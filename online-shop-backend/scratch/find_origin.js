const axios = require('axios');
const pool = require('../db');

const apiKey = 'biteship_test.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiZGlzdHJhcG5lc3MiLCJ1c2VySWQiOiI2OWU3OWUwYTIyMTIwNWI4YjliYmUwOTkiLCJpYXQiOjE3NzY5NzY5NzZ9.FYCY7ZQkPsX1pv_FekkRd0-GlVyjP_SXinfIX9snZRM';
const query = 'Tenjolaya Tapos 2 Bogor';

async function findAndSaveArea() {
    try {
        console.log(`Mencari Area ID untuk: ${query}...`);
        const response = await axios.get('https://api.biteship.com/v1/maps/areas', {
            params: { countries: 'ID', input: query, type: 'single' },
            headers: { authorization: apiKey }
        });

        const area = response.data.areas?.[0];
        if (!area) {
            console.error('❌ Wah, area tidak ditemukan. Coba periksa penulisannya.');
            process.exit(1);
        }

        console.log(`✅ Ketemu! Area: ${area.name} (ID: ${area.id})`);
        
        await pool.promise().query(
            "INSERT INTO settings (setting_key, setting_value) VALUES ('shipping_origin', ?) ON DUPLICATE KEY UPDATE setting_value = ?",
            [area.id, area.id]
        );
        
        console.log(`🚀 Shipping Origin berhasil diset ke: ${area.id}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Gagal:', err.response?.data || err.message);
        process.exit(1);
    }
}

findAndSaveArea();
