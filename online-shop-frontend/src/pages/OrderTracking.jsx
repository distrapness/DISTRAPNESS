import React from "react";
import BackButton from "../components/BackButton.jsx";

const dummyTracking = {
  orderId: `INV${Date.now().toString().slice(-6)}`,
  status: "Dalam Pengiriman",
  courier: "JNE Express",
  trackingNumber: "JNE1234567890",
  shippedAt: new Date(Date.now() - 86400000).toLocaleString("id-ID"), // kemarin
  estimatedArrival: new Date(Date.now() + 2 * 86400000).toLocaleDateString("id-ID"), // 2 hari lagi
  history: [
    { date: new Date(Date.now() - 86400000).toLocaleString("id-ID"), desc: "Pesanan dikirim oleh penjual" },
    { date: new Date().toLocaleString("id-ID"), desc: "Paket tiba di gudang JNE Jakarta" },
  ],
};

const OrderTracking = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 pt-20 md:pt-24 px-4 py-10 transition-colors duration-[900ms] ease-in-out">
      <div className="bg-white shadow-xl rounded-lg p-8 w-full max-w-lg animate-fadeIn">
        <div className="flex items-center gap-4 mb-4">
          <BackButton />
          <h1 className="text-3xl font-bold text-black dark:text-gray-100 transition-colors duration-[900ms] ease-in-out ml-4">Tracking Pesanan</h1>
        </div>
        <div className="mb-4 flex justify-between text-sm">
          <span className="font-semibold">ID Pesanan</span>
          <span>{dummyTracking.orderId}</span>
        </div>
        <div className="mb-4 flex justify-between text-sm">
          <span className="font-semibold">Kurir</span>
          <span>{dummyTracking.courier}</span>
        </div>
        <div className="mb-4 flex justify-between text-sm">
          <span className="font-semibold">No. Resi</span>
          <span>{dummyTracking.trackingNumber}</span>
        </div>
        <div className="mb-4 flex justify-between text-sm">
          <span className="font-semibold">Status</span>
          <span className="text-black font-bold">{dummyTracking.status}</span>
        </div>
        <div className="mb-4 flex justify-between text-sm">
          <span className="font-semibold">Dikirim</span>
          <span>{dummyTracking.shippedAt}</span>
        </div>
        <div className="mb-4 flex justify-between text-sm">
          <span className="font-semibold">Estimasi Tiba</span>
          <span>{dummyTracking.estimatedArrival}</span>
        </div>
        <div className="mb-4">
          <span className="font-semibold">Riwayat Pengiriman:</span>
          <ul className="list-disc ml-5 mt-2">
            {dummyTracking.history.map((item, idx) => (
              <li key={idx} className="text-sm mb-1">
                <span className="font-mono text-gray-600">{item.date}:</span> <span>{item.desc}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <a href="/order-status" className="w-full text-center bg-gradient-to-r from-gray-700 to-gray-900 text-white py-3 rounded-lg font-semibold text-lg shadow hover:from-gray-900 hover:to-gray-700 transition">Kembali ke Status Pesanan</a>
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

export default OrderTracking;
