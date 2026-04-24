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
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();
const server = http.createServer(app);
// setupSocket(server); // Disabled for Vercel Serverless stability

// ====== CORS untuk seluruh route, termasuk static file ======
app.use(cors());


// ====== MIDDLEWARE: Verify Token & Admin ======
const { verifyToken, verifyAdmin } = require('./middleware/auth');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// Brand API (Synced with Settings Table)
app.get('/api/brand', async (req, res) => {
  try {
    const [rows] = await pool.promise().query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('site_title', 'logo_url', 'contact_phone')");
    const settings = rows.reduce((acc, row) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});
    
    res.json({
      brandName: settings.site_title || "DISTRAPNESS",
      logo: settings.logo_url || "/uploads/logo-hitam.png",
      logoWhite: settings.logo_url || "/uploads/logo-putih.png",
      phone: settings.contact_phone || "6285888159265"
    });
  } catch (err) {
    console.error("Brand fetch error:", err);
    res.json({ brandName: "DISTRAPNESS" });
  }
});

app.put('/api/brand', verifyToken, verifyAdmin, async (req, res) => {
  const { brandName, logo, phone } = req.body;
  try {
    await pool.promise().query(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?), (?, ?), (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
      ['site_title', brandName, 'logo_url', logo, 'contact_phone', phone]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Brand update error:", err);
    res.status(500).json({ error: 'Failed to update brand' });
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
    await connection.query(`CREATE TABLE IF NOT EXISTS banners (id INT AUTO_INCREMENT PRIMARY KEY, image LONGTEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, sort_order INT DEFAULT 0)`);

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

    // Ensure category column exists
    try {
      await connection.query(`ALTER TABLE products ADD COLUMN category VARCHAR(100)`);
    } catch (e) {
      // Ignore if exists
    }

    // Ensure weight column exists
    try {
      await connection.query(`ALTER TABLE products ADD COLUMN weight INT DEFAULT 1000`);
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

    // Ensure paymentProof column (LONGTEXT for Base64)
    try {
      await connection.query(`ALTER TABLE orders ADD COLUMN paymentProof LONGTEXT`);
    } catch (e) {
      // If exists, modify
      try { await connection.query(`ALTER TABLE orders MODIFY paymentProof LONGTEXT`); } catch (e2) { }
    }

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

    // Create shipping_manual_rates table
    const createManualShippingTable = `
      CREATE TABLE IF NOT EXISTS shipping_manual_rates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        destination_name VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await connection.query(createManualShippingTable);

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

const { sendRegistrationWelcome, sendContactNotification } = require('./services/emailService');

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
      
      // Send Welcome Email (Safe, non-blocking)
      try {
        sendRegistrationWelcome(email);
      } catch (e) {
        console.warn("Welcome email failed:", e.message);
      }

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

// PROFILE ENDPOINT
app.get('/api/profile', verifyToken, (req, res) => {
  const userId = req.user.id;
  pool.query('SELECT email, role, referral_code, referrals_count, points, balance FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!results.length) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.json(results[0]);
  });
});

// VERIFY REFERRAL
app.get('/api/referral/verify/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const [results] = await pool.promise().query('SELECT id, email FROM users WHERE referral_code = ?', [code]);
    if (results.length === 0) return res.status(404).json({ valid: false, message: 'Kode referral tidak ditemukan' });
    res.json({ valid: true, user: results[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GOOGLE LOGIN ENDPOINT
app.post('/api/google-login', async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name, picture } = ticket.getPayload();

    pool.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });

      let user;
      if (results.length === 0) {
        // Create new user if doesn't exist
        const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
        await pool.promise().query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, randomPassword, 'customer']);
        const [newUsers] = await pool.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        user = newUsers[0];
      } else {
        user = results[0];
      }

      // Generate JWT
      const jwtToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role || 'customer' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token: jwtToken,
        email: user.email,
        role: user.role || 'customer'
      });
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(401).json({ message: 'Invalid Google Token' });
  }
});

// ====== ADMIN ROUTES (PHASE 1 & 2) ======

// Helper for safe JSON parsing
const safeJsonParse = (str) => {
  try {
    return str ? JSON.parse(str) : [];
  } catch (e) {
    return str ? [str] : []; // Return as single item array if not JSON
  }
};

// Dashboard Stats
app.get('/api/admin/stats', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [orders] = await pool.promise().query('SELECT COUNT(*) as count FROM orders');
    const [revenue] = await pool.promise().query('SELECT SUM(total) as total FROM orders WHERE status = "paid"');
    const [products] = await pool.promise().query('SELECT COUNT(*) as count FROM products');

    // Low Stock ( < 10 )
    const [lowStock] = await pool.promise().query('SELECT id, name, stock, images FROM products WHERE stock < 10 LIMIT 3');

    // Chart Data (Real Revenue Last 7 Days)
    const [allOrders] = await pool.promise().query('SELECT total, createdAt, items FROM orders WHERE status != "cancelled" AND status != "failed"');
    
    // Process real chart data
    const chartData = [0, 0, 0, 0, 0, 0, 0]; // Day -6 to Day 0 (Today)
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Process real best sellers
    const productSales = {};

    allOrders.forEach(o => {
      // Calculate Chart Data
      const orderDate = new Date(o.createdAt);
      const diffTime = Math.abs(today - orderDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays < 7) {
        chartData[6 - diffDays] += Number(o.total) || 0;
      }

      // Calculate Best Sellers
      try {
        const items = JSON.parse(o.items || '[]');
        items.forEach(item => {
          if (!productSales[item.id]) {
            productSales[item.id] = { id: item.id, name: item.name, price: item.price, sales: 0, images: item.images || [item.image] };
          }
          productSales[item.id].sales += Number(item.qty) || 1;
        });
      } catch (e) {}
    });

    const realBestSellers = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 4)
      .map(p => ({
        ...p,
        growth: Math.floor(Math.random() * 5) + 1 // Genuine growth logic usually requires history, mock slight growth
      }));

    res.json({
      totalOrders: orders[0].count,
      totalRevenue: revenue[0].total || 0,
      totalProducts: products[0].count,
      lowStock: lowStock.map(p => ({
        ...p,
        images: safeJsonParse(p.images)
      })),
      bestSellers: realBestSellers,
      chartData
    });
  } catch (err) {
    console.error("Stats API Error:", err);
    res.status(500).json({ error: 'Stats error: ' + err.message });
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

// Categories API
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.promise().query('SELECT * FROM categories ORDER BY created_at DESC');
    
    // Fallback images for categories: use first product image found in that category if null or placeholder
    const categoriesWithImages = await Promise.all(rows.map(async (cat) => {
      const needsFallback = !cat.image || cat.image.trim() === "" || cat.image === "null" || cat.image.includes("placehold.co");
      
      if (needsFallback) {
        const [products] = await pool.promise().query(
          "SELECT images FROM products WHERE LOWER(category) = LOWER(?) AND images IS NOT NULL AND images != '[]' LIMIT 1",
          [cat.name]
        );
        if (products.length > 0) {
          try {
            const images = JSON.parse(products[0].images);
            if (Array.isArray(images) && images.length > 0) {
              return { ...cat, image: images[0] };
            }
          } catch(e) {}
        }
        // Final fallback: professional placeholder
        return { ...cat, image: `https://placehold.co/600x800/222222/ffffff?text=${encodeURIComponent(cat.name)}` };
      }
      return cat;
    }));

    res.json(categoriesWithImages);
  } catch (err) {
    res.status(500).json({ error: 'Categories fetch error' });
  }
});

app.post('/api/categories', verifyToken, verifyAdmin, async (req, res) => {
  const { name, image } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name required' });
  const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

  try {
    const [result] = await pool.promise().query(
      'INSERT INTO categories (name, slug, image) VALUES (?, ?, ?)',
      [name, slug, image || null]
    );
    res.json({ id: result.insertId, name, slug, image });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, image } = req.body;
  const slug = name ? name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') : undefined;

  try {
    if (name) {
      await pool.promise().query('UPDATE categories SET name=?, slug=?, image=? WHERE id=?', [name, slug, image, id]);
    } else {
      await pool.promise().query('UPDATE categories SET image=? WHERE id=?', [image, id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    await pool.promise().query('DELETE FROM categories WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// NEWSLETTER & CONTACT API
app.post('/api/newsletter', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    await pool.promise().query('CREATE TABLE IF NOT EXISTS subscribers (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) UNIQUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    await pool.promise().query('INSERT INTO subscribers (email) VALUES (?)', [email]);
    res.json({ success: true, message: 'Subscribed successfully!' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.json({ success: true, message: 'Already subscribed!' });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!email || !message) return res.status(400).json({ error: 'Email and message required' });
  try {
    await pool.promise().query('CREATE TABLE IF NOT EXISTS contact_messages (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), message TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    await pool.promise().query('INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)', [name, email, message]);
    
    // Send Email Notification to Admin
    try {
      sendContactNotification({ name, email, message });
    } catch (e) {
      console.warn("Contact email failed:", e.message);
    }

    res.json({ success: true, message: 'Message sent!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const shippingRoutes = require('./routes/shippingRoutes');
app.use('/api/shipping', shippingRoutes);

const shippingManualRoutes = require('./routes/shippingManualRoutes');
app.use('/api/shipping-manual', shippingManualRoutes);

const couponRoutes = require('./routes/couponRoutes');
app.use('/api/coupons', couponRoutes);

const affiliateRoutes = require('./routes/affiliateRoutes');
app.use('/api/affiliate', affiliateRoutes);

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  server.listen(PORT, () => console.log(`Server running on port ${PORT} (with Socket.io)`));
}

module.exports = app;
