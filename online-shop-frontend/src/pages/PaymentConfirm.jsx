import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton.jsx";

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
    // Ambil data pembayaran dari localStorage
    const token = localStorage.getItem("midtransToken");
    const order_id = localStorage.getItem("midtransOrderId");
    // Untuk demo dummy, request ulang ke backend agar dapat data lengkap (VA, QR, dsb)
    if (!method || !order_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("http://localhost:5001/api/midtrans/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order_id.replace("ORDER-", "").split("-")[0],
        total: localStorage.getItem("cart") ? JSON.parse(localStorage.getItem("cart")).reduce((sum, item) => sum + item.price * item.qty, 0) : 0,
        email: "guest@mail.com",
        paymentMethod: method
      })
    })
      .then(res => res.json())
      .then(data => {
        setPaymentData(data);
        setError("");
      })
      .catch(() => setError("Gagal mengambil data pembayaran"))
      .finally(() => setLoading(false));
  }, [method]);

  const handleNext = () => {
    navigate("/payment-success");
  };

  if (!method) {
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
        <div className="mb-6">
          <span className="block text-gray-600 dark:text-gray-300 mb-2">Anda memilih metode:</span>
          <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-semibold px-4 py-2 rounded text-lg mb-2">
            {paymentLabels[method] || method}
          </span>
        </div>
        {loading ? (
          <div className="mb-6 text-blue-600">Memuat detail pembayaran...</div>
        ) : error ? (
          <div className="mb-6 text-red-500">{error}</div>
        ) : paymentData && (
          <div className="mb-6">
            {/* VA BCA */}
            {method === "bca_va" && (
              <>
                <div className="font-semibold mb-2">Nomor Virtual Account BCA:</div>
                <div className="text-2xl font-mono bg-gray-100 dark:bg-gray-900 text-blue-700 dark:text-blue-200 rounded p-3 select-all tracking-widest mb-2">
                  {paymentData.va_number}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Total: <span className="font-bold">Rp {paymentData.total?.toLocaleString('id-ID')}</span></div>
              </>
            )}
            {/* QRIS */}
            {method === "qris" && (
              <>
                <div className="font-semibold mb-2">Kode QRIS Pembayaran:</div>
                <div className="mb-2"><img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DUMMY-QR-STRING-123456" alt="QRIS Dummy" className="mx-auto" /></div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Total: <span className="font-bold">Rp {paymentData.total?.toLocaleString('id-ID')}</span></div>
                <div className="text-xs text-gray-400">Ini QR dummy, gunakan QR asli jika integrasi Midtrans</div>
              </>
            )}
            {/* Mandiri Transfer */}
            {method === "mandiri_tf" && (
              <>
                <div className="font-semibold mb-2">Transfer ke Rekening Mandiri:</div>
                <div className="text-2xl font-mono bg-gray-100 dark:bg-gray-900 text-blue-700 dark:text-blue-200 rounded p-3 select-all tracking-widest mb-2">
                  {paymentData.account_number}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Total: <span className="font-bold">Rp {paymentData.total?.toLocaleString('id-ID')}</span></div>
              </>
            )}
            {/* COD */}
            {method === "cod" && (
              <>
                <div className="font-semibold mb-2">Bayar di Tempat (COD)</div>
                <div className="text-gray-600 dark:text-gray-300 mb-2">Silakan siapkan uang tunai sebesar <span className="font-bold">Rp {paymentData.total?.toLocaleString('id-ID')}</span> untuk pembayaran ke kurir saat barang diterima.</div>
              </>
            )}
          </div>
        )}
        <button
          className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-2 rounded font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition shadow"
          onClick={handleNext}
          disabled={loading || error}
        >
          Lanjutkan
        </button>
      </div>
    </div>
  );
};

export default PaymentConfirm;
