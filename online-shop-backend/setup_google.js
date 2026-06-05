require('dotenv').config();
const pool = require('./db');

async function run() {
  try {
    const googleId = process.env.GOOGLE_CLIENT_ID || '67311538354-3kkrjm976iaptm7k40qgr5rrgefgu2i7.apps.googleusercontent.com';

    await pool.promise().query(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT (setting_key) DO UPDATE SET setting_value = ?',
      ['google_client_id', googleId, googleId]
    );

    console.log("Google Client ID updated successfully in Supabase!");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
