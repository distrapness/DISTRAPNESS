const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/products
router.get('/', (req, res) => {
  pool.query('SELECT * FROM products', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    // Parse images field (JSON array)
    const products = results.map(product => {
      // Remove sku, category, weight, and dimensions from response if present
      const { sku, category, weight, dimensions, ...rest } = product;
      return {
        ...rest,
        images: product.images ? JSON.parse(product.images) : (product.image ? [product.image] : []),
      };
    });
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
    // Remove sku, category, weight, and dimensions from response if present
    const { sku, category, weight, dimensions, ...rest } = product;
    rest.images = product.images ? JSON.parse(product.images) : (product.image ? [product.image] : []);
    res.json(rest);
  });
});

// POST /api/products
router.post('/', (req, res) => {
  const { name, price, images, description, stock } = req.body;
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
      'INSERT INTO products (name, price, images, description, stock) VALUES (?, ?, ?, ?, ?)',
      [name, price, JSON.stringify(imagesToSave), description, Number(stock) || 0],
      (err, result) => {
        if (err) {
          if (err.message.includes('no such column: images')) {
            return res.status(500).json({ error: 'Kolom images belum ada di database. Jalankan migrasi SQL: ALTER TABLE products ADD COLUMN images TEXT;' });
          }
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: result.insertId, name, price, images: imagesToSave, description, stock: Number(stock) || 0 });
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
  const { name, price, images, description, stock } = req.body;
  if (!name || !price) {
    console.error('[PUT /api/products/:id] Field wajib kosong:', { name, price });
    return res.status(400).json({ error: 'Nama dan harga produk wajib diisi.' });
  }
  // Ambil gambar lama dari database
  pool.query('SELECT images FROM products WHERE id=?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    let oldImages = [];
    if (results && results.length > 0 && results[0].images) {
      try {
        oldImages = JSON.parse(results[0].images);
      } catch (e) {
        oldImages = [];
      }
    }
    let imagesToSave = images;
    if (!Array.isArray(imagesToSave)) {
      try {
        imagesToSave = images ? JSON.parse(images) : [];
      } catch (e) {
        imagesToSave = [];
      }
    }
    // Gabungkan gambar lama dan baru, lalu filter agar tidak ada duplikat
    const mergedImages = Array.from(new Set([...(oldImages || []), ...(imagesToSave || [])]));
    try {
      pool.query(
        'UPDATE products SET name=?, price=?, images=?, description=?, stock=? WHERE id=?',
        [name, price, JSON.stringify(mergedImages), description, Number(stock) || 0, id],
        (err, result) => {
          if (err) {
            if (err.message.includes('no such column: images')) {
              return res.status(500).json({ error: 'Kolom images belum ada di database. Jalankan migrasi SQL: ALTER TABLE products ADD COLUMN images TEXT;' });
            }
            return res.status(500).json({ error: err.message });
          }
          res.json({ id, name, price, images: mergedImages, description, stock: Number(stock) || 0 });
        }
      );
    } catch (err) {
      console.error('[PUT /api/products/:id] Fatal Error:', err);
      res.status(500).json({ error: 'Unexpected error saat update produk.' });
    }
  });
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
