const pool = require('./db');
pool.query("SELECT setting_key, setting_value FROM settings", (err, res) => {
  if (err) console.error(err);
  else console.log(res);
  process.exit();
});
