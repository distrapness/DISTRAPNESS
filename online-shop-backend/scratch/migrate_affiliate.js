const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

if (process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1') {
  dbConfig.ssl = { rejectUnauthorized: false };
}

async function migrate() {
  const connection = await mysql.createConnection(dbConfig);
  console.log("Connected to database.");

  // Add balance to users
  try {
    await connection.query("ALTER TABLE users ADD COLUMN balance DECIMAL(15, 2) DEFAULT 0.00");
    console.log("Added balance column to users.");
  } catch (e) {
    console.log("Column balance might already exist.");
  }

  // Create withdrawals table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      bank_account TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("Created withdrawals table.");

  await connection.end();
}

migrate().catch(console.error);
