const pool = require('../db');

async function check() {
  try {
    console.log("Checking Supabase tables via db.js adapter...");
    const [tables] = await pool.promise().query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`
    );
    
    console.log("\nFound tables:");
    console.log(tables);

    for (const t of tables) {
      const tableName = t.table_name;
      const [countResult] = await pool.promise().query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      const count = countResult[0]?.count || countResult[0]?.COUNT || 0;
      console.log(`- Table: ${tableName} | Rows: ${count}`);

      const [cols] = await pool.promise().query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ?`,
        [tableName]
      );
      console.log("  Columns:", cols.map(c => `${c.column_name} (${c.data_type})`).join(', '));
    }
  } catch (err) {
    console.error("Database connection/audit failed:", err);
  } finally {
    process.exit();
  }
}

check();
