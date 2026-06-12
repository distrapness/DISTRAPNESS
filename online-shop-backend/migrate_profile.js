const pool = require('./db');

async function migrate() {
  const connection = await pool.promise().getConnection();
  try {
    console.log('Starting profile columns migration...');
    const columns = [
      { name: 'first_name', type: 'VARCHAR(100)' },
      { name: 'last_name', type: 'VARCHAR(100)' },
      { name: 'phone', type: 'VARCHAR(20)' },
      { name: 'address', type: 'TEXT' },
      { name: 'province', type: 'VARCHAR(100)' },
      { name: 'city', type: 'VARCHAR(100)' },
      { name: 'district', type: 'VARCHAR(100)' },
      { name: 'area', type: 'VARCHAR(100)' },
      { name: 'postal_code', type: 'VARCHAR(20)' }
    ];

    for (const col of columns) {
      try {
        await connection.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Added column: ${col.name}`);
      } catch (err) {
        console.log(`Column ${col.name} already exists or error:`, err.message);
      }
    }
    console.log('Profile columns migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    connection.release();
    process.exit();
  }
}

migrate();
