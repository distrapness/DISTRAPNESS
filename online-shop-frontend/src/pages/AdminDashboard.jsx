import React from "react";
import { Link } from "react-router-dom";
import BackButton from "../components/BackButton.jsx";

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 md:pt-24 px-4 transition-colors duration-[900ms] ease-in-out">
      <div className="flex justify-between mb-6">
        <BackButton />
        {/* <LogoutButton /> dihapus */}
      </div>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-black dark:text-gray-100 transition-colors duration-[900ms] ease-in-out text-center">Dashboard Admin Website</h1>
        <div className="w-full flex flex-col items-center mb-8">
          <img src="/assets/admin-illustration.svg" alt="Admin Illustration" className="w-56 mb-4 opacity-80" onError={e => e.target.style.display='none'} />
          <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-xl">
            Selamat datang di Dashboard Admin!<br/>
            Silakan pilih menu di bawah untuk mengelola produk, brand, banner, pesanan, pembayaran, dan fitur live chat pelanggan.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
          <Link to="/product-admin" className="block bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg p-6 transition-colors duration-[900ms] ease-in-out border border-gray-200 dark:border-gray-700 text-center">
            <div className="font-bold text-lg mb-2 text-blue-700 dark:text-blue-200">Kelola Produk</div>
            <div className="text-gray-600 dark:text-gray-300 text-sm">Tambah, edit, dan hapus produk yang tampil di toko online.</div>
          </Link>
          <Link to="/brand-admin" className="block bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg p-6 transition-colors duration-[900ms] ease-in-out border border-gray-200 dark:border-gray-700 text-center">
            <div className="font-bold text-lg mb-2 text-blue-700 dark:text-blue-200">Kelola Brand & Logo</div>
            <div className="text-gray-600 dark:text-gray-300 text-sm">Edit nama toko dan logo brand yang tampil di header.</div>
          </Link>
          <Link to="/banner-admin" className="block bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg p-6 transition-colors duration-[900ms] ease-in-out border border-gray-200 dark:border-gray-700 text-center">
            <div className="font-bold text-lg mb-2 text-blue-700 dark:text-blue-200">Kelola Banner Homepage</div>
            <div className="text-gray-600 dark:text-gray-300 text-sm">Tambah, edit, dan hapus banner carousel di halaman utama.</div>
          </Link>
          <Link to="/order-status" className="block bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg p-6 transition-colors duration-[900ms] ease-in-out border border-gray-200 dark:border-gray-700 text-center">
            <div className="font-bold text-lg mb-2 text-blue-700 dark:text-blue-200">Lihat Status Pesanan</div>
            <div className="text-gray-600 dark:text-gray-300 text-sm">Pantau dan update status pesanan pelanggan.</div>
          </Link>
          <Link to="/admin-chat" className="block bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg p-6 transition-colors duration-[900ms] ease-in-out border border-gray-200 dark:border-gray-700 text-center">
            <div className="font-bold text-lg mb-2 text-blue-700 dark:text-blue-200">Live Chat Admin</div>
            <div className="text-gray-600 dark:text-gray-300 text-sm">Pantau dan balas pesan pelanggan secara real-time.</div>
          </Link>
          <Link to="/admin/payment-dashboard" className="block bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg p-6 transition-colors duration-[900ms] ease-in-out border border-gray-200 dark:border-gray-700 text-center">
            <div className="font-bold text-lg mb-2 text-blue-700 dark:text-blue-200">Dashboard Pembayaran</div>
            <div className="text-gray-600 dark:text-gray-300 text-sm">Pantau dan verifikasi pembayaran order.</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
