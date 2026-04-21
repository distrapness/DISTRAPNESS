const pool = require('./db');
const settings = {
  biteship_api_key: 'biteship_test.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiRElTVFJBUE5FU1MiLCJ1c2VySWQiOiI2OWU3OWUwYTIyMTIwNWI4YjliYmUwOTkiLCJpYXQiOjE3NzY3ODc0MDh9.QvHvR-FwB1cqd8X1wEOrxSSaqe_NJjjsqgw0WTflaTI',
  shipping_origin: 'IDNP6IDNC147IDND829' // Default to Gambir, Jakarta Pusat
};

async function sync() {
    for (const [key, value] of Object.entries(settings)) {
      await pool.promise().query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value, value]
      );
    }
    console.log("Biteship Keys processed");
    process.exit(0);
}
sync();
