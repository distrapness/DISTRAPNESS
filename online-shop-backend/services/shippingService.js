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
    const res = await axios.get('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json', { timeout: 5000 });
    return res.data;
  },
  getCities: async (provinceId) => {
    const res = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`, { timeout: 5000 });
    return res.data;
  },
  getDistricts: async (cityId) => {
    const res = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${cityId}.json`, { timeout: 5000 });
    return res.data;
  },
  getVillages: async (districtId) => {
    const res = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${districtId}.json`, { timeout: 5000 });
    return res.data;
  },

  // Map manual string selection to Biteship Area ID
  findAreaId: async (query) => {
    try {
      const config = await getShippingConfig();
      const response = await axios.get(`${BITESHIP_BASE_URL}/maps/areas`, {
        params: { countries: 'ID', input: query, type: 'single' },
        headers: { authorization: config.apiKey },
        timeout: 5000
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
  getRatesByQuery: async (query, items, originInput) => {
      try {
        const config = await getShippingConfig();
        const origin = originInput || config.origin;

        // 1. Resolve Area
        console.log(`Resolving area for query: ${query}`);
        const areaRes = await axios.get(`${BITESHIP_BASE_URL}/maps/areas`, {
            params: { countries: 'ID', input: query, type: 'single' },
            headers: { authorization: config.apiKey }
        });
        
        let area = areaRes.data.areas?.[0];
        
        // If not found with full query, try District + City
        if (!area) {
            const parts = query.split(',');
            if (parts.length >= 3) {
                const retryQuery = parts.slice(1, 4).join(',').trim();
                console.log(`Retrying area resolution with: ${retryQuery}`);
                const retryRes = await axios.get(`${BITESHIP_BASE_URL}/maps/areas`, {
                    params: { countries: 'ID', input: retryQuery, type: 'single' },
                    headers: { authorization: config.apiKey }
                });
                area = retryRes.data.areas?.[0];
            }
        }
        
        // One last try with just City
        if (!area) {
            const parts = query.split(',');
            const cityQuery = parts[parts.length - 2]?.trim();
            if (cityQuery) {
                console.log(`Final attempt with city: ${cityQuery}`);
                const finalRes = await axios.get(`${BITESHIP_BASE_URL}/maps/areas`, {
                    params: { countries: 'ID', input: cityQuery, type: 'single' },
                    headers: { authorization: config.apiKey }
                });
                area = finalRes.data.areas?.[0];
            }
        }

        if (!area) throw new Error("Area tidak ditemukan di Biteship untuk wilayah ini.");

        const areaId = area.id;
        console.log(`Resolved Area ID: ${areaId} (${area.name})`);

        // 2. Get Rates
        const payload = {
            origin_area_id: origin,
            destination_area_id: areaId,
            couriers: "jne,sicepat,jnt,pos,anteraja,tiki,lion,ninja",
            items: items.map(i => ({
                name: String(i.name || "Product"),
                value: Number(i.value || 10000),
                weight: Number(i.weight || 1000),
                quantity: Number(i.quantity || 1)
            }))
        };

        console.log("Biteship Request Payload:", JSON.stringify(payload));

        const response = await axios.post(`${BITESHIP_BASE_URL}/rates/couriers`, payload, {
            headers: { 
                'Authorization': config.apiKey, 
                'Content-Type': 'application/json' 
            }
        });

        return { pricing: response.data.pricing, area_id: areaId, resolved_area_name: area.name };
      } catch (error) {
        const errorDetail = error.response ? error.response.data : error.message;
        const finalMessage = error.response?.data?.description || 
                           error.response?.data?.error || 
                           error.message || 
                           "Gagal mendapatkan biaya pengiriman";

        // EMERGENCY FALLBACK: If balance is empty, provide a mock price so testing can continue
        if (finalMessage.toLowerCase().includes("balance") || finalMessage.toLowerCase().includes("credit")) {
            console.warn("BITESHIP BALANCE EMPTY: Using Emergency Fallback Price (20k)");
            return {
                is_fallback: true,
                area_id: "FALLBACK_ID",
                resolved_area_name: "Fallback Area",
                pricing: [
                    {
                        company: 'jne',
                        courier_name: 'JNE',
                        courier_service_name: 'REG (Emergency Fallback)',
                        courier_service_code: 'reg',
                        price: 20000,
                        duration: '2 - 4 Days',
                        note: 'Biteship balance empty, using static rate for testing.'
                    }
                ]
            };
        }

        console.error('Shipping Service Error Details:', JSON.stringify(errorDetail, null, 2));
        throw new Error(finalMessage);
      }
  }
};

module.exports = shippingService;
