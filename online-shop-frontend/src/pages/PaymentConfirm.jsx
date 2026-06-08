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

  const [snapToken, setSnapToken] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const fetchSnapToken = async (order) => {
    try {
      setTokenLoading(true);
      setTokenError("");
      
      const email = (order.shipping_address && order.shipping_address.email) || order.email || "customer@mail.com";
      
      const res = await fetch(`${config.API_URL}/api/midtrans/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          total: order.total,
          email: email
        })
      });
      const data = await res.json();
      if (!data.token) throw new Error(data.detail || "Gagal mendapatkan token pembayaran");
      
      setSnapToken(data.token);
    } catch (err) {
      console.error("Token prefetch error:", err);
      setTokenError(err.message || "Gagal membuat token pembayaran");
    } finally {
      setTokenLoading(false);
    }
  };

  useEffect(() => {
    const isTemp = searchParams.get("temp") === "true";
    if (isTemp) {
      const tempStr = localStorage.getItem('tempCodOrder');
      if (tempStr) {
        try {
          const tempData = JSON.parse(tempStr);
          // Normalize address field
          tempData.shippingAddress = tempData.shippingAddress || tempData.shipping_address;
          tempData.shipping_address = tempData.shippingAddress;
          setPaymentData(tempData);
          setError("");
          setLoading(false);
          return;
        } catch(e){}
      }
    }

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

        const parsedOrder = {
          ...data,
          items: items,
          total: parseFloat(data.total),
          // Normalize address field
          shippingAddress: data.shipping_address || data.shippingAddress,
          shipping_address: data.shipping_address || data.shippingAddress
        };

        setPaymentData(parsedOrder);
        setError("");

        // Prefetch token immediately if it uses Midtrans
        const method = parsedOrder.paymentMethod;
        if (method && method !== "cod" && method !== "mandiri_tf") {
          fetchSnapToken(parsedOrder);
        }
      })
      .catch((err) => setError(err.message || "Gagal mengambil data pesanan"))
      .finally(() => setLoading(false));

    // Load Midtrans script
    fetch(`${config.API_URL}/api/midtrans/config`)
      .then(res => res.json())
      .then(data => {
        const scriptUrl = data.isProduction ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js';
        
        if (window.snap) {
          setScriptLoaded(true);
          return;
        }

        const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
        if (existingScript) {
          setScriptLoaded(true);
        } else {
          const script = document.createElement('script');
          script.src = scriptUrl;
          script.setAttribute('data-client-key', data.clientKey);
          script.async = true;
          script.onload = () => setScriptLoaded(true);
          script.onerror = () => {
            console.error("Gagal memuat script Midtrans");
            setTokenError("Gagal memuat library Midtrans. Pastikan Adblocker Anda mati.");
          };
          document.body.appendChild(script);
        }
      })
      .catch(console.error);

  }, [searchParams]);

  const [processing, setProcessing] = useState(false);
  const method = paymentData?.paymentMethod;

  const handlePayment = async () => {
    if (!method) return;

    try {
      setProcessing(true);

      if (method === "cod") {
        const isTemp = searchParams.get("temp") === "true";
        if (isTemp) {
          // 1. Create order in database first
          const createRes = await fetch(`${config.API_URL}/api/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: paymentData.userId || "guest",
              email: paymentData.email || "guest@mail.com",
              items: paymentData.items,
              total: paymentData.total,
              paymentMethod: "cod",
              status: "pending",
              shippingAddress: paymentData.shippingAddress,
              couponCode: paymentData.couponCode,
              discountAmount: paymentData.discountAmount,
              referralCode: paymentData.referralCode
            })
          });
          const createData = await createRes.json();
          if (!createRes.ok) throw new Error(createData.error || "Gagal membuat pesanan COD");

          const realOrderId = createData.orderId;

          // 2. Confirm COD order (sends email & changes status to processing)
          const confirmRes = await fetch(`${config.API_URL}/api/orders/${realOrderId}/confirm-cod`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
          });
          const confirmData = await confirmRes.json();
          if (!confirmRes.ok) throw new Error(confirmData.error || "Gagal mengonfirmasi pesanan COD");

          // Save success metadata for Success page
          localStorage.setItem('lastOrderId', realOrderId);
          localStorage.setItem('cartTotal', paymentData.total);
          localStorage.setItem('lastOrderItems', JSON.stringify(paymentData.items));
          localStorage.setItem('lastOrderEmail', paymentData.email || "guest@mail.com");

          // 3. Clear cart & temp files
          localStorage.removeItem('cart');
          localStorage.removeItem('tempCodOrder');
          localStorage.removeItem('referral_code');
          localStorage.removeItem('appliedCoupon');
          localStorage.removeItem('discountAmount');

          navigate("/payment-success");
          return;
        } else {
          // Existing order confirm COD
          const res = await fetch(`${config.API_URL}/api/orders/${paymentData.id}/confirm-cod`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Gagal mengonfirmasi pesanan COD");
          navigate("/payment-success");
          return;
        }
      }

      if (!window.snap) {
        throw new Error("Sistem pembayaran Midtrans sedang disiapkan atau diblokir oleh ekstensi browser (seperti Adblocker). Silakan refresh halaman dan coba beberapa detik lagi.");
      }

      if (!snapToken) {
        if (tokenError) throw new Error(tokenError);
        throw new Error("Token pembayaran belum siap. Silakan tunggu beberapa detik.");
      }

      window.snap.pay(snapToken, {
        onSuccess: () => navigate("/payment-success"),
        onPending: () => { alert("Menunggu pembayaran..."); navigate("/"); },
        onError: () => alert("Pembayaran gagal!"),
        onClose: () => alert("Pembayaran dibatalkan")
      });
    } catch (err) {
      console.error("Payment Error:", err);
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleGoBack = () => {
    const isTemp = searchParams.get("temp") === "true";
    if (isTemp) {
      navigate('/payment');
      return;
    }
    const lastItems = localStorage.getItem('lastOrderItems');
    if (lastItems) {
      localStorage.setItem('cart', lastItems);
    }
    navigate('/payment');
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
                      paymentData.status === 'processing' ? 'bg-teal-100 text-teal-700' :
                      'bg-yellow-100 text-yellow-700 animate-pulse'
                    }`}>
                      {paymentData.status === 'paid' ? '✔ Paid' : 
                       paymentData.status === 'shipped' ? '🚚 Shipped' :
                       paymentData.status === 'cancelled' ? '✘ Cancelled' :
                       paymentData.status === 'processing' ? '⚙ Processing' :
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

                {/* Invoice / Receipt Details */}
                <div className="mb-6 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 bg-gray-50/30 dark:bg-gray-800/20 space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b pb-2">Rincian Nota & Pengiriman</h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">No. Invoice / ID</span>
                      <span className="font-bold font-mono text-gray-800 dark:text-gray-200">
                        {paymentData.id === 'temp' ? 'DRAFT_COD' : `#${paymentData.id}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Tanggal</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {paymentData.createdAt ? new Date(paymentData.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : new Date().toLocaleDateString('id-ID', {
                          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Metode Pembayaran</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200 uppercase text-[10px]">
                        {paymentData.paymentMethod === 'cod' ? 'COD (Bayar di Tempat)' :
                         paymentData.paymentMethod === 'mandiri_tf' ? 'Transfer Bank Mandiri' : 'Midtrans (QRIS/VA/E-Wallet)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Metode Pengiriman</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200 uppercase text-[10px]">
                        {paymentData.shippingAddress?.courierInfo || 'Manual / Standard'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 pt-4 text-xs">
                    <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-wider mb-2">Alamat Pengiriman</span>
                    <div className="bg-white/50 dark:bg-black/10 p-3 rounded-2xl border border-gray-50 dark:border-gray-800/50">
                      <p className="font-bold text-gray-950 dark:text-white mb-0.5">
                        {paymentData.shippingAddress?.firstName} {paymentData.shippingAddress?.lastName || ''}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-[10px] mb-2 font-mono">
                        📞 {paymentData.shippingAddress?.phone}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {paymentData.shippingAddress?.address}, Kel. {paymentData.shippingAddress?.area}, Kec. {paymentData.shippingAddress?.district}, {paymentData.shippingAddress?.city}, {paymentData.shippingAddress?.province} - {paymentData.shippingAddress?.postalCode}
                      </p>
                      {paymentData.shippingAddress?.note && (
                        <div className="mt-3 pt-2 border-t border-dashed border-gray-100 dark:border-gray-800 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                          <span className="font-bold uppercase text-[9px] block mb-1 opacity-70">Catatan:</span>
                          "{paymentData.shippingAddress.note}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>

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
                    {tokenError && (
                      <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-semibold">
                        ⚠️ {tokenError}
                      </div>
                    )}
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
                      <button 
                        onClick={handlePayment} 
                        disabled={
                          processing || 
                          (method !== 'cod' && (!scriptLoaded || tokenLoading || !snapToken))
                        } 
                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all ${
                          processing || (method !== 'cod' && (!scriptLoaded || tokenLoading || !snapToken))
                            ? 'bg-gray-300 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                            : 'bg-black dark:bg-white text-white dark:text-black'
                        }`}
                      >
                        {processing 
                          ? 'Processing' 
                          : method === 'cod' 
                            ? 'Confirm Order' 
                            : !scriptLoaded 
                              ? 'Loading Payment System...' 
                              : tokenLoading 
                                ? 'Generating Payment Token...' 
                                : 'Pay Now'}
                      </button>
                    )}

                    <button 
                      onClick={handleGoBack}
                      className="w-full py-4 border border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all"
                    >
                      ← Kembali & Ubah Pesanan
                    </button>
                  </div>
                ) : (
                  <button onClick={() => navigate('/shop')} className="w-full bg-gray-100 dark:bg-gray-800 dark:text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px]">Continue Shopping</button>
                )}
              </div>
            )}
            
            <div className="mt-12 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-300">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Secure 256-bit SSL Metadata Encryption
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirm;
