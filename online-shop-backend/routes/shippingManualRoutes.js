const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Get all manual rates
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.promise().query('SELECT * FROM shipping_manual_rates ORDER BY destination_name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new manual rate
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
    const { destination_name, price } = req.body;
    if (!destination_name || !price) return res.status(400).json({ error: 'Name and Price required' });

    try {
        const [result] = await pool.promise().query(
            'INSERT INTO shipping_manual_rates (destination_name, price) VALUES (?, ?)',
            [destination_name, price]
        );
        res.json({ id: result.insertId, destination_name, price });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update manual rate
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { destination_name, price } = req.body;

    try {
        await pool.promise().query(
            'UPDATE shipping_manual_rates SET destination_name = ?, price = ? WHERE id = ?',
            [destination_name, price, id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete manual rate
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        await pool.promise().query('DELETE FROM shipping_manual_rates WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
