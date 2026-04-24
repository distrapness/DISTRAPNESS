import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import config from '../config.js';
import { getImageUrl } from "../utils/imageHelper";

const PaymentConfirm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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

        let items = data.items;
        if (typeof items === 'string') {
          try { items = JSON.parse(items); } catch (e) { }
        }

        if (!items || items.length === 0) {
          items = JSON.parse(localStorage.getItem("cart") || "[]");
        }

        setPaymentData({
          ...data,
          items: items,
          total: parseFloat(data.total)
        });
        setError("");
      })
      .catch((err) => setError(err.message || "Gagal mengambil data pesanan"))
      .finally(() => setLoading(false));

    // Load Midtrans script
    fetch(`${config.API_URL}/api/midtrans/config`)
      .then(res => res.json())
      .then(data => {
        const scriptUrl = data.isProduction ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js';
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
  const method = paymentData?.paymentMethod;

  const handlePayment = async () => {
    if (!method) return;
    if (method === "cod") {
      navigate("/payment-success");
      return;
    }

    try {
      setProcessing(true);
      const res = await fetch(`${config.API_URL}/api/midtrans/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: paymentData.id,
          total: paymentData.total,
          email: paymentData.email || "customer@mail.com"
        })
      });
      const data = await res.json();
      if (!data.token) throw new Error(data.detail || "Gagal mendapatkan token pembayaran");

      window.snap.pay(data.token, {
        onSuccess: () => navigate("/payment-success"),
        onPending: () => { alert("Menunggu pembayaran..."); navigate("/"); },
        onError: () => alert("Pembayaran gagal!"),
        onClose: () => alert("Pembayaran dibatalkan")
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUploadProof = async () => {
    if (!proofFile) { alert("Pilih foto bukti transfer"); return; }
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
        alert("Bukti terkirim! Admin akan memverifikasi.");
        navigate("/payment-success");
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-12 transition-colors duration-700">
      <div className="max-w-xl mx-auto px-6">
        <div className="bg-white dark:bg-gray-900 p-10 md:p-14 rounded-[40px] shadow-2xl border border-gray-100 dark:border-gray-800 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 dark:bg-black/20 rounded-full -mr-16 -mt-16"></div>
          
          <div className="relative z-10">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                 <div className="w-10 h-10 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Fetching details...</p>
              </div>
            ) : error ? (
              <div className="py-20 text-center">
                 <p className="text-red-500 font-bold mb-4">{error}</p>
                 <button onClick={() => navigate("/")} className="px-6 py-2 bg-black text-white rounded-lg text-xs uppercase font-bold">Back to Home</button>
              </div>
            ) : paymentData && (
              <div className="w-full text-left">
                {/* Header Status */}
                <div className="flex flex-col items-center mb-10">
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-4 block italic">Order Status</span>
                   <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                      paymentData.status === 'paid' ? 'bg-green-100 text-green-700' :
                      paymentData.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                      paymentData.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700 animate-pulse'
                    }`}>
                      {paymentData.status === 'paid' ? '✔ Paid' : 
                       paymentData.status === 'shipped' ? '🚚 Shipped' :
                       paymentData.status === 'cancelled' ? '✘ Cancelled' :
                       '⌛ Waiting for Payment'}
                   </div>
                </div>

                {/* Delivery Info */}
                {paymentData.status === 'shipped' && (
                   <div className="mb-10 bg-black text-white p-8 rounded-3xl">
                      <p className="text-[9px] font-bold uppercase opacity-50 mb-2">Tracking Number</p>
                      <p className="text-xl font-mono font-black tracking-widest">{paymentData.tracking_number || "PENDING"}</p>
                   </div>
                )}

                {/* Order Summary */}
                <div className="mb-10 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 bg-gray-50/30 dark:bg-gray-800/20">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 border-b pb-2">Your Order</h3>
                  <div className="space-y-4">
                    {paymentData.items?.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-center">
                        <img src={getImageUrl(item?.image || item?.images?.[0])} className="w-12 h-12 rounded-lg object-cover" alt="item" />
                        <div className="flex-1">
                           <p className="font-bold text-xs uppercase dark:text-white">{item.name}</p>
                           <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Qty: {item.qty}</p>
                        </div>
                        <div className="font-black text-sm dark:text-white">Rp {(item.price * item.qty).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-4 border-t border-dashed flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase text-gray-400">Grand Total</span>
                    <span className="text-2xl font-black dark:text-white">Rp {paymentData.total?.toLocaleString()}</span>
                  </div>
                </div>

                {paymentData.status === 'pending' ? (
                  <div className="space-y-6">
                    {method === 'mandiri_tf' ? (
                      <div className="space-y-6">
                        <div className="bg-black text-white p-8 rounded-3xl text-center">
                          <p className="text-xs uppercase font-bold mb-2 opacity-50">Transfer Bank Mandiri</p>
                          <p className="text-xl font-mono font-black select-all">123-456-7890</p>
                          <p className="text-[9px] opacity-30 mt-2 font-bold uppercase">a.n. Distrapness Indonesia</p>
                        </div>
                        <div className="p-6 border border-gray-100 dark:border-gray-800 rounded-3xl">
                           <input type="file" onChange={e => setProofFile(e.target.files[0])} className="w-full text-xs mb-4" />
                           <button onClick={handleUploadProof} disabled={uploading} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest">{uploading ? 'Processing' : 'Submit Proof'}</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={handlePayment} disabled={processing} className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-xl">{processing ? 'Processing' : 'Pay Now'}</button>
                    )}
                  </div>
                ) : (
                  <button onClick={() => navigate('/shop')} className="w-full bg-gray-100 dark:bg-gray-800 dark:text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px]">Continue Shopping</button>
                )}
              </div>
            )}
            
            <div className="mt-12 text-[9px] font-bold uppercase text-gray-300 tracking-[0.2em]">SSL Encrypted Transaction</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirm;
