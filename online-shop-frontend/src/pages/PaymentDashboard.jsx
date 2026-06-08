import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton.jsx";
import config from '../config.js';
import { useAuth } from "../contexts/AuthContext";
import { getImageUrl } from "../utils/imageHelper";
import { useCurrency } from "../components/CurrencyContext.jsx";

const PaymentDashboard = () => {
  const navigate = useNavigate();
  const { userEmail } = useAuth();
  const { t, language } = useCurrency();
  const isId = language !== 'EN';
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
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
          };
          document.body.appendChild(script);
        }
      })
      .catch(console.error);
  }, []);
  const [cart, setCart] = useState([]);
  const [creating, setCreating] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);

  // Form States
  const [address, setAddress] = useState({
    firstName: "", lastName: "", address: "", city: "", postalCode: "", phone: "", note: ""
  });

  useEffect(() => {
    const saved = localStorage.getItem(`savedAddress_${userEmail || 'guest'}`);
    if (saved) {
      try { setAddress(JSON.parse(saved)); } catch(e){}
    }
  }, [userEmail]);
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(localStorage.getItem('selectedPaymentMethod') || "midtrans");

  useEffect(() => {
    localStorage.setItem('selectedPaymentMethod', selectedPaymentMethod);
  }, [selectedPaymentMethod]);

  // Coupon State
  const [couponCode, setCouponCode] = useState(localStorage.getItem('appliedCoupon') || "");
  const [discountAmount, setDiscountAmount] = useState(Number(localStorage.getItem('discountAmount')) || 0);
  const [appliedCoupon, setAppliedCoupon] = useState(localStorage.getItem('appliedCoupon') || null);
  const [referralCode, setReferralCode] = useState(localStorage.getItem('referral_code') || "");
  const [referralDiscount, setReferralDiscount] = useState(0);

  // Manual methods (always available)
  const staticMethods = [
    { label: "Midtrans (QRIS, VA, E-Wallet)", value: "midtrans" },
    { label: "COD (Bayar di Tempat)", value: "cod" }
  ];

  useEffect(() => {
    // ... existing useEffect ...
    // Merge static methods with API methods if any (or just use static for stability now)
    setMethods(staticMethods);
    const savedMethod = localStorage.getItem('selectedPaymentMethod');
    setSelectedPaymentMethod(savedMethod || "midtrans");
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
    const st = c.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.qty || 1), 0);
    setSubtotal(st);

    // Auto-apply referral discount if exists
    if (referralCode) {
      fetch(`${config.API_URL}/api/referral/verify/${referralCode}`)
        .then(res => res.json())
        .then(data => {
           if (data.valid) {
             // 5% Referral Discount for any user who uses a ref link
             const refDisc = Math.floor(st * 0.05);
             setReferralDiscount(refDisc);
           }
        })
        .catch(err => console.log("Referral verification failed"));
    }
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
        localStorage.setItem('appliedCoupon', data.couponCode);
        localStorage.setItem('discountAmount', String(data.discountAmount));
        alert(`Kupon ${data.couponCode} berhasil! Hemat Rp${data.discountAmount.toLocaleString('id-ID')}`);
      } else {
        setDiscountAmount(0);
        setAppliedCoupon(null);
        localStorage.removeItem('appliedCoupon');
        localStorage.removeItem('discountAmount');
        alert(data.error || "Kupon tidak valid");
      }
    } catch (e) {
      alert("Gagal memverifikasi kupon");
    }
  };

  // Biteship/Manual Hierarchy States
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState(localStorage.getItem('sel_prov') || ""); // ID
  const [selectedCity, setSelectedCity] = useState(localStorage.getItem('sel_city') || ""); // ID
  const [selectedDistrict, setSelectedDistrict] = useState(localStorage.getItem('sel_dist') || ""); // ID
  const [selectedVillage, setSelectedVillage] = useState(localStorage.getItem('sel_vill') || ""); // ID

  const isInitialProv = useRef(true);
  const isInitialCity = useRef(true);
  const isInitialDist = useRef(true);

  const provinceOptions = useMemo(() => {
    return provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>);
  }, [provinces]);

  const cityOptions = useMemo(() => {
    return cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>);
  }, [cities]);

  const districtOptions = useMemo(() => {
    return districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>);
  }, [districts]);

  const villageOptions = useMemo(() => {
    return villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>);
  }, [villages]);

  const [selectedAreaId, setSelectedAreaId] = useState(null); // The resolved Biteship ID
  
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState(null);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [courier, setCourier] = useState(localStorage.getItem('selectedCourier') || "jne");

  useEffect(() => {
    localStorage.setItem('selectedCourier', courier);
  }, [courier]);

  // Load Provinces
  useEffect(() => {
    fetch(`${config.API_URL}/api/shipping/provinces`)
      .then(res => res.json())
      .then(data => setProvinces(Array.isArray(data) ? data : []));
  }, []);

  // Cascading Fetches
  useEffect(() => {
    if (isInitialProv.current) {
      isInitialProv.current = false;
      if (selectedProvince) {
        fetch(`${config.API_URL}/api/shipping/cities/${selectedProvince}`)
          .then(res => res.json())
          .then(data => setCities(Array.isArray(data) ? data : []));
      }
      return;
    }

    localStorage.setItem('sel_prov', selectedProvince);
    if (selectedProvince) {
      fetch(`${config.API_URL}/api/shipping/cities/${selectedProvince}`)
        .then(res => res.json())
        .then(data => setCities(Array.isArray(data) ? data : []));
    } else {
      setCities([]);
    }
    // Clear child selections when parent changes
    setSelectedCity("");
    setSelectedDistrict("");
    setSelectedVillage("");
    localStorage.removeItem('sel_city');
    localStorage.removeItem('sel_dist');
    localStorage.removeItem('sel_vill');
    localStorage.removeItem('selectedService');
  }, [selectedProvince]);

  useEffect(() => {
    if (isInitialCity.current) {
      isInitialCity.current = false;
      if (selectedCity) {
        fetch(`${config.API_URL}/api/shipping/districts/${selectedCity}`)
          .then(res => res.json())
          .then(data => setDistricts(Array.isArray(data) ? data : []));
      }
      return;
    }

    localStorage.setItem('sel_city', selectedCity);
    if (selectedCity) {
      fetch(`${config.API_URL}/api/shipping/districts/${selectedCity}`)
        .then(res => res.json())
        .then(data => setDistricts(Array.isArray(data) ? data : []));
    } else {
      setDistricts([]);
    }
    setSelectedDistrict("");
    setSelectedVillage("");
    localStorage.removeItem('sel_dist');
    localStorage.removeItem('sel_vill');
    localStorage.removeItem('selectedService');
  }, [selectedCity]);

  useEffect(() => {
    if (isInitialDist.current) {
      isInitialDist.current = false;
      if (selectedDistrict) {
        fetch(`${config.API_URL}/api/shipping/villages/${selectedDistrict}`)
          .then(res => res.json())
          .then(data => setVillages(Array.isArray(data) ? data : []));
      }
      return;
    }

    localStorage.setItem('sel_dist', selectedDistrict);
    if (selectedDistrict) {
      fetch(`${config.API_URL}/api/shipping/villages/${selectedDistrict}`)
        .then(res => res.json())
        .then(data => setVillages(Array.isArray(data) ? data : []));
    } else {
      setVillages([]);
    }
    setSelectedVillage("");
    localStorage.removeItem('sel_vill');
    localStorage.removeItem('selectedService');
  }, [selectedDistrict]);

  useEffect(() => {
    localStorage.setItem('sel_vill', selectedVillage);
  }, [selectedVillage]);

  // Calculate Cost (Optimized: combined area resolution + rates)
  useEffect(() => {
    if (selectedVillage && villages.length > 0 && cart.length > 0) {
      const v = villages.find(v => v.id === selectedVillage);
      const d = districts.find(d => d.id === selectedDistrict);
      const c = cities.find(c => c.id === selectedCity);
      const p = provinces.find(p => p.id === selectedProvince);
      
      if (!v || !d || !c || !p) return;
      
      setLoadingShipping(true);
      const query = `${v.name}, ${d.name}, ${c.name}, ${p.name}`;

      const items = cart.map(item => ({
        name: item.name,
        description: "Baju/Tas",
        value: item.price,
        length: 10, width: 10, height: 10,
        weight: item.weight || 1000,
        quantity: item.qty
      }));
      
      fetch(`${config.API_URL}/api/shipping/cost-by-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, items })
      })
      .then(res => res.json())
      .then(data => {
        setLoadingShipping(false);
        if (data.error) {
           const detailedError = data.details ? `${data.error}: ${data.details}` : data.error;
           console.error("Shipping API Error:", detailedError);
           // Don't return if we have manual pricing
           if (data.pricing && data.pricing.length > 0) {
             setShippingError(`Note: ${detailedError}`); // Show as warning
           } else {
             setShippingOptions([]);
             setShippingCost(0);
             setShippingError(detailedError);
             return;
           }
        }
        
        if (data.pricing && Array.isArray(data.pricing) && data.pricing.length > 0) {
          setShippingOptions(data.pricing);
          setSelectedAreaId(data.area_id);
          setShippingError(null);
          
          const savedServiceStr = localStorage.getItem('selectedService');
          if (savedServiceStr) {
            try {
              const savedService = JSON.parse(savedServiceStr);
              const matched = data.pricing.find(opt => opt.courier_service_code === savedService.courier_service_code && opt.company === savedService.company);
              if (matched) {
                setSelectedService(matched);
                setShippingCost(matched.price);
                setShippingMethod(`${matched.company.toUpperCase()} - ${matched.courier_service_name}`);
                return;
              }
            } catch(e){}
          }

          const courierOptions = data.pricing.filter(opt => opt.company === courier);
          if (courierOptions.length > 0) {
            handleServiceChange(courierOptions[0]);
          }
        } else {
          setShippingOptions([]);
          setSelectedService(null);
          setShippingCost(0);
          setShippingError("Tidak ada layanan kurir yang tersedia untuk rute ini.");
          console.warn("No shipping options available for this route.");
        }
      })
      .catch(err => {
        setLoadingShipping(false);
        setShippingOptions([]);
        setSelectedService(null);
        setShippingCost(0);
        setShippingError("Gagal menghubungi server pengiriman.");
        console.error("Error calculating cost:", err);
      });
    }
  }, [selectedVillage, courier, cart, provinces, cities, districts, villages]);

  const handleServiceChange = (service) => {
    setSelectedService(service);
    setShippingCost(service.price);
    setShippingMethod(`${service.company.toUpperCase()} - ${service.courier_service_name}`);
    localStorage.setItem('selectedService', JSON.stringify(service));
  };

  const handleCreateOrder = async () => {
    if (creating) return;

    if (!selectedPaymentMethod) {
      alert("Pilih metode pembayaran terlebih dahulu.");
      return;
    }
    if (!selectedVillage || !selectedService) {
      alert("Pilih alamat pengiriman lengkap (sampai kelurahan) dan layanan kurir.");
      return;
    }
    if (!address.firstName || !address.phone) {
      alert("Nama depan dan nomor telepon wajib diisi.");
      return;
    }
    if (!address.address) {
      alert("Detail alamat (nama jalan/nomor rumah) wajib diisi.");
      return;
    }

    // Consistent total calculation (same formula used in display)
    const discountedAmount = Math.max(0, subtotal - discountAmount - referralDiscount);
    const taxes = Math.round(discountedAmount * 0.11);
    const finalTotal = discountedAmount + shippingCost + taxes;
    const items = cart;

    // For COD, we bypass creating the order in the database and clearing the cart on checkout page.
    // Instead, we save the details temporarily to localStorage and let the confirmation page trigger the write.
    if (selectedPaymentMethod === 'cod') {
      const tempOrder = {
        id: "temp",
        items,
        total: finalTotal > 0 ? finalTotal : 0,
        paymentMethod: 'cod',
        status: 'pending',
        shippingAddress: {
          ...address,
          province: provinces.find(p => p.id === selectedProvince)?.name || "",
          city: cities.find(c => c.id === selectedCity)?.name || "",
          district: districts.find(d => d.id === selectedDistrict)?.name || "",
          area: villages.find(v => v.id === selectedVillage)?.name || "",
          courierInfo: selectedService ? `${selectedService.company.toUpperCase()} ${selectedService.courier_service_name}` : ""
        },
        couponCode: appliedCoupon,
        discountAmount: discountAmount + referralDiscount,
        referralCode: referralCode,
        email: userEmail || "guest@mail.com"
      };

      localStorage.setItem('tempCodOrder', JSON.stringify(tempOrder));
      localStorage.setItem('selectedPaymentMethod', 'cod');
      localStorage.setItem(`savedAddress_${userEmail || 'guest'}`, JSON.stringify(address));
      
      navigate(`/payment/confirm?temp=true`);
      return;
    }

    setCreating(true);

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
            province: provinces.find(p => p.id === selectedProvince)?.name || "",
            city: cities.find(c => c.id === selectedCity)?.name || "",
            district: districts.find(d => d.id === selectedDistrict)?.name || "",
            area: villages.find(v => v.id === selectedVillage)?.name || "",
            courierInfo: selectedService ? `${selectedService.company.toUpperCase()} ${selectedService.courier_service_name}` : ""
          },
          couponCode: appliedCoupon,
          discountAmount: discountAmount + referralDiscount,
          referralCode: referralCode
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat pesanan");

      localStorage.setItem('lastOrderId', data.orderId);
      localStorage.setItem('selectedPaymentMethod', selectedPaymentMethod);
      localStorage.setItem('cartTotal', finalTotal);
      localStorage.setItem('lastOrderItems', JSON.stringify(items));
      localStorage.setItem('lastOrderEmail', userEmail || "guest@mail.com");
      localStorage.setItem(`savedAddress_${userEmail || 'guest'}`, JSON.stringify(address));
      
      // ✅ FIX: Clear cart after successful order creation
      localStorage.removeItem('cart');
      
      // Clean up referral after use
      localStorage.removeItem('referral_code');
      localStorage.removeItem('appliedCoupon');
      localStorage.removeItem('discountAmount');

      // Redirect to Order Confirmation page (Halaman Confirm Order / Status)
      navigate(`/payment/confirm?orderId=${data.orderId}`);

    } catch (e) {
      alert(e.message || "Gagal memproses pesanan");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 pt-4 md:pt-8 pb-12 px-4 md:px-8 transition-colors duration-[900ms]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <BackButton to="/" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('admin.payment.title')}</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">

          {/* LEFT COLUMN: FORMS */}
          <div className="flex-1 space-y-10">

            {/* 1. Shipping Address */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">1</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isId ? 'Alamat Pengiriman' : 'Shipping Address'}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text" placeholder={isId ? "Nama Depan" : "First Name"} className="w-full p-4 bg-white dark:bg-gray-800 border-none rounded shadow-sm focus:ring-1 focus:ring-black"
                  value={address.firstName} onChange={e => setAddress({ ...address, firstName: e.target.value })}
                />
                <input
                  type="text" placeholder={isId ? "Nama Belakang" : "Last Name"} className="w-full p-4 bg-white dark:bg-gray-800 border-none rounded shadow-sm focus:ring-1 focus:ring-black"
                  value={address.lastName} onChange={e => setAddress({ ...address, lastName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select 
                  className="w-full p-4 bg-white dark:bg-gray-800 border-none rounded shadow-sm focus:ring-1 focus:ring-black dark:text-white"
                  value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)}
                >
                  <option value="">{isId ? "Pilih Provinsi" : "Select Province"}</option>
                  {provinceOptions}
                </select>

                <select 
                  className="w-full p-4 bg-white dark:bg-gray-800 border-none rounded shadow-sm focus:ring-1 focus:ring-black dark:text-white"
                  value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
                  disabled={!selectedProvince}
                >
                  <option value="">{isId ? "Pilih Kota/Kabupaten" : "Select City/Regency"}</option>
                  {cityOptions}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select 
                  className="w-full p-4 bg-white dark:bg-gray-800 border-none rounded shadow-sm focus:ring-1 focus:ring-black dark:text-white"
                  value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)}
                  disabled={!selectedCity}
                >
                  <option value="">{isId ? "Pilih Kecamatan" : "Select District"}</option>
                  {districtOptions}
                </select>

                <select 
                  className="w-full p-4 bg-white dark:bg-gray-800 border-none rounded shadow-sm focus:ring-1 focus:ring-black dark:text-white"
                  value={selectedVillage} onChange={e => setSelectedVillage(e.target.value)}
                  disabled={!selectedDistrict}
                >
                  <option value="">{isId ? "Pilih Desa/Kelurahan" : "Select Village"}</option>
                  {villageOptions}
                </select>
              </div>

              <div className="mb-4">
                <textarea
                  placeholder={isId ? "Detail Alamat (Jalan, No. Rumah, RT/RW)" : "Detailed Address (Street, House No, etc)"} className="w-full p-4 bg-white dark:bg-gray-800 border-none rounded shadow-sm focus:ring-1 focus:ring-black min-h-[100px]"
                  value={address.address} onChange={e => setAddress({ ...address, address: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <textarea
                  placeholder={isId ? "Catatan untuk Penjual (Opsional)" : "Notes for Seller (Optional)"} className="w-full p-4 bg-white dark:bg-gray-800 border-none rounded shadow-sm focus:ring-1 focus:ring-black min-h-[80px]"
                  value={address.note} onChange={e => setAddress({ ...address, note: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text" placeholder={isId ? "Kode Pos" : "Postal Code"} className="w-full p-4 bg-white dark:bg-gray-800 border-none rounded shadow-sm focus:ring-1 focus:ring-black"
                  value={address.postalCode} onChange={e => setAddress({ ...address, postalCode: e.target.value })}
                />
                <input
                  type="text" placeholder={isId ? "Nomor Handphone" : "Phone Number"} className="w-full p-4 bg-white dark:bg-gray-800 border-none rounded shadow-sm focus:ring-1 focus:ring-black"
                  value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })}
                />
              </div>
            </section>

            {/* 2. Shipping Method */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">2</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isId ? 'Metode Pengiriman' : 'Shipping Method'}</h2>
              </div>

              {/* Kurir Selection */}
              <div className="flex gap-2 mb-6">
                {['jne', 'pos', 'tiki', 'manual'].map(c => {
                  const hasRates = shippingOptions.some(opt => opt.company === c);
                  if (c === 'manual' && !hasRates) return null;
                  
                  return (
                    <button
                      key={c}
                      onClick={() => { setCourier(c); setSelectedService(null); }}
                      className={`flex-1 py-3 font-black rounded-xl border-2 transition-all uppercase text-[10px] tracking-widest ${courier === c ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700 hover:border-gray-200'}`}
                    >
                      {c === 'manual' ? 'Custom' : c}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                {!selectedVillage && (
                  <p className="text-sm text-gray-500 italic text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">{isId ? 'Pilih alamat lengkap terlebih dahulu untuk melihat ongkir.' : 'Select a complete address first to view shipping cost.'}</p>
                )}
                
                {selectedVillage && loadingShipping && (
                  <div className="flex flex-col items-center justify-center p-8 space-y-3 bg-white dark:bg-gray-800 rounded shadow-sm border border-dashed border-gray-200">
                    <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium animate-pulse">{isId ? 'Menghitung ongkos kirim terbaik...' : 'Calculating best shipping rates...'}</p>
                  </div>
                )}
                
                {selectedProvince && selectedCity && selectedDistrict && selectedVillage && !loadingShipping && shippingError && !shippingError.startsWith('Note:') && shippingOptions.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-8 space-y-3 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/30">
                    <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-tighter">⚠️ Biaya pengiriman gagal dihitung</p>
                    <p className="text-[10px] text-red-500 text-center font-bold">{shippingError}</p>
                    <div className="mt-2 p-2 bg-white/50 rounded text-[9px] text-gray-500 font-mono">
                      Query: {`${villages.find(x => x.id === selectedVillage)?.name || ''}, ${districts.find(x => x.id === selectedDistrict)?.name || ''}, ${cities.find(x => x.id === selectedCity)?.name || ''}`}
                    </div>
                  </div>
                )}

                {shippingError && shippingError.startsWith('Note:') && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20 mb-4">
                    <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest text-center">💡 {shippingError.replace('Note: ', '')}</p>
                  </div>
                )}

                {selectedVillage && !loadingShipping && shippingOptions.length > 0 && shippingOptions.filter(opt => opt.company === courier).map((opt, idx) => (
                  <label key={idx} className={`flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded shadow-sm cursor-pointer border ${selectedService?.courier_service_code === opt.courier_service_code ? 'border-red-500 bg-red-50 dark:bg-gray-700' : 'border-transparent'}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio" name="shipping" value={opt.courier_service_code} 
                        checked={selectedService?.courier_service_code === opt.courier_service_code}
                        onChange={() => handleServiceChange(opt)}
                        className="text-black dark:text-white focus:ring-black"
                      />
                      <div>
                        <div className="font-bold">{opt.company.toUpperCase()} - {opt.courier_service_name}</div>
                        <div className="text-xs text-gray-500">Estimasi: {opt.duration}</div>
                      </div>
                    </div>
                    <span className="font-bold text-red-600">Rp {opt.price.toLocaleString('id-ID')}</span>
                  </label>
                ))}
                
                {selectedAreaId && shippingOptions.length > 0 && shippingOptions.filter(opt => opt.company === courier).length === 0 && (
                  <p className="text-sm text-gray-500 italic text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">Tidak ada layanan kurir {courier.toUpperCase()} yang tersedia untuk rute ini.</p>
                )}
              </div>
            </section>

            {/* 3. Payment Method */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">3</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isId ? 'Metode Pembayaran' : 'Payment Method'}</h2>
              </div>

              {/* Methods Tab */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                {methods.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setSelectedPaymentMethod(m.value)}
                    className={`py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${selectedPaymentMethod === m.value ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:bg-gray-50'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>


            </section>

          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY */}
          <div className="w-full lg:w-[400px]">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm sticky top-32">
              <h2 className="text-xl font-bold mb-6">{isId ? 'Ringkasan Pesanan' : 'Order Summary'}</h2>

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
                      Rp {Number(item.price).toLocaleString('id-ID')}
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
                  <button onClick={() => { setAppliedCoupon(null); setDiscountAmount(0); setCouponCode(""); localStorage.removeItem('appliedCoupon'); localStorage.removeItem('discountAmount'); }} className="bg-red-500 text-white px-4 py-2 text-sm font-bold rounded">Cancel</button>
                ) : (
                  <button onClick={handleApplyCoupon} className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-bold rounded">Apply</button>
                )}
              </div>

              {/* Counts */}
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between">
                  <span>{t('cart.subtotal')}</span>
                  <span className="font-bold text-gray-900 dark:text-white">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('cart.shipping')}</span>
                  <span className={`font-bold ${shippingCost === 0 ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                    {shippingCost === 0 ? t('cart.free') : `Rp ${shippingCost.toLocaleString('id-ID')}`}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount ({appliedCoupon})</span>
                    <span className="font-bold">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {referralDiscount > 0 && (
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span className="flex items-center gap-1">Referral Reward (5%) <span className="text-[10px] bg-red-100 dark:bg-red-900/30 px-1 rounded">REF:{referralCode}</span></span>
                    <span className="font-bold">- Rp {referralDiscount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>PPN (11%)</span>
                  <span className="font-bold text-gray-900 dark:text-white">Rp {Math.round((subtotal - discountAmount - referralDiscount) * 0.11).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-end mb-8">
                <span className="text-lg font-bold">{t('cart.total')}</span>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block mb-1">IDR</span>
                  <span className="text-3xl font-[900] tracking-tight text-red-600 dark:text-red-500">
                    Rp{Math.max(0, Math.round((subtotal - discountAmount - referralDiscount) * 1.11) + shippingCost).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCreateOrder}
                disabled={creating}
                className="w-full bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black font-black py-5 rounded-xl shadow-2xl uppercase tracking-[0.2em] text-[10px] transition-all active:scale-[0.97] mb-4 disabled:opacity-50"
              >
                {creating ? (isId ? "Memproses..." : "Processing...") : (isId ? "Lanjut ke Status Pesanan →" : "Continue to Order Status →")}
              </button>

              <div className="mt-8 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-300">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Secure 256-bit SSL Metadata Encryption
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PaymentDashboard;
