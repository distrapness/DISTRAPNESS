const pool = require('./db');
pool.query("SHOW COLUMNS FROM products;", (err, results) => {
  if (err) throw err;
  console.log(results);
  process.exit();
});
