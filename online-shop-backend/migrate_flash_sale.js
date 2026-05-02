const pool = require('./db');

async function migrate() {
  console.log("Starting migration: Adding flash sale columns to products table...");
  const connection = await pool.promise().getConnection();
  try {
    // Check if columns exist (using a safe approach or just trying to add them)
    // In PostgreSQL, we can use ALTER TABLE ADD COLUMN IF NOT EXISTS (Postgres 9.6+)
    
    await connection.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS is_flash_sale BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS flash_sale_price DECIMAL(15, 2),
      ADD COLUMN IF NOT EXISTS flash_sale_end TIMESTAMP;
    `);

    console.log("Migration successful: Columns added to 'products' table.");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    connection.release();
    process.exit();
  }
}

migrate();
