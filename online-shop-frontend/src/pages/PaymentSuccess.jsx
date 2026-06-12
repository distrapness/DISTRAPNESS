import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getImageUrl } from "../utils/imageHelper";
import config from "../config.js";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [shippingAddress, setShippingAddress] = useState(null);
  const [brand, setBrand] = useState({ phone: "6285888159265" });

  useEffect(() => {
    // Fetch brand contact details
    fetch(`${config.API_URL}/api/brand`)
      .then(res => res.json())
      .then(data => {
        if (data.phone) setBrand(data);
      })
      .catch(err => console.error("Error fetching brand contact:", err));

    // Retrieve order details from localStorage
    const storedOrderId = localStorage.getItem("lastOrderId") || `INV${Date.now().toString().slice(-6)}`;
    const storedTotal = localStorage.getItem("cartTotal") || 0;
    const storedMethod = localStorage.getItem("selectedPaymentMethod") || "";
    
    let storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (!storedCart || storedCart.length === 0) {
      try {
        storedCart = JSON.parse(localStorage.getItem("lastOrderItems") || "[]");
      } catch (e) {
        storedCart = [];
      }
    }
    
    const storedEmail = localStorage.getItem("lastOrderEmail") || localStorage.getItem("userEmail") || "yourname@example.com";

    setOrderId(storedOrderId);
    setTotal(parseFloat(storedTotal));
    setItems(storedCart);
    setEmail(storedEmail);
    setPaymentMethod(storedMethod);

    // Fetch complete order details from backend to display full invoice
    if (storedOrderId) {
      fetch(`${config.API_URL}/api/orders/${storedOrderId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          if (data.items) {
            try { setItems(JSON.parse(data.items)); } catch(e){}
          }
          if (data.total) setTotal(Number(data.total));
          if (data.paymentMethod) setPaymentMethod(data.paymentMethod);
          if (data.shipping_address) {
            try {
              const addr = JSON.parse(data.shipping_address);
              setShippingAddress(addr);
              if (addr.email) setEmail(addr.email);
            } catch(e){}
          }
        }
      })
      .catch(err => console.error("Error fetching success invoice details:", err));
    }

    // Clear cart and temporary items
    localStorage.removeItem("cart");
    localStorage.removeItem("lastOrderItems");
    localStorage.removeItem("lastOrderEmail");
    localStorage.removeItem("selectedPaymentMethod");
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 pt-4 md:pt-6 pb-12 px-4 flex justify-center items-start">
      <div className="w-full max-w-3xl">

        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-[#00D12E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
            Thank You for Your Order!
          </h1>
          <p className="text-gray-500 text-lg">
            A confirmation email has been sent to <br className="md:hidden" />
            <span className="font-semibold text-gray-900 dark:text-gray-300">{email}</span>
          </p>
        </div>

        {/* Order Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">

          {/* Card Header */}
          <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-bold">Order Details</h2>
            <div className="flex gap-6 text-sm text-gray-500">
              <div>
                <span className="block text-gray-400 text-xs uppercase tracking-wider">Order ID</span>
                <span className="font-mono font-bold text-black dark:text-white">#{orderId}</span>
              </div>
              <div>
                <span className="block text-gray-400 text-xs uppercase tracking-wider">Est. Delivery</span>
                <span className="font-bold text-black dark:text-white">
                  {new Date(Date.now() + 2 * 86400000).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })} - {new Date(Date.now() + 5 * 86400000).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="p-6 md:p-8">
            {items.length > 0 ? (
              <div className="space-y-6">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x100?text=Prod"; }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white">{item.name}</h3>
                      <p className="text-sm text-gray-500">Qty: {item.qty}</p>
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      Rp {item.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">Order details loaded from secure session.</p>
            )}

            {/* Totals */}
            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700 space-y-3">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>Rp {items.reduce((acc, item) => acc + item.price * item.qty, 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold mt-4">
                <span>Total</span>
                <span className="text-[#00D12E]">Rp {total.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Shipping & Payment Invoice Details */}
            {shippingAddress && (
              <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700 grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs mb-3">Shipping Address</h4>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{shippingAddress.fullName || `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim()}</p>
                  <p className="text-gray-500 mt-1">{shippingAddress.phone}</p>
                  <p className="text-gray-500 leading-relaxed mt-1">
                    {shippingAddress.address}<br />
                    {shippingAddress.area || shippingAddress.district || ''}, {shippingAddress.city}<br />
                    {shippingAddress.province} {shippingAddress.postalCode || shippingAddress.postal_code || ''}
                  </p>
                  {shippingAddress.courierInfo && (
                    <p className="text-xs text-gray-400 mt-2 uppercase tracking-wide">
                      🚚 Courier: <strong className="text-gray-700 dark:text-gray-300">{shippingAddress.courierInfo}</strong>
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs mb-3">Billing Info</h4>
                  <p className="text-gray-500">Payment Method: <strong className="text-gray-800 dark:text-gray-200 capitalize">{paymentMethod === 'cod' ? 'COD (Bayar di Tempat)' : paymentMethod === 'midtrans' ? 'Midtrans (VA/QRIS)' : paymentMethod}</strong></p>
                  <p className="text-gray-500 mt-1">Status: <strong className="text-yellow-600 bg-yellow-50 dark:bg-yellow-900/10 px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wider inline-block">Waiting for Payment</strong></p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Actions - Centered Buttons */}
        <div className="mt-10 flex flex-col md:flex-row gap-4 justify-center items-center">
          <a
            href={`https://wa.me/${brand.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo Admin, saya sudah order dengan ID #${orderId}. Mohon diproses ya! Total: Rp ${total.toLocaleString('id-ID')}`)}`}
            target="_blank"
            rel="noreferrer"
            className="w-full md:w-auto px-8 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-full shadow-lg hover:shadow-xl transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-8.683-2.031-9.667-.272-.099-.47-.149-.669-.149-.198 0-.42.001-.643.001-.223 0-.585.085-.89.42-.306.334-1.169 1.142-1.169 2.786 0 1.643 1.2 3.232 1.368 3.456.168.224 2.361 3.605 5.722 5.056 2.188.943 2.635.756 3.596.71.956-.046 2.138-.875 2.438-1.721.298-.846.298-1.572.208-1.721z" /></svg>
            Konfirmasi WhatsApp
          </a>

          <button
            onClick={() => navigate(`/payment/confirm?orderId=${orderId}`)}
            className="w-full md:w-auto px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full hover:opacity-85 transition transform active:scale-95 flex items-center justify-center"
          >
            {paymentMethod === "cod" ? "Detail Pesanan" : paymentMethod === "mandiri_tf" ? "Upload Bukti Transfer" : "Halaman Pay Now"}
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="w-full md:w-auto px-8 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            My Orders
          </button>
        </div>

        <div className="mt-8 text-center flex flex-col gap-2">
          <button onClick={() => navigate("/")} className="text-gray-400 hover:text-black dark:hover:text-white underline text-sm">
            Continue Shopping
          </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentSuccess;
