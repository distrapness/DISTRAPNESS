const axios = require('axios');

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;
const RAJAONGKIR_BASE_URL = 'https://api.rajaongkir.com/starter'; // Fixed for Starter plan

const shippingService = {
  getProvinces: async () => {
    try {
      const response = await axios.get(`${RAJAONGKIR_BASE_URL}/province`, {
        headers: { key: RAJAONGKIR_API_KEY }
      });
      return response.data.rajaongkir.results;
    } catch (error) {
      console.error('Error fetching provinces:', error.response?.data || error.message);
      throw error;
    }
  },

  getCities: async (provinceId) => {
    try {
      const response = await axios.get(`${RAJAONGKIR_BASE_URL}/city?province=${provinceId}`, {
        headers: { key: RAJAONGKIR_API_KEY }
      });
      return response.data.rajaongkir.results;
    } catch (error) {
      console.error('Error fetching cities:', error.response?.data || error.message);
      throw error;
    }
  },

  calculateCost: async (origin, destination, weight, courier) => {
    try {
      const response = await axios.post(`${RAJAONGKIR_BASE_URL}/cost`, {
        origin,
        destination,
        weight,
        courier
      }, {
        headers: { key: RAJAONGKIR_API_KEY }
      });
      return response.data.rajaongkir.results;
    } catch (error) {
      console.error('Error calculating cost:', error.response?.data || error.message);
      throw error;
    }
  }
};

module.exports = shippingService;
