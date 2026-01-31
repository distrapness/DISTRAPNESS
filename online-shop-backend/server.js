const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');
const http = require('http');
const setupSocket = require('./socket');

const app = express();
const server = http.createServer(app);
setupSocket(server);

// ====== CORS untuk seluruh route, termasuk static file ======
app.use(cors());

app.use(express.json());

// ====== Static file uploads dengan header CORS ======
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Multer setup
// Cloudinary config
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'online-shop',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage });

// Upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // req.file.path berisi URL public dari Cloudinary
  res.json({ url: req.file.path });
});

// Brand API
const fs = require('fs');
const BRAND_JSON = path.join(__dirname, 'brand.json');

app.get('/api/brand', (req, res) => {
  fs.readFile(BRAND_JSON, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Gagal membaca brand' });
    res.json(JSON.parse(data));
  });
});

app.put('/api/brand', (req, res) => {
  fs.writeFile(BRAND_JSON, JSON.stringify(req.body, null, 2), (err) => {
    if (err) return res.status(500).json({ error: 'Gagal menyimpan brand' });
    res.json({ success: true });
  });
});

// TEST ROUTE UNTUK CEK SERVER
app.get('/api/test', (req, res) => {
  res.json({ ok: true, message: 'Server aktif!' });
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
    // Kirim token dummy (bisa diganti JWT jika perlu)
    const token = 'dummy-token';
    res.json({ token, email: user.email });
  });
});

const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

const bannerRoutes = require('./routes/bannerRoutes');
app.use('/api/banners', bannerRoutes);

const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);

const midtransRoutes = require('./routes/midtrans');
app.use('/api/midtrans', midtransRoutes);

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  server.listen(PORT, () => console.log(`Server running on port ${PORT} (with Socket.io)`));
}

module.exports = app;
