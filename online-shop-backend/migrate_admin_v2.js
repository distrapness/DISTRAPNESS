const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Create connection config without SSL
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    // ssl: { rejectUnauthorized: true } // Removed SSL
});

async function migrate() {
    const connection = await pool.promise().getConnection();
    try {
        console.log('Connected to DB (No SSL). Starting migration...');

        // 1. Add role column to users (Check column first)
        try {
            // Try adding. If it exists, MySQL usually errors or warns.
            // For robustness, let's query columns first?
            // Or just run ALTER IGNORE... MySQL syntax varies.
            // Easiest is try-catch.
            await connection.query(`ALTER TABLE users ADD COLUMN role ENUM('admin', 'customer') DEFAULT 'customer'`);
            console.log('Added role column to users');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Role column already exists. Skipping.');
            } else {
                throw err; // Re-throw real errors
            }
        }

        // 2. Create categories table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        image VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('categories table ready.');

        // 3. Create settings table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(255) NOT NULL UNIQUE,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        console.log('settings table ready.');

        // 4. Create default admin
        const adminEmail = 'admin@distrapness.com';
        const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [adminEmail]);

        if (rows.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [adminEmail, hashedPassword, 'admin']);
            console.log(`Created default admin: ${adminEmail} (pass: admin123)`);
        } else {
            await connection.query('UPDATE users SET role = ? WHERE email = ?', ['admin', adminEmail]);
            console.log(`Updated role for ${adminEmail} to admin.`);
        }

        console.log('Migration v2 success.');
    } catch (err) {
        console.error('Migration v2 failed:', err);
    } finally {
        connection.release();
        process.exit();
    }
}

migrate();
