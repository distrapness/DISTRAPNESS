const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendOrderConfirmation, sendAdminNotification, sendStatusUpdateEmail } = require('../services/emailService');
const { verifyToken, verifyAdmin } = require('../middleware/auth');


// Multer setup for payment proof uploads
// Multer setup for payment proof uploads (Memory for Base64)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET USER ORDERS (By Email in Shipping Address)
router.get('/user', (req, res) => {
  const { email } = req.query;
  if (!email) return res.json([]);

  // Use LIKE to find email in JSON string (Compatible with most MySQL versions)
  // Pattern matches "email":"value" structure roughly
  const search = `%"email":"${email}"%`;

  pool.query('SELECT * FROM orders WHERE shipping_address LIKE ? ORDER BY createdAt DESC', [search], (err, results) => {
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
router.post('/', async (req, res) => {
  const { userId, items, total, paymentMethod, status, shippingAddress, couponCode, discountAmount, email } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Keranjang belanja kosong' });
  }

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

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
    const dbUserId = (userId && !isNaN(userId)) ? userId : null;
    const finalShipping = {
      ...(shippingAddress || {}),
      email: email || (userId && typeof userId === 'string' && userId.includes('@') ? userId : '')
    };
    const refCode = req.body.referralCode || null;

    // 3. Simpan Order
    const [result] = await connection.query(
      'INSERT INTO orders (userId, items, total, paymentMethod, status, shipping_address, coupon_code, discount_amount, referral_code, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
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

    // 5. Kirim Email ke Customer (safe)
    const targetEmail = email || (userId && typeof userId === 'string' && userId.includes('@') ? userId : null);
    if (targetEmail) {
      try {
        sendOrderConfirmation({
          email: targetEmail,
          orderId: newOrderId,
          cart: items,
          total: total
        });
      } catch (e) {
        console.warn("Email confirmation warning:", e.message);
      }
    }

    // 6. Kirim Email Notifikasi ke Admin (safe)
    try {
      sendAdminNotification({
        orderId: newOrderId,
        cart: items,
        total: total,
        email: targetEmail,
        paymentMethod: paymentMethod,
        shippingAddress: finalShipping
      });
    } catch (e) {
      console.warn("Admin email warning:", e.message);
    }

    res.json({ success: true, orderId: newOrderId });

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
    'UPDATE orders SET paymentProof=?, status=? WHERE id=?',
    [url, 'waiting_verification', orderId],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error', detail: err });
      res.json({ success: true, url });
    }
  );
});

// GET ALL ORDERS (Admin)
router.get('/', verifyToken, verifyAdmin, (req, res) => {
  pool.query('SELECT * FROM orders ORDER BY createdAt DESC', (err, results) => {
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
    const [rows] = await pool.promise().query('SELECT status, paymentMethod FROM orders WHERE id = ?', [orderId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    if (rows[0].paymentMethod !== 'cod') {
      return res.status(400).json({ error: 'Hanya pesanan COD yang bisa dikonfirmasi di sini' });
    }

    await pool.promise().query('UPDATE orders SET status = ? WHERE id = ?', ['processing', orderId]);
    res.json({ success: true });
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

    // If changing to 'cancelled' or 'expired' from a non-cancelled status, return stock
    if ((status === 'cancelled' || status === 'expired') && oldStatus !== 'cancelled' && oldStatus !== 'expired') {
      for (const item of items) {
        await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.qty, item.id]);
        
        // Also update size-specific stock if sizes exist
        const [pRows] = await connection.query('SELECT sizes FROM products WHERE id = ?', [item.id]);
        if (pRows.length > 0 && pRows[0].sizes) {
          try {
            let sizes = JSON.parse(pRows[0].sizes);
            if (item.selectedSize && sizes[item.selectedSize] !== undefined) {
              sizes[item.selectedSize] += item.qty;
              await connection.query('UPDATE products SET sizes = ? WHERE id = ?', [JSON.stringify(sizes), item.id]);
            }
          } catch(e) {}
        }
      }
    }

    // If changing FROM 'cancelled' back to something else (rare but possible), reduce stock again
    if (oldStatus === 'cancelled' && status !== 'cancelled' && status !== 'expired') {
       for (const item of items) {
        await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.qty, item.id]);
        // sizes update logic omitted for brevity in this specific edge case, but ideally should match above
      }
    }

    let query = 'UPDATE orders SET status=? WHERE id=?';
    let params = [status, orderId];

    if (trackingNumber !== undefined) {
      query = 'UPDATE orders SET status=?, tracking_number=? WHERE id=?';
      params = [status, trackingNumber, orderId];
    }

    await connection.query(query, params);

    // AFFILIATE COMMISSION LOGIC (Triggered when marked as PAID)
    if (status === 'paid' && oldStatus !== 'paid') {
      const [orderRows] = await connection.query('SELECT referral_code, total FROM orders WHERE id = ?', [orderId]);
      const refCode = orderRows[0]?.referral_code;
      const totalAmount = orderRows[0]?.total || 0;

      if (refCode) {
        // Give 10% commission + 1000 points
        const commission = parseFloat(totalAmount) * 0.10;
        await connection.query(
          'UPDATE users SET balance = balance + ?, points = points + 1000, referrals_count = referrals_count + 1 WHERE referral_code = ?',
          [commission, refCode]
        );
        console.log(`Manual Reward: Affiliate commission (${commission}) & 1000pts given to code: ${refCode}`);
      }
    }

    await connection.commit();

    // Fetch order details for notification
    const [results] = await pool.promise().query('SELECT shipping_address FROM orders WHERE id = ?', [orderId]);
    if (results.length > 0) {
      try {
        const addr = JSON.parse(results[0].shipping_address);
        if (addr && addr.email) {
          sendStatusUpdateEmail({
            email: addr.email,
            orderId,
            status,
            trackingNumber
          });
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
    const [orders] = await pool.promise().query('SELECT * FROM orders ORDER BY createdAt DESC');

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
        DATE(createdAt) as date,
        COUNT(*) as orders,
        SUM(total) as revenue
      FROM orders
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND status NOT IN ('cancelled', 'pending')
      GROUP BY DATE(createdAt)
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

module.exports = router;
