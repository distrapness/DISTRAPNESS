import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BackButton from "../components/BackButton.jsx";
import config from '../config.js';
import { getImageUrl } from "../utils/imageHelper";

const paymentLabels = {
  bca_va: "Virtual Account BCA",
  qris: "QRIS (All Bank)",
  mandiri_tf: "Transfer Bank Mandiri",
  cod: "COD (Bayar di Tempat)"
};

const PaymentConfirm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Priority: URL Param -> LocalStorage
    const orderId = searchParams.get("orderId") || localStorage.getItem("lastOrderId");

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

        // Fallback to localStorage cart if backend doesn't return items (possible if viewing from history but items not strictly in DB structure correctly yet, but we improved GET /user so hopefully GET /:id is fine.
        // Actually GET /:id returns items as JSON string in DB usually.
        // Let's parse items if string.
        let items = data.items;
        if (typeof items === 'string') {
          try { items = JSON.parse(items); } catch (e) { }
        }

        // If items still missing, fallback (only works for immediate checkout flow)
        if (!items || items.length === 0) {
          items = JSON.parse(localStorage.getItem("cart") || "[]");
        }

        setPaymentData({
          ...data,
          items: items,
          // Enrich data
          va_number: '1234 5678 9012',
          account_number: '14000 999 888',
          total: parseFloat(data.total)
        });
        setError("");
      })
      .catch((err) => setError(err.message || "Gagal mengambil data pesanan"))
      .finally(() => setLoading(false));

    // Load Midtrans config
    fetch(`${config.API_URL}/api/midtrans/config`)
      .then(res => res.json())
      .then(data => {
        const scriptUrl = data.isProduction ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js';
        
        // Prevent duplicate script loading
        if (!document.querySelector(`script[src="${scriptUrl}"]`)) {
          const script = document.createElement('script');
          script.src = scriptUrl;
          script.setAttribute('data-client-key', data.clientKey);
          script.async = true;
          document.body.appendChild(script);
        }
      })
      .catch(console.error);

  }, [searchParams]);

  const [processing, setProcessing] = useState(false);
  const method = paymentData?.paymentMethod || localStorage.getItem("selectedPaymentMethod");

  // Midtrans Snap handling
  const handlePayment = async () => {
    if (!method) return;
    if (method === "cod") {
      navigate("/payment-success");
      return;
    }

    try {
      setProcessing(true);
      // Minta token transaksi ke backend (Snap)
      const res = await fetch(`${config.API_URL}/api/midtrans/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: paymentData.id,
          total: paymentData.total,
          email: paymentData.email || "guest@mail.com"
        })
      });
      const data = await res.json();
      if (!data.token) throw new Error("Gagal mendapatkan token pembayaran");

      // Buka Popup Snap
      window.snap.pay(data.token, {
        onSuccess: function (result) {
          navigate("/payment-success");
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
    } finally {
      setProcessing(false);
    }
  };

  // Bukti Transfer Handling
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUploadProof = async () => {
    if (!proofFile) { alert("Pilih foto bukti transfer terlebih dahulu"); return; }
    setUploading(true);

    const formData = new FormData();
    formData.append('paymentProof', proofFile);

    try {
      const res = await fetch(`${config.API_URL}/api/orders/upload-proof/${paymentData.id}`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert("Bukti pembayaran berhasil dikirim! Menunggu verifikasi admin.");
        navigate("/payment-success");
      } else {
        throw new Error(data.error || "Gagal upload");
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  };

  if (!loading && !method) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded shadow text-center">
          <h2 className="text-xl font-bold mb-2 text-red-600">Metode perkiraan tidak ditemukan</h2>
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
    <div className="min-h-screen flex flex-col items-center justify-start pt-4 md:pt-8 pb-12 bg-gray-50 dark:bg-gray-900">
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
          <div className="mb-6 w-full text-left">
            {/* Order Items List */}
            <div className="mb-6 border border-gray-100 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Order Summary</h3>
              <div className="space-y-4 pr-1">
                {paymentData.items && paymentData.items.length > 0 ? (
                  paymentData.items.filter(item => item).map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded-md overflow-hidden shrink-0 border border-gray-200 dark:border-gray-600">
                        <img
                          src={getImageUrl(item?.image || (item?.images && item?.images?.[0]))}
                          alt={item.name}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100?text=No+Img"; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{item.name}</h4>
                        <p className="text-xs text-gray-500">Size: {item.selectedSize || 'M'} | Qty: {item.qty} x Rp {item.price?.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="font-bold text-sm whitespace-nowrap">
                        Rp {(item.price * item.qty).toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">Order details not available.</p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-4 mb-2">
              <span className="text-gray-600 dark:text-gray-300">Total Payment</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                Rp {paymentData.total?.toLocaleString('id-ID')}
              </span>
            </div>

            {method === 'mandiri_tf' ? (
              <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded mb-6 border border-gray-200 dark:border-gray-600 w-full text-center">
                <h3 className="font-bold mb-2 text-gray-900 dark:text-white">Transfer Manual</h3>
                <p className="mb-1 text-gray-600 dark:text-gray-300">Bank Mandiri</p>
                <p className="font-mono text-lg font-bold mb-1 text-black dark:text-white select-all">123-456-7890</p>
                <p className="text-sm text-gray-500 mb-6">a.n. PT Distrapness Indonesia</p>

                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2 text-left text-gray-700 dark:text-gray-300">Upload Bukti Transfer</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setProofFile(e.target.files[0])}
                    className="w-full text-sm text-gray-500 border border-gray-300 rounded cursor-pointer bg-white dark:bg-gray-800 focus:outline-none dark:border-gray-600 dark:placeholder-gray-400"
                  />
                </div>

                <button
                  onClick={handleUploadProof}
                  disabled={uploading}
                  className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? 'Mengupload...' : 'Kirim Bukti Pembayaran'}
                </button>
              </div>
            ) : method === 'cod' ? (
              <>
                <div className="text-gray-600 dark:text-gray-300 mb-6 text-sm text-center">
                  Please prepare cash when the courier arrives.
                </div>
                <button
                  className="w-full bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-sm font-bold uppercase tracking-widest hover:opacity-80 transition-opacity shadow-lg"
                  onClick={handlePayment}
                >
                  Complete Order
                </button>
              </>
            ) : (
              <>
                <div className="text-gray-600 dark:text-gray-300 mb-6 text-sm text-center">
                  Click the button below to complete payment via Midtrans.
                </div>
                <button
                  disabled={processing}
                  className="w-full bg-blue-600 text-white px-8 py-4 rounded-sm font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50"
                  onClick={handlePayment}
                >
                  {processing ? 'MEMPROSES...' : 'PAY NOW'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentConfirm;
