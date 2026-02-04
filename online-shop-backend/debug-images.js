require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    // ssl: { rejectUnauthorized: false } // Commented out to test regular connection
});

async function debugImages() {
    try {
        const [rows] = await pool.promise().query('SELECT id, name, CAST(image AS CHAR) as image, CAST(images AS CHAR) as images FROM products LIMIT 5');
        console.log('--- DEBUG PRODUCTS ---');
        rows.forEach(r => {
            console.log(`ID: ${r.id}, Name: ${r.name}`);
            console.log(`Image (Old): ${r.image}`);
            console.log(`Images (New): ${r.images}`);
            console.log('----------------___');
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugImages();
