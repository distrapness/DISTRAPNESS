const axios = require('axios');
const pool = require('../db');

const getRajaOngkirConfig = async () => {
    try {
        const [rows] = await pool.promise().query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('rajaongkir_api_key', 'rajaongkir_origin')");
        const settings = rows.reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});
        return {
            apiKey: settings.rajaongkir_api_key || process.env.RAJAONGKIR_API_KEY,
            origin: settings.rajaongkir_origin || process.env.RAJAONGKIR_ORIGIN || '151' // Default Jakarta Barat if not set
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
        const config = await getRajaOngkirConfig();
        const res = await axios.get('https://api.rajaongkir.com/starter/province', {
            headers: { key: config.apiKey }
        });
        return res.data.rajaongkir.results;
    },

    getCities: async (provinceId) => {
        const config = await getRajaOngkirConfig();
        const res = await axios.get(`https://api.rajaongkir.com/starter/city?province=${provinceId}`, {
            headers: { key: config.apiKey }
        });
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
            }
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
        const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1000) * (item.quantity || 1), 0);
        
        // Extract city from query (e.g. "Jakarta Selatan, DKI Jakarta")
        const parts = query.split(',');
        const cityName = parts[parts.length - 2]?.trim() || parts[0]?.trim();
        
        // 1. Find City ID
        const cities = await rajaOngkirService.getCities('');
        const matchedCity = cities.find(c => 
            cityName.toLowerCase().includes(c.city_name.toLowerCase()) || 
            c.city_name.toLowerCase().includes(cityName.toLowerCase())
        );

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
            resolved_area_name: matchedCity.city_name 
        };
    }
};

module.exports = rajaOngkirService;
