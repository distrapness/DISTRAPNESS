const pool = require('../db');

const key = 'biteship_test.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiZGlzdHJhcG5lc3MiLCJ1c2VySWQiOiI2OWU3OWUwYTIyMTIwNWI4YjliYmUwOTkiLCJpYXQiOjE3NzY5NzY5NzZ9.FYCY7ZQkPsX1pv_FekkRd0-GlVyjP_SXinfIX9snZRM';

async function updateKey() {
    try {
        await pool.promise().query(
            "INSERT INTO settings (setting_key, setting_value) VALUES ('biteship_api_key', ?) ON DUPLICATE KEY UPDATE setting_value = ?",
            [key, key]
        );
        console.log('✅ Biteship API Key berhasil disimpan ke database!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Gagal menyimpan kunci:', err.message);
        process.exit(1);
    }
}

updateKey();
