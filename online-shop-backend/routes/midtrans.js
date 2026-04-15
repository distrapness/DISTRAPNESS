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

// Generate Snap Token
router.get('/config', (req, res) => {
  res.json({ 
    clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-xxx',
    isProduction: process.env.NODE_ENV === 'production' && !process.env.MIDTRANS_CLIENT_KEY?.includes('SB-')
  });
});

router.post('/token', async (req, res) => {
  const { orderId, total, email } = req.body;

  // Parameter parameter transaksi
  let parameter = {
    transaction_details: {
      order_id: `ORDER-${orderId}-${Date.now()}`, // Unik setiap transaksi
      gross_amount: total
    },
    credit_card: {
      secure: true
    },
    customer_details: {
      email: email
    }
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    // transaction token
    const transactionToken = transaction.token;
    res.json({ token: transactionToken });
  } catch (error) {
    console.error('Midtrans Error:', error);
    res.status(500).json({ error: 'Gagal membuat token pembayaran' });
  }
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
