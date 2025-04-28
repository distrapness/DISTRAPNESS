import React from "react";
import { Link } from "react-router-dom";
import BackButton from "../components/BackButton.jsx";

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 md:pt-24 px-4 transition-colors duration-[900ms] ease-in-out">
      <BackButton />
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-black dark:text-gray-100 transition-colors duration-[900ms] ease-in-out ml-10">Dashboard Admin Website</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <Link to="/product-admin" className="block bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg p-6 transition-colors duration-[900ms] ease-in-out border border-gray-200 dark:border-gray-700">
            <div className="font-bold text-lg mb-2 text-black dark:text-gray-100">Kelola Produk</div>
            <div className="text-gray-600 dark:text-gray-300 text-sm">Tambah, edit, dan hapus produk yang tampil di toko online.</div>
          </Link>
          <Link to="/brand-admin" className="block bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg p-6 transition-colors duration-[900ms] ease-in-out border border-gray-200 dark:border-gray-700">
            <div className="font-bold text-lg mb-2 text-black dark:text-gray-100">Kelola Brand & Logo</div>
            <div className="text-gray-600 dark:text-gray-300 text-sm">Edit nama toko dan logo brand yang tampil di header.</div>
          </Link>
          <Link to="/banner-admin" className="block bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg p-6 transition-colors duration-[900ms] ease-in-out border border-gray-200 dark:border-gray-700">
            <div className="font-bold text-lg mb-2 text-black dark:text-gray-100">Kelola Banner Homepage</div>
            <div className="text-gray-600 dark:text-gray-300 text-sm">Tambah, edit, dan hapus banner carousel di halaman utama.</div>
          </Link>
          <Link to="/order-status" className="block bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg p-6 transition-colors duration-[900ms] ease-in-out border border-gray-200 dark:border-gray-700">
            <div className="font-bold text-lg mb-2 text-black dark:text-gray-100">Lihat Status Pesanan</div>
            <div className="text-gray-600 dark:text-gray-300 text-sm">Pantau dan update status pesanan pelanggan.</div>
          </Link>
          <Link to="/payment" className="block bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg p-6 transition-colors duration-[900ms] ease-in-out border border-gray-200 dark:border-gray-700">
            <div className="font-bold text-lg mb-2 text-black dark:text-gray-100">Kelola Pembayaran</div>
            <div className="text-gray-600 dark:text-gray-300 text-sm">Kelola dan cek pembayaran yang masuk.</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
