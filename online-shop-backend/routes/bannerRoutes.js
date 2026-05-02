const express = require('express');
const multer = require('multer');
const router = express.Router();
const pool = require('../db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Multer setup (Dual Mode)
let storage;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: { folder: 'distrapness-banners' }
  });
} else {
  storage = multer.memoryStorage();
}

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB Limit for Banners
});

// UPLOAD banner image -> Returns URL or Base64
router.post('/upload', verifyToken, verifyAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  if (req.file.path) {
    return res.json({ url: req.file.path });
  }

  const b64 = Buffer.from(req.file.buffer).toString('base64');
  const mime = req.file.mimetype;
  const url = `data:${mime};base64,${b64}`;

  res.json({ url });
});

// GET all banners
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.promise().query('SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error("GET Banners Error:", err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// POST new banner
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  const { image, original_image } = req.body;
  if (!image) return res.status(400).json({ error: 'Gambar wajib diisi' });
  
  try {
    const [result] = await pool.promise().query('INSERT INTO banners (image, original_image) VALUES (?, ?)', [image, original_image || null]);
    res.json({ id: result.insertId.toString(), image, original_image });
  } catch (err) {
    console.error("POST Banners Error:", err);
    res.status(500).json({ error: 'Failed to add banner' });
  }
});

// PUT update banner
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { image, original_image } = req.body;
  
  if (!image) return res.status(400).json({ error: 'Gambar wajib diisi' });

  try {
    let sql = 'UPDATE banners SET image=?';
    let params = [image];
    if (original_image !== undefined) {
      sql += ', original_image=?';
      params.push(original_image);
    }
    sql += ' WHERE id=?';
    params.push(id);

    const [result] = await pool.promise().query(sql, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Banner tidak ditemukan' });
    res.json({ id, image, original_image });
  } catch (err) {
    console.error("PUT Banners Error:", err);
    res.status(500).json({ error: 'Failed to update banner' });
  }
});

// DELETE banner
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.promise().query('DELETE FROM banners WHERE id=?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Banner tidak ditemukan' });
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE Banners Error:", err);
    res.status(500).json({ error: 'Failed to delete banner' });
  }
});

// PUT /sort : reorder banners
router.put('/sort', verifyToken, verifyAdmin, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'Format tidak valid' });
  
  const connection = await pool.promise().getConnection();
  try {
    await connection.beginTransaction();
    for (let i = 0; i < ids.length; i++) {
        await connection.query('UPDATE banners SET sort_order=? WHERE id=?', [i, ids[i]]);
    }
    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    console.error("SORT Banners Error:", err);
    res.status(500).json({ error: 'Failed to reorder banners' });
  } finally {
    connection.release();
  }
});

module.exports = router;
