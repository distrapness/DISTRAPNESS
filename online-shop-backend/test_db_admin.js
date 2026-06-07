const pool = require('./db');
pool.query("SELECT email, role FROM users WHERE role = 'admin'", (err, res) => {
  if (err) console.error(err);
  else console.log(res);
  process.exit();
});
