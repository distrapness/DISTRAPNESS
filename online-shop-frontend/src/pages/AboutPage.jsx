import React from "react";

const AboutPage = () => (
  <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col justify-center items-center px-4 py-12 w-full">
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 flex flex-col items-center border-2 border-black dark:border-transparent transition-colors duration-500">
      <h1 className="text-4xl font-extrabold text-black dark:text-gray-100 mb-6 text-center tracking-tight uppercase">Tentang Kami</h1>
      <p className="text-lg text-gray-700 dark:text-gray-200 mb-4 text-center leading-relaxed">DISTRAPNESS adalah toko online yang berdiri sejak 2025 dengan visi memberikan pelayanan terbaik dan pengalaman belanja online yang mudah, aman, serta menyenangkan untuk semua pelanggan di Indonesia.</p>
      <p className="text-base text-gray-600 dark:text-gray-300 text-center leading-relaxed mb-2">Kami menyediakan berbagai produk berkualitas dengan harga terjangkau dan proses transaksi yang transparan. Kepuasan pelanggan adalah prioritas utama kami.</p>
      <p className="text-base text-gray-600 dark:text-gray-300 text-center leading-relaxed">Hubungi kami untuk kerjasama atau pertanyaan lebih lanjut. Terima kasih telah mempercayakan kebutuhan belanja Anda kepada DISTRAPNESS!</p>
    </div>
  </div>
);

export default AboutPage;
