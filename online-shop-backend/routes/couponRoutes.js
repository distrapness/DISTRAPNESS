const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');


// GET all coupons (Admin)
router.get('/', verifyToken, verifyAdmin, (req, res) => {
    pool.query('SELECT * FROM coupons ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// GET all active coupons (Public)
router.get('/active', (req, res) => {
    const query = `
        SELECT code, type, value, min_purchase, start_date, expiry_date, usage_limit, usage_count 
        FROM coupons 
        WHERE is_active = TRUE 
          AND (start_date IS NULL OR start_date <= NOW())
          AND (expiry_date IS NULL OR expiry_date >= NOW())
          AND (usage_limit = 0 OR usage_count < usage_limit)
        ORDER BY created_at DESC
    `;
    pool.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// CREATE coupon (Admin)
router.post('/', verifyToken, verifyAdmin, (req, res) => {
    const { code, type, value, min_purchase, start_date, expiry_date, usage_limit, is_active } = req.body;

    if (!code || !value) return res.status(400).json({ error: "Code and Value are required" });

    const query = `
    INSERT INTO coupons (code, type, value, min_purchase, start_date, expiry_date, usage_limit, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

    pool.query(query,
        [code.toUpperCase(), type || 'percent', value, min_purchase || 0, start_date || null, expiry_date || null, usage_limit || 0, is_active ?? true],
        (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY' || err.code === '23505') return res.status(400).json({ error: "Coupon code already exists" });
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: result.insertId, code, message: "Coupon created" });
        });
});

// UPDATE coupon (Admin)
router.put('/:id', verifyToken, verifyAdmin, (req, res) => {
    const { id } = req.params;
    const { code, type, value, min_purchase, start_date, expiry_date, usage_limit, is_active } = req.body;

    const query = `
    UPDATE coupons 
    SET code=?, type=?, value=?, min_purchase=?, start_date=?, expiry_date=?, usage_limit=?, is_active=?
    WHERE id=?
  `;

    pool.query(query,
        [code.toUpperCase(), type, value, min_purchase, start_date || null, expiry_date || null, usage_limit, is_active, id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: "Coupon updated" });
        });
});

// DELETE coupon (Admin)
router.delete('/:id', verifyToken, verifyAdmin, (req, res) => {
    pool.query('DELETE FROM coupons WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Coupon deleted" });
    });
});

// VERIFY coupon (Client)
router.post('/verify', (req, res) => {
    const { code, cartTotal } = req.body;
    if (!code) return res.status(400).json({ error: "No code provided" });

    pool.query('SELECT * FROM coupons WHERE code = ? AND is_active = TRUE', [code.toUpperCase()], (err, results) => {
        if (err) return res.status(500).json({ error: "Verification failed" });
        if (results.length === 0) return res.status(404).json({ error: "Invalid coupon code" });

        const coupon = results[0];
        const now = new Date();

        // Check dates
        if (coupon.start_date && new Date(coupon.start_date) > now) return res.status(400).json({ error: "Coupon not yet active" });
        if (coupon.expiry_date && new Date(coupon.expiry_date) < now) return res.status(400).json({ error: "Coupon expired" });

        // Check limit
        if (coupon.usage_limit > 0 && coupon.usage_count >= coupon.usage_limit) return res.status(400).json({ error: "Coupon usage limit reached" });

        // Check min purchase
        if (Number(cartTotal) < coupon.min_purchase) return res.status(400).json({ error: `Minimum purchase of Rp ${coupon.min_purchase.toLocaleString('id-ID')} required` });

        // Calculate discount
        let discountAmount = 0;
        if (coupon.type === 'percent') {
            discountAmount = (coupon.value / 100) * Number(cartTotal);
            // Optional: Cap max discount? For now, no cap.
        } else {
            discountAmount = coupon.value;
        }

        // Don't result in negative
        if (discountAmount > Number(cartTotal)) discountAmount = Number(cartTotal);

        res.json({
            valid: true,
            discountAmount,
            couponCode: coupon.code,
            message: "Coupon applied!"
        });
    });
});

module.exports = router;
