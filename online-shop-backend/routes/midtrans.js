const express = require('express');
const router = express.Router();
const midtransClient = require('midtrans-client');
const pool = require('../db');
const { sendStatusUpdateEmail } = require('../services/emailService');

const getMidtransConfig = async () => {
    try {
        const [rows] = await pool.promise().query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('midtrans_server_key', 'midtrans_client_key', 'midtrans_production')");
        const settings = rows.reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});
        return {
            serverKey: settings.midtrans_server_key || process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-xxx',
            clientKey: settings.midtrans_client_key || process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-xxx',
            isProduction: settings.midtrans_production === 'true'
        };
    } catch (err) {
        console.error("Error fetching Midtrans config", err);
        return {
            serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-xxx',
            clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-xxx',
            isProduction: false
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

// Generate Snap Token
router.get('/config', async (req, res) => {
  const config = await getMidtransConfig();
  res.json({ 
    clientKey: config.clientKey,
    isProduction: config.isProduction
  });
});

router.post('/token', async (req, res) => {
  const { orderId, total, email } = req.body;

  // Parameter parameter transaksi
  let parameter = {
    transaction_details: {
      order_id: `ORDER-${orderId}-${Date.now()}`, // Unik setiap transaksi
      gross_amount: Math.round(total) // Midtrans requires integer for many methods (like QRIS)
    },
    credit_card: {
      secure: true
    },
    customer_details: {
      email: email
    }
  };

  try {
    const snap = await getSnapInstance();
    const transaction = await snap.createTransaction(parameter);
    // transaction token
    const transactionToken = transaction.token;
    res.json({ token: transactionToken });
  } catch (error) {
    console.error('Midtrans API Error Detail:', error.ApiResponse || error);
    res.status(500).json({ 
      error: 'Gagal membuat token pembayaran', 
      detail: error.ApiResponse ? error.ApiResponse.error_messages : error.message 
    });
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
    
    pool.query('SELECT status, items FROM orders WHERE id=?', [orderId], async (err, orderResults) => {
      if (err || !orderResults.length) return res.status(500).json({ error: 'DB error' });
      
      const oldStatus = orderResults[0].status;
      const items = JSON.parse(orderResults[0].items || '[]');

      // If status changes to failed/cancel/expire FROM something else
      if ((status === 'failed' || status === 'cancel' || status === 'expire') && oldStatus !== 'failed' && oldStatus !== 'cancel' && oldStatus !== 'expire') {
          try {
              for (const item of items) {
                  await pool.promise().query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.qty, item.id]);
                  
                  // Restore variant stock
                  if (item.selectedSize) {
                      const [pRows] = await pool.promise().query('SELECT sizes FROM products WHERE id = ?', [item.id]);
                      if (pRows.length > 0 && pRows[0].sizes) {
                          let sizes = typeof pRows[0].sizes === 'string' ? JSON.parse(pRows[0].sizes) : pRows[0].sizes;
                          if (sizes && sizes[item.selectedSize] !== undefined) {
                              sizes[item.selectedSize] += item.qty;
                              await pool.promise().query('UPDATE products SET sizes = ? WHERE id = ?', [JSON.stringify(sizes), item.id]);
                          }
                      }
                  }
              }
          } catch (e) {
              console.error("Stock restoration error (Midtrans):", e.message);
          }
      }

      pool.query('UPDATE orders SET status=? WHERE id=?', [status, orderId], async (err) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        
        // Referral & Affiliate Reward Logic
        if (status === 'paid' && oldStatus !== 'paid') {
            try {
                const [orders] = await pool.promise().query('SELECT referral_code, total FROM orders WHERE id = ?', [orderId]);
                const refCode = orders[0]?.referral_code;
                const totalAmount = orders[0]?.total || 0;
                
                if (refCode) {
                    // Reward the referrer (1000 points per success + 10% cash commission)
                    const commission = parseFloat(totalAmount) * 0.10; 
                    await pool.promise().query(
                      'UPDATE users SET points = points + 1000, referrals_count = referrals_count + 1, balance = balance + ? WHERE referral_code = ?', 
                      [commission, refCode]
                    );
                    console.log(`Referral reward & affiliate commission (${commission}) given to code: ${refCode}`);
                }
            } catch (e) {
                console.error("Affiliate reward error:", e.message);
            }
        }

        // Send Status Email (Sync) [NEW]
        try {
            const [rows] = await pool.promise().query('SELECT shipping_address FROM orders WHERE id = ?', [orderId]);
            if (rows.length > 0) {
                const addr = JSON.parse(rows[0].shipping_address || '{}');
                if (addr.email) {
                    sendStatusUpdateEmail({
                        email: addr.email,
                        orderId,
                        status
                    });
                }
            }
        } catch (e) {
            console.error("Failed to send Midtrans status email:", e.message);
        }

        res.status(200).json({ success: true });
      });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
