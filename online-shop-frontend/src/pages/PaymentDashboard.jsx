import React, { useEffect, useState } from "react";
import BackButton from "../components/BackButton.jsx";
import config from '../config.js';
import { useAuth } from "../contexts/AuthContext";
import { getImageUrl } from "../utils/imageHelper";

const PaymentDashboard = () => {
  const { userEmail } = useAuth();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);

  // Form States
  const [address, setAddress] = useState({
    firstName: "", lastName: "", address: "", city: "", postalCode: "", phone: ""
  });

  useEffect(() => {
    const saved = localStorage.getItem(`savedAddress_${userEmail || 'guest'}`);
    if (saved) {
      try { setAddress(JSON.parse(saved)); } catch(e){}
    }
  }, [userEmail]);
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Manual methods (always available)
  const staticMethods = [
    { label: "Manual Transfer (Bank Mandiri)", value: "mandiri_tf" },
    { label: "COD (Bayar di Tempat)", value: "cod" },
    { label: "QRIS / E-Wallet (Midtrans)", value: "qris" },
    { label: "Bank Transfer / VA (Midtrans)", value: "bca_va" }
  ];

  useEffect(() => {
    // ... existing useEffect ...
    // Merge static methods with API methods if any (or just use static for stability now)
    setMethods(staticMethods);
    setSelectedPaymentMethod(staticMethods[0].value);
    setLoading(false);

    /* 
    // Jika ingin fetch Midtrans methods:
    fetch(`${config.API_URL}/api/midtrans/methods`)
      .then(res => res.json())
      .then(data => {
         setMethods([...staticMethods, ...data]);
      })
      .catch(err => console.log("Using static methods only"));
    */

    // Load Cart
    const c = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(c);
    setSubtotal(c.reduce((sum, item) => sum + item.price * item.qty, 0));
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await fetch(`${config.API_URL}/api/coupons/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, cartTotal: subtotal })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setDiscountAmount(data.discountAmount);
        setAppliedCoupon(data.couponCode); // Use returned code (formatted)
        alert(`Kupon ${data.couponCode} berhasil! Hemat Rp ${data.discountAmount.toLocaleString('id-ID')}`);
      } else {
        setDiscountAmount(0);
        setAppliedCoupon(null);
        alert(data.error || "Kupon tidak valid");
      }
    } catch (e) {
      alert("Gagal memverifikasi kupon");
    }
  };

  // RajaOngkir States
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [courier, setCourier] = useState("jne");
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  // Load Provinces
  useEffect(() => {
    fetch(`${config.API_URL}/api/shipping/provinces`)
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error("Error loading provinces:", err));
  }, []);

  // Load Cities when Province changes
  useEffect(() => {
    if (selectedProvince) {
      fetch(`${config.API_URL}/api/shipping/cities/${selectedProvince}`)
        .then(res => res.json())
        .then(data => setCities(data))
        .catch(err => console.error("Error loading cities:", err));
    } else {
      setCities([]);
    }
  }, [selectedProvince]);

  // Calculate Cost
  useEffect(() => {
    if (selectedCity && courier) {
      // Calculate total weight (default 1000g per item if not specified)
      const totalWeight = cart.reduce((sum, item) => sum + (item.weight || 1000) * item.qty, 0);
      
      fetch(`${config.API_URL}/api/shipping/cost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: '151', // Jakarta Pusat (Example)
          destination: selectedCity,
          weight: totalWeight,
          courier: courier
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setShippingOptions(data[0].costs);
          // Auto select first option if none selected
          if (data[0].costs.length > 0 && !selectedService) {
            handleServiceChange(data[0].costs[0]);
          }
        }
      })
      .catch(err => console.error("Error calculating cost:", err));
    }
  }, [selectedCity, courier, cart]);

  const handleServiceChange = (service) => {
    setSelectedService(service);
    setShippingCost(service.cost[0].value);
    setShippingMethod(`${courier.toUpperCase()} - ${service.service}`);
  };

  const handleCreateOrder = async () => {
    if (!selectedPaymentMethod) {
      alert("Please select a payment method.");
      return;
    }
    if (!selectedCity || !selectedService) {
      alert("Pilih alamat pengiriman dan layanan kurir.");
      return;
    }

    // Calculate final total
    const taxes = subtotal * 0.11;
    const finalTotal = subtotal + shippingCost + taxes - discountAmount;
    const items = cart;

    try {
      const res = await fetch(`${config.API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userEmail || "guest",
          email: userEmail || "guest@mail.com",
          items,
          total: finalTotal > 0 ? finalTotal : 0,
          paymentMethod: selectedPaymentMethod,
          status: 'pending',
          shippingAddress: {
            ...address,
            provinceTitle: provinces.find(p => p.province_id === selectedProvince)?.province,
            cityTitle: cities.find(c => c.city_id === selectedCity)?.city_name,
            courierInfo: `${courier.toUpperCase()} ${selectedService.service}`
          },
          couponCode: appliedCoupon,
          discountAmount: discountAmount
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat pesanan");

      localStorage.setItem('lastOrderId', data.orderId);
      localStorage.setItem('selectedPaymentMethod', selectedPaymentMethod);
      localStorage.setItem('cartTotal', finalTotal);
      localStorage.setItem(`savedAddress_${userEmail || 'guest'}`, JSON.stringify(address));

      window.location.href = '/payment/confirm';

    } catch (e) {
      alert(e.message || "Gagal memproses pesanan");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 pt-4 md:pt-8 pb-12 px-4 md:px-8 transition-colors duration-[900ms]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <BackButton to="/" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Checkout</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">

          {/* LEFT COLUMN: FORMS */}
          <div className="flex-1 space-y-10">

            {/* 1. Shipping Address */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">1</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Shipping Address</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text" placeholder="First Name" className="w-full p-4 bg-white dark:bg-gray-800 border-none rounded shadow-sm focus:ring-1 focus:ring-black"
                  value={address.firstName} onChange={e => setAddress({ ...address, firstName: e.target.value })}
                />
                <input
                  type="text" placeholder="Last Name" className="w-full p-4 bg-white dark:bg-gray-800 border-none rounded shadow-sm focus:ring-1 focus:ring-black"
                  value={address.lastName} onChange={e => setAddress({ ...address, lastName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select 
                  className="w-full p-4 bg-white dark:bg-gray-800 border-none rounded shadow-sm focus:ring-1 focus:ring-black dark:text-white"
                  value={selectedProvince}
                  onChange={e => { setSelectedProvince(e.target.value); setSelectedCity(""); }}
                >
                  <option value="">Pilih Provinsi</option>
                  {provinces.map(p => (
                    <option key={p.province_id} value={p.province_id}>{p.province}</option>
                  ))}
                </select>

                <select 
                  className="w-full p-4 bg-white dark:bg-gray-800 border-none rounded shadow-sm focus:ring-1 focus:ring-black dark:text-white"
                  value={selectedCity}
                  onChange={e => setSelectedCity(e.target.value)}
                  disabled={!selectedProvince}
                >
                  <option value="">Pilih Kota/Kabupaten</option>
                  {cities.map(c => (
                    <option key={c.city_id} value={c.city_id}>{c.type} {c.city_name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <textarea
                  placeholder="Detail Alamat (Jalan, No. Rumah, RT/RW)" className="w-full p-4 bg-white dark:bg-gray-800 border-none rounded shadow-sm focus:ring-1 focus:ring-black min-h-[100px]"
                  value={address.address} onChange={e => setAddress({ ...address, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text" placeholder="Postal Code" className="w-full p-4 bg-white dark:bg-gray-800 border-none rounded shadow-sm focus:ring-1 focus:ring-black"
                  value={address.postalCode} onChange={e => setAddress({ ...address, postalCode: e.target.value })}
                />
                <input
                  type="text" placeholder="Phone Number" className="w-full p-4 bg-white dark:bg-gray-800 border-none rounded shadow-sm focus:ring-1 focus:ring-black"
                  value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })}
                />
              </div>
            </section>

            {/* 2. Shipping Method */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">2</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Shipping Method</h2>
              </div>

              {/* Kurir Selection */}
              <div className="flex gap-2 mb-6">
                {['jne', 'pos', 'tiki'].map(c => (
                  <button
                    key={c}
                    onClick={() => { setCourier(c); setSelectedService(null); }}
                    className={`flex-1 py-3 font-bold rounded border transition-all uppercase ${courier === c ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 border-transparent hover:bg-gray-100'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {!selectedCity && (
                  <p className="text-sm text-gray-500 italic text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">Pilih kota pengiriman terlebih dahulu untuk melihat ongkir.</p>
                )}
                
                {selectedCity && shippingOptions.length === 0 && (
                  <p className="text-sm text-gray-500 italic text-center p-4">Loading shipping options...</p>
                )}

                {shippingOptions.map((opt, idx) => (
                  <label key={idx} className={`flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded shadow-sm cursor-pointer border ${selectedService?.service === opt.service ? 'border-red-500 bg-red-50 dark:bg-gray-700' : 'border-transparent'}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio" name="shipping" value={opt.service} 
                        checked={selectedService?.service === opt.service}
                        onChange={() => handleServiceChange(opt)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <div>
                        <div className="font-bold">{opt.service} - {opt.description}</div>
                        <div className="text-xs text-gray-500">Estimasi: {opt.cost[0].etd} Hari</div>
                      </div>
                    </div>
                    <span className="font-bold text-red-600">Rp {opt.cost[0].value.toLocaleString('id-ID')}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* 3. Payment Method */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">3</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Method</h2>
              </div>

              {/* Methods Tab */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {methods.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setSelectedPaymentMethod(m.value)}
                    className={`py-3 text-sm font-bold rounded border transition-all ${selectedPaymentMethod === m.value ? 'bg-white dark:bg-gray-800 border-red-500 text-red-500 shadow-sm' : 'bg-gray-50 dark:bg-gray-800 border-transparent text-gray-500 hover:bg-gray-100'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Visual Card Form (Only decorative if backend uses Snap, but matches the UI request) */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 italic">Complete payment securely via Midtrans.</p>
                </div>
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY */}
          <div className="w-full lg:w-[400px]">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm sticky top-32">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-6 mb-6">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded overflow-hidden relative border border-gray-200 dark:border-gray-600 shrink-0">
                      <img
                        src={getImageUrl(item?.image || (item?.images && item?.images?.[0]))}
                        alt={item.name}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x100?text=Prod"; }}
                      />
                      <span className="absolute top-0 right-0 bg-gray-500 text-white text-[9px] font-bold px-1 rounded-bl">x{item.qty}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-gray-800 dark:text-gray-100">{item.name}</div>
                      <div className="text-xs text-gray-500 mb-1">Size: {item.selectedSize || 'M'}</div>
                    </div>
                    <div className="text-sm font-bold">
                      Rp {item.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code */}
              <div className="flex gap-2 mb-8">
                <input
                  type="text"
                  placeholder="Kode Promo"
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-transparent dark:text-white"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={appliedCoupon}
                />
                {appliedCoupon ? (
                  <button onClick={() => { setAppliedCoupon(null); setDiscountAmount(0); setCouponCode(""); }} className="bg-red-500 text-white px-4 py-2 text-sm font-bold rounded">Cancel</button>
                ) : (
                  <button onClick={handleApplyCoupon} className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-bold rounded">Apply</button>
                )}
              </div>

              {/* Counts */}
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900 dark:text-white">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className={`font-bold ${shippingCost === 0 ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                    {shippingCost === 0 ? 'Free' : `Rp ${shippingCost.toLocaleString('id-ID')}`}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount ({appliedCoupon})</span>
                    <span className="font-bold">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Taxes (11%)</span>
                  <span className="font-bold text-gray-900 dark:text-white">Rp {(subtotal * 0.11).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-end mb-8">
                <span className="text-lg font-bold">Total</span>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block mb-1">IDR</span>
                  <span className="text-3xl font-[900] tracking-tight">
                    Rp {(subtotal + shippingCost + (subtotal * 0.11) - discountAmount).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCreateOrder}
                className="w-full bg-[#FF0000] hover:bg-red-700 text-white font-bold py-4 rounded shadow-lg uppercase tracking-wider text-sm transition-all active:scale-[0.98]"
              >
                Complete Purchase &rarr;
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-gray-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                All transactions are secure and encrypted.
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PaymentDashboard;
