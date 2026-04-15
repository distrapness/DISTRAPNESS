const express = require('express');
const router = express.Router();
const shippingService = require('../services/shippingService');

// Fetch Provinces
router.get('/provinces', async (req, res) => {
  try {
    const provinces = await shippingService.getProvinces();
    res.json(provinces);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data provinsi' });
  }
});

// Fetch Cities by Province ID
router.get('/cities/:provinceId', async (req, res) => {
  try {
    const cities = await shippingService.getCities(req.params.provinceId);
    res.json(cities);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data kota' });
  }
});

// Calculate Cost
router.post('/cost', async (req, res) => {
  const { origin, destination, weight, courier } = req.body;
  
  if (!origin || !destination || !weight || !courier) {
    return res.status(400).json({ error: 'Parameter asal, tujuan, berat, dan kurir wajib diisi' });
  }

  try {
    const costs = await shippingService.calculateCost(origin, destination, weight, courier);
    res.json(costs);
  } catch (error) {
    res.status(500).json({ error: 'Gagal menghitung ongkos kirim' });
  }
});

module.exports = router;
