const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

const app = express();

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
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url });
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
