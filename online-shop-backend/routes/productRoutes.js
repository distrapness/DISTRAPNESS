const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const cacheService = require('../services/cacheService');

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
  const limit = parseInt(req.query.limit) || 12;
  const offset = parseInt(req.query.offset) || 0;
  const search = req.query.search ? `%${req.query.search.trim().toLowerCase()}%` : null;
  const category = req.query.category && req.query.category !== 'Semua' ? req.query.category.trim() : null;
  const sortBy = req.query.sortBy || 'newest';

  // Build dynamic SQL query
  let sql = 'SELECT * FROM products';
  let countSql = 'SELECT COUNT(*) as total FROM products';
  let conditions = [];
  let params = [];

  if (search) {
    conditions.push('(LOWER(name) LIKE ? OR LOWER(description) LIKE ?)');
    params.push(search, search);
  }
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }

  if (conditions.length > 0) {
    const condStr = ' WHERE ' + conditions.join(' AND ');
    sql += condStr;
    countSql += condStr;
  }

  // Sorting
  switch (sortBy) {
    case 'price_asc':
      sql += ' ORDER BY price ASC';
      break;
    case 'price_desc':
      sql += ' ORDER BY price DESC';
      break;
    case 'name_asc':
      sql += ' ORDER BY name ASC';
      break;
    case 'newest':
    default:
      sql += ' ORDER BY id DESC'; 
      break;
  }

  sql += ' LIMIT ? OFFSET ?';
  const queryParams = [...params, limit, offset];

  pool.query(sql, queryParams, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    pool.query(countSql, params, (errCount, countResults) => {
      if (errCount) return res.status(500).json({ error: errCount.message });

      const totalItems = countResults[0]?.total || 0;

      const products = results.map(product => {
        const { sku, dimensions, ...rest } = product;
        const parsedSizes = parseSizes(product.sizes);
        let recalculatedStock = rest.stock;
        if (parsedSizes && typeof parsedSizes === 'object' && Object.keys(parsedSizes).length > 0) {
          recalculatedStock = Object.values(parsedSizes).reduce((sum, v) => sum + (Number(v) || 0), 0);
        }
        return {
          ...rest,
          stock: recalculatedStock,
          images: parseImages(product.images) || (product.image ? [product.image] : []),
          sizes: parsedSizes
        };
      });

      res.json({
        products,
        pagination: {
          total: totalItems,
          limit,
          offset,
          pages: Math.ceil(totalItems / limit)
        }
      });
    });
  });
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const cacheKey = `product_detail_${id}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return res.json(cached);

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
    
    cacheService.set(cacheKey, rest);
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
        cacheService.clearPattern('products_list');
        cacheService.clearPattern('categories_list');
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
          cacheService.clearPattern('products_list');
          cacheService.del(`product_detail_${id}`);
          cacheService.clearPattern('categories_list');
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
        cacheService.clearPattern('products_list');
        cacheService.del(`product_detail_${id}`);
        cacheService.clearPattern('categories_list');
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
  const user_id = req.user?.id || null;
  const user_email = req.user?.email || "";

  if (!user_email) {
    return res.status(401).json({ error: 'Pengguna tidak terautentikasi' });
  }

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating requires a value between 1 and 5' });
  }

  // Verify that the user has purchased this product
  try {
    const searchEmail = `%"email":"${user_email}"%`;
    const [orders] = await pool.promise().query(
      'SELECT id, items FROM orders WHERE ("userId" = ? OR shipping_address LIKE ?) AND status IN (\'paid\', \'shipped\', \'completed\')',
      [user_id, searchEmail]
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

// REPLY TO REVIEW (Admin only)
router.put('/reviews/:reviewId/reply', verifyToken, verifyAdmin, async (req, res) => {
  const { reviewId } = req.params;
  const { admin_reply } = req.body;

  try {
    await pool.promise().query(
      'UPDATE reviews SET admin_reply = ? WHERE id = ?',
      [admin_reply || null, reviewId]
    );
    res.json({ success: true, message: 'Balasan berhasil disimpan', admin_reply });
  } catch (err) {
    console.error("Reply review error:", err);
    res.status(500).json({ error: 'Gagal membalas ulasan' });
  }
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
      cacheService.del(`product_detail_${id}`);
    }
    
    await connection.commit();
    cacheService.clearPattern('products_list');
    cacheService.clearPattern('categories_list');
    res.json({ success: true, message: `${updates.length} produk berhasil diperbarui` });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
