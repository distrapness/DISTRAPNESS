const { Pool } = require('pg');
require('dotenv').config();

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * JEMBATAN OTOMATIS (MySQL to PostgreSQL Adapter)
 * Menerjemahkan syntax MySQL (?) ke PostgreSQL ($1) secara otomatis.
 */
function convertQuery(sql) {
  let idx = 1;
  let pgSql = sql;

  // 1. Tangani ON DUPLICATE KEY UPDATE khusus untuk tabel settings
  if (pgSql.includes('ON DUPLICATE KEY UPDATE')) {
    pgSql = pgSql.replace(/ON DUPLICATE KEY UPDATE setting_value = VALUES\(setting_value\)/gi, 'ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value');
    pgSql = pgSql.replace(/ON DUPLICATE KEY UPDATE setting_value = \?/gi, 'ON CONFLICT (setting_key) DO UPDATE SET setting_value = ?');
  }

  // 2. Ubah ? menjadi $1, $2, dst
  pgSql = pgSql.replace(/\?/g, () => `$${idx++}`);

  // 3. Tambahkan RETURNING id untuk INSERT agar insertId bekerja
  if (/^\s*INSERT\s+INTO/i.test(pgSql) && !/RETURNING/i.test(pgSql)) {
    pgSql += ' RETURNING id';
  }

  // 4. Perbaikan syntax LIMIT (MySQL: LIMIT offset, count -> Postgres: LIMIT count OFFSET offset)
  // Catatan: Proyek ini sepertinya hanya menggunakan LIMIT sederhana atau offset sederhana.
  
  return pgSql;
}

function processResult(sql, pgResult) {
  const isSelect = /^\s*SELECT/i.test(sql) || /^\s*SHOW/i.test(sql);
  
  if (isSelect) {
    return pgResult.rows;
  } else {
    const resultObj = {
      affectedRows: pgResult.rowCount,
      insertId: (pgResult.rows && pgResult.rows.length > 0) ? pgResult.rows[0].id : null
    };
    return resultObj;
  }
}

const pool = {
  // Callback style (untuk compatibilitas mysql2 pool.query)
  query: function(sql, values, callback) {
    if (typeof values === 'function') {
      callback = values;
      values = [];
    }

    const pgSql = convertQuery(sql);
    const pgValues = values || [];

    pgPool.query(pgSql, pgValues, (err, res) => {
      if (err) return callback(err);
      callback(null, processResult(sql, res));
    });
  },

  // Promise style (untuk compatibilitas pool.promise().query)
  promise: function() {
    return {
      query: async (sql, values) => {
        const pgSql = convertQuery(sql);
        const pgValues = values || [];
        try {
          const res = await pgPool.query(pgSql, pgValues);
          const processed = processResult(sql, res);
          // MySQL2 promise returns [rows, fields]
          return [processed, res.fields];
        } catch (err) {
          throw err;
        }
      },
      getConnection: async () => {
        const client = await pgPool.connect();
        return {
          query: async (sql, values) => {
            const pgSql = convertQuery(sql);
            const pgValues = values || [];
            const res = await client.query(pgSql, pgValues);
            return [processResult(sql, res), res.fields];
          },
          release: () => client.release()
        };
      }
    };
  }
};

module.exports = pool;
