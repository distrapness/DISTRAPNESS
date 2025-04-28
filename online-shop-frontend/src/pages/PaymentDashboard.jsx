import React, { useState } from "react";
import { useCart } from "../components/CartContext";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton.jsx";

const paymentOptions = [
  { label: "Virtual Account BCA", value: "bca_va" },
  { label: "QRIS (All Bank)", value: "qris" },
  { label: "Transfer Bank Mandiri", value: "mandiri_tf" },
  { label: "COD (Bayar di Tempat)", value: "cod" },
];

const PaymentDashboard = () => {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(paymentOptions[0].value);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handlePay = () => {
    setShowSuccess(true);
    clearCart();
    setTimeout(() => {
      setShowSuccess(false);
      navigate("/payment-success", { state: { paymentMethod } });
    }, 1800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 to-blue-50 pt-20 md:pt-24 px-4 py-10 relative overflow-hidden">
      {/* Success Animation Overlay */}
      {showSuccess && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-50 animate-fadeIn">
          <div className="bg-white rounded-full p-8 shadow-xl flex flex-col items-center animate-bounceIn">
            <svg className="w-16 h-16 text-green-500 mb-4 animate-pulse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            <div className="text-2xl font-bold text-green-600 mb-2">Pembayaran Berhasil!</div>
            <div className="text-gray-600 text-center">Terima kasih sudah berbelanja.<br />Anda akan diarahkan ke halaman sukses.</div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-4 mb-4 w-full max-w-lg">
        <BackButton />
        <h1 className="text-3xl font-bold text-blue-700 ml-4">Dashboard Payment</h1>
      </div>
      <div className={`bg-white shadow-xl rounded-lg p-8 w-full max-w-lg animate-fadeIn ${showSuccess ? 'opacity-30 pointer-events-none' : ''}`}>
        <h2 className="text-lg font-semibold mb-4">Ringkasan Belanja</h2>
        {cart.length === 0 ? (
          <p className="text-gray-500 text-center mb-6">Keranjang kosong.</p>
        ) : (
          <ul className="mb-6 divide-y">
            {cart.map((item) => (
              <li key={item.id} className="flex justify-between py-2">
                <span>{item.name} <span className="text-xs text-gray-400">x{item.qty}</span></span>
                <span>Rp {(item.price * item.qty).toLocaleString("id-ID")}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-between items-center font-bold text-lg mb-6">
          <span>Total</span>
          <span>Rp {total.toLocaleString("id-ID")}</span>
        </div>
        {/* Pilihan metode pembayaran */}
        <div className="mb-6">
          <div className="font-semibold mb-2">Pilih Metode Pembayaran:</div>
          <div className="flex flex-col gap-2">
            {paymentOptions.map((opt) => (
              <label key={opt.value} className={`flex items-center gap-2 p-2 rounded cursor-pointer border transition ${paymentMethod === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={opt.value}
                  checked={paymentMethod === opt.value}
                  onChange={() => setPaymentMethod(opt.value)}
                  className="accent-blue-600"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
        <button
          onClick={handlePay}
          disabled={cart.length === 0 || showSuccess}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold text-lg shadow hover:from-green-600 hover:to-emerald-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2zm-5 4v2m-4-6h8" /></svg>
          Bayar Sekarang
        </button>
      </div>
      {/* Animasi confetti sederhana */}
      {showSuccess && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-50">
          {[...Array(24)].map((_, i) => (
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
      )}
      {/* Animasi CSS untuk fadeIn, bounceIn, confetti */}
      <style>{`
        .animate-fadeIn { animation: fadeIn .5s; }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .animate-bounceIn { animation: bounceIn .8s; }
        @keyframes bounceIn { 0% { transform: scale(0.2);} 60% { transform: scale(1.15);} 80% { transform: scale(0.95);} 100% { transform: scale(1);} }
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

export default PaymentDashboard;
