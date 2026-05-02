const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS || process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        ssl: {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true
        }
    });

    try {
        const [rows] = await pool.query('SELECT id, email, role FROM users');
        console.log('--- USER LIST ---');
        console.table(rows);
    } catch (err) {
        console.error('Error checking users:', err.message);
    } finally {
        await pool.end();
    }
}

checkUsers();
