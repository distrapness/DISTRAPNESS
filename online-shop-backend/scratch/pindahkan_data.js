const mysql = require('mysql2/promise');
const { Pool } = require('pg');
require('dotenv').config();

// KREDENSIAL DATABASE LAMA (TiDB)
const oldDbConfig = {
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  user: '3uVhEc1JR3fKTFA.root',
  password: 'dB7rdFcNcvDH5yXe',
  database: 'test',
  port: 4000,
  ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
};

// KREDENSIAL DATABASE BARU (Supabase dari .env)
const newDb = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('🚀 Memulai migrasi data dari TiDB ke Supabase...');
  let oldDb;
  
  try {
    oldDb = await mysql.createConnection(oldDbConfig);
    console.log('✅ Terhubung ke Database LAMA (TiDB)');

    // 1. PINDAHKAN USERS
    console.log('--- Memindahkan Users... ---');
    const [users] = await oldDb.query('SELECT * FROM users');
    for (const u of users) {
      await newDb.query(
        'INSERT INTO users (email, password, role, referral_code, referrals_count, points, balance) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (email) DO NOTHING',
        [u.email, u.password, u.role, u.referral_code, u.referrals_count, u.points, u.balance]
      );
    }
    console.log(`✅ ${users.length} Users berhasil dipindah.`);

    // 2. PINDAHKAN CATEGORIES
    console.log('--- Memindahkan Kategori... ---');
    const [categories] = await oldDb.query('SELECT * FROM categories');
    for (const c of categories) {
      await newDb.query(
        'INSERT INTO categories (name, slug, image) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING',
        [c.name, c.slug, c.image]
      );
    }

    // 3. PINDAHKAN PRODUCTS
    console.log('--- Memindahkan Produk... ---');
    const [products] = await oldDb.query('SELECT * FROM products');
    for (const p of products) {
      // Pastikan images dalam format string JSON
      const images = typeof p.images === 'string' ? p.images : JSON.stringify(p.images);
      await newDb.query(
        'INSERT INTO products (id, name, price, description, images, stock, category, sizes, weight) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name',
        [p.id, p.name, p.price, p.description, images, p.stock, p.category, p.sizes, p.weight]
      );
    }
    console.log(`✅ ${products.length} Produk berhasil dipindah.`);

    // 4. PINDAHKAN BANNERS
    console.log('--- Memindahkan Banner... ---');
    const [banners] = await oldDb.query('SELECT * FROM banners');
    for (const b of banners) {
      await newDb.query(
        'INSERT INTO banners (id, image, original_image, sort_order) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
        [b.id, b.image, b.original_image, b.sort_order]
      );
    }

    // 5. PINDAHKAN SETTINGS
    console.log('--- Memindahkan Pengaturan... ---');
    const [settings] = await oldDb.query('SELECT * FROM settings');
    for (const s of settings) {
      await newDb.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO NOTHING',
        [s.setting_key, s.setting_value]
      );
    }

    console.log('\n✨ SEMUA DATA BERHASIL DIPINDAHKAN KE SUPABASE!');
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat migrasi:', error.message);
  } finally {
    if (oldDb) await oldDb.end();
    await newDb.end();
  }
}

migrate();
