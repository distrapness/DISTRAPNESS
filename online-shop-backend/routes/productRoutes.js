const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Safer version strictly for this file
const parseImages = (str) => {
  try { return str ? JSON.parse(str) : []; } catch (e) { return str ? [str] : []; }
};
const parseSizes = (str) => {
  try { return str ? JSON.parse(str) : { S: 0, M: 0, L: 0, XL: 0 }; } catch (e) { return { S: 0, M: 0, L: 0, XL: 0 }; }
};

// GET /api/products
router.get('/', (req, res) => {
  pool.query('SELECT * FROM products', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const products = results.map(product => {
      // Weight is now included
      const { sku, dimensions, ...rest } = product;
      return {
        ...rest,
        images: parseImages(product.images) || (product.image ? [product.image] : []),
        sizes: parseSizes(product.sizes)
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
    const { sku, dimensions, ...rest } = product;
    rest.images = parseImages(product.images) || (product.image ? [product.image] : []);
    rest.sizes = parseSizes(product.sizes);
    res.json(rest);
  });
});

// POST /api/products
router.post('/', verifyToken, verifyAdmin, (req, res) => {
  const { name, price, images, description, stock, sizes, category, weight } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Nama dan harga produk wajib diisi.' });
  }

  let imagesToSave = images;
  if (!Array.isArray(imagesToSave)) {
    try { imagesToSave = images ? JSON.parse(images) : []; } catch (e) { imagesToSave = []; }
  }

  // Use stock field from payload
  let totalStock = Number(stock) || 0;
  let sizesToSave = sizes || { S: 0, M: 0, L: 0, XL: 0 };

  try {
    pool.query(
      'INSERT INTO products (name, price, images, description, stock, sizes, category, weight) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, price, JSON.stringify(imagesToSave), description, totalStock, JSON.stringify(sizesToSave), category || 'Uncategorized', weight || 1000],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, name, price, images: imagesToSave, description, stock: totalStock, sizes: sizesToSave, category, weight });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Unexpected error saat menyimpan produk.' });
  }
});

// PUT /api/products/:id
router.put('/:id', verifyToken, verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { name, price, images, description, stock, sizes, category, weight } = req.body;

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

    // Use stock field from payload
    let totalStock = Number(stock) || 0;
    let sizesToSave = sizes || { S: 0, M: 0, L: 0, XL: 0 };

    try {
      pool.query(
        'UPDATE products SET name=?, price=?, images=?, description=?, stock=?, sizes=?, category=?, weight=? WHERE id=?',
        [name, price, JSON.stringify(mergedImages), description, totalStock, JSON.stringify(sizesToSave), category, weight, id],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ id, name, price, images: mergedImages, description, stock: totalStock, sizes: sizesToSave, category, weight });
        }
      );
    } catch (err) {
      res.status(500).json({ error: 'Unexpected error saat update produk.' });
    }
  });
});

// DELETE /api/products/:id
router.delete('/:id', verifyToken, verifyAdmin, (req, res) => {
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
