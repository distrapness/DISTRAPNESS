/**
 * Cleanup Duplicate Users Script
 * Finds users with case-insensitive duplicate emails,
 * merges their data, and removes duplicates.
 */
const pool = require('../db');

async function cleanup() {
  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    // Find duplicate emails (case-insensitive)
    const [allUsers] = await connection.query('SELECT id, email, role, password FROM users ORDER BY id ASC');

    const emailMap = {}; // lowercase email -> array of user records
    for (const user of allUsers) {
      const key = (user.email || '').trim().toLowerCase();
      if (!emailMap[key]) emailMap[key] = [];
      emailMap[key].push(user);
    }

    let totalMerged = 0;
    let totalDeleted = 0;

    for (const [lowerEmail, users] of Object.entries(emailMap)) {
      if (users.length <= 1) continue; // No duplicates

      console.log(`\n--- Duplikat ditemukan untuk: ${lowerEmail} (${users.length} akun) ---`);
      users.forEach(u => console.log(`  ID: ${u.id} | Email: "${u.email}" | Role: ${u.role}`));

      // Pick primary account: prefer admin > oldest (lowest ID)
      let primary = users.find(u => u.role === 'admin') || users[0];
      const duplicates = users.filter(u => u.id !== primary.id);

      console.log(`  -> Primary: ID ${primary.id} (${primary.email}, role: ${primary.role})`);

      for (const dup of duplicates) {
        console.log(`  -> Merging ID ${dup.id} into ID ${primary.id}...`);

        // Reassign orders
        const [orderResult] = await connection.query(
          'UPDATE orders SET "userId" = $1 WHERE "userId" = $2',
          [primary.id, dup.id]
        );
        console.log(`     Orders reassigned: ${orderResult.affectedRows || 0}`);

        // Reassign withdrawals
        try {
          const [wResult] = await connection.query(
            'UPDATE withdrawals SET user_id = $1 WHERE user_id = $2',
            [primary.id, dup.id]
          );
          console.log(`     Withdrawals reassigned: ${wResult.affectedRows || 0}`);
        } catch (e) {
          console.log(`     Withdrawals table skipped: ${e.message}`);
        }

        // Reassign reviews
        try {
          const [rResult] = await connection.query(
            'UPDATE reviews SET user_email = $1 WHERE TRIM(LOWER(user_email)) = $2',
            [primary.email, lowerEmail]
          );
          console.log(`     Reviews reassigned: ${rResult.affectedRows || 0}`);
        } catch (e) {
          console.log(`     Reviews table skipped: ${e.message}`);
        }

        // Delete duplicate user
        await connection.query('DELETE FROM users WHERE id = $1', [dup.id]);
        console.log(`     Deleted user ID ${dup.id}`);
        totalDeleted++;
      }

      // Normalize the primary account email to lowercase
      if (primary.email !== lowerEmail) {
        await connection.query('UPDATE users SET email = $1 WHERE id = $2', [lowerEmail, primary.id]);
        console.log(`  -> Normalized email to: ${lowerEmail}`);
      }

      totalMerged++;
    }

    await connection.commit();

    console.log(`\n========================================`);
    console.log(`Selesai! ${totalMerged} grup duplikat diproses, ${totalDeleted} akun duplikat dihapus.`);
    console.log(`========================================\n`);

  } catch (err) {
    await connection.rollback();
    console.error('Error during cleanup:', err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

cleanup();
