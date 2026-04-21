const express = require('express');
const router = express.Router();
const shippingService = require('../services/shippingService');

// --- New Manual Hierarchy Routes ---
router.get('/provinces', async (req, res) => {
  try {
    const data = await shippingService.getProvinces();
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/cities/:provinceId', async (req, res) => {
  try {
    const data = await shippingService.getCities(req.params.provinceId);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/districts/:cityId', async (req, res) => {
  try {
    const data = await shippingService.getDistricts(req.params.cityId);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/villages/:districtId', async (req, res) => {
  try {
    const data = await shippingService.getVillages(req.params.districtId);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/find-area', async (req, res) => {
  try {
    const { q } = req.query;
    const areaId = await shippingService.findAreaId(q);
    res.json({ area_id: areaId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Search areas (kept for compatibility)
router.get('/areas', async (req, res) => {
  const { input } = req.query;
  if (!input) return res.json([]);
  
  try {
    const areas = await shippingService.searchAreas(input);
    res.json(areas);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mencari area', details: error.message });
  }
});

// Calculate Cost
router.post('/cost-by-query', async (req, res) => {
  const { origin, query, items } = req.body;
  
  if (!query || !items || !items.length) {
    return res.status(400).json({ error: 'Parameter query alamat dan detail produk wajib diisi' });
  }

  try {
    const result = await shippingService.getRatesByQuery(origin, query, items);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Gagal menghitung ongkos kirim', details: error.message });
  }
});

module.exports = router;
