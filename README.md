# Online Shop Fullstack (React + Tailwind + Node.js + MySQL)

## Struktur Project

- `/online-shop-frontend` : Frontend React + Tailwind CSS
- `/online-shop-backend`  : Backend Node.js + Express + MySQL

---

## Setup Frontend

1. Masuk ke folder frontend:
   ```bash
   cd online-shop-frontend
   ```
2. Jalankan:
   ```bash
   npm install
   npm start
   ```
3. Akses di browser: [http://localhost:3000](http://localhost:3000)

---

## Setup Backend

1. Pastikan XAMPP aktif, jalankan MySQL.
2. Masuk ke folder backend:
   ```bash
   cd online-shop-backend
   ```
3. Jalankan:
   ```bash
   npm install
   node server.js
   ```
4. Endpoint API produk dapat diakses di: [http://localhost:5000/api/products](http://localhost:5000/api/products)

---

## Setup Database (MySQL)

1. Buka phpMyAdmin (biasanya di [http://localhost/phpmyadmin](http://localhost/phpmyadmin))
2. Buat database baru dengan nama: `online_shop`
3. Buat tabel `products` dengan contoh struktur:
   ```sql
   CREATE TABLE products (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(255),
     price DECIMAL(12,2),
     image VARCHAR(255),
     description TEXT
   );
   ```
4. Tambahkan beberapa data dummy produk untuk testing.

---

## Integrasi Frontend & Backend

- Frontend dapat mengambil data produk dari backend dengan fetch/axios ke endpoint `/api/products`.
- Pastikan backend berjalan sebelum frontend melakukan request.

---

## Catatan
- Untuk pengembangan lebih lanjut, tambahkan fitur autentikasi, keranjang, checkout, dsb sesuai kebutuhan.
- Pastikan environment variable di backend (`.env`) sesuai dengan konfigurasi MySQL lokal Anda.
