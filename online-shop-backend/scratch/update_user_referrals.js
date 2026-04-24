const pool = require('../db');

const addColumns = async () => {
    try {
        console.log('Adding referral columns to users table...');
        
        // Add referral_code
        try {
            await pool.promise().query('ALTER TABLE users ADD COLUMN referral_code VARCHAR(50) DEFAULT NULL');
            console.log('Column referral_code added.');
        } catch (e) { console.log('referral_code might already exist.'); }
        
        // Add index
        try {
            await pool.promise().query('ALTER TABLE users ADD UNIQUE (referral_code)');
            console.log('Unique index added to referral_code.');
        } catch (e) { console.log('Unique index might already exist.'); }

        // Add referrals_count
        try {
            await pool.promise().query('ALTER TABLE users ADD COLUMN referrals_count INT DEFAULT 0');
            console.log('Column referrals_count added.');
        } catch (e) { console.log('referrals_count might already exist.'); }
        
        // Add points
        try {
            await pool.promise().query('ALTER TABLE users ADD COLUMN points INT DEFAULT 0');
            console.log('Column points added.');
        } catch (e) { console.log('points might already exist.'); }
        
        // Generate referral codes for existing users who don't have one
        const [users] = await pool.promise().query('SELECT id, email FROM users WHERE referral_code IS NULL OR referral_code = ""');
        console.log(`Generating codes for ${users.length} users...`);
        
        for (const user of users) {
            const code = user.email.split('@')[0].toUpperCase() + Math.floor(1000 + Math.random() * 9000);
            await pool.promise().query('UPDATE users SET referral_code = ? WHERE id = ?', [code, user.id]);
        }
        
        console.log('User columns updated successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error updating users table:', err.message);
        process.exit(1);
    }
};

addColumns();
