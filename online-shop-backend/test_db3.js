const pool = require('./db');
pool.query("SELECT conname, contype FROM pg_constraint WHERE conrelid = 'settings'::regclass", (err, res) => {
  if (err) console.error(err);
  else console.log(res);
  process.exit();
});
