const pool = require('./db');

async function run() {
  const connection = await pool.promise().getConnection();
  try {
    console.log("Dropping and recreating coupons table on PostgreSQL...");
    await connection.query('DROP TABLE IF EXISTS coupons');
    await connection.query(`
      CREATE TABLE coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(255) NOT NULL UNIQUE,
        type VARCHAR(50) DEFAULT 'percent',
        value DECIMAL(15,2) NOT NULL,
        min_purchase DECIMAL(15,2) DEFAULT 0.00,
        usage_limit INT DEFAULT 0,
        usage_count INT DEFAULT 0,
        start_date TIMESTAMP,
        expiry_date TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Coupons table migrated successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
