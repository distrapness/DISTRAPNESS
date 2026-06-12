const express = require('express');
const router = express.Router();
const pool = require('../db');

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendOrderConfirmation, sendAdminNotification, sendStatusUpdateEmail, sendShippingReceiptEmail } = require('../services/emailService');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const midtransClient = require('midtrans-client');

const getMidtransConfig = async () => {
    try {
        const [rows] = await pool.promise().query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('midtrans_server_key', 'midtrans_client_key', 'midtrans_production')");
        const settings = rows.reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});
        const serverKeyFallback = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-xxx';
        return {
            serverKey: settings.midtrans_server_key || serverKeyFallback,
            clientKey: settings.midtrans_client_key || process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-xxx',
            isProduction: settings.midtrans_production ? settings.midtrans_production === 'true' : !serverKeyFallback.startsWith('SB-')
        };
    } catch (err) {
        console.error("Error fetching Midtrans config", err);
        const serverKeyFallback = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-xxx';
        return {
            serverKey: serverKeyFallback,
            clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-xxx',
            isProduction: !serverKeyFallback.startsWith('SB-')
        };
    }
};

const getSnapInstance = async () => {
    const config = await getMidtransConfig();
    return new midtransClient.Snap({
        isProduction: config.isProduction,
        serverKey: config.serverKey,
        clientKey: config.clientKey
    });
};



// Multer setup for payment proof uploads
// Multer setup for payment proof uploads (Memory for Base64)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET USER ORDERS (By Email in Shipping Address)
router.get('/user', verifyToken, (req, res) => {
  const email = req.user?.email;
  if (!email) return res.json([]);

  // Use LIKE to find email in JSON string (Compatible with most MySQL versions)
  // Pattern matches "email":"value" structure roughly
  const search = `%"email":"${email}"%`;

  pool.query('SELECT * FROM orders WHERE shipping_address LIKE ? ORDER BY "createdAt" DESC', [search], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error', detail: err });
    const data = results.map(r => ({
      ...r,
      shipping_address: r.shipping_address ? JSON.parse(r.shipping_address) : null,
      items: r.items ? JSON.parse(r.items) : []
    }));
    res.json(data);
  });
});

// CREATE ORDER (With Stock Management)
// Note: Midtrans payments now use POST /api/midtrans/prepare instead of this endpoint.
// This endpoint handles COD, mandiri_tf, and other immediate payment methods.
router.post('/', async (req, res) => {
  const { userId, items, total, paymentMethod, status, shippingAddress, couponCode, discountAmount, email } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Keranjang belanja kosong' });
  }

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    // 0. Check if tempId already exists in database to prevent duplicates
    if (shippingAddress && shippingAddress.tempId) {
      const tempId = shippingAddress.tempId;
      const [existing] = await connection.query(
        'SELECT id, status FROM orders WHERE shipping_address LIKE ?',
        [`%${tempId}%`]
      );
      if (existing.length > 0) {
        if (status === 'paid' && existing[0].status !== 'paid') {
          await connection.query('UPDATE orders SET status = ? WHERE id = ?', ['paid', existing[0].id]);
        }
        await connection.commit();
        connection.release();
        return res.json({ success: true, orderId: existing[0].id });
      }
    }

    // 1. Cek Stok (Locking with FOR UPDATE)
    for (const item of items) {
      const [rows] = await connection.query('SELECT stock, name, sizes FROM products WHERE id = ? FOR UPDATE', [item.id]);

      if (rows.length === 0) {
        throw new Error(`Produk "${item.name}" tidak ditemukan.`);
      }

      const product = rows[0];
      
      // Global stock check
      if (product.stock < item.qty) {
        throw new Error(`Stok habis untuk "${product.name}". Tersisa hanya ${product.stock}.`);
      }

      // ✅ FIX: Size-specific stock check
      if (item.selectedSize) {
        try {
          let sizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
          if (sizes && sizes[item.selectedSize] !== undefined) {
             if (sizes[item.selectedSize] < item.qty) {
               throw new Error(`Ukuran "${item.selectedSize}" untuk produk "${product.name}" sudah habis atau tidak mencukupi.`);
             }
          }
        } catch(e) {
          console.error("Size validation error:", e.message);
          // Fallback to allow if size parsing fails, or could be stricter
        }
      }
    }

    // 2. Siapkan Data
    let dbUserId = null;
    if (userId && !isNaN(userId)) {
      dbUserId = parseInt(userId);
    } else if (userId && typeof userId === 'string' && userId.includes('@')) {
      const [uRows] = await connection.query('SELECT id FROM users WHERE email = ?', [userId]);
      if (uRows.length > 0) {
        dbUserId = uRows[0].id;
      }
    } else if (email && typeof email === 'string' && email.includes('@')) {
      const [uRows] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
      if (uRows.length > 0) {
        dbUserId = uRows[0].id;
      }
    }
    const targetEmail = email || (userId && typeof userId === 'string' && userId.includes('@') ? userId : '') || 'customer@mail.com';
    const finalShipping = {
      ...(shippingAddress || {}),
      email: targetEmail
    };
    const refCode = null;

    // 3. Simpan Order
    const [result] = await connection.query(
      'INSERT INTO orders ("userId", items, total, "paymentMethod", status, shipping_address, coupon_code, discount_amount, referral_code, "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [dbUserId, JSON.stringify(items), total, paymentMethod, status || 'pending', JSON.stringify(finalShipping), couponCode || null, discountAmount || 0, refCode]
    );

    const newOrderId = result.insertId;

    // 4. Kurangi Stok (Global & Per Ukuran)
    for (const item of items) {
      // Update global stock
      await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.qty, item.id]);
      
      // Update size-specific stock if selected
      if (item.selectedSize) {
        const [pRows] = await connection.query('SELECT sizes FROM products WHERE id = ?', [item.id]);
        if (pRows.length > 0 && pRows[0].sizes) {
          try {
            let sizes = typeof pRows[0].sizes === 'string' ? JSON.parse(pRows[0].sizes) : pRows[0].sizes;
            if (sizes && sizes[item.selectedSize] !== undefined) {
              sizes[item.selectedSize] = Math.max(0, sizes[item.selectedSize] - item.qty);
              await connection.query('UPDATE products SET sizes = ? WHERE id = ?', [JSON.stringify(sizes), item.id]);
            }
          } catch(e) {
            console.error("Error updating size stock:", e.message);
          }
        }
      }
    }
    
    // 4b. Update Coupon Usage if applied
    if (couponCode) {
      await connection.query('UPDATE coupons SET usage_count = usage_count + 1 WHERE code = ?', [couponCode]);
    }

    await connection.commit();

      // 5. Kirim Email ke Customer ditunda sampai pesanan dibayar (untuk Midtrans) atau dikonfirmasi (untuk COD)

    // 6. Kirim Email Notifikasi ke Admin (safe)
    try {
      sendAdminNotification({
        orderId: newOrderId,
        cart: items,
        total: total,
        email: targetEmail,
        paymentMethod: paymentMethod,
        shippingAddress: finalShipping
      }).catch(e => console.warn("Admin email async error:", e.message));
    } catch (e) {
      console.warn("Admin email sync error:", e.message);
    }

    let snapToken = null;
    if (paymentMethod !== 'cod' && paymentMethod !== 'mandiri_tf') {
      try {
        const snap = await getSnapInstance();
        const parameter = {
          transaction_details: {
            order_id: `ORDER-${newOrderId}-${Date.now()}`,
            gross_amount: Math.round(total)
          },
          credit_card: {
            secure: true
          },
          expiry: {
            unit: "hours",
            duration: 24
          },
          customer_details: {
            email: targetEmail || "customer@mail.com"
          }
        };
        const transaction = await snap.createTransaction(parameter);
        snapToken = transaction.token;
      } catch (err) {
        console.error('Midtrans token creation failed on order create:', err.ApiResponse || err);
      }
    }

    res.json({ success: true, orderId: newOrderId, snapToken });

  } catch (err) {
    await connection.rollback();
    console.error("Order Transaction Error:", err.message);
    res.status(400).json({ error: err.message || 'Gagal memproses pesanan' });
  } finally {
    connection.release();
  }
});

// UPLOAD PAYMENT PROOF
router.post('/upload-proof/:orderId', upload.single('paymentProof'), (req, res) => {
  const { orderId } = req.params;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // Convert buffer to Base64 for Vercel/Serverless compatibility
  const b64 = Buffer.from(req.file.buffer).toString('base64');
  const mime = req.file.mimetype;
  const url = `data:${mime};base64,${b64}`;

  pool.query(
    'UPDATE orders SET "paymentProof"=?, status=? WHERE id=?',
    [url, 'waiting_verification', orderId],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error', detail: err });
      res.json({ success: true, url });
    }
  );
});

// GET ALL ORDERS (Admin)
router.get('/', verifyToken, verifyAdmin, (req, res) => {
  const limit = parseInt(req.query.limit) || 1000;
  const offset = parseInt(req.query.offset) || 0;
  
  // Custom adapter in db.js requires parameterized syntax but doesn't fully support $1, $2 for LIMIT yet
  // However, I previously changed the adapter to support standard parameterized queries for PG
  // Let's use standard ? for adapter to convert to $1
  pool.query('SELECT * FROM orders ORDER BY "createdAt" DESC LIMIT ? OFFSET ?', [limit, offset], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error', detail: err });
    const data = results.map(r => ({
      ...r,
      shipping_address: r.shipping_address ? JSON.parse(r.shipping_address) : null
    }));
    res.json(data);
  });
});

// GET ORDER BY ID
router.get('/:orderId', (req, res) => {
  const { orderId } = req.params;
  pool.query('SELECT * FROM orders WHERE id=?', [orderId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error', detail: err });
    if (!results.length) return res.status(404).json({ error: 'Order not found' });
    const order = results[0];
    try { order.shipping_address = JSON.parse(order.shipping_address); } catch (e) { }
    try { order.items = JSON.parse(order.items); } catch (e) { }
    res.json(order);
  });
});

// CUSTOMER CONFIRM COD
router.put('/:orderId/confirm-cod', async (req, res) => {
  const { orderId } = req.params;
  try {
    const [rows] = await pool.promise().query('SELECT status, "paymentMethod", shipping_address, total, items FROM orders WHERE id = ?', [orderId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    if (rows[0].paymentMethod !== 'cod') {
      return res.status(400).json({ error: 'Hanya pesanan COD yang bisa dikonfirmasi di sini' });
    }

    await pool.promise().query('UPDATE orders SET status = ? WHERE id = ?', ['processing', orderId]);

    // Kirim Email Konfirmasi Pesanan COD (karena sudah dikonfirmasi ulang oleh customer)
    try {
      const addr = JSON.parse(rows[0].shipping_address || '{}');
      const items = JSON.parse(rows[0].items || '[]');
      if (addr.email) {
        sendOrderConfirmation({
          email: addr.email,
          orderId: orderId,
          cart: items,
          total: rows[0].total
        }).catch(e => console.warn("COD Email confirmation async error:", e.message));
      }
    } catch (emailErr) {
      console.error("Failed to send COD confirmation email:", emailErr.message);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// UPDATE ORDER STATUS BY CUSTOMER (For Midtrans flow)
router.put('/:orderId/customer-status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body; // 'pending', 'waiting_payment', 'cancelled', 'paid'
  
  if (!['pending', 'waiting_payment', 'cancelled', 'paid'].includes(status)) {
    return res.status(400).json({ error: 'Status tidak valid' });
  }

  try {
    const [rows] = await pool.promise().query('SELECT status, "paymentMethod", items FROM orders WHERE id = ?', [orderId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const oldStatus = rows[0].status;
    const paymentMethod = rows[0].paymentMethod;
    const items = JSON.parse(rows[0].items || '[]');

    if (paymentMethod !== 'midtrans') {
      return res.status(400).json({ error: 'Hanya pesanan Midtrans yang dapat diupdate melalui endpoint ini' });
    }

    // If cancelling, restore stock
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      const connection = await pool.promise().getConnection();
      try {
        await connection.beginTransaction();
        for (const item of items) {
          await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.qty, item.id]);
          
          // Restore variant stock
          const [pRows] = await connection.query('SELECT sizes FROM products WHERE id = ?', [item.id]);
          if (pRows.length > 0 && pRows[0].sizes) {
            let sizes = typeof pRows[0].sizes === 'string' ? JSON.parse(pRows[0].sizes) : pRows[0].sizes;
            if (item.selectedSize && sizes && sizes[item.selectedSize] !== undefined) {
              sizes[item.selectedSize] += item.qty;
              await connection.query('UPDATE products SET sizes = ? WHERE id = ?', [JSON.stringify(sizes), item.id]);
            }
          }
        }
        await connection.query('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', orderId]);
        await connection.commit();
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } else {
      await pool.promise().query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE ORDER SHIPPING ADDRESS BY CUSTOMER (Before payment/processing)
router.put('/:orderId/shipping-address', async (req, res) => {
  const { orderId } = req.params;
  const { shippingAddress } = req.body;

  if (!shippingAddress) {
    return res.status(400).json({ error: 'Alamat pengiriman kosong' });
  }

  try {
    const [rows] = await pool.promise().query('SELECT status FROM orders WHERE id = ?', [orderId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const status = rows[0].status;
    if (!['pending', 'waiting_payment'].includes(status)) {
      return res.status(400).json({ error: 'Alamat pesanan yang sudah dibayar atau diproses tidak dapat diubah' });
    }

    await pool.promise().query('UPDATE orders SET shipping_address = ? WHERE id = ?', [JSON.stringify(shippingAddress), orderId]);
    res.json({ success: true, message: 'Alamat pengiriman berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// UPDATE ORDER STATUS (Admin)
router.put('/status/:orderId', verifyToken, verifyAdmin, async (req, res) => {
  const { orderId } = req.params;
  const { status, trackingNumber } = req.body;

  const connection = await pool.promise().getConnection();
  try {
    await connection.beginTransaction();

    // Fetch existing order to check status change
    const [orders] = await connection.query('SELECT status, items FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) throw new Error("Order not found");
    const oldStatus = orders[0].status;
    const items = JSON.parse(orders[0].items || '[]');

    const isDead = (s) => s === 'cancelled' || s === 'expired' || s === 'failed';
    const oldDead = isDead(oldStatus);
    const newDead = isDead(status);

    // If changing to a dead status from a live status, return stock
    if (newDead && !oldDead) {
      for (const item of items) {
        await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.qty, item.id]);
        
        // Also update size-specific stock if sizes exist
        const [pRows] = await connection.query('SELECT sizes FROM products WHERE id = ?', [item.id]);
        if (pRows.length > 0 && pRows[0].sizes) {
          try {
            let sizes = typeof pRows[0].sizes === 'string' ? JSON.parse(pRows[0].sizes) : pRows[0].sizes;
            if (item.selectedSize && sizes && sizes[item.selectedSize] !== undefined) {
              sizes[item.selectedSize] += item.qty;
              await connection.query('UPDATE products SET sizes = ? WHERE id = ?', [JSON.stringify(sizes), item.id]);
            }
          } catch(e) {
            console.error("Failed to restore size stock on status change:", e.message);
          }
        }
      }
    }

    // If changing FROM a dead status back to a live status, reduce stock again
    if (oldDead && !newDead) {
      for (const item of items) {
        await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.qty, item.id]);
        
        // Also update size-specific stock if sizes exist
        const [pRows] = await connection.query('SELECT sizes FROM products WHERE id = ?', [item.id]);
        if (pRows.length > 0 && pRows[0].sizes) {
          try {
            let sizes = typeof pRows[0].sizes === 'string' ? JSON.parse(pRows[0].sizes) : pRows[0].sizes;
            if (item.selectedSize && sizes && sizes[item.selectedSize] !== undefined) {
              sizes[item.selectedSize] = Math.max(0, sizes[item.selectedSize] - item.qty);
              await connection.query('UPDATE products SET sizes = ? WHERE id = ?', [JSON.stringify(sizes), item.id]);
            }
          } catch(e) {
            console.error("Failed to reduce size stock on status change:", e.message);
          }
        }
      }
    }

    let query = 'UPDATE orders SET status=? WHERE id=?';
    let params = [status, orderId];

    if (trackingNumber !== undefined) {
      query = 'UPDATE orders SET status=?, tracking_number=? WHERE id=?';
      params = [status, trackingNumber, orderId];
    }

    await connection.query(query, params);



    await connection.commit();

    // Fetch order details for notification
    const [results] = await pool.promise().query('SELECT shipping_address, items, total, "paymentMethod" FROM orders WHERE id = ?', [orderId]);
    if (results.length > 0) {
      try {
        const addr = JSON.parse(results[0].shipping_address || '{}');
        const items = JSON.parse(results[0].items || '[]');
        const total = results[0].total || 0;
        
        if (addr && addr.email) {
          if (status === 'shipped') {
            sendShippingReceiptEmail({
              email: addr.email,
              orderId,
              trackingNumber,
              courier: addr.courierInfo || 'Standard Delivery',
              cart: items,
              total,
              shippingAddress: addr
            }).catch(e => console.error("Resi email fail:", e.message));
          } else {
            sendStatusUpdateEmail({
              email: addr.email,
              orderId,
              status,
              trackingNumber
            });
          }
        }
      } catch (e) {
        console.error("Failed to send status email:", e.message);
      }
    }

    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// ─── EXPORT ORDERS TO CSV ────────────────────────────────────────────────────
router.get('/export/csv', verifyAdmin, async (req, res) => {
  try {
    const [orders] = await pool.promise().query('SELECT * FROM orders ORDER BY "createdAt" DESC');

    const rows = orders.map(o => {
      let addr = {};
      try { addr = JSON.parse(o.shipping_address || '{}'); } catch(e) {}
      let items = [];
      try { items = JSON.parse(o.items || '[]'); } catch(e) {}
      const itemNames = items.map(i => `${i.name}(x${i.qty})`).join(' | ');

      return [
        o.id,
        addr.email || '',
        `"${addr.firstName || ''} ${addr.lastName || ''}"`.trim(),
        addr.phone || '',
        `"${addr.address || ''}"`,
        addr.city || '',
        o.total,
        o.status,
        o.paymentMethod || '',
        o.tracking_number || '',
        `"${itemNames}"`,
        new Date(o.createdAt).toLocaleDateString('id-ID')
      ].join(',');
    });

    const header = 'ID,Email,Nama,Telepon,Alamat,Kota,Total,Status,Pembayaran,Resi,Items,Tanggal';
    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="orders-${new Date().toISOString().slice(0,10)}.csv"`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SALES CHART DATA (last 30 days) ─────────────────────────────────────────
router.get('/stats/chart', verifyAdmin, async (req, res) => {
  try {
    const [rows] = await pool.promise().query(`
      SELECT 
        "createdAt"::date as date,
        COUNT(*) as orders,
        SUM(total) as revenue
      FROM orders
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        AND status NOT IN ('cancelled', 'pending', 'expired', 'failed')
      GROUP BY "createdAt"::date
      ORDER BY date ASC
    `);

    // Fill gaps with 0
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const found = rows.find(r => String(r.date).slice(0, 10) === dateStr);
      result.push({
        date: dateStr,
        orders: found ? Number(found.orders) : 0,
        revenue: found ? Number(found.revenue) : 0
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AUTO-CANCEL EXPIRED ORDERS (older than 24 hours)
router.all('/auto-cancel', async (req, res) => {
  console.log("[AUTO-CANCEL] Checking for expired pending orders...");
  const connection = await pool.promise().getConnection();
  try {
    await connection.beginTransaction();

    // Select pending/waiting_payment orders older than 24 hours in PostgreSQL
    const [staleOrders] = await connection.query(
      `SELECT id, items, status, shipping_address FROM orders 
       WHERE status IN ('pending', 'waiting_payment') 
       AND "createdAt" < NOW() - INTERVAL '24 hours'`
    );

    console.log(`[AUTO-CANCEL] Found ${staleOrders.length} stale pending orders to cancel.`);
    const cancelledIds = [];

    for (const order of staleOrders) {
      const items = JSON.parse(order.items || '[]');

      // Revert product global and size stocks
      for (const item of items) {
        // Restore global stock
        await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.qty, item.id]);

        // Restore size stock
        const [pRows] = await connection.query('SELECT sizes FROM products WHERE id = ?', [item.id]);
        if (pRows.length > 0 && pRows[0].sizes) {
          try {
            let sizes = typeof pRows[0].sizes === 'string' ? JSON.parse(pRows[0].sizes) : pRows[0].sizes;
            if (item.selectedSize && sizes && sizes[item.selectedSize] !== undefined) {
              sizes[item.selectedSize] += item.qty;
              await connection.query('UPDATE products SET sizes = ? WHERE id = ?', [JSON.stringify(sizes), item.id]);
            }
          } catch (e) {
            console.error(`[AUTO-CANCEL] Error restoring size stock for order #${order.id}:`, e.message);
          }
        }
      }

      // Update status to expired
      await connection.query("UPDATE orders SET status = 'expired' WHERE id = ?", [order.id]);

      // Try sending a status update email
      try {
        const addr = JSON.parse(order.shipping_address || '{}');
        if (addr && addr.email) {
          sendStatusUpdateEmail({
            email: addr.email,
            orderId: order.id,
            status: 'expired'
          });
        }
      } catch (e) {
        console.error(`[AUTO-CANCEL] Failed to send email for order #${order.id}:`, e.message);
      }

      cancelledIds.push(order.id);
    }

    await connection.commit();
    res.json({ success: true, cancelledCount: cancelledIds.length, cancelledIds });
  } catch (err) {
    await connection.rollback();
    console.error("[AUTO-CANCEL] Rollback error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
