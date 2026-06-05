const pool = require('./db');
pool.query("SELECT * FROM settings", (err, res) => {
  if (err) console.error(err);
  else console.log(res);
  process.exit();
});
