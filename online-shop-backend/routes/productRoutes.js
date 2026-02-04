const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/products
router.get('/', (req, res) => {
  pool.query('SELECT * FROM products', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    // Parse images and sizes field
    const products = results.map(product => {
      const { sku, category, weight, dimensions, ...rest } = product;
      return {
        ...rest,
        images: product.images ? JSON.parse(product.images) : (product.image ? [product.image] : []),
        sizes: product.sizes ? JSON.parse(product.sizes) : { S: 0, M: 0, L: 0, XL: 0 }
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
    const { sku, category, weight, dimensions, ...rest } = product;
    rest.images = product.images ? JSON.parse(product.images) : (product.image ? [product.image] : []);
    rest.sizes = product.sizes ? JSON.parse(product.sizes) : { S: 0, M: 0, L: 0, XL: 0 };
    res.json(rest);
  });
});

// POST /api/products
router.post('/', (req, res) => {
  const { name, price, images, description, stock, sizes } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: 'Nama dan harga produk wajib diisi.' });
  }
  let imagesToSave = images;
  if (!Array.isArray(imagesToSave)) {
    try { imagesToSave = images ? JSON.parse(images) : []; } catch (e) { imagesToSave = []; }
  }

  // Calculate total stock from sizes if provided, otherwise use stock field
  let totalStock = Number(stock) || 0;
  let sizesToSave = sizes || { S: 0, M: 0, L: 0, XL: 0 };

  if (sizes) {
    // If sizes provided, update total stock
    totalStock = Object.values(sizes).reduce((a, b) => Number(a) + Number(b), 0);
  }

  try {
    pool.query(
      'INSERT INTO products (name, price, images, description, stock, sizes) VALUES (?, ?, ?, ?, ?, ?)',
      [name, price, JSON.stringify(imagesToSave), description, totalStock, JSON.stringify(sizesToSave)],
      (err, result) => {
        if (err) {
          // Handle missing column by trying to add it on the fly? Better rely on migration in server.js
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: result.insertId, name, price, images: imagesToSave, description, stock: totalStock, sizes: sizesToSave });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Unexpected error saat menyimpan produk.' });
  }
});

// PUT /api/products/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, images, description, stock, sizes } = req.body;

  // Ambil data lama dulu untuk gambar
  pool.query('SELECT images FROM products WHERE id=?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    let oldImages = [];
    if (results && results.length > 0 && results[0].images) {
      try { oldImages = JSON.parse(results[0].images); } catch (e) { oldImages = []; }
    }

    let imagesToSave = images;
    if (!Array.isArray(imagesToSave)) {
      try { imagesToSave = images ? JSON.parse(images) : []; } catch (e) { imagesToSave = []; }
    }
    const mergedImages = Array.from(new Set([...(oldImages || []), ...(imagesToSave || [])]));

    // Calculate total stock from sizes
    let totalStock = Number(stock) || 0;
    let sizesToSave = sizes || { S: 0, M: 0, L: 0, XL: 0 };
    if (sizes) {
      totalStock = Object.values(sizes).reduce((a, b) => Number(a) + Number(b), 0);
    }

    try {
      pool.query(
        'UPDATE products SET name=?, price=?, images=?, description=?, stock=?, sizes=? WHERE id=?',
        [name, price, JSON.stringify(mergedImages), description, totalStock, JSON.stringify(sizesToSave), id],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ id, name, price, images: mergedImages, description, stock: totalStock, sizes: sizesToSave });
        }
      );
    } catch (err) {
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
