import React from "react";
import BackButton from "../components/BackButton.jsx";

const dummyOrder = {
  id: `INV${Date.now().toString().slice(-6)}`,
  status: "Sedang Diproses",
  payment: "Lunas",
  method: "Virtual Account BCA",
  total: 225000,
  items: [
    { name: "Kaos Polos", qty: 1, price: 75000 },
    { name: "Celana Jeans", qty: 1, price: 150000 },
  ],
  createdAt: new Date().toLocaleString("id-ID"),
};

const OrderStatus = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50 pt-20 md:pt-24 px-4 py-10 transition-colors duration-[900ms] ease-in-out">
      <div className="bg-white shadow-xl rounded-lg p-8 w-full max-w-lg animate-fadeIn">
        <div className="flex items-center gap-4 mb-4">
          <BackButton />
          <h1 className="text-3xl font-bold text-black dark:text-gray-100 transition-colors duration-[900ms] ease-in-out ml-4">Status Pesanan</h1>
        </div>
        <div className="mb-4 flex justify-between text-sm">
          <span className="font-semibold">ID Pesanan</span>
          <span>{dummyOrder.id}</span>
        </div>
        <div className="mb-4 flex justify-between text-sm">
          <span className="font-semibold">Tanggal</span>
          <span>{dummyOrder.createdAt}</span>
        </div>
        <div className="mb-4 flex justify-between text-sm">
          <span className="font-semibold">Status</span>
          <span className="text-yellow-600 font-bold">{dummyOrder.status}</span>
        </div>
        <div className="mb-4 flex justify-between text-sm">
          <span className="font-semibold">Pembayaran</span>
          <span className="text-green-600 font-bold">{dummyOrder.payment}</span>
        </div>
        <div className="mb-4 flex justify-between text-sm">
          <span className="font-semibold">Metode</span>
          <span>{dummyOrder.method}</span>
        </div>
        <div className="mb-4">
          <span className="font-semibold">Daftar Produk:</span>
          <ul className="list-disc ml-5 mt-2">
            {dummyOrder.items.map((item, idx) => (
              <li key={idx} className="flex justify-between">
                <span>{item.name} <span className="text-xs text-gray-400">x{item.qty}</span></span>
                <span>Rp {(item.price * item.qty).toLocaleString("id-ID")}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-between items-center font-bold text-lg mb-6">
          <span>Total</span>
          <span>Rp {dummyOrder.total.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex flex-col gap-2">
          <a href="/" className="w-full text-center bg-black text-white py-3 rounded-lg font-semibold text-lg shadow hover:bg-gray-900 transition">Kembali ke Beranda</a>
        </div>
      </div>
      <style>{`
        .animate-fadeIn { animation: fadeIn .5s; }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
};

export default OrderStatus;
