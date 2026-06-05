const pool = require('./db');
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'coupons'", (err, res) => {
  if (err) console.error(err);
  else console.log(res);
  process.exit();
});
