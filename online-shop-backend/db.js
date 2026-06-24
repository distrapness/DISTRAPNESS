const pg = require('pg');
const { Pool } = pg;
require('dotenv').config();

// Force pg to parse timestamp without timezone (OID 1114) as UTC instead of local time
pg.types.setTypeParser(1114, function(stringValue) {
  return new Date(stringValue.replace(' ', 'T') + 'Z');
});

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 5000
});

/**
 * JEMBATAN OTOMATIS (MySQL to PostgreSQL Adapter)
 * Menerjemahkan syntax MySQL (?) ke PostgreSQL ($1) secara otomatis.
 */
function convertQuery(sql) {
  let pgSql = sql;

  // 1. Tangani ON DUPLICATE KEY UPDATE khusus untuk tabel settings
  if (pgSql.includes('ON DUPLICATE KEY UPDATE')) {
    pgSql = pgSql.replace(/ON DUPLICATE KEY UPDATE setting_value = VALUES\(setting_value\)/gi, 'ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value');
    pgSql = pgSql.replace(/ON DUPLICATE KEY UPDATE setting_value = \?/gi, 'ON CONFLICT (setting_key) DO UPDATE SET setting_value = ?');
  }

  // 2. Ubah ? menjadi $1, $2, dst (Aman dari tanda tanya di dalam string literal)
  let idx = 1;
  let inString = false;
  let stringChar = '';
  let result = '';
  
  for (let i = 0; i < pgSql.length; i++) {
    const char = pgSql[i];
    
    if (inString) {
      result += char;
      if (char === stringChar) {
        // Cek jika karakter kutip di-escape (contoh: \')
        if (pgSql[i-1] !== '\\') {
          inString = false;
        }
      }
    } else {
      if (char === "'" || char === '"') {
        inString = true;
        stringChar = char;
        result += char;
      } else if (char === '?') {
        result += `$${idx++}`;
      } else {
        result += char;
      }
    }
  }
  pgSql = result;

  // 3. Tambahkan RETURNING id untuk INSERT agar insertId bekerja
  if (/^\s*INSERT\s+INTO/i.test(pgSql) && !/RETURNING/i.test(pgSql)) {
    pgSql += ' RETURNING id';
  }

  // 4. Perbaikan syntax AUTO_INCREMENT & DATETIME untuk PostgreSQL
  pgSql = pgSql.replace(/INT\s+AUTO_INCREMENT/gi, 'SERIAL');
  pgSql = pgSql.replace(/AUTO_INCREMENT/gi, 'SERIAL');
  pgSql = pgSql.replace(/DATETIME/gi, 'TIMESTAMP');
  
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
      if (err) {
        console.error(`[DB ERROR] Query: ${pgSql} | Error: ${err.message}`);
        const friendlyError = process.env.NODE_ENV === 'production'
          ? new Error('Terjadi kesalahan pada sistem basis data internal.')
          : err;
        return callback(friendlyError);
      }
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
          console.error(`[DB PROMISE ERROR] Query: ${pgSql} | Error: ${err.message}`);
          throw process.env.NODE_ENV === 'production'
            ? new Error('Gagal memproses data kueri internal.')
            : err;
        }
      },
      getConnection: async () => {
        const client = await pgPool.connect();
        return {
          query: async (sql, values) => {
            const pgSql = convertQuery(sql);
            const pgValues = values || [];
            try {
              const res = await client.query(pgSql, pgValues);
              return [processResult(sql, res), res.fields];
            } catch (err) {
              console.error(`[DB CONNECTION ERROR] Query: ${pgSql} | Error: ${err.message}`);
              throw process.env.NODE_ENV === 'production'
                ? new Error('Koneksi basis data gagal memproses kueri.')
                : err;
            }
          },
          beginTransaction: async () => {
            await client.query('BEGIN');
          },
          commit: async () => {
            await client.query('COMMIT');
          },
          rollback: async () => {
            await client.query('ROLLBACK');
          },
          release: () => client.release()
        };
      }
    };
  }
};

module.exports = pool;
