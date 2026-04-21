const axios = require('axios');
const pool = require('../db');

const BITESHIP_BASE_URL = 'https://api.biteship.com/v1';

const getShippingConfig = async () => {
    try {
        const [rows] = await pool.promise().query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('biteship_api_key', 'shipping_origin')");
        const settings = rows.reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});
        return {
            apiKey: settings.biteship_api_key || process.env.BITESHIP_API_KEY,
            origin: settings.shipping_origin || process.env.SHIPPING_ORIGIN // e.g. IDNP...
        };
    } catch (err) {
        console.error("Error fetching Shipping config from DB", err);
        return {
            apiKey: process.env.BITESHIP_API_KEY,
            origin: process.env.SHIPPING_ORIGIN
        };
    }
};

const shippingService = {
  // --- New Manual Hierarchy Methods (emsifa API) ---
  getProvinces: async () => {
    const res = await axios.get('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
    return res.data;
  },
  getCities: async (provinceId) => {
    const res = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`);
    return res.data;
  },
  getDistricts: async (cityId) => {
    const res = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${cityId}.json`);
    return res.data;
  },
  getVillages: async (districtId) => {
    const res = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${districtId}.json`);
    return res.data;
  },

  // Map manual string selection to Biteship Area ID
  findAreaId: async (query) => {
    try {
      const config = await getShippingConfig();
      const response = await axios.get(`${BITESHIP_BASE_URL}/maps/areas`, {
        params: { countries: 'ID', input: query, type: 'single' },
        headers: { authorization: config.apiKey }
      });
      // Return the first match's ID
      return response.data.areas?.[0]?.id || null;
    } catch (error) {
      console.error('Error finding Biteship area ID:', error.message);
      return null;
    }
  },

  searchAreas: async (input) => {
    try {
      const config = await getShippingConfig();
      const response = await axios.get(`${BITESHIP_BASE_URL}/maps/areas`, {
        params: { countries: 'ID', input, type: 'single' },
        headers: { authorization: config.apiKey }
      });
      return response.data.areas;
    } catch (error) {
      console.error('Error fetching areas:', error.response?.data || error.message);
      throw error;
    }
  },

  calculateCost: async (originInput, destinationAreaId, items) => {
    try {
      const config = await getShippingConfig();
      const origin = originInput || config.origin;

      if (!origin || !destinationAreaId) {
          throw new Error("Missing origin or destination ID");
      }

      const payload = {
        origin_area_id: origin,
        destination_area_id: destinationAreaId,
        couriers: "jne,tiki,sicepat,jnt,pos,anteraja,ninja,grab,gojek",
        items: items
      };

      const response = await axios.post(`${BITESHIP_BASE_URL}/rates/couriers`, payload, {
        headers: { 
            authorization: config.apiKey,
            'Content-Type': 'application/json'
        }
      });
      
      return response.data.pricing;
    } catch (error) {
      console.error('Error calculating cost (Biteship):', error.response?.data || error.message);
      throw error;
    }
  },

  // Optimized: Resolve Area + Get Rates in one call
  getRatesByQuery: async (originInput, query, items) => {
      try {
        const config = await getShippingConfig();
        const origin = originInput || config.origin;

        // 1. Resolve Area
        const areaRes = await axios.get(`${BITESHIP_BASE_URL}/maps/areas`, {
            params: { countries: 'ID', input: query, type: 'single' },
            headers: { authorization: config.apiKey }
        });
        const areaId = areaRes.data.areas?.[0]?.id;
        if (!areaId) throw new Error("Area tidak ditemukan untuk query: " + query);

        // 2. Get Rates
        const payload = {
            origin_area_id: origin,
            destination_area_id: areaId,
            couriers: "jne,tiki,sicepat,jnt,pos,anteraja,ninja,grab,gojek",
            items: items
        };

        const response = await axios.post(`${BITESHIP_BASE_URL}/rates/couriers`, payload, {
            headers: { authorization: config.apiKey, 'Content-Type': 'application/json' }
        });

        return { pricing: response.data.pricing, area_id: areaId };
      } catch (error) {
        const errorDetail = error.response?.data || error.message;
        console.error('Error getting rates by query:', errorDetail);
        throw new Error(JSON.stringify(errorDetail));
      }
  }
};

module.exports = shippingService;
