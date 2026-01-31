const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
  try {
    // Insert order
    pool.query(
      'INSERT INTO orders (userId, items, total, paymentMethod, status, createdAt) VALUES (?, ?, ?, ?, ?, NOW())',
      [userId, JSON.stringify(items), total, paymentMethod, status || 'pending'],
      (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error', detail: err });
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
