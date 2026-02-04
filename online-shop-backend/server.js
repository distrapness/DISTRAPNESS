const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');
const http = require('http');
const setupSocket = require('./socket');
const jwt = require('jsonwebtoken'); // Add JWT

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123'; // Fallback secret

const app = express();
const server = http.createServer(app);
// setupSocket(server); // Disabled for Vercel Serverless stability

// ====== CORS untuk seluruh route, termasuk static file ======
app.use(cors());


// ====== MIDDLEWARE: Verify Token ======
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(403).json({ message: 'Malformed token' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Unauthorized / Invalid Token' });
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;
    next();
  });
};

// ====== MIDDLEWARE: Verify Admin ======
const verifyAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Require Admin Role!' });
  }
  next();
};

app.use(express.json());

// ====== Static file uploads dengan header CORS ======
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Multer setup
// Multer setup (Memory Storage for Base64)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 } // Limit 4MB
});

// Cloudinary removed to support "Automatic" mode without keys
// If you want Cloudinary later, you can revert this.

// Upload endpoint -> Returns Base64 Data URI
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // Convert buffer to Base64
  const b64 = Buffer.from(req.file.buffer).toString('base64');
  const mime = req.file.mimetype;
  const url = `data:${mime};base64,${b64}`;

  res.json({ url });
});

// Brand API
const fs = require('fs');
const BRAND_JSON = path.join(__dirname, 'brand.json');

app.get('/api/brand', (req, res) => {
  try {
    if (fs.existsSync(BRAND_JSON)) {
      fs.readFile(BRAND_JSON, 'utf8', (err, data) => {
        if (err) throw err;
        res.json(JSON.parse(data));
      });
    } else {
      // Default brand if file missing
      res.json({
        brandName: "DISTRAPNESS",
        logo: "/assets/logo-placeholder.png",
        logoWhite: "/assets/logo-placeholder-white.png"
      });
    }
  } catch (err) {
    console.error("Brand read error:", err);
    res.json({ brandName: "DISTRAPNESS" });
  }
});

app.put('/api/brand', (req, res) => {
  try {
    fs.writeFile(BRAND_JSON, JSON.stringify(req.body, null, 2), (err) => {
      if (err) {
        console.error("Brand write error (Vercel Read-Only):", err);
        return res.status(500).json({ error: 'Gagal menyimpan brand (Read-Only System)' });
      }
      res.json({ success: true });
    });
  } catch (err) {
    console.error("Brand write error:", err);
    res.status(500).json({ error: 'System Error' });
  }
});

// TEST ROUTE & DEBUG (Check Connectivity)
app.get('/api/test', async (req, res) => {
  const dbStatus = { connected: false, error: null };
  const fsStatus = { uploadsWritable: false, error: null };

  // Check DB
  try {
    await pool.promise().query('SELECT 1');
    dbStatus.connected = true;
  } catch (err) {
    console.error("DB Check Failed:", err);
    dbStatus.error = err.message;
  }

  // Check FS
  const UPLOADS_DIR = path.join(__dirname, 'uploads');
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      // Try create
      try { fs.mkdirSync(UPLOADS_DIR); } catch (e) { }
    }
    fs.accessSync(UPLOADS_DIR, fs.constants.W_OK);
    fsStatus.uploadsWritable = true;
  } catch (err) {
    fsStatus.error = err.message;
  }

  res.json({
    message: 'Server Active',
    env: {
      node: process.version,
      host: process.env.DB_HOST ? 'Set' : 'Missing',
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing'
    },
    dbStatus,
    fsStatus
  });
});

// EMERGENCY SETUP ROUTE (REMOVE AFTER USE OR SECURE)
app.get('/api/setup-admin', async (req, res) => {
  const { key } = req.query;
  if (key !== 'rahasia123') return res.status(403).json({ error: 'Forsake!' });

  const connection = await pool.promise().getConnection();
  try {
    // 1. Create Tables
    await connection.query(`ALTER TABLE users ADD COLUMN role ENUM('admin', 'customer') DEFAULT 'customer'`).catch(() => { });
    await connection.query(`CREATE TABLE IF NOT EXISTS categories (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL UNIQUE, image VARCHAR(500), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await connection.query(`CREATE TABLE IF NOT EXISTS settings (id INT AUTO_INCREMENT PRIMARY KEY, setting_key VARCHAR(255) NOT NULL UNIQUE, setting_value TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);

    // Ensure images column is LONGTEXT for Base64 support
    try {
      await connection.query(`ALTER TABLE products MODIFY images LONGTEXT`);
      await connection.query(`ALTER TABLE products MODIFY image LONGTEXT`);
    } catch (e) {
      console.log("Column modification skipped or failed (likely already TEXT/LONGTEXT):", e.message);
    }

    // Ensure sizes column exists
    try {
      await connection.query(`ALTER TABLE products ADD COLUMN sizes TEXT`);
    } catch (e) {
      // Ignore if exists
    }

    // Ensure orders table columns (shipping_address, tracking_number)
    // Ensure orders table columns (shipping_address, tracking_number)
    try {
      await connection.query(`ALTER TABLE orders ADD COLUMN shipping_address TEXT`);
    } catch (e) { }
    try {
      await connection.query(`ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100)`);
    } catch (e) { }

    // Ensure coupon columns in orders
    try {
      await connection.query(`ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50)`);
      await connection.query(`ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0`);
    } catch (e) { }

    // Create coupons table
    const createCouponsTable = `
      CREATE TABLE IF NOT EXISTS coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        type ENUM('percent', 'fixed') DEFAULT 'percent',
        value DECIMAL(10, 2) NOT NULL,
        min_purchase DECIMAL(10, 2) DEFAULT 0,
        start_date DATETIME DEFAULT NULL,
        expiry_date DATETIME DEFAULT NULL,
        usage_limit INT DEFAULT 0,
        usage_count INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await connection.query(createCouponsTable);

    // 2. Create Admin
    const email = 'admin@distrapness.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      await connection.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashedPassword, 'admin']);
      res.json({ message: 'Admin created successfully', email });
    } else {
      await connection.query('UPDATE users SET role = ?, password = ? WHERE email = ?', ['admin', hashedPassword, email]);
      res.json({ message: 'Admin role & password updated successfully', email });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// REGISTER ENDPOINT
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email dan password wajib diisi' });

  pool.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    pool.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], (err2, result) => {
      if (err2) return res.status(500).json({ message: 'Gagal menyimpan user' });
      res.json({ message: 'Registrasi berhasil' });
    });
  });
});

// LOGIN ENDPOINT
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  pool.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!results.length) return res.status(401).json({ message: 'Email tidak terdaftar' });
    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Password salah' });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'customer' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      email: user.email,
      role: user.role || 'customer'
    });
  });
});

// ====== ADMIN ROUTES (PHASE 1 & 2) ======

// Dashboard Stats
app.get('/api/admin/stats', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [orders] = await pool.promise().query('SELECT COUNT(*) as count FROM orders');
    const [revenue] = await pool.promise().query('SELECT SUM(total_amount) as total FROM orders WHERE status = "paid"');
    const [products] = await pool.promise().query('SELECT COUNT(*) as count FROM products');

    // Low Stock ( < 10 )
    const [lowStock] = await pool.promise().query('SELECT id, name, stock, images FROM products WHERE stock < 10 LIMIT 3');

    // Best Sellers (Mock logic for now, or complicated SQL. Let's return random products as "trending" for UI demo)
    const [trending] = await pool.promise().query('SELECT id, name, price, images FROM products ORDER BY RAND() LIMIT 4');

    // Chart Data (Mock last 7 days)
    // In real app: Group by date
    const chartData = [1200000, 2100000, 800000, 1600000, 2400000, 3200000, 1800000];

    res.json({
      totalOrders: orders[0].count,
      totalRevenue: revenue[0].total || 0,
      totalProducts: products[0].count,
      lowStock: lowStock.map(p => ({
        ...p,
        images: p.images ? JSON.parse(p.images) : []
      })),
      bestSellers: trending.map(p => ({
        ...p,
        sales: Math.floor(Math.random() * 50) + 10, // Mock sales count
        growth: Math.floor(Math.random() * 20), // Mock growth %
        images: p.images ? JSON.parse(p.images) : []
      })),
      chartData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Stats error' });
  }
});

// Settings API (GET/PUT)
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await pool.promise().query('SELECT * FROM settings');
    // Convert rows to object { key: value }
    const settings = rows.reduce((acc, row) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Settings fetch error' });
  }
});

app.put('/api/settings', verifyToken, verifyAdmin, async (req, res) => {
  const settings = req.body; // { site_title: "My Shop", ... }
  const connection = await pool.promise().getConnection();
  try {
    await connection.beginTransaction();
    for (const [key, value] of Object.entries(settings)) {
      await connection.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value, value]
      );
    }
    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: 'Settings update error' });
  } finally {
    connection.release();
  }
});

// Categories API (Placeholder)
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.promise().query('SELECT * FROM categories ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Categories fetch error' });
  }
});

const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

const bannerRoutes = require('./routes/bannerRoutes');
app.use('/api/banners', bannerRoutes);

const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);

const midtransRoutes = require('./routes/midtrans');
app.use('/api/midtrans', midtransRoutes);

const couponRoutes = require('./routes/couponRoutes');
app.use('/api/coupons', couponRoutes);

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  server.listen(PORT, () => console.log(`Server running on port ${PORT} (with Socket.io)`));
}

module.exports = app;
