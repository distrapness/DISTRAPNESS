const pool = require('./db');
pool.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'orders'", (err, res) => {
  if (err) console.error(err);
  else console.log(res);
  process.exit();
});
