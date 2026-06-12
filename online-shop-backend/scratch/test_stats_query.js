const pool = require('../db');

async function test() {
  try {
    console.log("Testing stats query...");
    const [orders] = await pool.promise().query('SELECT COUNT(*) as count FROM orders');
    console.log("Orders count:", orders);

    const [revenue] = await pool.promise().query("SELECT SUM(total) as total FROM orders WHERE status IN ('paid', 'processing', 'completed', 'shipped')");
    console.log("Total revenue:", revenue);

    console.log("Testing monthlyThis query...");
    const [monthlyThis] = await pool.promise().query(
      "SELECT SUM(total) as total FROM orders WHERE status IN ('paid', 'processing', 'completed', 'shipped') AND \"createdAt\" >= DATE_TRUNC('month', NOW())"
    );
    console.log("monthlyThis:", monthlyThis);

    console.log("Testing monthlyLast query...");
    const [monthlyLast] = await pool.promise().query(
      "SELECT SUM(total) as total FROM orders WHERE status IN ('paid', 'processing', 'completed', 'shipped') AND \"createdAt\" >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') AND \"createdAt\" < DATE_TRUNC('month', NOW())"
    );
    console.log("monthlyLast:", monthlyLast);

    console.log("All queries executed successfully!");
  } catch (err) {
    console.error("Query failed with error:", err);
  } finally {
    process.exit(0);
  }
}

test();
