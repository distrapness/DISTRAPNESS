const pool = require('./db');
const settings = {
  rajaongkir_api_key: 'ROYHLspcab00bff25a6163d0c23oldi3',
  shipping_origin: '151',
  midtrans_server_key: 'L4N4gkeHab00bff25a6163d0H8dgkUhL',
  midtrans_client_key: 'L4N4gkeHab00bff25a6163d0H8dgkUhL'
};

async function sync() {
    for (const [key, value] of Object.entries(settings)) {
      await pool.promise().query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value, value]
      );
    }
    console.log("Keys processed");
    process.exit(0);
}
sync();
