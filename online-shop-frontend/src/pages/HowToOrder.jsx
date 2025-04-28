import React from "react";

const HowToOrder = () => (
  <div className="max-w-2xl mx-auto py-12 px-4 bg-white dark:bg-gray-900 rounded shadow-md mt-10">
    <h1 className="text-2xl font-bold mb-6 text-center text-blue-600 dark:text-blue-400">Panduan Cara Order di Distrapness</h1>
    <ol className="list-decimal list-inside space-y-5 text-gray-800 dark:text-gray-100 text-lg">
      <li>
        <b>Buka Website Distrapness</b><br />
        Kunjungi website kami dan masuk/daftar akun jika belum.
      </li>
      <li>
        <b>Pilih Produk</b><br />
        Telusuri katalog, klik produk yang diinginkan untuk melihat detail, pilih varian/ukuran jika tersedia.
      </li>
      <li>
        <b>Masukkan ke Keranjang</b><br />
        Klik tombol <span className="font-semibold">Tambah ke Keranjang</span> pada halaman produk.
      </li>
      <li>
        <b>Lihat & Cek Keranjang</b><br />
        Klik ikon keranjang di kanan atas untuk melihat daftar belanjaan Anda. Pastikan jumlah dan produk sudah sesuai.
      </li>
      <li>
        <b>Checkout</b><br />
        Klik tombol <span className="font-semibold">Checkout</span>, kemudian isi data pengiriman secara lengkap dan benar.
      </li>
      <li>
        <b>Pilih Metode Pembayaran</b><br />
        Pilih salah satu metode pembayaran yang tersedia (transfer bank, e-wallet, dll).
      </li>
      <li>
        <b>Lakukan Pembayaran</b><br />
        Transfer sesuai nominal dan instruksi yang diberikan. Jangan lupa konfirmasi jika diperlukan.
      </li>
      <li>
        <b>Tunggu Pesanan Diproses</b><br />
        Setelah pembayaran terverifikasi, pesanan Anda akan segera diproses dan dikirim ke alamat tujuan.
      </li>
      <li>
        <b>Cek Status Pesanan</b><br />
        Anda dapat memantau status pesanan melalui menu <span className="font-semibold">Order History</span> di akun Anda.
      </li>
    </ol>
    <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
      Jika ada pertanyaan atau kendala, silakan hubungi customer service kami melalui kontak yang tersedia di website.
    </div>
  </div>
);

export default HowToOrder;
