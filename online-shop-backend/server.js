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

// Auto-migrate database: ensure birth_date column exists in users table
pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date VARCHAR(20)", (err) => {
  if (err) console.error("[DATABASE] Error adding birth_date column:", err.message);
  else console.log("[DATABASE] birth_date column checked/added.");
});

const app = express();
const server = http.createServer(app);
setupSocket(server, app); // Enabled for local stability

// ====== GOOGLE RECAPTCHA CONFIG ======
const RECAPTCHA_SECRET = '6LcmfhstAAAAAHSygpkMox2_5evMdlA31ClpAxPG';

const verifyGoogleRecaptcha = async (token) => {
  if (!token) return false;
  try {
    const axios = require('axios');
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: RECAPTCHA_SECRET,
          response: token
        }
      }
    );
    return response.data.success;
  } catch (error) {
    console.error('[RECAPTCHA] Verification failed:', error.message);
    return false;
  }
};

// ====== CORS untuk seluruh route, termasuk static file ======
app.use(cors());


// ====== MIDDLEWARE INLINE (FORCED SYNC) ======
const verifyToken = (req, res, next) => {
  console.log(`[DEBUG] Incoming Request: ${req.method} ${req.url}`);
  // console.log(`[DEBUG] Headers:`, req.headers); // Only for deep debug

  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    console.log(`[DEBUG] No Authorization header found!`);
    return res.status(403).json({ 
      message: 'AKSES DITOLAK: INI SERVER LOKAL ASLI DISTRAPNESS', 
      debug: { receivedRole: 'SERVER_LOKAL', email: 'IDENTITAS_LOKAL' } 
    });
  }

  const token = authHeader.split(' ')[1]; 
  if (!token || token === 'null' || token === 'undefined') {
    console.log('[DEBUG] Token is empty or string null/undefined');
    return res.status(403).json({ message: 'Malformed token', debug: { receivedRole: 'none', email: 'bad-token' } });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log(`[DEBUG] JWT Verify Failed: ${err.message}`);
      return res.status(401).json({ message: 'Unauthorized / Invalid Token' });
    }
    
    // Explicitly set req.user
    req.user = {
      id: decoded.id,
      role: String(decoded.role || 'customer').toLowerCase(),
      email: decoded.email
    };
    
    console.log(`[AUTH] Token Verified for: ${req.user.email} (Role: ${req.user.role})`);
    next();
  });
};

const verifyAdmin = (req, res, next) => {
  // DATABASE / TOKEN BYPASS - JALUR TIKUS UNTUK OWNER
  const email = req.user ? String(req.user.email).toLowerCase().trim() : "unknown";
  const role = req.user ? String(req.user.role).toLowerCase().trim() : "unknown";
  
  const adminEmails = [
    'admin@distrapness.com', 
    'owner@distrapness.com', 
    'distrapness@gmail.com', 
    'iqbalfauzi511@gmail.com'
  ];
  
  console.log(`[ACL CHECK] Email: ${email}, Role: ${role}`);

  if (adminEmails.includes(email)) {
    console.log(`[ACL SUCCESS] Welcome Admin: ${email}`);
    return next();
  }

  if (role === 'admin') {
    return next();
  }

  return res.status(403).json({ 
    message: 'Require Admin Role!', 
    debug: { receivedRole: role, email: email } 
  });
};

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ====== Static file uploads dengan header CORS ======
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Multer setup (Dual Mode: Cloudinary or Memory Storage)
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

let storage;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: { folder: 'distrapness-shop' }
  });
} else {
  storage = multer.memoryStorage();
}

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 } // Limit 4MB
});

// Upload endpoint -> Returns URL (Cloudinary) or Base64 Data URI
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // If Cloudinary, req.file.path contains the secure URL
  if (req.file.path) {
    return res.json({ url: req.file.path });
  }  // Convert buffer to Base64
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

// SERVER VERIFICATION (DNA TEST)
app.get('/api/verify-server', (req, res) => {
  res.json({ 
    status: 'CORRECT_LOCAL_SERVER', 
    timestamp: new Date().toISOString(),
    owner: 'DISTRAPNESS_AI_FIXED'
  });
});

// EMERGENCY SETUP ROUTE (REMOVE AFTER USE OR SECURE)
app.get('/api/setup-admin', async (req, res) => {
  const { key, email } = req.query;
  if (key !== 'rahasia123') return res.status(403).json({ error: 'Forsake!' });

  const targetEmail = email || 'admin@distrapness.com';
  const connection = await pool.promise().getConnection();
  try {
    // 1. Ensure Table Structure
    await connection.query(`ALTER TABLE users MODIFY COLUMN role VARCHAR(50) DEFAULT 'customer'`).catch(() => { });
    await connection.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS balance DECIMAL(15,2) DEFAULT 0`).catch(() => { });
    await connection.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS points INT DEFAULT 0`).catch(() => { });

    // 2. Update/Create Admin
    const password = 'admin123'; 
    const hashedPassword = await bcrypt.hash(password, 10);

    const [users] = await connection.query('SELECT * FROM users WHERE TRIM(LOWER(email)) = TRIM(LOWER(?))', [targetEmail]);
    if (users.length === 0) {
      await connection.query('INSERT INTO users (email, password, role) VALUES (?, ?, "admin")', [targetEmail, hashedPassword]);
      res.json({ message: `AKUN BARU BERHASIL DIBUAT SEBAGAI ADMIN`, email: targetEmail, pass: 'admin123' });
    } else {
      // FORCE UPDATE ROLE TO ADMIN
      await connection.query('UPDATE users SET role = "admin" WHERE TRIM(LOWER(email)) = TRIM(LOWER(?))', [targetEmail]);
      res.json({ message: `HAK AKSES ADMIN BERHASIL DIBERIKAN`, email: targetEmail, note: 'SILAHKAN REFRESH DAN LOGIN ULANG' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

const { sendRegistrationWelcome, sendContactNotification, sendPasswordResetOTP } = require('./services/emailService');

// REGISTER ENDPOINT
app.post('/api/register', async (req, res) => {
  const { email, phone, password, fullName, birthDate, recaptchaToken } = req.body;
  if (!email || !phone || !password || !fullName || !birthDate || !recaptchaToken) {
    return res.status(400).json({ message: 'Semua kolom pendaftaran wajib diisi termasuk Captcha' });
  }

  // Verify Google reCAPTCHA
  const isRecaptchaValid = await verifyGoogleRecaptcha(recaptchaToken);
  if (!isRecaptchaValid) {
    return res.status(400).json({ message: 'Verifikasi Captcha gagal atau kedaluwarsa, silakan coba lagi' });
  }

  if (password.length < 6) return res.status(400).json({ message: 'Password minimal 6 karakter' });

  const cleanEmail = (email || '').toString().trim().toLowerCase();
  const cleanPhone = (phone || '').toString().trim();

  // Check if email or phone is already registered
  pool.query('SELECT * FROM users WHERE TRIM(LOWER(email)) = ? OR phone = ?', [cleanEmail, cleanPhone], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', detail: err.message });
    if (results.length > 0) {
      const existing = results[0];
      if (existing.email.toLowerCase() === cleanEmail) {
        return res.status(400).json({ message: 'Email sudah terdaftar' });
      } else {
        return res.status(400).json({ message: 'Nomor telepon sudah terdaftar' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    pool.query(
      'INSERT INTO users (email, phone, password, first_name, birth_date) VALUES (?, ?, ?, ?, ?)',
      [cleanEmail, cleanPhone, hashedPassword, fullName, birthDate],
      (err2, result) => {
        if (err2) return res.status(500).json({ message: 'Gagal menyimpan user', detail: err2.message });
        
        // Send Welcome Email (Safe, non-blocking)
        try {
          sendRegistrationWelcome(cleanEmail);
        } catch (e) {
          console.warn("Welcome email failed:", e.message);
        }

        const userId = result.insertId;
        const finalRole = 'customer';
        const token = jwt.sign(
          { id: userId, email: cleanEmail, role: finalRole },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({ 
          message: 'Registrasi berhasil',
          token,
          email: cleanEmail,
          role: finalRole
        });
      }
    );
  });
});

// LOGIN ENDPOINT
app.post('/api/login', async (req, res) => {
  const { email, password, recaptchaToken } = req.body;
  if (!email || !password || !recaptchaToken) {
    return res.status(400).json({ message: 'Kolom login dan Captcha wajib diisi' });
  }

  // Verify Google reCAPTCHA
  const isRecaptchaValid = await verifyGoogleRecaptcha(recaptchaToken);
  if (!isRecaptchaValid) {
    return res.status(400).json({ message: 'Verifikasi Captcha gagal atau kedaluwarsa, silakan coba lagi' });
  }

  const cleanInput = (email || "").toString().trim();
  const cleanEmail = cleanInput.toLowerCase();
  
  // Search by either email or phone
  pool.query('SELECT * FROM users WHERE TRIM(LOWER(email)) = ? OR phone = ?', [cleanEmail, cleanInput], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', detail: err.message });
    
    if (!results.length) {
      return res.status(401).json({ 
        message: `Akun tidak terdaftar dengan email atau nomor telepon: [${cleanInput}]`,
        suggestion: 'Pastikan data sudah benar atau daftar akun baru.'
      });
    }
    
    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Password salah!',
        detail: `Kata sandi yang Anda masukkan tidak sesuai.`
      });
    }

    // Force valid role string
    const finalRole = (user.role || 'customer').toString().trim().toLowerCase();
    
    // Generate JWT with explicit fields
    const token = jwt.sign(
      { id: user.id, email: user.email, role: finalRole },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`Login Success: ${user.email}, Final Role assigned: ${finalRole}`);
    res.json({
      token,
      email: user.email,
      role: finalRole
    });
  });
});

// PROFILE ENDPOINT
app.get('/api/profile', verifyToken, (req, res) => {
  const userId = req.user.id;
  pool.query('SELECT email, role, referral_code, referrals_count, points, balance, first_name, last_name, phone, birth_date, address, province, city, district, area, postal_code, province_id, city_id, district_id, area_id FROM users WHERE id = ?', [userId], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!results.length) return res.status(404).json({ message: 'User tidak ditemukan' });
    
    let user = results[0];
    if (!user.referral_code) {
      const emailPrefix = (user.email || 'REF').split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
      const code = emailPrefix + Math.floor(1000 + Math.random() * 9000);
      try {
        await pool.promise().query('UPDATE users SET referral_code = ? WHERE id = ?', [code, userId]);
        user.referral_code = code;
      } catch (updErr) {
        console.error("Failed to generate referral code on-the-fly:", updErr.message);
      }
    }
    res.json(user);
  });
});

// UPDATE PROFILE ENDPOINT
app.put('/api/profile', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { firstName, lastName, phone, address, province, city, district, area, postalCode, provinceId, cityId, districtId, areaId } = req.body;

  pool.query(
    'UPDATE users SET first_name = ?, last_name = ?, phone = ?, address = ?, province = ?, city = ?, district = ?, area = ?, postal_code = ?, province_id = ?, city_id = ?, district_id = ?, area_id = ? WHERE id = ?',
    [firstName || null, lastName || null, phone || null, address || null, province || null, city || null, district || null, area || null, postalCode || null, provinceId || null, cityId || null, districtId || null, areaId || null, userId],
    (err, results) => {
      if (err) {
        console.error("Profile update error:", err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true, message: 'Profil berhasil diperbarui' });
    }
  );
});

// CHANGE PASSWORD ENDPOINT
app.put('/api/profile/change-password', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Password baru minimal 6 karakter' });
  }

  try {
    const [users] = await pool.promise().query('SELECT password FROM users WHERE id = ?', [userId]);
    if (!users.length) return res.status(404).json({ message: 'User tidak ditemukan' });

    const user = users[0];

    // If user has a real password (not random from Google), verify old password
    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Password lama salah' });
      }
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);
    await pool.promise().query('UPDATE users SET password = ? WHERE id = ?', [hashedNew, userId]);

    res.json({ success: true, message: 'Password berhasil diperbarui' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
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
    let clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      const [rows] = await pool.promise().query("SELECT setting_value FROM settings WHERE setting_key = 'google_client_id'");
      if (rows.length > 0 && rows[0].setting_value) {
        clientId = rows[0].setting_value;
      }
    }
    if (!clientId) {
      clientId = '67311538354-3kkrjm976iaptm7k40qgr5rrgefgu2i7.apps.googleusercontent.com';
    }

    const activeClient = clientId === process.env.GOOGLE_CLIENT_ID ? googleClient : new OAuth2Client(clientId);
    const ticket = await activeClient.verifyIdToken({
      idToken: token,
      audience: clientId,
    });
    const { email, name, picture } = ticket.getPayload();
    const cleanEmail = (email || '').toString().trim().toLowerCase();

    pool.query('SELECT * FROM users WHERE TRIM(LOWER(email)) = ?', [cleanEmail], async (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });

      let user;
      if (results.length === 0) {
        // Create new user if doesn't exist
        const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
        await pool.promise().query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [cleanEmail, randomPassword, 'customer']);
        const [newUsers] = await pool.promise().query('SELECT * FROM users WHERE TRIM(LOWER(email)) = ?', [cleanEmail]);
        user = newUsers[0];
      } else {
        user = results[0];
      }

      // Generate JWT
      const userRole = (user.role || 'customer').toString().toLowerCase();
      const jwtToken = jwt.sign(
        { id: user.id, email: user.email, role: userRole },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token: jwtToken,
        email: user.email,
        role: userRole
      });
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(401).json({ message: 'Invalid Google Token' });
  }
});

// ====== FORGOT PASSWORD ENDPOINTS ======

// 1. FORGOT PASSWORD - REQUEST OTP
app.post('/api/forgot-password', async (req, res) => {
  const { identity } = req.body;
  if (!identity) {
    return res.status(400).json({ message: 'Email atau nomor telepon wajib diisi' });
  }

  const cleanIdentity = identity.trim();
  const lowerIdentity = cleanIdentity.toLowerCase();

  pool.query(
    'SELECT * FROM users WHERE TRIM(LOWER(email)) = ? OR phone = ?',
    [lowerIdentity, cleanIdentity],
    async (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', detail: err.message });
      if (results.length === 0) {
        return res.status(404).json({ message: 'Identitas tidak terdaftar. Silakan periksa kembali atau buat akun baru.' });
      }

      const user = results[0];
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Sign the OTP with a 10-minute expiry
      const token = jwt.sign(
        { userId: user.id, email: user.email, otpCode },
        JWT_SECRET,
        { expiresIn: '10m' }
      );

      // Determine verification method (simple check for email format)
      const isEmail = cleanIdentity.includes('@');
      let method = 'phone';

      if (isEmail) {
        method = 'email';
        await sendPasswordResetOTP(user.email, otpCode);
      } else {
        // Log OTP to server console for local testing
        console.log(`[SMS OTP SIMULATION] Reset code for phone ${user.phone}: ${otpCode}`);
      }

      res.json({
        message: isEmail 
          ? 'Kode verifikasi telah dikirim ke email Anda.' 
          : 'Kode verifikasi telah disimulasikan ke nomor telepon Anda.',
        token,
        method,
        // Expose simulated OTP only for non-email (phone) for simulation/testing convenience
        otp_simulated: isEmail ? null : otpCode
      });
    }
  );
});

// 2. FORGOT PASSWORD - VERIFY OTP
app.post('/api/verify-otp', (req, res) => {
  const { token, code } = req.body;
  if (!token || !code) {
    return res.status(400).json({ message: 'Token dan kode verifikasi wajib diisi' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.otpCode !== code.trim()) {
      return res.status(400).json({ message: 'Kode verifikasi salah!' });
    }

    // Generate a secure reset authorization token with a 5-minute expiry
    const resetToken = jwt.sign(
      { userId: decoded.userId, authorized: true },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.json({
      message: 'Verifikasi berhasil.',
      resetToken
    });
  } catch (err) {
    return res.status(400).json({ message: 'Kode verifikasi kedaluwarsa atau tidak valid, silakan coba lagi' });
  }
});

// 3. FORGOT PASSWORD - RESET PASSWORD
app.post('/api/reset-password', async (req, res) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword) {
    return res.status(400).json({ message: 'Token otorisasi dan password baru wajib diisi' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password minimal 6 karakter' });
  }

  try {
    const decoded = jwt.verify(resetToken, JWT_SECRET);
    if (!decoded.authorized) {
      return res.status(403).json({ message: 'Akses ditolak / Token tidak sah' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, decoded.userId],
      (err, result) => {
        if (err) return res.status(500).json({ message: 'Gagal memperbarui password', detail: err.message });
        res.json({ success: true, message: 'Password berhasil diubah. Silakan login kembali.' });
      }
    );
  } catch (err) {
    return res.status(400).json({ message: 'Token otorisasi kedaluwarsa atau tidak valid, silakan ulangi proses lupa sandi.' });
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
  console.log(`[ADMIN API] Accessing stats: ${req.user.email}`);
  try {
    const [orders] = await pool.promise().query('SELECT COUNT(*) as count FROM orders');
    const [revenue] = await pool.promise().query("SELECT SUM(total) as total FROM orders WHERE status IN ('paid', 'processing', 'completed', 'shipped')");
    const [products] = await pool.promise().query('SELECT COUNT(*) as count FROM products');

    // Low Stock ( < 10 )
    const [lowStock] = await pool.promise().query('SELECT id, name, stock, images FROM products WHERE stock < 10 LIMIT 3');

    // Chart Data (Real Revenue Last 7 Days)
    const [allOrders] = await pool.promise().query('SELECT total, "createdAt", items, status, "paymentMethod" FROM orders');
    
    // Process real chart data
    const chartData = [0, 0, 0, 0, 0, 0, 0]; // Day -6 to Day 0 (Today)
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Process real best sellers
    const productSales = {};
    
    // Status counts
    const statusCounts = {
      success: 0, // paid, processing, completed, shipped
      pending: 0, // pending, waiting_payment, waiting_verification
      failed: 0   // cancelled, expired, failed
    };

    // Payment method stats
    const paymentMethodStats = {};

    allOrders.forEach(o => {
      // Calculate Chart Data (only for non-dead orders)
      const isDead = o.status === 'cancelled' || o.status === 'expired' || o.status === 'failed';
      if (!isDead) {
        const orderDate = new Date(o.createdAt);
        const diffTime = Math.abs(today - orderDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays < 7) {
          chartData[6 - diffDays] += Number(o.total) || 0;
        }
      }

      // Group by status
      if (['paid', 'processing', 'completed', 'shipped'].includes(o.status)) {
        statusCounts.success += 1;
        
        // Group by payment method for success orders
        const method = o.paymentMethod || 'other';
        if (!paymentMethodStats[method]) {
          paymentMethodStats[method] = { count: 0, total: 0 };
        }
        paymentMethodStats[method].count += 1;
        paymentMethodStats[method].total += Number(o.total) || 0;
      } else if (['cancelled', 'expired', 'failed'].includes(o.status)) {
        statusCounts.failed += 1;
      } else {
        statusCounts.pending += 1;
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
        growth: Math.floor(Math.random() * 5) + 1 // mock slight growth
      }));

    // Monthly revenues
    const [monthlyThis] = await pool.promise().query("SELECT SUM(total) as total FROM orders WHERE status IN ('paid', 'processing', 'completed', 'shipped') AND \"createdAt\" >= DATE_TRUNC('month', NOW())");
    const [monthlyLast] = await pool.promise().query("SELECT SUM(total) as total FROM orders WHERE status IN ('paid', 'processing', 'completed', 'shipped') AND \"createdAt\" >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') AND \"createdAt\" < DATE_TRUNC('month', NOW())");

    res.json({
      totalOrders: orders[0].count,
      totalRevenue: revenue[0].total || 0,
      totalProducts: products[0].count,
      lowStock: lowStock.map(p => ({
        ...p,
        images: safeJsonParse(p.images)
      })),
      bestSellers: realBestSellers,
      chartData,
      statusCounts,
      paymentMethodStats,
      thisMonthRevenue: monthlyThis[0].total || 0,
      lastMonthRevenue: monthlyLast[0].total || 0
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

// GET PUBLIC SETTINGS (For Frontend Initialization)
app.get('/api/config/public', async (req, res) => {
  try {
    const [rows] = await pool.promise().query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('google_client_id', 'midtrans_client_key')");
    const settings = rows.reduce((acc, row) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});
    res.json(settings);
  } catch (err) {
    res.json({}); // Fallback gracefully
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
    const [rows] = await pool.promise().query('SELECT * FROM categories ORDER BY id DESC');
    
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
    console.error("Categories fetch error:", err);
    res.status(500).json({ error: 'Categories fetch error', detail: err.message });
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
    if (err.code === 'ER_DUP_ENTRY' || err.code === '23505') return res.json({ success: true, message: 'Already subscribed!' });
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



const PORT = process.env.PORT || 5000;
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (with Socket.io)`);
    // Run initial check after 5 seconds of startup, then hourly
    setTimeout(async () => {
      try {
        const axios = require('axios');
        await axios.post(`http://localhost:${PORT}/api/orders/auto-cancel`);
        console.log("[STARTUP] Initial stale orders check done.");
      } catch (err) {
        console.error("[STARTUP] Initial stale orders check failed:", err.message);
      }
    }, 5000);
  });
}

// Background Interval Task for Auto-Cancellation (runs every 1 hour)
setInterval(async () => {
  try {
    const axios = require('axios');
    const port = process.env.PORT || 5000;
    await axios.post(`http://localhost:${port}/api/orders/auto-cancel`);
    console.log("[CRON] Stale orders auto-cancellation successfully triggered.");
  } catch (err) {
    console.error("[CRON] Failed to auto-cancel stale orders:", err.message);
  }
}, 1000 * 60 * 60); // 1 hour

module.exports = app;
