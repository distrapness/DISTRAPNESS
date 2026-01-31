import React, { useEffect, useState } from "react";
import BackButton from "../components/BackButton.jsx";

import config from '../config.js';

const PaymentMethodList = ({ onSelect }) => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch(`${config.API_URL}/api/midtrans/methods`)
      .then(res => {
        if (!res.ok) throw new Error("Gagal mengambil metode pembayaran");
        return res.json();
      })
      .then(data => {
        setMethods(data);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const c = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(c);
    setTotal(c.reduce((sum, item) => sum + item.price * item.qty, 0));
  }, []);

  const handleClick = async (method) => {
    // Buat order/token ke backend untuk semua metode
    // (hanya contoh, bisa diubah sesuai kebutuhan order)
    const orderId = Math.floor(Math.random() * 1000000);
    try {
      const res = await fetch("http://localhost:5001/api/midtrans/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          total,
          email: "guest@mail.com",
          paymentMethod: method
        })
      });
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error(data.error || "Gagal membuat pembayaran");
      // Simpan data pembayaran ke localStorage/session jika perlu
      localStorage.setItem('selectedPaymentMethod', method);
      localStorage.setItem('midtransToken', data.token);
      localStorage.setItem('midtransOrderId', orderId);
      // Redirect ke halaman konfirmasi
      window.location.href = '/payment/confirm';
    } catch (e) {
      alert(e.message || "Gagal membuat pembayaran");
    }
  };

  if (loading) return <div className="text-center py-6">Memuat metode pembayaran...</div>;
  if (error) return <div className="text-center text-red-500 py-6">{error}</div>;

  return (
    <div className="w-full flex flex-col items-center gap-4 mt-8">
      {methods.map((m, idx) => (
        <button
          key={m.value}
          className={`w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-4 text-lg font-semibold transition flex items-center gap-4 justify-center hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-600 ${idx === 1 ? 'scale-105 border-blue-500 ring-2 ring-blue-300 font-bold' : ''}`}
          style={{ minHeight: 56 }}
          onClick={() => handleClick(m.value)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
};

const PaymentDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 md:pt-24 px-4 transition-colors duration-[900ms] ease-in-out flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between mb-6">
          <BackButton to="/" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-700 dark:text-blue-300">Pilih Metode Pembayaran</h2>
        <PaymentMethodList />
      </div>
    </div>
  );
};

export default PaymentDashboard;
