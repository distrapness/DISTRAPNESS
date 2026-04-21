require('dotenv').config();
const mysql = require('mysql2/promise');

async function setup() {
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  };
  
  if (process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1') {
    dbConfig.ssl = { rejectUnauthorized: false };
  }

  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log("Connected to DB, creating reviews table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        rating INT NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Table 'reviews' created successfully.");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    await connection.end();
  }
}

setup();
