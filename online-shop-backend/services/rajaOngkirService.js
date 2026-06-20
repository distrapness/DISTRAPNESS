const axios = require('axios');
const pool = require('../db');

let cachedProvinces = null;
let cachedCities = null;

const getRajaOngkirConfig = async () => {
    try {
        const [rows] = await pool.promise().query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('rajaongkir_api_key', 'rajaongkir_origin')");
        const settings = rows.reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});
        return {
            apiKey: process.env.RAJAONGKIR_API_KEY || settings.rajaongkir_api_key,
            origin: process.env.RAJAONGKIR_ORIGIN || settings.rajaongkir_origin || '151' // Default Jakarta Barat if not set
        };
    } catch (err) {
        return {
            apiKey: process.env.RAJAONGKIR_API_KEY,
            origin: process.env.RAJAONGKIR_ORIGIN || '151'
        };
    }
};

const rajaOngkirService = {
    getProvinces: async () => {
        if (cachedProvinces) return cachedProvinces;
        const config = await getRajaOngkirConfig();
        const res = await axios.get('https://api.rajaongkir.com/starter/province', {
            headers: { key: config.apiKey },
            timeout: 5000
        });
        cachedProvinces = res.data.rajaongkir.results;
        return cachedProvinces;
    },

    getCities: async (provinceId) => {
        if (!provinceId && cachedCities) {
            return cachedCities;
        }
        const config = await getRajaOngkirConfig();
        const res = await axios.get(`https://api.rajaongkir.com/starter/city?province=${provinceId}`, {
            headers: { key: config.apiKey },
            timeout: 5000
        });
        if (!provinceId) {
            cachedCities = res.data.rajaongkir.results;
        }
        return res.data.rajaongkir.results;
    },

    calculateCost: async (destinationCityId, weight, courier = 'jne') => {
        const config = await getRajaOngkirConfig();
        const params = new URLSearchParams();
        params.append('origin', config.origin);
        params.append('destination', destinationCityId);
        params.append('weight', weight);
        params.append('courier', courier);

        const res = await axios.post('https://api.rajaongkir.com/starter/cost', params, {
            headers: { 
                key: config.apiKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 5000
        });

        const results = res.data.rajaongkir.results[0];
        return results.costs.map(c => ({
            company: courier,
            courier_name: results.name,
            courier_service_name: c.service,
            courier_service_code: c.service.toLowerCase(),
            price: c.cost[0].value,
            duration: c.cost[0].etd + ' Days',
            note: c.description
        }));
    },

    // Bridge for compatibility with frontend
    getRatesByQuery: async (query, items) => {
        // RajaOngkir Starter needs City ID. We try to find city name in query string.
        // This is a bit hacky but works for basic implementations.
        const config = await getRajaOngkirConfig();
        const totalWeight = items.reduce((sum, item) => sum + (Number(item.weight) || 1000) * (Number(item.quantity) || 1), 0);
        
        // Extract city from query (e.g. "Jakarta Selatan, DKI Jakarta")
        const parts = query.split(',');
        const cityName = parts[parts.length - 2]?.trim() || parts[0]?.trim();
        
        if (!cityName) throw new Error("Format alamat pengiriman tidak valid untuk mendapatkan ongkir.");

        // 1. Find City ID
        const cities = await rajaOngkirService.getCities('');
        
        // Determine if city type is Kota or Kabupaten
        const isKota = cityName.toUpperCase().includes('KOTA');
        const isKabupaten = cityName.toUpperCase().includes('KABUPATEN') || cityName.toUpperCase().includes('KAB.');
        
        // Clean prefix names (KOTA / KABUPATEN / KAB.) for clean substring match
        const cleanCityName = cityName
            .replace(/KOTA|KABUPATEN|KAB\./gi, '')
            .trim()
            .toLowerCase();

        // Match by name AND type to prevent Kediri Kota matching Kediri Kabupaten etc.
        let matchedCity = cities.find(c => {
            const roCityName = c.city_name.toLowerCase();
            const roType = c.type.toLowerCase();
            const nameMatches = cleanCityName.includes(roCityName) || roCityName.includes(cleanCityName);
            if (!nameMatches) return false;
            
            if (isKota && roType === 'kota') return true;
            if (isKabupaten && roType === 'kabupaten') return true;
            return false;
        });

        // Fallback to name-only match if type check did not yield result
        if (!matchedCity) {
            matchedCity = cities.find(c => {
                const roCityName = c.city_name.toLowerCase();
                return cleanCityName.includes(roCityName) || roCityName.includes(cleanCityName);
            });
        }

        if (!matchedCity) throw new Error(`Kota "${cityName}" tidak ditemukan di RajaOngkir.`);

        // 2. Get rates for major couriers in PARALLEL to reduce waiting time
        const couriers = ['jne', 'tiki', 'pos'];
        
        const ratePromises = couriers.map(courier => 
            rajaOngkirService.calculateCost(matchedCity.city_id, totalWeight, courier)
                .catch(e => {
                    console.error(`Error fetching RajaOngkir for ${courier}:`, e.message);
                    return [];
                })
        );
        
        const results = await Promise.all(ratePromises);
        let allPricing = results.flat();

        return { 
            pricing: allPricing, 
            area_id: matchedCity.city_id, 
            resolved_area_name: `${matchedCity.type} ${matchedCity.city_name}` 
        };
    }
};

module.exports = rajaOngkirService;
