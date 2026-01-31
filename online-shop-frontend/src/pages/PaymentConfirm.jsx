import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton.jsx";
import config from '../config.js';

const paymentLabels = {
  bca_va: "Virtual Account BCA",
  qris: "QRIS (All Bank)",
  mandiri_tf: "Transfer Bank Mandiri",
  cod: "COD (Bayar di Tempat)"
};

const PaymentConfirm = () => {
  const navigate = useNavigate();
  const method = localStorage.getItem("selectedPaymentMethod");
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Ambil order ID dari localStorage (disimpan saat checkout di PaymentDashboard)
    const orderId = localStorage.getItem("lastOrderId");

    if (!orderId) {
      setError("Data pesanan tidak ditemukan");
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${config.API_URL}/api/orders/${orderId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setPaymentData({
          ...data,
          // Perkaya data untuk tampilan (karena DB belum simpan detail pembayaran virtual)
          va_number: '1234 5678 9012',
          account_number: '14000 999 888',
          total: parseFloat(data.total)
        });
        setError("");
      })
      .catch((err) => setError(err.message || "Gagal mengambil data pesanan"))
      .finally(() => setLoading(false));
  }, []);

  // Midtrans Snap handling
  const handlePayment = async () => {
    if (method === "cod") {
      navigate("/payment-success");
      return;
    }

    try {
      // Minta token transaksi ke backend (Snap)
      const res = await fetch(`${config.API_URL}/api/midtrans/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: paymentData.id,
          total: paymentData.total,
          email: "guest@mail.com" // Harusnya ambil dari paymentData atau auth
        })
      });
      const data = await res.json();
      if (!data.token) throw new Error("Gagal mendapatkan token pembayaran");

      // Buka Popup Snap
      window.snap.pay(data.token, {
        onSuccess: function (result) {
          // Update status order jadi paid (optional, lebih aman via webhook)
          fetch(`${config.API_URL}/api/orders/status/${paymentData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'paid' })
          }).then(() => {
            navigate("/payment-success");
          });
        },
        onPending: function (result) {
          alert("Menunggu pembayaran (status pending). Cek email Anda.");
          navigate("/");
        },
        onError: function (result) {
          alert("Pembayaran gagal!");
        },
        onClose: function () {
          alert("Anda menutup popup tanpa menyelesaikan pembayaran");
        }
      });

    } catch (err) {
      alert(err.message);
    }
  };

  if (!method) {
    // ... (kode existing)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded shadow text-center">
          <h2 className="text-xl font-bold mb-2 text-red-600">Metode pembayaran belum dipilih</h2>
          <button
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => navigate("/payment")}
          >
            Pilih Metode Pembayaran
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded shadow text-center max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <BackButton to="/payment" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300">Konfirmasi Pembayaran</h2>

        {loading ? (
          <div className="mb-6 text-blue-600">Memuat detail pesanan...</div>
        ) : error ? (
          <div className="mb-6 text-red-500">{error}</div>
        ) : paymentData && (
          <div className="mb-6">
            <p className="text-lg">Total Pembayaran:</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
              Rp {paymentData.total?.toLocaleString('id-ID')}
            </p>

            {method === 'cod' ? (
              <div className="text-gray-600 dark:text-gray-300 mb-6">
                Silakan siapkan uang tunai saat kurir datang.
              </div>
            ) : (
              <div className="text-gray-600 dark:text-gray-300 mb-6">
                Klik tombol di bawah untuk membayar melalui QRIS, Virtual Account, atau Kartu Kredit (Midtrans).
              </div>
            )}

            <button
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-full font-bold text-xl hover:shadow-lg transition transform hover:scale-105"
              onClick={handlePayment}
            >
              {method === 'cod' ? 'Selesaikan Pesanan' : 'BAYAR SEKARANG'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentConfirm;
