const express = require('express');
const router = express.Router();
const pool = require('../db');

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendOrderConfirmation, sendAdminNotification, sendStatusUpdateEmail, sendShippingReceiptEmail, checkAndNotifyLowStock } = require('../services/emailService');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const midtransClient = require('midtrans-client');

const calculateServerSideTotal = async (items, couponCode, shippingAddress) => {
  let subtotal = 0;
  for (const item of items) {
    const [rows] = await pool.promise().query('SELECT price, is_flash_sale, flash_sale_price, flash_sale_end FROM products WHERE id = ?', [item.id]);
    if (rows.length === 0) throw new Error(`Produk dengan ID ${item.id} tidak ditemukan.`);
    
    const prod = rows[0];
    let activePrice = Number(prod.price);
    
    if (prod.is_flash_sale && (!prod.flash_sale_end || new Date(prod.flash_sale_end) > new Date())) {
      activePrice = Number(prod.flash_sale_price);
    }
    
    subtotal += activePrice * Number(item.qty);
  }

  let discountAmount = 0;
  if (couponCode) {
    const [coupons] = await pool.promise().query('SELECT * FROM coupons WHERE code = ? AND is_active = TRUE', [couponCode.toUpperCase()]);
    if (coupons.length > 0) {
      const coupon = coupons[0];
      const now = new Date();
      const isDateValid = (!coupon.start_date || new Date(coupon.start_date) <= now) && (!coupon.expiry_date || new Date(coupon.expiry_date) >= now);
      const isLimitValid = coupon.usage_limit === 0 || coupon.usage_count < coupon.usage_limit;
      const isMinPurchaseValid = subtotal >= Number(coupon.min_purchase);

      if (isDateValid && isLimitValid && isMinPurchaseValid) {
        if (coupon.type === 'percent') {
          discountAmount = (coupon.value / 100) * subtotal;
        } else {
          discountAmount = Number(coupon.value);
        }
      }
    }
  }

  let shippingFee = subtotal > 300000 ? 0 : 25000;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);
  return { subtotal, discountAmount, shippingFee, finalTotal };
};

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

  // Enforce correct state based on payment method and status
  let paymentStatus = 'pending';
  let orderStatus = 'pending';
  if (paymentMethod === 'cod') {
    paymentStatus = 'cod';
    orderStatus = 'processing';
  } else if (paymentMethod === 'mandiri_tf') {
    paymentStatus = 'pending';
    orderStatus = 'pending';
  } else if (paymentMethod === 'midtrans') {
    if (status === 'paid' || status === 'settlement' || status === 'capture') {
      paymentStatus = 'paid';
      orderStatus = 'processing';
    } else if (status === 'waiting_payment' || status === 'pending') {
      paymentStatus = 'pending';
      orderStatus = 'pending';
    } else if (status === 'cancelled' || status === 'expire' || status === 'cancel') {
      paymentStatus = 'cancelled';
      orderStatus = 'cancelled';
    }
  }

  // Recalculate price server-side to prevent client price editing
  let validatedAmounts;
  try {
    validatedAmounts = await calculateServerSideTotal(items, couponCode, shippingAddress);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    const tempId = shippingAddress && shippingAddress.tempId ? shippingAddress.tempId : null;
    
    // Check if temp_id already exists to prevent duplicate order inserts
    if (tempId) {
      const [existing] = await connection.query(
        'SELECT id, payment_status, order_status FROM orders WHERE temp_id = ? FOR UPDATE',
        [tempId]
      );
      if (existing.length > 0) {
        if (paymentStatus === 'paid' && existing[0].payment_status !== 'paid') {
          await connection.query('UPDATE orders SET payment_status = ?, order_status = ?, "updatedAt" = NOW() WHERE id = ?', ['paid', 'processing', existing[0].id]);
        }
        await connection.commit();
        return res.json({ success: true, orderId: existing[0].id, total: validatedAmounts.finalTotal });
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

      // Size-specific stock check
      if (item.selectedSize) {
        try {
          let sizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
          if (sizes && sizes[item.selectedSize] !== undefined) {
             if (sizes[item.selectedSize] < item.qty) {
               throw new Error(`Ukuran "${item.selectedSize}" untuk produk "${product.name}" sudah habis.`);
             }
          }
        } catch(e) {
          throw new Error("Gagal memvalidasi ukuran stok produk.");
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

    // 3. Simpan Order (menggunakan validatedAmounts.finalTotal terverifikasi server-side!)
    const [result] = await connection.query(
      'INSERT INTO orders ("userId", items, total, "paymentMethod", payment_status, order_status, shipping_address, coupon_code, discount_amount, temp_id, "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [dbUserId, JSON.stringify(items), validatedAmounts.finalTotal, paymentMethod, paymentStatus, orderStatus, JSON.stringify(finalShipping), couponCode || null, validatedAmounts.discountAmount, tempId]
    );

    const newOrderId = result.insertId;

    // 4. Kurangi Stok (Global & Per Ukuran)
    for (const item of items) {
      await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.qty, item.id]);
      
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

      checkAndNotifyLowStock(item.id).catch(err => console.error("Low stock check failed:", err.message));
    }
    
    if (couponCode) {
      await connection.query('UPDATE coupons SET usage_count = usage_count + 1 WHERE code = ?', [couponCode]);
    }

    await connection.commit();

    try {
      sendAdminNotification({
        orderId: newOrderId,
        cart: items,
        total: validatedAmounts.finalTotal,
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
            gross_amount: Math.round(validatedAmounts.finalTotal)
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

    res.json({ success: true, orderId: newOrderId, snapToken, total: validatedAmounts.finalTotal });

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
    'UPDATE orders SET "paymentProof"=?, payment_status=?, order_status=?, "updatedAt"=NOW() WHERE id=?',
    [url, 'pending', 'waiting_verification', orderId],
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
    const [rows] = await pool.promise().query('SELECT payment_status, order_status, "paymentMethod", shipping_address, total, items FROM orders WHERE id = ?', [orderId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    if (rows[0].paymentMethod !== 'cod') {
      return res.status(400).json({ error: 'Hanya pesanan COD yang bisa dikonfirmasi di sini' });
    }

    await pool.promise().query('UPDATE orders SET order_status = ?, "updatedAt" = NOW() WHERE id = ?', ['processing', orderId]);

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
router.put('/:orderId/customer-status', verifyToken, async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body; // Actually orderStatus or paymentStatus. Assuming this is cancel request.
  
  // HANYA ijinkan status 'cancelled' atau 'waiting_payment'. Blokir keras status 'paid' / 'completed' dari client!
  if (!['pending', 'waiting_payment', 'cancelled'].includes(status)) {
    return res.status(403).json({ error: 'Operasi ditolak: Status LUNAS hanya dapat dikonfirmasi otomatis oleh sistem webhook gateway.' });
  }

  try {
    const [rows] = await pool.promise().query('SELECT payment_status, order_status, "paymentMethod", items, "userId" FROM orders WHERE id = ?', [orderId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const order = rows[0];
    const oldStatus = order.order_status;
    const paymentMethod = order.paymentMethod;
    const items = JSON.parse(order.items || '[]');

    // Pastikan pengguna hanya memodifikasi miliknya sendiri
    if (order.userId && String(order.userId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Akses ditolak: Anda tidak memilik hak untuk mengubah pesanan ini.' });
    }

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
        await connection.query('UPDATE orders SET payment_status = ?, order_status = ?, "updatedAt" = NOW() WHERE id = ?', ['cancelled', 'cancelled', orderId]);
        await connection.commit();
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } else {
      await pool.promise().query('UPDATE orders SET payment_status = ?, order_status = ?, "updatedAt" = NOW() WHERE id = ?', [status === 'cancelled' ? 'cancelled' : 'pending', status, orderId]);
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
    const [rows] = await pool.promise().query('SELECT payment_status, order_status FROM orders WHERE id = ?', [orderId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const status = rows[0].payment_status === 'pending' || rows[0].order_status === 'pending' ? 'pending' : rows[0].order_status;
    if (!['pending', 'waiting_payment'].includes(status)) {
      return res.status(400).json({ error: 'Alamat pesanan yang sudah dibayar atau diproses tidak dapat diubah' });
    }

    await pool.promise().query('UPDATE orders SET shipping_address = ? WHERE id = ?', [JSON.stringify(shippingAddress), orderId]);
    res.json({ success: true, message: 'Alamat pengiriman berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE ORDER PAYMENT DETAILS BY CUSTOMER (When changing payment method/courier for a pending order)
router.put('/:orderId/payment-details', async (req, res) => {
  const { orderId } = req.params;
  const { paymentMethod, shippingAddress, total } = req.body;

  if (!paymentMethod || !shippingAddress) {
    return res.status(400).json({ error: 'Metode pembayaran dan alamat pengiriman wajib diisi' });
  }

  try {
    const [rows] = await pool.promise().query('SELECT payment_status, order_status FROM orders WHERE id = ?', [orderId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const status = rows[0].payment_status === 'pending' || rows[0].order_status === 'pending' ? 'pending' : rows[0].order_status;
    if (!['pending', 'waiting_payment'].includes(status)) {
      return res.status(400).json({ error: 'Pesanan yang sudah dibayar atau diproses tidak dapat diubah' });
    }

    await pool.promise().query(
      'UPDATE orders SET "paymentMethod" = ?, shipping_address = ?, total = ? WHERE id = ?',
      [paymentMethod, JSON.stringify(shippingAddress), total, orderId]
    );

    res.json({ success: true, message: 'Detail pembayaran pesanan berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// UPDATE BULK ORDER STATUS (Admin)
router.put('/bulk-status', verifyToken, verifyAdmin, async (req, res) => {
  const { orderIds, status } = req.body;
  
  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json({ error: 'orderIds tidak valid' });
  }

  const connection = await pool.promise().getConnection();
  try {
    await connection.beginTransaction();

    const isDead = (s) => s === 'cancelled' || s === 'expired' || s === 'failed';
    const newDead = isDead(status);

    for (const orderId of orderIds) {
      // Fetch existing order to check status change
      const [orders] = await connection.query('SELECT payment_status, order_status, items FROM orders WHERE id = ?', [orderId]);
      if (orders.length === 0) continue; // skip if not found
      
      const oldStatus = orders[0].order_status;
      if (oldStatus === status) continue; // skip if status is the same

      const items = JSON.parse(orders[0].items || '[]');
      const oldDead = isDead(oldStatus);

      // Handle stock adjustments for each order
      if (!oldDead && newDead) {
        // If changing to a dead status from a live status, return stock
        for (const item of items) {
          await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.qty, item.id]);
          if (item.selectedSize) {
            const [pRows] = await connection.query('SELECT sizes FROM products WHERE id = ?', [item.id]);
            if (pRows.length > 0 && pRows[0].sizes) {
              try {
                let sizes = typeof pRows[0].sizes === 'string' ? JSON.parse(pRows[0].sizes) : pRows[0].sizes;
                if (sizes && sizes[item.selectedSize] !== undefined) {
                  sizes[item.selectedSize] += item.qty;
                  await connection.query('UPDATE products SET sizes = ? WHERE id = ?', [JSON.stringify(sizes), item.id]);
                }
              } catch(e) {
                console.error("Failed to restore size stock on status change:", e.message);
              }
            }
          }
        }
      } else if (oldDead && !newDead) {
        // If changing FROM a dead status back to a live status, reduce stock again
        for (const item of items) {
          await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.qty, item.id]);
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
          checkAndNotifyLowStock(item.id).catch(err => console.error("Low stock check failed:", err.message));
        }
      }

      // Update status for the order
      // Admin updates order_status. If completing COD, also set payment_status to paid.
      let pStatusQuery = '';
      let queryParams = [status, orderId];
      if (status === 'completed' || status === 'delivered') {
         pStatusQuery = ', payment_status = \'paid\'';
      } else if (status === 'cancelled') {
         pStatusQuery = ', payment_status = \'cancelled\'';
      }
      await connection.query(`UPDATE orders SET order_status = ?${pStatusQuery}, "updatedAt" = NOW() WHERE id = ?`, queryParams);

      // Trigger status update email
      try {
        const [oRows] = await connection.query('SELECT shipping_address FROM orders WHERE id = ?', [orderId]);
        if (oRows.length > 0) {
          const addr = JSON.parse(oRows[0].shipping_address || '{}');
          if (addr.email) {
            sendStatusUpdateEmail({
              email: addr.email,
              orderId,
              status
            }).catch(e => console.error("Failed to send status email:", e.message));
          }
        }
      } catch (mailErr) {
        console.error("Failed to send bulk update email:", mailErr.message);
      }
    }

    await connection.commit();
    res.json({ success: true, updatedCount: orderIds.length });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
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
    const [orders] = await connection.query('SELECT payment_status, order_status, items, total, "paymentMethod" FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) throw new Error("Order not found");
    const oldStatus = orders[0].order_status;
    const pMethod = orders[0].paymentMethod;
    const items = JSON.parse(orders[0].items || '[]');
    const total = Number(orders[0].total) || 0;

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
        
        // Check for low stock notification
        checkAndNotifyLowStock(item.id).catch(err => console.error("Low stock check failed:", err.message));
      }
    }

    let pStatusUpdate = '';
    if (status === 'completed') { pStatusUpdate = ", payment_status='paid'"; }
    if (status === 'cancelled') { pStatusUpdate = ", payment_status='cancelled'"; }

    let query = `UPDATE orders SET order_status=?, "updatedAt"=NOW()${pStatusUpdate} WHERE id=?`;
    let params = [status, orderId];

    if (trackingNumber !== undefined) {
      query = `UPDATE orders SET order_status=?, tracking_number=?, "updatedAt"=NOW()${pStatusUpdate} WHERE id=?`;
      params = [status, trackingNumber, orderId];
    }

    await connection.query(query, params);

    // Update admin user balance when status becomes completed
    if (status === 'completed' && oldStatus !== 'completed') {
      await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [total, req.user.id]);
    } else if (oldStatus === 'completed' && status !== 'completed') {
      await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [total, req.user.id]);
    }

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
router.get('/export/csv', verifyToken, verifyAdmin, async (req, res) => {
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
        o.payment_status, o.order_status,
        o.paymentMethod || '',
        o.tracking_number || '',
        `"${itemNames}"`,
        new Date(o.createdAt).toLocaleDateString('id-ID')
      ].join(',');
    });

    const header = 'ID,Email,Nama,Telepon,Alamat,Kota,Total,Payment Status,Order Status,Pembayaran,Resi,Items,Tanggal';
    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="orders-${new Date().toISOString().slice(0,10)}.csv"`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SALES CHART DATA (last 30 days) ─────────────────────────────────────────
router.get('/stats/chart', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [rows] = await pool.promise().query(`
      SELECT 
        "createdAt"::date as date,
        COUNT(*) as orders,
        SUM(total) as revenue
      FROM orders
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        AND order_status NOT IN ('cancelled', 'pending', 'failed') AND payment_status = 'paid'
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
      await connection.query("UPDATE orders SET payment_status = 'expired', order_status = 'cancelled', \"updatedAt\" = NOW() WHERE id = ?", [order.id]);

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

    // NEW: Auto-complete Shipped orders older than 7 days
    const [shippedOrders] = await connection.query(
      `SELECT id, total, shipping_address FROM orders 
       WHERE status = 'shipped' 
       AND "updatedAt" < NOW() - INTERVAL '7 days'`
    );

    console.log(`[AUTO-COMPLETE] Found ${shippedOrders.length} shipped orders to auto-complete.`);
    const completedIds = [];

    // Find first admin user for balance update
    const [adminRows] = await connection.query(
      "SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1"
    );
    const adminId = adminRows.length > 0 ? adminRows[0].id : null;

    for (const order of shippedOrders) {
      // 1. Update status to completed
      await connection.query('UPDATE orders SET status = \'completed\', "updatedAt" = NOW() WHERE id = ?', [order.id]);

      // 2. Update admin balance
      if (adminId) {
        await connection.query(
          'UPDATE users SET balance = balance + ? WHERE id = ?',
          [order.total, adminId]
        );
      }

      // 3. Try sending a status update email
      try {
        const addr = JSON.parse(order.shipping_address || '{}');
        if (addr && addr.email) {
          sendStatusUpdateEmail({
            email: addr.email,
            orderId: order.id,
            status: 'completed'
          }).catch(e => console.error("Email failed on auto-complete:", e.message));
        }
      } catch (e) {
        console.error(`[AUTO-COMPLETE] Failed to send email for order #${order.id}:`, e.message);
      }

      completedIds.push(order.id);
    }

    await connection.commit();
    res.json({ 
      success: true, 
      cancelledCount: cancelledIds.length, 
      cancelledIds,
      completedCount: completedIds.length,
      completedIds
    });
  } catch (err) {
    await connection.rollback();
    console.error("[AUTO-CANCEL] Rollback error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// CUSTOMER CONFIRM DELIVERY RECEIVED
router.put('/:orderId/confirm-delivery', verifyToken, async (req, res) => {
  const { orderId } = req.params;
  const userEmail = req.user.email;

  const connection = await pool.promise().getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT status, total, shipping_address FROM orders WHERE id = ?',
      [orderId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    const order = rows[0];
    const shippingAddress = JSON.parse(order.shipping_address || '{}');

    if (shippingAddress.email !== userEmail) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses ke pesanan ini' });
    }

    if (order.status !== 'shipped') {
      return res.status(400).json({ error: 'Hanya pesanan yang sedang dikirim yang dapat dikonfirmasi diterima' });
    }

    // Update status to completed
    await connection.query(
      'UPDATE orders SET status = \'completed\', "updatedAt" = NOW() WHERE id = ?',
      [orderId]
    );

    // Update first admin's balance
    const [adminRows] = await connection.query(
      "SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1"
    );
    if (adminRows.length > 0) {
      const adminId = adminRows[0].id;
      await connection.query(
        'UPDATE users SET balance = balance + ? WHERE id = ?',
        [order.total, adminId]
      );
    }

    await connection.commit();

    try {
      sendStatusUpdateEmail({
        email: userEmail,
        orderId,
        status: 'completed'
      }).catch(e => console.error("Email failed on delivery confirmation:", e.message));
    } catch(e){}

    res.json({ success: true, message: 'Pesanan telah selesai dikonfirmasi diterima' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
module.exports.calculateServerSideTotal = calculateServerSideTotal;

