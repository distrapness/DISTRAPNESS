const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });
  
  const [rows] = await connection.query("DESCRIBE users");
  console.log(JSON.stringify(rows, null, 2));
  
  const [tables] = await connection.query("SHOW TABLES");
  console.log("Tables:", tables);
  
  await connection.end();
}

checkSchema().catch(console.error);
