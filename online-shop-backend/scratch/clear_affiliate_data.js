const pool = require('../db');

async function run() {
  const connection = await pool.promise().getConnection();
  try {
    console.log("Purging all affiliate data from database...");
    
    // 1. Delete all withdrawals
    const [delResult] = await connection.query('DELETE FROM withdrawals');
    console.log(`Deleted withdrawals: ${delResult.affectedRows} row(s)`);

    // 2. Reset affiliate fields in users table
    const [updResult] = await connection.query(
      'UPDATE users SET balance = 0.00, points = 0, referrals_count = 0, referral_code = NULL'
    );
    console.log(`Reset users table affiliate stats: ${updResult.affectedRows} row(s)`);

    console.log("Affiliate data cleared successfully!");
  } catch (err) {
    console.error("Purge failed:", err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
