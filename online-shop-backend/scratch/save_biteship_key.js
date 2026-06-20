const pool = require('../db');

const key = 'biteship_test.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiZGlzdHJhcG5lc3MiLCJ1c2VySWQiOiI2OWU3OWUwYTIyMTIwNWI4YjliYmUwOTkiLCJpYXQiOjE3ODE4NDc2OTR9.w_YCt_S5FRrvTVuxlgSDYQ74jUCfSK-RE10z5L7o0Tw';

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
