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

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < 50000) {
        return res.status(400).json({ error: 'Minimal penarikan adalah Rp 50.000 dan harus berupa angka valid.' });
    }

    if (!bank_account || bank_account.trim() === "") {
        return res.status(400).json({ error: 'Nomor akun bank tujuan wajib diisi.' });
    }

    const connection = await pool.promise().getConnection();
    try {
        // 1. Mulai transaksi terlebih dahulu agar isolasi berjalan
        await connection.beginTransaction();

        // 2. Kunci baris user dengan FOR UPDATE untuk mencegah pembacaan data saldo yang kotor (dirty reads) secara konkruen
        const [user] = await connection.query('SELECT balance FROM users WHERE id = ? FOR UPDATE', [userId]);
        
        if (!user.length) {
            await connection.rollback();
            return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }

        const currentBalance = parseFloat(user[0].balance);
        if (currentBalance < withdrawAmount) {
            await connection.rollback();
            return res.status(400).json({ error: 'Saldo tidak mencukupi untuk melakukan penarikan.' });
        }

        // 3. Potong saldo afiliasi
        await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [withdrawAmount, userId]);
        
        // 4. Catat riwayat penarikan
        await connection.query(
            'INSERT INTO withdrawals (user_id, amount, bank_account, status, created_at) VALUES (?, ?, ?, ?, NOW())',
            [userId, withdrawAmount, bank_account.trim(), 'pending']
        );

        await connection.commit();
        res.json({ success: true, message: 'Permintaan penarikan berhasil dikirim' });
    } catch (err) {
        await connection.rollback();
        console.error("[WITHDRAW TRANSACTION ERROR]:", err.message);
        res.status(500).json({ error: 'Terjadi kesalahan sistem saat memproses penarikan.' });
    } finally {
        connection.release();
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

    const connection = await pool.promise().getConnection();
    try {
        await connection.beginTransaction();

        if (status === 'rejected') {
            // Refund balance
            const [w] = await connection.query('SELECT * FROM withdrawals WHERE id = ? FOR UPDATE', [id]);
            if (w[0] && w[0].status === 'pending') {
                await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [w[0].amount, w[0].user_id]);
            }
        }
        
        await connection.query('UPDATE withdrawals SET status = ? WHERE id = ?', [status, id]);
        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
