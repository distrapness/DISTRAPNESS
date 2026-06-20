const express = require('express');
const router = express.Router();
const shippingService = require('../services/shippingService');
const rajaOngkirService = require('../services/rajaOngkirService');
const pool = require('../db');

// --- New Manual Hierarchy Routes ---
router.get('/provinces', async (req, res) => {
  try {
    const data = await shippingService.getProvinces();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cities/:provinceId', async (req, res) => {
  try {
    const data = await shippingService.getCities(req.params.provinceId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// Helper for calculating dynamic rates offline when APIs fail
const PROVINCE_RATES = {
  // Banten & Jakarta & Jawa Barat
  "dki jakarta": { rate: 8000, duration: "1-2 Hari" },
  "jakarta": { rate: 8000, duration: "1-2 Hari" },
  "banten": { rate: 9000, duration: "1-2 Hari" },
  "jawa barat": { rate: 9000, duration: "1-2 Hari" },
  "west java": { rate: 9000, duration: "1-2 Hari" },
  
  // Jawa Tengah & DIY
  "jawa tengah": { rate: 15000, duration: "2-3 Hari" },
  "central java": { rate: 15000, duration: "2-3 Hari" },
  "daerah istimewa yogyakarta": { rate: 15000, duration: "2-3 Hari" },
  "yogyakarta": { rate: 15000, duration: "2-3 Hari" },
  
  // Jawa Timur
  "jawa timur": { rate: 17000, duration: "2-3 Hari" },
  "east java": { rate: 17000, duration: "2-3 Hari" },
  
  // Bali
  "bali": { rate: 20000, duration: "3-4 Hari" },
  
  // Sumatera
  "lampung": { rate: 18000, duration: "2-3 Hari" },
  "sumatera selatan": { rate: 20000, duration: "3-4 Hari" },
  "south sumatra": { rate: 20000, duration: "3-4 Hari" },
  "bengkulu": { rate: 22000, duration: "3-4 Hari" },
  "jambi": { rate: 22000, duration: "3-4 Hari" },
  "kepulauan bangka belitung": { rate: 20000, duration: "3-4 Hari" },
  "bangka belitung": { rate: 20000, duration: "3-4 Hari" },
  "riau": { rate: 24000, duration: "3-4 Hari" },
  "kepulauan riau": { rate: 26000, duration: "3-4 Hari" },
  "sumatera barat": { rate: 24000, duration: "3-4 Hari" },
  "west sumatra": { rate: 24000, duration: "3-4 Hari" },
  "sumatera utara": { rate: 28000, duration: "4-5 Hari" },
  "north sumatra": { rate: 28000, duration: "4-5 Hari" },
  "aceh": { rate: 32000, duration: "4-5 Hari" },
  "nanggroe aceh darussalam": { rate: 32000, duration: "4-5 Hari" },
  
  // Nusa Tenggara
  "nusa tenggara barat": { rate: 25000, duration: "3-4 Hari" },
  "ntb": { rate: 25000, duration: "3-4 Hari" },
  "nusa tenggara timur": { rate: 38000, duration: "4-6 Hari" },
  "ntt": { rate: 38000, duration: "4-6 Hari" },
  
  // Kalimantan
  "kalimantan barat": { rate: 28000, duration: "3-5 Hari" },
  "west kalimantan": { rate: 28000, duration: "3-5 Hari" },
  "kalimantan tengah": { rate: 30000, duration: "4-5 Hari" },
  "central kalimantan": { rate: 30000, duration: "4-5 Hari" },
  "kalimantan selatan": { rate: 30000, duration: "3-5 Hari" },
  "south kalimantan": { rate: 30000, duration: "3-5 Hari" },
  "kalimantan timur": { rate: 32000, duration: "4-5 Hari" },
  "east kalimantan": { rate: 32000, duration: "4-5 Hari" },
  "kalimantan utara": { rate: 38000, duration: "4-6 Hari" },
  "north kalimantan": { rate: 38000, duration: "4-6 Hari" },
  
  // Sulawesi
  "sulawesi selatan": { rate: 32000, duration: "3-5 Hari" },
  "south sulawesi": { rate: 32000, duration: "3-5 Hari" },
  "sulawesi utara": { rate: 42000, duration: "4-6 Hari" },
  "north sulawesi": { rate: 42000, duration: "4-6 Hari" },
  "sulawesi tengah": { rate: 38000, duration: "4-6 Hari" },
  "central sulawesi": { rate: 38000, duration: "4-6 Hari" },
  "sulawesi tenggara": { rate: 38000, duration: "4-6 Hari" },
  "southeast sulawesi": { rate: 38000, duration: "4-6 Hari" },
  "sulawesi barat": { rate: 38000, duration: "4-6 Hari" },
  "west sulawesi": { rate: 38000, duration: "4-6 Hari" },
  "gorontalo": { rate: 42000, duration: "4-6 Hari" },
  
  // Maluku & Papua
  "maluku": { rate: 55000, duration: "5-7 Hari" },
  "maluku utara": { rate: 60000, duration: "5-8 Hari" },
  "north maluku": { rate: 60000, duration: "5-8 Hari" },
  "papua": { rate: 85000, duration: "5-8 Hari" },
  "papua barat": { rate: 85000, duration: "5-8 Hari" },
  "west papua": { rate: 85000, duration: "5-8 Hari" },
  "papua tengah": { rate: 90000, duration: "6-9 Hari" },
  "papua selatan": { rate: 90000, duration: "6-9 Hari" },
  "papua pegunungan": { rate: 110000, duration: "7-10 Hari" },
  "papua barat daya": { rate: 90000, duration: "6-9 Hari" }
};

function calculateOfflineRates(query, items) {
  const totalWeight = items.reduce((sum, item) => sum + (Number(item.weight) || 1000) * (Number(item.quantity) || 1), 0);
  const weightKg = Math.ceil(totalWeight / 1000) || 1;

  const parts = query.split(',');
  const provinceName = parts[parts.length - 1]?.trim().toLowerCase() || "";

  let matchedRate = null;
  for (const [prov, info] of Object.entries(PROVINCE_RATES)) {
    if (provinceName.includes(prov) || prov.includes(provinceName)) {
      matchedRate = info;
      break;
    }
  }

  const baseRate = matchedRate ? matchedRate.rate : 18000;
  const duration = matchedRate ? matchedRate.duration : "3-5 Hari";

  const finalJneReg = baseRate * weightKg;
  const finalJtReg = Math.max(8000, (baseRate - 1000) * weightKg);
  const finalSicepatReg = baseRate * weightKg;
  const finalJneYes = Math.round(baseRate * 1.5) * weightKg;

  return [
    {
      company: 'jne',
      courier_name: 'JNE',
      courier_service_name: 'Regular (REG)',
      courier_service_code: 'reg',
      price: finalJneReg,
      duration: duration,
      note: 'Layanan Reguler JNE'
    },
    {
      company: 'jnt',
      courier_name: 'J&T',
      courier_service_name: 'EZ (Regular)',
      courier_service_code: 'ez',
      price: finalJtReg,
      duration: duration,
      note: 'Layanan EZ Regular J&T'
    },
    {
      company: 'sicepat',
      courier_name: 'Sicepat',
      courier_service_name: 'SiUntung (REG)',
      courier_service_code: 'reg',
      price: finalSicepatReg,
      duration: duration,
      note: 'Layanan SiUntung Sicepat'
    },
    {
      company: 'jne',
      courier_name: 'JNE',
      courier_service_name: 'YES (Yakin Esok Sampai)',
      courier_service_code: 'yes',
      price: finalJneYes,
      duration: '1-2 Hari',
      note: 'Layanan Kilat JNE'
    }
  ];
}

// Calculate Cost
router.post('/cost-by-query', async (req, res) => {
  const { origin, query, items } = req.body;
  
  if (!query || !items || !items.length) {
    return res.status(400).json({ error: 'Parameter query alamat dan detail produk wajib diisi' });
  }

  try {
    // 1. Try RajaOngkir (Primary recommendation)
    try {
      console.log("Attempting shipping calculation with RajaOngkir...");
      const result = await rajaOngkirService.getRatesByQuery(query, items);
      
      if (!result || !result.pricing || result.pricing.length === 0) {
        throw new Error("RajaOngkir returned no rates");
      }

      return res.json(result);
    } catch (roError) {
      console.warn("RajaOngkir failed, falling back to Biteship:", roError.message);
      
      // 2. Fallback to Biteship
      try {
        let result = await shippingService.getRatesByQuery(query, items, origin);
        
        if (result.is_fallback) {
          console.warn("Biteship is using static 20k fallback. Overriding with dynamic offline calculator.");
          const offlineRates = calculateOfflineRates(query, items);
          result.pricing = offlineRates;
        }

        res.json(result);
      } catch (apiError) {
        console.warn("Biteship also failed, using Offline Dynamic calculator:", apiError.message);
        // 3. Final Fallback: Offline Dynamic
        const offlineRates = calculateOfflineRates(query, items);
        
        res.json({
          pricing: offlineRates,
          is_offline: true,
          resolved_area_name: query.split(',').slice(-2).join(', ').trim()
        });
      }
    }
  } catch (error) {
    res.status(500).json({ error: 'Gagal menghitung ongkos kirim', details: error.message });
  }
});

module.exports = router;
