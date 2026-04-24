const pool = require('../db');

const addColumns = async () => {
    try {
        console.log('Adding flash sale columns...');
        await pool.promise().query('ALTER TABLE products ADD COLUMN IF NOT EXISTS is_flash_sale BOOLEAN DEFAULT FALSE');
        await pool.promise().query('ALTER TABLE products ADD COLUMN IF NOT EXISTS flash_sale_price DECIMAL(10, 2) DEFAULT NULL');
        await pool.promise().query('ALTER TABLE products ADD COLUMN IF NOT EXISTS flash_sale_end DATETIME DEFAULT NULL');
        console.log('Columns added successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error adding columns:', err);
        process.exit(1);
    }
};

addColumns();
