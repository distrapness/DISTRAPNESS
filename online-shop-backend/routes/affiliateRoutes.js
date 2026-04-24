const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Get affiliate stats & balance
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.promise().query(
            'SELECT balance, points, referral_code, referrals_count FROM users WHERE id = ?', 
            [req.user.id]
        );
        
        const [withdrawals] = await pool.promise().query(
            'SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );

        res.json({
            ...rows[0],
            withdrawals
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Request withdrawal
router.post('/withdraw', verifyToken, async (req, res) => {
    const { amount, bank_account } = req.body;
    const userId = req.user.id;

    if (!amount || amount < 50000) {
        return res.status(400).json({ error: 'Minimal penarikan adalah Rp 50.000' });
    }

    try {
        const [user] = await pool.promise().query('SELECT balance FROM users WHERE id = ?', [userId]);
        if (user[0].balance < amount) {
            return res.status(400).json({ error: 'Saldo tidak mencukupi' });
        }

        await pool.promise().query('START TRANSACTION');
        
        // Deduct balance
        await pool.promise().query('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, userId]);
        
        // Create withdrawal record
        await pool.promise().query(
            'INSERT INTO withdrawals (user_id, amount, bank_account, status) VALUES (?, ?, ?, ?)',
            [userId, amount, bank_account, 'pending']
        );

        await pool.promise().query('COMMIT');
        res.json({ success: true, message: 'Permintaan penarikan berhasil dikirim' });
    } catch (err) {
        await pool.promise().query('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get all withdrawals
router.get('/admin/withdrawals', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const [rows] = await pool.promise().query(`
            SELECT w.*, u.email as user_email 
            FROM withdrawals w 
            JOIN users u ON w.user_id = u.id 
            ORDER BY w.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Update withdrawal status
router.put('/admin/withdrawals/:id', verifyToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // approved or rejected

    try {
        if (status === 'rejected') {
            // Refund balance
            const [w] = await pool.promise().query('SELECT * FROM withdrawals WHERE id = ?', [id]);
            if (w[0] && w[0].status === 'pending') {
                await pool.promise().query('UPDATE users SET balance = balance + ? WHERE id = ?', [w[0].amount, w[0].user_id]);
            }
        }
        
        await pool.promise().query('UPDATE withdrawals SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
