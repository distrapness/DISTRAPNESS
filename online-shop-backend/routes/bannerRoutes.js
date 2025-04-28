const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();

const BANNERS_JSON = path.join(__dirname, '../banners.json');
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'));
  }
});
const upload = multer({ storage });

// UPLOAD banner image
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

// Helper: read banners
function readBanners() {
  if (!fs.existsSync(BANNERS_JSON)) return [];
  const data = fs.readFileSync(BANNERS_JSON, 'utf8');
  try { return JSON.parse(data); } catch { return []; }
}
// Helper: write banners
function writeBanners(banners) {
  fs.writeFileSync(BANNERS_JSON, JSON.stringify(banners, null, 2));
}

// GET all banners
router.get('/', (req, res) => {
  res.json(readBanners());
});

// POST new banner
router.post('/', (req, res) => {
  const banners = readBanners();
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: 'Gambar wajib diisi' });
  const id = Date.now().toString();
  const banner = { id, image };
  banners.push(banner);
  writeBanners(banners);
  res.json(banner);
});

// PUT update banner
router.put('/:id', (req, res) => {
  const banners = readBanners();
  const idx = banners.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Banner tidak ditemukan' });
  banners[idx] = { ...banners[idx], ...req.body };
  writeBanners(banners);
  res.json(banners[idx]);
});

// DELETE banner
router.delete('/:id', (req, res) => {
  let banners = readBanners();
  const before = banners.length;
  banners = banners.filter(b => b.id !== req.params.id);
  if (banners.length === before) return res.status(404).json({ error: 'Banner tidak ditemukan' });
  writeBanners(banners);
  res.json({ success: true });
});

// PUT /sort : reorder banners
router.put('/sort', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'Format tidak valid' });
  const banners = readBanners();
  const newOrder = ids.map(id => banners.find(b => b.id === id)).filter(Boolean);
  if (newOrder.length !== banners.length) return res.status(400).json({ error: 'Urutan tidak valid' });
  writeBanners(newOrder);
  res.json({ success: true });
});

module.exports = router;
