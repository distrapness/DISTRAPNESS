const express = require('express');
const router = express.Router();
const midtransClient = require('midtrans-client');
const pool = require('../db');

// Ganti dengan Server Key dan Client Key sandbox Anda
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-xxx',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-xxx'
});

// Dummy endpoint untuk generate token & data pembayaran tanpa Midtrans
router.post('/token', async (req, res) => {
  const { orderId, total, email, paymentMethod } = req.body;
  // Simulasi nomor virtual account dan QR code
  let dummyData = {
    token: `dummy-token-${orderId}`,
    order_id: `ORDER-${orderId}-${Date.now()}`,
    payment_method: paymentMethod,
    total,
    email,
  };
  if (paymentMethod === 'bca_va') {
    dummyData.va_number = '1234 5678 9012 3456';
    dummyData.bank = 'BCA';
  } else if (paymentMethod === 'qris') {
    dummyData.qr_string = 'DUMMY-QR-STRING-123456';
    dummyData.qr_url = 'https://dummy-qr.com/123456';
  } else if (paymentMethod === 'mandiri_tf') {
    dummyData.account_number = '14000 1234 5678';
    dummyData.bank = 'Mandiri';
  }
  res.json(dummyData);
});

// Endpoint untuk mendapatkan data pembayaran dummy
router.get('/payments', async (req, res) => {
  // Dummy data pembayaran
  const payments = [
    {
      id: 1,
      order_id: 'ORDER-1-1714650000000',
      customer: 'Budi',
      email: 'budi@mail.com',
      amount: 250000,
      status: 'paid',
      method: 'bca_va',
      date: '2025-05-02 18:00:00'
    },
    {
      id: 2,
      order_id: 'ORDER-2-1714651000000',
      customer: 'Siti',
      email: 'siti@mail.com',
      amount: 120000,
      status: 'waiting_payment',
      method: 'gopay',
      date: '2025-05-02 18:30:00'
    }
  ];
  res.json(payments);
});

// Endpoint untuk daftar metode pembayaran
router.get('/methods', (req, res) => {
  const methods = [
    { label: 'Virtual Account BCA', value: 'bca_va' },
    { label: 'QRIS (All Bank)', value: 'qris' },
    { label: 'Transfer Bank Mandiri', value: 'mandiri_tf' },
    { label: 'COD (Bayar di Tempat)', value: 'cod' }
  ];
  res.json(methods);
});

// Webhook endpoint untuk update status order otomatis
router.post('/webhook', express.json(), async (req, res) => {
  const notif = req.body;
  // Midtrans akan mengirim notifikasi status pembayaran ke endpoint ini
  // Update status order di database sesuai notif.transaction_status
  try {
    const orderId = notif.order_id.split('-')[1]; // Format: ORDER-<orderId>-timestamp
    let status = 'pending';
    if (notif.transaction_status === 'settlement') status = 'paid';
    if (notif.transaction_status === 'pending') status = 'waiting_payment';
    if (notif.transaction_status === 'expire' || notif.transaction_status === 'cancel') status = 'failed';
    pool.query('UPDATE orders SET status=? WHERE id=?', [status, orderId], (err) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.status(200).json({ success: true });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
