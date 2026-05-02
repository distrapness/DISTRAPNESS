const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function debugAdmin() {
  console.log("Connecting to:", process.env.DB_HOST);
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });
  
  console.log("\n=== USER SCHEMA ===");
  const [schema] = await connection.query("DESCRIBE users");
  console.table(schema);
  
  console.log("\n=== ADMIN USER DATA ===");
  const [rows] = await connection.query("SELECT id, email, role, password FROM users WHERE email = 'admin@distrapness.com'");
  console.log(rows);
  
  if (rows.length === 0) {
    console.log("ERROR: admin@distrapness.com NOT FOUND!");
  } else {
    console.log("Admin exists. Role is:", rows[0].role);
  }
  
  await connection.end();
}

debugAdmin().catch(console.error);
