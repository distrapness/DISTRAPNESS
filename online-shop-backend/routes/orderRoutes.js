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
      const [rows] = await connection.query('SELECT stock, name FROM products WHERE id = ? FOR UPDATE', [item.id]);

      if (rows.length === 0) {
        throw new Error(`Produk "${item.name}" tidak ditemukan.`);
      }

      const product = rows[0];
      if (product.stock < item.qty) {
        throw new Error(`Stok habis untuk "${product.name}". Tersisa hanya ${product.stock}.`);
      }
    }

    // 2. Siapkan Data
    const dbUserId = (userId && !isNaN(userId)) ? userId : null;
    const finalShipping = {
      ...(shippingAddress || {}),
      email: email || (userId && typeof userId === 'string' && userId.includes('@') ? userId : '')
    };

    // 3. Simpan Order
    const [result] = await connection.query(
      'INSERT INTO orders (userId, items, total, paymentMethod, status, shipping_address, coupon_code, discount_amount, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [dbUserId, JSON.stringify(items), total, paymentMethod, status || 'pending', JSON.stringify(finalShipping), couponCode || null, discountAmount || 0]
    );

    const newOrderId = result.insertId;

    // 4. Kurangi Stok
    for (const item of items) {
      await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.qty, item.id]);
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
    res.json(order);
  });
});

// UPDATE ORDER STATUS (Admin)
router.put('/status/:orderId', verifyToken, verifyAdmin, (req, res) => {
  const { orderId } = req.params;
  const { status, trackingNumber } = req.body;

  let query = 'UPDATE orders SET status=? WHERE id=?';
  let params = [status, orderId];

  if (trackingNumber !== undefined) {
    query = 'UPDATE orders SET status=?, tracking_number=? WHERE id=?';
    params = [status, trackingNumber, orderId];
  }

  pool.query(query, params, (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error', detail: err });
    
    // Fetch order details to get email for notification
    pool.query('SELECT shipping_address FROM orders WHERE id = ?', [orderId], (err2, results) => {
      if (!err2 && results.length > 0) {
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
    });

    res.json({ success: true });
  });
});

module.exports = router;
