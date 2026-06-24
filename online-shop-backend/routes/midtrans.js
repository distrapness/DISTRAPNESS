const express = require('express');
const router = express.Router();
const midtransClient = require('midtrans-client');
const pool = require('../db');
const { sendStatusUpdateEmail, sendOrderConfirmation, checkAndNotifyLowStock } = require('../services/emailService');

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

// Generate Snap Token
router.get('/config', async (req, res) => {
  const config = await getMidtransConfig();
  res.json({ 
    clientKey: config.clientKey,
    isProduction: config.isProduction
  });
});

// In-memory store for temporary Midtrans order payloads
// Keyed by tempId (UUID), auto-expires after 2 hours
const tempOrderStore = new Map();
setInterval(() => {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  for (const [key, val] of tempOrderStore.entries()) {
    if (val.createdAt < twoHoursAgo) tempOrderStore.delete(key);
  }
}, 30 * 60 * 1000); // cleanup every 30 min

// New endpoint: store temp order + generate snap token in one shot
// Frontend calls this BEFORE showing popup — NO real order is created yet
router.post('/prepare', async (req, res) => {
  const { orderPayload, total, email } = req.body;
  // orderPayload = { userId, email, items, total, paymentMethod, shippingAddress, couponCode, discountAmount, referralCode }

  try {
    if (!orderPayload || !orderPayload.items || orderPayload.items.length === 0) {
      return res.status(400).json({ error: 'Detail produk pesanan kosong.' });
    }

    const { calculateServerSideTotal } = require('./orderRoutes');
    let validatedAmounts;
    try {
      validatedAmounts = await calculateServerSideTotal(
        orderPayload.items,
        orderPayload.couponCode,
        orderPayload.shippingAddress
      );
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    const { randomUUID } = require('crypto');
    const tempId = randomUUID();

    // Inject tempId into shippingAddress to track it in database for pending webhook matching
    if (orderPayload) {
      orderPayload.shippingAddress = orderPayload.shippingAddress || {};
      orderPayload.shippingAddress.tempId = tempId;
      orderPayload.total = validatedAmounts.finalTotal; // Enforce calculated total
      orderPayload.discountAmount = validatedAmounts.discountAmount;
    }

    // 1. Store payload in-memory (avoids DB adapter RETURNING id issue)
    tempOrderStore.set(tempId, { payload: orderPayload, createdAt: Date.now() });

    // Also try to persist to DB
    try {
      await pool.promise().query(
        'INSERT INTO temp_midtrans_orders2 (temp_id, payload) VALUES (?, ?) ON CONFLICT (temp_id) DO NOTHING RETURNING temp_id',
        [tempId, JSON.stringify(orderPayload)]
      );
    } catch (dbErr) {
      console.warn('DB persist failed (non-fatal), using in-memory store:', dbErr.message);
    }

    // 2. Generate Snap token
    const parameter = {
      transaction_details: {
        order_id: `ORDER-${tempId}`,
        gross_amount: Math.round(validatedAmounts.finalTotal)
      },
      credit_card: { secure: true },
      expiry: {
        unit: "hours",
        duration: 24
      },
      customer_details: { email: email || orderPayload?.email || 'customer@mail.com' }
    };

    const snap = await getSnapInstance();
    const transaction = await snap.createTransaction(parameter);

    res.json({ token: transaction.token, tempId, total: validatedAmounts.finalTotal });
  } catch (error) {
    console.error('Midtrans prepare error:', error.ApiResponse || error);
    res.status(500).json({
      error: 'Gagal menyiapkan pembayaran',
      detail: error.ApiResponse ? error.ApiResponse.error_messages : error.message
    });
  }
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
    expiry: {
      unit: "hours",
      duration: 24
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

const crypto = require('crypto');

// Webhook endpoint untuk update status order otomatis
router.post('/webhook', express.json(), async (req, res) => {
  const notif = req.body;
  
  try {
    // 1. VERIFIKASI KEAMANAN (SIGNATURE KEY)
    const config = await getMidtransConfig();
    const hashData = notif.order_id + notif.status_code + notif.gross_amount + config.serverKey;
    const expectedSignature = crypto.createHash('sha512').update(hashData).digest('hex');
    
    if (expectedSignature !== notif.signature_key) {
      console.warn('⚠️ Webhook ditolak: Signature Key tidak valid. Kemungkinan serangan.');
      return res.status(403).json({ error: 'Invalid Signature Key' });
    }

    // Extract orderId from ORDER-{UUID_or_numeric_id}-{timestamp}
    const rawId = notif.order_id.replace(/^ORDER-/, ''); 
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(rawId);
    const orderId = isUUID
      ? rawId.substring(0, 36) 
      : rawId.replace(/-\d+$/, ''); 

    let paymentStatus = 'pending';
    let orderStatus = 'pending';
    if (notif.transaction_status === 'settlement' || notif.transaction_status === 'capture') {
      paymentStatus = 'paid';
      orderStatus = 'processing';
    }
    if (notif.transaction_status === 'pending') {
      paymentStatus = 'pending';
    }
    if (notif.transaction_status === 'expire' || notif.transaction_status === 'cancel' || notif.transaction_status === 'deny') {
      paymentStatus = 'cancelled';
      orderStatus = 'cancelled';
    }

    const connection = await pool.promise().getConnection();
    try {
      await connection.beginTransaction();

      // Retrieve temporary order payload
      let tempPayload = null;
      const memEntry = tempOrderStore.get(orderId);
      if (memEntry) {
        tempPayload = memEntry.payload;
      } else {
        const [tempRows] = await connection.query('SELECT payload FROM temp_midtrans_orders2 WHERE temp_id = ? FOR UPDATE', [orderId]);
        if (tempRows.length > 0) {
          tempPayload = typeof tempRows[0].payload === 'string'
            ? JSON.parse(tempRows[0].payload)
            : tempRows[0].payload;
        }
      }

      // Check if there is an existing order in orders table referencing this tempId
      let existingOrder = null;
      if (isUUID) {
        const [rows] = await connection.query(
          'SELECT id, payment_status, order_status, items, total, shipping_address FROM orders WHERE temp_id = ? FOR UPDATE',
          [orderId]
        );
        if (rows.length > 0) {
          existingOrder = rows[0];
        }
      }

      const finalizeOrder = async (payload, pStatus, oStatus) => {
        const { userId, items, total, shippingAddress, couponCode, discountAmount, email } = payload;
        
        // Stock checks (locking with FOR UPDATE)
        for (const item of items) {
          const [rows] = await connection.query('SELECT stock, name, sizes FROM products WHERE id = ? FOR UPDATE', [item.id]);
          if (rows.length === 0) throw new Error(`Produk "${item.name}" tidak ditemukan.`);
          const product = rows[0];
          if (product.stock < item.qty) throw new Error(`Stok habis untuk "${product.name}". Tersisa hanya ${product.stock}.`);
          if (item.selectedSize) {
            let sizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
            if (sizes && sizes[item.selectedSize] !== undefined && sizes[item.selectedSize] < item.qty) {
              throw new Error(`Ukuran "${item.selectedSize}" untuk produk "${product.name}" sudah habis.`);
            }
          }
        }

        let dbUserId = null;
        if (userId && !isNaN(userId)) {
          dbUserId = parseInt(userId);
        } else if (userId && typeof userId === 'string' && userId.includes('@')) {
          const [uRows] = await connection.query('SELECT id FROM users WHERE email = ?', [userId]);
          if (uRows.length > 0) dbUserId = uRows[0].id;
        } else if (email && typeof email === 'string' && email.includes('@')) {
          const [uRows] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
          if (uRows.length > 0) dbUserId = uRows[0].id;
        }
        const targetEmail = email || (typeof userId === 'string' && userId.includes('@') ? userId : '') || 'customer@mail.com';
        const finalShipping = { ...(shippingAddress || {}), email: targetEmail };

        // Insert final order with UNIQUE temp_id
        const [result] = await connection.query(
          'INSERT INTO orders ("userId", items, total, "paymentMethod", payment_status, order_status, shipping_address, coupon_code, discount_amount, temp_id, "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
          [dbUserId, JSON.stringify(items), total, 'midtrans', pStatus, oStatus, JSON.stringify(finalShipping), couponCode || null, discountAmount || 0, orderId]
        );
        const newOrderId = result.insertId;

        // Deduct stock
        for (const item of items) {
          await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.qty, item.id]);
          if (item.selectedSize) {
            const [pRows] = await connection.query('SELECT sizes FROM products WHERE id = ?', [item.id]);
            if (pRows.length > 0 && pRows[0].sizes) {
              let sizes = typeof pRows[0].sizes === 'string' ? JSON.parse(pRows[0].sizes) : pRows[0].sizes;
              if (sizes && sizes[item.selectedSize] !== undefined) {
                sizes[item.selectedSize] = Math.max(0, sizes[item.selectedSize] - item.qty);
                await connection.query('UPDATE products SET sizes = ? WHERE id = ?', [JSON.stringify(sizes), item.id]);
              }
            }
          }
          checkAndNotifyLowStock(item.id).catch(err => console.error("Low stock check failed (Midtrans):", err.message));
        }

        if (couponCode) {
          await connection.query('UPDATE coupons SET usage_count = usage_count + 1 WHERE code = ?', [couponCode]);
        }

        // Send confirmation email
        if (pStatus === 'paid') {
          try {
            if (targetEmail) {
              await sendOrderConfirmation({ email: targetEmail, orderId: newOrderId, cart: items, total });
            }
          } catch (e) { console.error('Post-payment email error:', e.message); }
        }
      };

      if (isUUID) {
        if (existingOrder) {
          if (paymentStatus === 'paid' && existingOrder.payment_status !== 'paid') {
            await connection.query('UPDATE orders SET payment_status = ?, order_status = ?, "updatedAt" = NOW() WHERE id = ?', ['paid', 'processing', existingOrder.id]);
            
            // Send confirmation email
            try {
              const items = typeof existingOrder.items === 'string' ? JSON.parse(existingOrder.items) : existingOrder.items || [];
              const addr = typeof existingOrder.shipping_address === 'string' ? JSON.parse(existingOrder.shipping_address) : existingOrder.shipping_address || {};
              if (addr.email) {
                sendOrderConfirmation({
                  email: addr.email,
                  orderId: existingOrder.id,
                  cart: items,
                  total: existingOrder.total
                }).catch(e => console.error("Webhook mail error:", e.message));
              }
            } catch (e) { console.error("Webhook mail parsing error:", e.message); }
          } else if (paymentStatus === 'cancelled' && existingOrder.payment_status !== 'cancelled') {
            await connection.query('UPDATE orders SET payment_status = ?, order_status = ?, "updatedAt" = NOW() WHERE id = ?', ['cancelled', 'cancelled', existingOrder.id]);
            const items = typeof existingOrder.items === 'string' ? JSON.parse(existingOrder.items) : existingOrder.items || [];
            for (const item of items) {
              await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.qty, item.id]);
            }
          }
          
          if (paymentStatus === 'paid' || paymentStatus === 'cancelled') {
            tempOrderStore.delete(orderId);
            await connection.query('DELETE FROM temp_midtrans_orders2 WHERE temp_id = ?', [orderId]);
          }

          await connection.commit();
          return res.status(200).json({ success: true });
        }

        if (paymentStatus === 'paid' && tempPayload) {
          await finalizeOrder(tempPayload, 'paid', 'processing');
          tempOrderStore.delete(orderId);
          await connection.query('DELETE FROM temp_midtrans_orders2 WHERE temp_id = ?', [orderId]);
          await connection.commit();
          return res.status(200).json({ success: true });
        }

        if (paymentStatus === 'pending' && tempPayload) {
          const payType = (notif.payment_type || '').toLowerCase();
          const isPayLater = ['bank_transfer', 'echannel', 'cstore'].includes(payType) || payType.includes('va') || payType.includes('transfer') || payType.includes('bill');
          if (isPayLater) {
            await finalizeOrder(tempPayload, 'pending', 'pending');
          }
          await connection.commit();
          return res.status(200).json({ success: true });
        }

        if (paymentStatus === 'cancelled') {
          tempOrderStore.delete(orderId);
          await connection.query('DELETE FROM temp_midtrans_orders2 WHERE temp_id = ?', [orderId]);
        }
        await connection.commit();
        return res.status(200).json({ success: true });
      }

      // Fallback for non-UUID orderId (pre-existing orders)
      const [orderRows] = await connection.query('SELECT payment_status, order_status, items, total, shipping_address FROM orders WHERE id = ? FOR UPDATE', [orderId]);
      if (orderRows.length === 0) {
        await connection.commit();
        return res.status(404).json({ error: 'Order not found' });
      }

      const existingPaymentStatus = orderRows[0].payment_status;
      const items = typeof orderRows[0].items === 'string' ? JSON.parse(orderRows[0].items) : orderRows[0].items || [];
      const addr = typeof orderRows[0].shipping_address === 'string' ? JSON.parse(orderRows[0].shipping_address) : orderRows[0].shipping_address || {};

      if (paymentStatus === 'paid' && existingPaymentStatus !== 'paid') {
        await connection.query('UPDATE orders SET payment_status = ?, order_status = ?, "updatedAt" = NOW() WHERE id = ?', ['paid', 'processing', orderId]);
        try {
          if (addr.email) {
            sendOrderConfirmation({
              email: addr.email,
              orderId,
              cart: items,
              total: orderRows[0].total
            }).catch(e => console.error("Midtrans fallback invoice email failed:", e.message));
          }
        } catch (e) {}
      } else if (paymentStatus === 'cancelled' && existingPaymentStatus !== 'cancelled') {
        await connection.query('UPDATE orders SET payment_status = ?, order_status = ?, "updatedAt" = NOW() WHERE id = ?', ['cancelled', 'cancelled', orderId]);
        for (const item of items) {
          await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.qty, item.id]);
        }
      }

      await connection.commit();
      res.status(200).json({ success: true });
    } catch (dbErr) {
      await connection.rollback();
      throw dbErr;
    } finally {
      connection.release();
    }
  } catch (e) {
    console.error("Webhook processing error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
module.exports.tempOrderStore = tempOrderStore;

