const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Safer version strictly for this file
const parseImages = (str) => {
  try { return str ? JSON.parse(str) : []; } catch (e) { return str ? [str] : []; }
};
const parseSizes = (str) => {
  try { 
    return str ? JSON.parse(str) : null;
  } catch (e) { return null; }
};

// GET /api/products
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit) || 1000;
  const offset = parseInt(req.query.offset) || 0;

  pool.query('SELECT * FROM products LIMIT ? OFFSET ?', [limit, offset], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const products = results.map(product => {
      const { sku, dimensions, ...rest } = product;
      const parsedSizes = parseSizes(product.sizes);
      
      // Recalculate stock from sizes if sizes exist
      // This ensures shop always shows correct stock matching admin panel
      let recalculatedStock = rest.stock;
      if (parsedSizes && typeof parsedSizes === 'object' && Object.keys(parsedSizes).length > 0) {
        const sizeTotal = Object.values(parsedSizes).reduce((sum, v) => sum + (Number(v) || 0), 0);
        // Only override if sizes have actual data to avoid resetting manually-set stock
        recalculatedStock = sizeTotal;
      }
      
      return {
        ...rest,
        stock: recalculatedStock,
        images: parseImages(product.images) || (product.image ? [product.image] : []),
        sizes: parsedSizes
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
    
    // Recalculate stock from sizes if sizes exist
    if (rest.sizes && typeof rest.sizes === 'object' && Object.keys(rest.sizes).length > 0) {
      rest.stock = Object.values(rest.sizes).reduce((sum, v) => sum + (Number(v) || 0), 0);
    }
    
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
  let sizesToSave = (sizes !== undefined && sizes !== null) ? sizes : null;

  try {
    pool.query(
      'INSERT INTO products (name, price, images, description, stock, sizes, category, weight, is_flash_sale, flash_sale_price, flash_sale_end) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, price, JSON.stringify(imagesToSave), description, totalStock, sizesToSave ? JSON.stringify(sizesToSave) : null, category || 'Uncategorized', weight || 1000, req.body.is_flash_sale || false, req.body.flash_sale_price || null, req.body.flash_sale_end || null],
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

    // Stop merging old images. Just use what was sent in the request.
    let imagesToSave = images;
    if (!Array.isArray(imagesToSave)) {
      try { imagesToSave = images ? JSON.parse(images) : []; } catch (e) { imagesToSave = []; }
    }

    // Use stock field from payload
    let totalStock = Number(stock) || 0;
    let sizesToSave = (sizes !== undefined && sizes !== null) ? sizes : null;

    try {
      pool.query(
        'UPDATE products SET name=?, price=?, images=?, description=?, stock=?, sizes=?, category=?, weight=?, is_flash_sale=?, flash_sale_price=?, flash_sale_end=? WHERE id=?',
        [name, price, JSON.stringify(imagesToSave), description, totalStock, sizesToSave ? JSON.stringify(sizesToSave) : null, category, weight, req.body.is_flash_sale || false, req.body.flash_sale_price || null, req.body.flash_sale_end || null, id],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ id, name, price, images: imagesToSave, description, stock: totalStock, sizes: sizesToSave, category, weight });
        }
      );
    } catch (err) {
      res.status(500).json({ error: 'Unexpected error saat update produk.' });
    }
});

// DELETE /api/products/:id
router.delete('/:id', verifyToken, verifyAdmin, (req, res) => {
  const { id } = req.params;
  
  // First, delete associated reviews to avoid foreign key issues
  pool.query('DELETE FROM reviews WHERE product_id=?', [id], (err1) => {
    if (err1) console.warn("Could not delete reviews for product:", id, err1.message);
    
    // Then delete the product
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
});

// GET ALL REVIEWS (Admin only)
router.get('/reviews/all', verifyToken, verifyAdmin, (req, res) => {
    const query = `
      SELECT r.*, p.name as product_name 
      FROM reviews r 
      JOIN products p ON r.product_id = p.id 
      ORDER BY r.created_at DESC
    `;
    pool.query(query, (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(results);
    });
});

// GET /api/products/:id/reviews
router.get('/:id/reviews', (req, res) => {
  const { id } = req.params;
  pool.query('SELECT * FROM reviews WHERE product_id=? ORDER BY created_at DESC', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// POST /api/products/:id/reviews (ONLY for verified buyers)
router.post('/:id/reviews', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const user_email = req.user?.email || req.userEmail;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating requires a value between 1 and 5' });
  }

  // Verify that the user has purchased this product
  try {
    const [orders] = await pool.promise().query(
      "SELECT id, items FROM orders WHERE userId = ? AND status IN ('paid', 'shipped', 'completed')",
      [user_email]
    );

    let hasPurchased = false;
    for (const order of orders) {
      let items = order.items;
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch (e) { continue; }
      }
      if (Array.isArray(items) && items.some(item => String(item.id) === String(id))) {
        hasPurchased = true;
        break;
      }
    }

    if (!hasPurchased) {
      return res.status(403).json({ error: 'Anda harus membeli produk ini terlebih dahulu sebelum memberikan ulasan.' });
    }

    // Check if user already reviewed this product
    const [existing] = await pool.promise().query(
      'SELECT id FROM reviews WHERE product_id = ? AND user_email = ?',
      [id, user_email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Anda sudah pernah memberikan ulasan untuk produk ini.' });
    }

    const [result] = await pool.promise().query(
      'INSERT INTO reviews (product_id, user_email, rating, comment) VALUES (?, ?, ?, ?)',
      [id, user_email, rating, comment || null]
    );
    res.json({ id: result.insertId, product_id: id, user_email, rating, comment });

  } catch (err) {
    console.error("Review error:", err);
    res.status(500).json({ error: 'Gagal menyimpan ulasan' });
  }
});

// DELETE REVIEW (Admin only)
router.delete('/reviews/:reviewId', verifyToken, verifyAdmin, (req, res) => {
  const { reviewId } = req.params;
  pool.query('DELETE FROM reviews WHERE id = ?', [reviewId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ success: true, message: 'Review deleted' });
  });
});

// BULK UPDATE STOCK (Admin only)
router.post('/bulk-stock', verifyToken, verifyAdmin, async (req, res) => {
  const { updates } = req.body; // Array of { id, stock, sizes }
  
  if (!updates || !Array.isArray(updates)) {
    return res.status(400).json({ error: 'Data update tidak valid' });
  }

  const connection = await pool.promise().getConnection();
  try {
    await connection.beginTransaction();
    
    for (const item of updates) {
      const { id, stock, sizes } = item;
      await connection.query(
        'UPDATE products SET stock = ?, sizes = ? WHERE id = ?',
        [stock, JSON.stringify(sizes), id]
      );
    }
    
    await connection.commit();
    res.json({ success: true, message: `${updates.length} produk berhasil diperbarui` });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
