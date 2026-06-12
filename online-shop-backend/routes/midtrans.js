const express = require('express');
const router = express.Router();
const midtransClient = require('midtrans-client');
const pool = require('../db');
const { sendStatusUpdateEmail, sendOrderConfirmation } = require('../services/emailService');

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
    const { randomUUID } = require('crypto');
    const tempId = randomUUID();

    // Inject tempId into shippingAddress to track it in database for pending webhook matching
    if (orderPayload) {
      orderPayload.shippingAddress = orderPayload.shippingAddress || {};
      orderPayload.shippingAddress.tempId = tempId;
    }

    // 1. Store payload in-memory (avoids DB adapter RETURNING id issue)
    tempOrderStore.set(tempId, { payload: orderPayload, createdAt: Date.now() });

    // Also try to persist to DB (best-effort, won't block if fails)
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
        gross_amount: Math.round(total)
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

    res.json({ token: transaction.token, tempId });
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
  // Midtrans akan mengirim notifikasi status pembayaran ke endpoint ini
  
  try {
    // 1. VERIFIKASI KEAMANAN (SIGNATURE KEY)
    const config = await getMidtransConfig();
    const hashData = notif.order_id + notif.status_code + notif.gross_amount + config.serverKey;
    const expectedSignature = crypto.createHash('sha512').update(hashData).digest('hex');
    
    if (expectedSignature !== notif.signature_key) {
      console.warn('⚠️ Webhook ditolak: Signature Key tidak valid. Kemungkinan serangan.');
      return res.status(403).json({ error: 'Invalid Signature Key' });
    }

    // Update status order di database sesuai notif.transaction_status

    // Extract orderId: format is ORDER-{UUID_or_numeric_id}-{timestamp}
    // UUID is 36 chars (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    // Numeric id is short. We take everything between "ORDER-" and the last "-{timestamp}"
    const rawId = notif.order_id.replace(/^ORDER-/, ''); // remove "ORDER-" prefix
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(rawId);
    const orderId = isUUID
      ? rawId.substring(0, 36) // UUID is exactly 36 chars
      : rawId.replace(/-\d+$/, ''); // numeric: strip trailing -timestamp
    let status = 'pending';
    if (notif.transaction_status === 'settlement' || notif.transaction_status === 'capture') status = 'paid';
    if (notif.transaction_status === 'pending') status = 'pending';
    if (notif.transaction_status === 'expire' || notif.transaction_status === 'cancel' || notif.transaction_status === 'deny') status = 'cancelled';

    // Retrieve temporary order payload — check in-memory store first, then DB fallback
    let tempPayload = null;
    const memEntry = tempOrderStore.get(orderId);
    if (memEntry) {
      tempPayload = memEntry.payload;
    } else {
      // Fallback: try DB (temp_midtrans_orders2)
      try {
        const [rows] = await pool.promise().query('SELECT payload FROM temp_midtrans_orders2 WHERE temp_id = ?', [orderId]);
        if (rows.length > 0) {
          tempPayload = typeof rows[0].payload === 'string'
            ? JSON.parse(rows[0].payload)
            : rows[0].payload;
        }
      } catch (dbErr) {
        console.warn('DB fallback lookup failed:', dbErr.message);
      }
    }

    // Check if there is an existing order in orders table referencing this UUID (tempId)
    let existingOrder = null;
    if (isUUID) {
      try {
        const [rows] = await pool.promise().query(
          "SELECT id, status, items FROM orders WHERE shipping_address LIKE ?",
          [`%${orderId}%`]
        );
        if (rows.length > 0) {
          existingOrder = rows[0];
        }
      } catch (err) {
        console.error("Error checking existing order by tempId:", err.message);
      }
    }

    // Helper to finalize order (supports paid or pending status)
    const finalizeOrder = async (payload, orderStatus = 'paid') => {
      const { userId, items, total, shippingAddress, couponCode, discountAmount, email, referralCode } = payload;
      const connection = await pool.promise().getConnection();
      try {
        await connection.beginTransaction();
        // Stock checks (same as order creation)
        for (const item of items) {
          const [rows] = await connection.query('SELECT stock, name, sizes FROM products WHERE id = ? FOR UPDATE', [item.id]);
          if (rows.length === 0) throw new Error(`Produk "${item.name}" tidak ditemukan.`);
          const product = rows[0];
          if (product.stock < item.qty) throw new Error(`Stok habis untuk "${product.name}". Tersisa hanya ${product.stock}.`);
          if (item.selectedSize) {
            try {
              let sizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
              if (sizes && sizes[item.selectedSize] !== undefined && sizes[item.selectedSize] < item.qty) {
                throw new Error(`Ukuran "${item.selectedSize}" untuk produk "${product.name}" sudah habis.`);
              }
            } catch (e) { console.error('Size validation error:', e.message); }
          }
        }
        // Resolve user id
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

        // Insert order with paid or pending status
        const [result] = await connection.query(
          'INSERT INTO orders ("userId", items, total, "paymentMethod", status, shipping_address, coupon_code, discount_amount, referral_code, "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
          [dbUserId, JSON.stringify(items), total, 'midtrans', orderStatus, JSON.stringify(finalShipping), couponCode || null, discountAmount || 0, null]
        );
        const newOrderId = result.insertId;

        // Decrease stock
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
              } catch (e) { console.error('Error updating size stock:', e.message); }
            }
          }
        }

        // Coupon usage
        if (couponCode) {
          await connection.query('UPDATE coupons SET usage_count = usage_count + 1 WHERE code = ?', [couponCode]);
        }

        await connection.commit();

        // Send emails only if paid/lunas
        if (orderStatus === 'paid') {
          try {
            const [orderRows] = await pool.promise().query('SELECT total, items, shipping_address FROM orders WHERE id = ?', [newOrderId]);
            const totalAmount = orderRows[0]?.total || 0;
            const orderItems = JSON.parse(orderRows[0]?.items || '[]');
            const addr = JSON.parse(orderRows[0]?.shipping_address || '{}');
            if (addr.email) {
              await sendOrderConfirmation({ email: addr.email, orderId: newOrderId, cart: orderItems, total: totalAmount });
            }
          } catch (e) { console.error('Post-payment email error:', e.message); }
        }
      } catch (e) {
        await connection.rollback();
        console.error('Finalize Midtrans order error:', e.message);
        throw e;
      } finally {
        connection.release();
      }
    };

    // Process based on status
    if (isUUID) {
      if (existingOrder) {
        // Order already created! Update status if status changes.
        if (status === 'paid' && existingOrder.status !== 'paid') {
          await pool.promise().query('UPDATE orders SET status = ? WHERE id = ?', ['paid', existingOrder.id]);
          
          // Send invoice confirmation email after payment success
          try {
            const [orders] = await pool.promise().query('SELECT total, items, shipping_address FROM orders WHERE id = ?', [existingOrder.id]);
            const totalAmount = orders[0]?.total || 0;
            const items = JSON.parse(orders[0]?.items || '[]');
            const addr = JSON.parse(orders[0]?.shipping_address || '{}');
            
            if (addr.email) {
              sendOrderConfirmation({
                email: addr.email,
                orderId: existingOrder.id,
                cart: items,
                total: totalAmount
              }).catch(e => console.error("Midtrans invoice email failed:", e.message));
            }
          } catch (e) {
            console.error("Invoice email error:", e.message);
          }
        } else if (status === 'cancelled' && existingOrder.status !== 'cancelled') {
          // Restore stock if cancelled
          await pool.promise().query('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', existingOrder.id]);
          
          let orderItems = [];
          try {
            orderItems = typeof existingOrder.items === 'string'
              ? JSON.parse(existingOrder.items)
              : existingOrder.items || [];
          } catch (e) {
            console.error("Failed to parse items from existingOrder:", e);
          }

          if (orderItems && orderItems.length > 0) {
            try {
              for (const item of orderItems) {
                await pool.promise().query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.qty, item.id]);
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
              console.error("Stock restoration error (Midtrans UUID):", e.message);
            }
          }

          // Send cancel status email
          try {
            const [rows] = await pool.promise().query('SELECT shipping_address FROM orders WHERE id = ?', [existingOrder.id]);
            if (rows.length > 0) {
              const addr = JSON.parse(rows[0].shipping_address || '{}');
              if (addr.email) {
                sendStatusUpdateEmail({
                  email: addr.email,
                  orderId: existingOrder.id,
                  status: 'cancelled'
                });
              }
            }
          } catch (e) {
            console.error("Failed to send cancel status email:", e.message);
          }
        }
        
        // Clean up temp stores if finalized
        if (status === 'paid' || status === 'cancelled') {
          tempOrderStore.delete(orderId);
          try {
            await pool.promise().query('DELETE FROM temp_midtrans_orders2 WHERE temp_id = ?', [orderId]);
          } catch (e) { /* non-fatal */ }
        }
        
        return res.status(200).json({ success: true });
      }

      // If order does not exist yet in DB
      if (status === 'paid' && tempPayload) {
        await finalizeOrder(tempPayload, 'paid');
        tempOrderStore.delete(orderId);
        try {
          await pool.promise().query('DELETE FROM temp_midtrans_orders2 WHERE temp_id = ?', [orderId]);
        } catch (e) { /* non-fatal */ }
        return res.status(200).json({ success: true });
      }

      if (status === 'pending' && tempPayload) {
        // Create the order as pending in the DB!
        await finalizeOrder(tempPayload, 'pending');
        // Do NOT delete from tempOrderStore/DB yet, since we need it for subsequent updates
        return res.status(200).json({ success: true });
      }

      if (status === 'cancelled') {
        tempOrderStore.delete(orderId);
        try {
          await pool.promise().query('DELETE FROM temp_midtrans_orders2 WHERE temp_id = ?', [orderId]);
        } catch (e) { /* non-fatal */ }
      }
      return res.status(200).json({ success: true });
    }

    pool.query('SELECT status, items FROM orders WHERE id=?', [orderId], async (err, orderResults) => {
      if (err || !orderResults.length) return res.status(500).json({ error: 'DB error' });
      
      const oldStatus = orderResults[0].status;
      const items = JSON.parse(orderResults[0].items || '[]');

      // If status changes to cancelled FROM something else
      if (status === 'cancelled' && oldStatus !== 'cancelled') {
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
        
        // Invoice Email
        if (status === 'paid' && oldStatus !== 'paid') {
            try {
                const [orders] = await pool.promise().query('SELECT total, items, shipping_address FROM orders WHERE id = ?', [orderId]);
                const totalAmount = orders[0]?.total || 0;
                const items = JSON.parse(orders[0]?.items || '[]');
                const addr = JSON.parse(orders[0]?.shipping_address || '{}');
                
                // Kirim Email Konfirmasi Pesanan dengan rincian barang (invoice) setelah pembayaran sukses
                if (addr.email) {
                    sendOrderConfirmation({
                        email: addr.email,
                        orderId: orderId,
                        cart: items,
                        total: totalAmount
                    }).catch(e => console.error("Midtrans invoice email failed:", e.message));
                }
            } catch (e) {
                console.error("Invoice email error:", e.message);
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
module.exports.tempOrderStore = tempOrderStore;

