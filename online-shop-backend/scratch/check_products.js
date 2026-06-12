const pool = require('../db');

async function check() {
  try {
    const [products] = await pool.promise().query(
      'SELECT id, name, price, is_flash_sale, flash_sale_price, flash_sale_end FROM products WHERE is_flash_sale = true'
    );
    console.log("Flash Sale Products in DB:");
    console.log(JSON.stringify(products, null, 2));
  } catch (err) {
    console.error("Error checking products:", err);
  } finally {
    process.exit(0);
  }
}

check();
