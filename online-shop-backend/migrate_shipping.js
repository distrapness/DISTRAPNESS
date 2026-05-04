const pool = require('./db');

async function migrate() {
  console.log("Starting migration: Creating shipping_manual_rates table...");
  const connection = await pool.promise().getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS shipping_manual_rates (
        id SERIAL PRIMARY KEY,
        destination_name VARCHAR(255) NOT NULL,
        price DECIMAL(15, 2) NOT NULL
      );
    `);
    
    // Check if table is empty, if so, insert a default rate just in case
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM shipping_manual_rates');
    if (rows[0].count == 0) {
        await connection.query(`
            INSERT INTO shipping_manual_rates (destination_name, price) VALUES 
            ('Local Delivery', 15000),
            ('Standard Shipping', 25000)
        `);
    }

    console.log("Migration successful: Table 'shipping_manual_rates' created.");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    connection.release();
    process.exit();
  }
}

migrate();
