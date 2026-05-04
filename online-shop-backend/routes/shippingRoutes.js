const express = require('express');
const router = express.Router();
const shippingService = require('../services/shippingService');
const rajaOngkirService = require('../services/rajaOngkirService');
const pool = require('../db');

// --- New Manual Hierarchy Routes ---
router.get('/provinces', async (req, res) => {
  try {
    // Try RajaOngkir first, then emsifa fallback
    const data = await rajaOngkirService.getProvinces();
    res.json(data.map(p => ({ id: p.province_id, name: p.province })));
  } catch (e) { 
    try {
      const data = await shippingService.getProvinces();
      res.json(data);
    } catch (err) { res.status(500).json({ error: e.message }); }
  }
});

router.get('/cities/:provinceId', async (req, res) => {
  try {
    const data = await rajaOngkirService.getCities(req.params.provinceId);
    res.json(data.map(c => ({ id: c.city_id, name: `${c.type} ${c.city_name}`, province_id: c.province_id })));
  } catch (e) { 
    try {
      const data = await shippingService.getCities(req.params.provinceId);
      res.json(data);
    } catch (err) { res.status(500).json({ error: e.message }); }
  }
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
    // 1. Get Manual Rates
    let manualPricing = [];
    try {
      const [manualRows] = await pool.promise().query('SELECT * FROM shipping_manual_rates');
      manualPricing = manualRows.map(row => ({
        company: 'manual',
        courier_name: 'Custom Delivery',
        courier_service_name: row.destination_name,
        courier_service_code: 'manual_' + row.id,
        price: row.price,
        duration: 'Standard',
        note: 'Kurir Lokal / Manual'
      }));
    } catch (dbErr) { console.error("Manual rates fetch failed", dbErr); }

    // 2. Try RajaOngkir (Primary recommendation)
    try {
      console.log("Attempting shipping calculation with RajaOngkir...");
      const result = await rajaOngkirService.getRatesByQuery(query, items);
      return res.json({
        ...result,
        pricing: [...(result.pricing || []), ...manualPricing]
      });
    } catch (roError) {
      console.warn("RajaOngkir failed, falling back to Biteship:", roError.message);
      
      // 3. Fallback to Biteship
      try {
        const result = await shippingService.getRatesByQuery(query, items, origin);
        res.json({
          ...result,
          pricing: [...(result.pricing || []), ...manualPricing]
        });
      } catch (apiError) {
        // 4. Final Fallback: Manual Only
        res.json({
          pricing: manualPricing,
          error: `RajaOngkir & Biteship error: ${apiError.message}`,
          is_manual_only: true
        });
      }
    }
  } catch (error) {
    res.status(500).json({ error: 'Gagal menghitung ongkos kirim', details: error.message });
  }
});

module.exports = router;
