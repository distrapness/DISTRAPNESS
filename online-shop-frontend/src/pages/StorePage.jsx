import React from "react";

const StorePage = () => (
  <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col justify-center items-center px-4 py-12 w-full">
    <div className="w-full max-w-5xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-gray-100 mb-8 text-center w-full">Toko Kami</h1>
      <p className="text-gray-700 dark:text-gray-200 mb-4 text-center w-full transition-colors duration-[900ms] ease-in-out">Kunjungi toko fisik kami di alamat berikut untuk pengalaman belanja langsung dan layanan terbaik dari tim kami.</p>
      <div className="mb-4 text-center w-full">
        <strong>Alamat:</strong> Jl. Raya Pajajaran, Bogor, Jawa Barat 16143
      </div>
      <div className="mb-4 text-center w-full">
        <strong>Jam Operasional:</strong>
        <div>Senin - Sabtu: 09.00 - 18.00 WIB</div>
        <div>Minggu & Libur Nasional: Tutup</div>
      </div>
      <div className="mb-4 text-center w-full">
        <strong>Telepon:</strong> <a href="tel:02112345678" className="text-black hover:underline">021-12345678</a>
      </div>
      <iframe
        title="Lokasi Toko"
        src="https://www.google.com/maps?q=-6.632422,106.689713&z=18&output=embed"
        width="100%"
        height="300"
        className="rounded border"
        allowFullScreen=""
        loading="lazy"
      ></iframe>
    </div>
  </div>
);

export default StorePage;
