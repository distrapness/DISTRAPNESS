const pool = require('../db');
pool.query("SELECT SUM(total) as total FROM orders WHERE status IN ('paid', 'processing', 'completed', 'shipped') AND \"createdAt\" >= DATE_TRUNC('month', NOW())", (err, res) => {
  if (err) console.error(err);
  else console.log(res);
  process.exit();
});
