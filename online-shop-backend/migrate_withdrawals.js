const pool = require('./db');

async function migrate() {
  const connection = await pool.promise().getConnection();
  try {
    console.log('Starting withdrawals migration for PostgreSQL...');

    // 1. Add balance column to users if not exists
    try {
      await connection.query('ALTER TABLE users ADD COLUMN balance DECIMAL(15, 2) DEFAULT 0.00');
      console.log('Added balance column to users');
    } catch (err) {
      console.log('Balance column might already exist:', err.message);
    }

    // 2. Create withdrawals table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        bank_account TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('withdrawals table created or verified.');

    console.log('Withdrawals migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    connection.release();
    process.exit();
  }
}

migrate();
