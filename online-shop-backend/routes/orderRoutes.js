const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendOrderConfirmation } = require('../services/emailService');

// Multer setup for payment proof uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// CREATE ORDER
router.post('/', async (req, res) => {
  const { userId, items, total, paymentMethod, status } = req.body;

  // Fix: userId di database kemungkinan INT, tapi frontend kirim Email (String) untuk guest.
  // Jika userId bukan angka, set ke NULL.
  const dbUserId = (userId && !isNaN(userId)) ? userId : null;

  try {
    // Insert order
    pool.query(
      'INSERT INTO orders (userId, items, total, paymentMethod, status, createdAt) VALUES (?, ?, ?, ?, ?, NOW())',
      [dbUserId, JSON.stringify(items), total, paymentMethod, status || 'pending'],
      (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error', detail: err });

        // Kirim email konfirmasi (asynchronous, tidak perlu tunggu selesai)
        // Kita perlu ambil email user dulu. 
        // NOTE: Di codingan lama, userId disimpan, tapi kita butuh email.
        // Asumsi: userId yang dikirim dari frontend adalah email (jika login pakai email) 
        // ATAU kita perlu query user table.
        // Untuk amannya, kita query user table berdasarkan userId (jika userId itu ID)
        // TAPI, jika userId itu sebenarnya string email (karena auth sederhana), langsung pakai.
        // Mari kita cek db schema user... 

        // SEMENTARA: Kita asumsikan backend menerima field 'userEmail' di body request juga agar lebih mudah.
        // Jika tidak ada request body email, kita coba gunakan userId kalau bentuknya email.
        const targetEmail = req.body.email || (userId && userId.includes('@') ? userId : null);

        if (targetEmail) {
          sendOrderConfirmation({
            email: targetEmail,
            orderId: result.insertId,
            cart: items,
            total: total
          });
        }

        res.json({ success: true, orderId: result.insertId });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', detail: err });
  }
});

// UPLOAD PAYMENT PROOF
router.post('/upload-proof/:orderId', upload.single('paymentProof'), (req, res) => {
  const { orderId } = req.params;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
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
router.get('/', (req, res) => {
  pool.query('SELECT * FROM orders ORDER BY createdAt DESC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error', detail: err });
    res.json(results);
  });
});

// GET ORDER BY ID
router.get('/:orderId', (req, res) => {
  const { orderId } = req.params;
  pool.query('SELECT * FROM orders WHERE id=?', [orderId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error', detail: err });
    if (!results.length) return res.status(404).json({ error: 'Order not found' });
    res.json(results[0]);
  });
});

// UPDATE ORDER STATUS (Admin)
router.put('/status/:orderId', (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  pool.query('UPDATE orders SET status=? WHERE id=?', [status, orderId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error', detail: err });
    res.json({ success: true });
  });
});

module.exports = router;
