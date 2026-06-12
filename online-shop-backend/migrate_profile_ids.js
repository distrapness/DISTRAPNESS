const pool = require('./db');

async function migrate() {
  const connection = await pool.promise().getConnection();
  try {
    console.log('Starting migration to add profile ID columns...');
    const columns = [
      { name: 'province_id', type: 'VARCHAR(50)' },
      { name: 'city_id', type: 'VARCHAR(50)' },
      { name: 'district_id', type: 'VARCHAR(50)' },
      { name: 'area_id', type: 'VARCHAR(50)' }
    ];

    for (const col of columns) {
      try {
        await connection.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Added column: ${col.name}`);
      } catch (err) {
        console.log(`Column ${col.name} already exists or error:`, err.message);
      }
    }
    console.log('Profile ID columns migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    connection.release();
    process.exit();
  }
}

migrate();
