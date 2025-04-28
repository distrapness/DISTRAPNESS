import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BackButton from "../components/BackButton.jsx";

const paymentOptionLabels = {
  bca_va: "Virtual Account BCA",
  qris: "QRIS (All Bank)",
  mandiri_tf: "Transfer Bank Mandiri",
  cod: "COD (Bayar di Tempat)",
};

const orderId = `INV${Date.now().toString().slice(-6)}`;
const paymentStatus = "Lunas";
const paymentAmount = 225000;

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const paymentMethod = location.state?.paymentMethod || "bca_va";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-emerald-50 pt-20 md:pt-24 px-4 py-10 relative overflow-hidden">
      <div className="flex items-center gap-4 mb-4 w-full max-w-lg">
        <BackButton />
        <h1 className="text-3xl font-bold text-green-700 ml-4">Pembayaran Berhasil</h1>
      </div>
      <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center animate-fadeIn max-w-lg w-full">
        <svg className="w-20 h-20 text-green-500 mb-6 animate-pulse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        <div className="text-lg text-gray-700 mb-6 text-center">Terima kasih sudah berbelanja.<br />Pesanan Anda sedang diproses.</div>
        {/* Detail pembayaran dan order */}
        <div className="w-full bg-gray-50 rounded-lg p-4 mb-6 shadow-inner">
          <div className="flex justify-between py-1 text-sm"><span className="font-semibold">ID Pesanan</span><span>{orderId}</span></div>
          <div className="flex justify-between py-1 text-sm"><span className="font-semibold">Metode</span><span>{paymentOptionLabels[paymentMethod]}</span></div>
          <div className="flex justify-between py-1 text-sm"><span className="font-semibold">Status</span><span className="text-green-600 font-bold">{paymentStatus}</span></div>
          <div className="flex justify-between py-1 text-sm"><span className="font-semibold">Total</span><span className="text-blue-700 font-bold">Rp {paymentAmount.toLocaleString("id-ID")}</span></div>
        </div>
        <button
          onClick={() => navigate("/")}
          className="mt-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold text-lg shadow hover:from-blue-600 hover:to-indigo-700 transition"
        >
          Kembali ke Beranda
        </button>
        <button
          onClick={() => navigate("/order-status")}
          className="mt-4 px-8 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold text-lg shadow hover:from-gray-900 hover:to-gray-700 transition"
        >
          Lihat Status Pesanan
        </button>
      </div>
      {/* Animasi confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-50">
        {[...Array(32)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full bg-gradient-to-br from-pink-400 to-blue-400 animate-confetti`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random()}s`,
              animationDuration: `${1 + Math.random()}s`,
            }}
          />
        ))}
      </div>
      <audio autoPlay src="https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa4b82.mp3" />
      <style>{`
        .animate-fadeIn { animation: fadeIn .5s; }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .animate-confetti { animation: confetti 1.2s ease-out forwards; }
        @keyframes confetti {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(120px) scale(0.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default PaymentSuccess;
