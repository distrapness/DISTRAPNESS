require('dotenv').config();
const pool = require('./db');

async function run() {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.MIDTRANS_CLIENT_KEY;
    const roKey = process.env.RAJAONGKIR_API_KEY;
    const roOrigin = process.env.RAJAONGKIR_ORIGIN;

    if (!serverKey || !roKey) {
       console.log("No env variables found.");
       process.exit(1);
    }

    const isProd = serverKey.startsWith('SB-') ? 'false' : 'true';

    const settings = {
       'midtrans_server_key': serverKey,
       'midtrans_client_key': clientKey,
       'midtrans_production': isProd,
       'rajaongkir_api_key': roKey,
       'rajaongkir_origin': roOrigin || '151'
    };

    console.log("Inserting settings...");
    for (const [key, value] of Object.entries(settings)) {
       await pool.promise().query(
         'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT (setting_key) DO UPDATE SET setting_value = ?',
         [key, value, value]
       );
    }
    console.log("Settings updated successfully in Supabase!");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
