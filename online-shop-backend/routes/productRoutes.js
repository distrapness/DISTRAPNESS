const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/products
router.get('/', (req, res) => {
  pool.query('SELECT * FROM products', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    // Parse images field (JSON array)
    const products = results.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : (product.image ? [product.image] : []),
    }));
    res.json(products);
  });
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  pool.query('SELECT * FROM products WHERE id=?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || results.length === 0) return res.status(404).json({ error: 'Produk tidak ditemukan' });
    const product = results[0];
    product.images = product.images ? JSON.parse(product.images) : (product.image ? [product.image] : []);
    res.json(product);
  });
});

// POST /api/products
router.post('/', (req, res) => {
  const { name, price, images, description } = req.body;
  if (!name || !price) {
    console.error('[POST /api/products] Field wajib kosong:', { name, price });
    return res.status(400).json({ error: 'Nama dan harga produk wajib diisi.' });
  }
  let imagesToSave = images;
  if (!Array.isArray(imagesToSave)) {
    try {
      imagesToSave = images ? JSON.parse(images) : [];
    } catch (e) {
      imagesToSave = [];
    }
  }
  try {
    pool.query(
      'INSERT INTO products (name, price, images, description) VALUES (?, ?, ?, ?)',
      [name, price, JSON.stringify(imagesToSave), description],
      (err, result) => {
        if (err) {
          console.error('[POST /api/products] DB Error:', err.message);
          if (err.message.includes('no such column: images')) {
            return res.status(500).json({ error: 'Kolom images belum ada di database. Jalankan migrasi SQL: ALTER TABLE products ADD COLUMN images TEXT;' });
          }
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: result.insertId, name, price, images: imagesToSave, description });
      }
    );
  } catch (err) {
    console.error('[POST /api/products] Fatal Error:', err);
    res.status(500).json({ error: 'Unexpected error saat menyimpan produk.' });
  }
});

// PUT /api/products/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, images, description } = req.body;
  if (!name || !price) {
    console.error('[PUT /api/products/:id] Field wajib kosong:', { name, price });
    return res.status(400).json({ error: 'Nama dan harga produk wajib diisi.' });
  }
  let imagesToSave = images;
  if (!Array.isArray(imagesToSave)) {
    try {
      imagesToSave = images ? JSON.parse(images) : [];
    } catch (e) {
      imagesToSave = [];
    }
  }
  try {
    pool.query(
      'UPDATE products SET name=?, price=?, images=?, description=? WHERE id=?',
      [name, price, JSON.stringify(imagesToSave), description, id],
      (err) => {
        if (err) {
          console.error('[PUT /api/products/:id] DB Error:', err.message);
          if (err.message.includes('no such column: images')) {
            return res.status(500).json({ error: 'Kolom images belum ada di database. Jalankan migrasi SQL: ALTER TABLE products ADD COLUMN images TEXT;' });
          }
          return res.status(500).json({ error: err.message });
        }
        res.json({ id, name, price, images: imagesToSave, description });
      }
    );
  } catch (err) {
    console.error('[PUT /api/products/:id] Fatal Error:', err);
    res.status(500).json({ error: 'Unexpected error saat update produk.' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  pool.query(
    'DELETE FROM products WHERE id=?',
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Produk tidak ditemukan' });
      res.json({ success: true });
    }
  );
});

module.exports = router;
