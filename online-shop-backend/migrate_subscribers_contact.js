const pool = require('./db');

async function run() {
  const connection = await pool.promise().getConnection();
  try {
    console.log("Creating subscribers and contact_messages tables on PostgreSQL...");
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Subscribers table created or verified.");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Contact messages table created or verified.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
