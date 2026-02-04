const pool = require('./db');
const bcrypt = require('bcryptjs');

async function migrate() {
    const connection = await pool.promise().getConnection();
    try {
        console.log('Starting migration...');

        // 1. Add role column to users if not exists
        // We check if column exists first to avoid error, or just try ADD COLUMN and ignore error
        try {
            await connection.query(`ALTER TABLE users ADD COLUMN role ENUM('admin', 'customer') DEFAULT 'customer'`);
            console.log('Added role column to users');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Role column already exists');
            } else {
                throw err;
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
        console.log('Created categories table');

        // 3. Create settings table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(255) NOT NULL UNIQUE,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        console.log('Created settings table');

        // 4. Create default admin if not exists
        const adminEmail = 'admin@distrapness.com';
        const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [adminEmail]);
        if (rows.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [adminEmail, hashedPassword, 'admin']);
            console.log(`Created default admin: ${adminEmail} / admin123`);
        } else {
            // Ensure existing admin has role 'admin'
            await connection.query('UPDATE users SET role = ? WHERE email = ?', ['admin', adminEmail]);
            console.log('Updated existing admin role');
        }

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        connection.release();
        process.exit();
    }
}

migrate();
