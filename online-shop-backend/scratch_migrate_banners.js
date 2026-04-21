const mysql = require('mysql2');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
};

if (process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1') {
    dbConfig.ssl = {
        rejectUnauthorized: false
    };
}

const pool = mysql.createPool(dbConfig);

async function run() {
    const connection = await pool.promise().getConnection();
    try {
        console.log('Adding original_image column to banners table...');
        await connection.query(`ALTER TABLE banners ADD COLUMN original_image LONGTEXT`);
        console.log('Success!');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists.');
        } else {
            console.error('Error:', err);
        }
    } finally {
        connection.release();
        process.exit();
    }
}

run();
