const pool = require('../db');

async function check() {
  try {
    const [users] = await pool.promise().query(
      'SELECT id, email, role, password FROM users'
    );
    console.log("Users in DB:");
    users.forEach(u => {
      console.log(`ID: ${u.id} | Email: "${u.email}" | Role: ${u.role} | Password Hash: ${u.password ? u.password.substring(0, 10) + '...' : 'NULL'}`);
    });
  } catch (err) {
    console.error("Error checking users:", err);
  } finally {
    process.exit(0);
  }
}

check();
