import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BackButton from "../components/BackButton.jsx";
import config from '../config.js';
import { useAuth } from "../contexts/AuthContext";
import { getImageUrl } from "../utils/imageHelper";
import { useCurrency } from "../components/CurrencyContext.jsx";
import { useCart } from "../components/CartContext.jsx";

const PaymentDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userEmail, logout } = useAuth();
  const { cart: globalCart, clearCart } = useCart();
  const { t, language } = useCurrency();
  const isId = language !== 'EN';
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [hasActiveCoupons, setHasActiveCoupons] = useState(false);

  useEffect(() => {
    fetch(`${config.API_URL}/api/coupons/active`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setHasActiveCoupons(true);
        }
      })
      .catch(err => console.error("Error fetching active coupons:", err));
  }, []);

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
    if (userEmail) {
      const token = localStorage.getItem("token");
      fetch(`${config.API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.status === 401) {
          logout();
          navigate("/login");
          throw new Error("Session expired");
        }
        return res.json();
      })
      .then(profile => {
        if (profile) {
          setAddress(prev => ({
            ...prev,
            firstName: profile.first_name || prev.firstName,
            lastName: profile.last_name || prev.lastName,
            phone: profile.phone || prev.phone,
            address: profile.address || prev.address,
            postalCode: profile.postal_code || prev.postalCode,
          }));
          
          if (profile.province_id) {
            setSelectedProvince(profile.province_id);
            localStorage.setItem('sel_prov', profile.province_id);
          }
          if (profile.city_id) {
            setSelectedCity(profile.city_id);
            localStorage.setItem('sel_city', profile.city_id);
          }
          if (profile.district_id) {
            setSelectedDistrict(profile.district_id);
            localStorage.setItem('sel_dist', profile.district_id);
          }
          if (profile.area_id) {
            setSelectedVillage(profile.area_id);
            localStorage.setItem('sel_vill', profile.area_id);
          }
        }
      })
      .catch(err => {
        console.error("Error fetching checkout profile:", err);
        const saved = localStorage.getItem(`savedAddress_${userEmail}`);
        if (saved) {
          try { setAddress(JSON.parse(saved)); } catch(e){}
        }
      });
    } else {
      const saved = localStorage.getItem(`savedAddress_guest`);
      if (saved) {
        try { setAddress(JSON.parse(saved)); } catch(e){}
      }
    }
  }, [userEmail]);
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(localStorage.getItem('selectedPaymentMethod') || "midtrans");

  useEffect(() => {
    localStorage.setItem('selectedPaymentMethod', selectedPaymentMethod);
  }, [selectedPaymentMethod]);

  useEffect(() => {
    if (address && (address.firstName || address.lastName || address.address || address.postalCode || address.phone)) {
      localStorage.setItem(`savedAddress_${userEmail || 'guest'}`, JSON.stringify(address));
    }
  }, [address, userEmail]);

  // Coupon State
  const [couponCode, setCouponCode] = useState(localStorage.getItem('appliedCoupon') || "");
  const [discountAmount, setDiscountAmount] = useState(Number(localStorage.getItem('discountAmount')) || 0);
  const [appliedCoupon, setAppliedCoupon] = useState(localStorage.getItem('appliedCoupon') || null);
  const [referralCode, setReferralCode] = useState("");
  const [referralDiscount, setReferralDiscount] = useState(0);

  // Manual methods (always available)
  const staticMethods = [
    { label: "Midtrans (QRIS, VA, E-Wallet)", value: "midtrans" },
    { label: language === 'EN' ? "COD (Cash on Delivery)" : "COD (Bayar di Tempat)", value: "cod" }
  ];

  useEffect(() => {
    setMethods(staticMethods);
    const savedMethod = localStorage.getItem('selectedPaymentMethod');
    setSelectedPaymentMethod(savedMethod || "midtrans");

    const orderId = searchParams.get("orderId");
    if (!orderId) {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (!orderId) {
      setCart(globalCart);
      const st = globalCart.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.qty || 1), 0);
      setSubtotal(st);
    }
  }, [globalCart, searchParams]);

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (orderId) {
      if (orderId.startsWith('temp-')) {
        const tempPendingStr = localStorage.getItem('tempPendingOrder');
        if (tempPendingStr) {
          try {
            const tempData = JSON.parse(tempPendingStr);
            let items = tempData.items;
            let addr = tempData.shippingAddress || tempData.shipping_address;

            // Restore cart in local state
            setCart(items || []);
            const st = (items || []).reduce((sum, item) => sum + (Number(item.price) || 0) * (item.qty || 1), 0);
            setSubtotal(st);

            // Restore address fields
            if (addr) {
              setAddress({
                firstName: addr.firstName || "",
                lastName: addr.lastName || "",
                address: addr.address || "",
                city: addr.city || "",
                postalCode: addr.postalCode || "",
                phone: addr.phone || "",
                note: addr.note || ""
              });

              if (addr.provinceId) setSelectedProvince(addr.provinceId);
              if (addr.cityId) setSelectedCity(addr.cityId);
              if (addr.districtId) setSelectedDistrict(addr.districtId);
              if (addr.areaId) setSelectedVillage(addr.areaId);

              // Restore courier and selected service if saved
              if (tempData.selectedCourier) {
                setCourier(tempData.selectedCourier);
                localStorage.setItem('selectedCourier', tempData.selectedCourier);
              }
              if (tempData.selectedService) {
                setSelectedService(tempData.selectedService);
                localStorage.setItem('selectedService', JSON.stringify(tempData.selectedService));
              }
            }

            // Restore payment method
            if (tempData.paymentMethod) {
              setSelectedPaymentMethod(tempData.paymentMethod);
              localStorage.setItem('selectedPaymentMethod', tempData.paymentMethod);
            }

            setLoading(false);
            return;
          } catch (e) {
            console.error("Error restoring tempPendingOrder in checkout:", e);
          }
        }
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
          let addr = data.shipping_address || data.shippingAddress;
          if (typeof addr === 'string') {
            try { addr = JSON.parse(addr); } catch (e) { }
          }

          setEditingOrder({ ...data, shipping_address: addr, shippingAddress: addr });
          setCart(items || []);
          const st = (items || []).reduce((sum, item) => sum + (Number(item.price) || 0) * (item.qty || 1), 0);
          setSubtotal(st);

          if (addr) {
            setAddress({
              firstName: addr.firstName || "",
              lastName: addr.lastName || "",
              address: addr.address || "",
              city: addr.city || "",
              postalCode: addr.postalCode || "",
              phone: addr.phone || "",
              note: addr.note || ""
            });

            if (addr.provinceId) {
              setSelectedProvince(addr.provinceId);
            }
            if (addr.cityId) {
              setSelectedCity(addr.cityId);
            }
            if (addr.districtId) {
              setSelectedDistrict(addr.districtId);
            }
            if (addr.areaId) {
              setSelectedVillage(addr.areaId);
            }
          }

          if (data.paymentMethod) {
            setSelectedPaymentMethod(data.paymentMethod);
          }
          if (data.coupon_code || data.couponCode) {
            setAppliedCoupon(data.coupon_code || data.couponCode);
            setCouponCode(data.coupon_code || data.couponCode);
          }
          if (data.discount_amount || data.discountAmount) {
            setDiscountAmount(Number(data.discount_amount || data.discountAmount) || 0);
          }
        })
        .catch(err => {
          console.error("Error fetching order for edit:", err);
          setError("Gagal mengambil data pesanan");
        })
        .finally(() => setLoading(false));
    }
  }, [searchParams]);

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
        alert(language === 'EN' ? `Coupon ${data.couponCode} applied successfully! Saved Rp${data.discountAmount.toLocaleString('id-ID')}` : `Kupon ${data.couponCode} berhasil! Hemat Rp${data.discountAmount.toLocaleString('id-ID')}`);
      } else {
        setDiscountAmount(0);
        setAppliedCoupon(null);
        localStorage.removeItem('appliedCoupon');
        localStorage.removeItem('discountAmount');
        alert(data.error || (language === 'EN' ? "Invalid coupon" : "Kupon tidak valid"));
      }
    } catch (e) {
      alert(language === 'EN' ? "Failed to verify coupon" : "Gagal memverifikasi kupon");
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
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);

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
          // Sort by price ascending to automatically find the cheapest option
          const sorted = [...data.pricing].sort((a, b) => Number(a.price) - Number(b.price));
          setShippingOptions(sorted);
          setSelectedAreaId(data.area_id);
          setShippingError(null);
          
          // Auto select the cheapest option as default
          const cheapest = sorted[0];
          setSelectedService(cheapest);
          setShippingCost(subtotal > 500000 ? 0 : Number(cheapest.price));
          setShippingMethod(`${cheapest.company.toUpperCase()} - ${cheapest.courier_service_name}`);
          localStorage.setItem('selectedService', JSON.stringify(cheapest));
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
  }, [selectedVillage, cart, provinces, cities, districts, villages, subtotal]);

  const handleServiceChange = (service) => {
    setSelectedService(service);
    setShippingCost(subtotal > 500000 ? 0 : Number(service.price));
    setShippingMethod(`${service.company.toUpperCase()} - ${service.courier_service_name}`);
    localStorage.setItem('selectedService', JSON.stringify(service));
  };

  const handleCreateOrder = async () => {
    if (creating) return;

    if (!selectedPaymentMethod) {
      alert(language === 'EN' ? "Please select a payment method first." : "Pilih metode pembayaran terlebih dahulu.");
      return;
    }
    if (!selectedVillage || !selectedService) {
      alert(language === 'EN' ? "Please select a complete shipping address (up to village level) and courier service." : "Pilih alamat pengiriman lengkap (sampai kelurahan) dan layanan kurir.");
      return;
    }
    if (!address.firstName || !address.phone) {
      alert(language === 'EN' ? "First name and phone number are required." : "Nama depan dan nomor telepon wajib diisi.");
      return;
    }
    if (!address.address) {
      alert(language === 'EN' ? "Detailed address (street name/house number) is required." : "Detail alamat (nama jalan/nomor rumah) wajib diisi.");
      return;
    }

    // Consistent total calculation (same formula used in display)
    const discountedAmount = Math.max(0, subtotal - discountAmount - referralDiscount);
    const taxes = 0;
    const finalTotal = discountedAmount + Number(shippingCost);
    const items = cart;

    // Sync address back to user profile in database
    if (userEmail) {
      const token = localStorage.getItem("token");
      const provinceName = provinces.find(p => p.id === selectedProvince)?.name || "";
      const cityName = cities.find(c => c.id === selectedCity)?.name || "";
      const districtName = districts.find(d => d.id === selectedDistrict)?.name || "";
      const villageName = villages.find(v => v.id === selectedVillage)?.name || "";

      fetch(`${config.API_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: address.firstName,
          lastName: address.lastName,
          phone: address.phone,
          address: address.address,
          province: provinceName,
          city: cityName,
          district: districtName,
          area: villageName,
          postalCode: address.postalCode,
          provinceId: selectedProvince,
          cityId: selectedCity,
          districtId: selectedDistrict,
          areaId: selectedVillage
        })
      }).catch(err => console.error("Failed to sync profile address on checkout:", err));
    }

    const orderId = searchParams.get("orderId");
    if (orderId && !orderId.startsWith('temp-')) {
      setCreating(true);
      // Preserve original email & tempId from the existing order's shipping_address
      const originalAddr = editingOrder?.shipping_address || editingOrder?.shippingAddress || {};
      const originalEmail = originalAddr.email || userEmail || "guest@mail.com";
      const originalTempId = originalAddr.tempId;

      const updatedPayload = {
        paymentMethod: selectedPaymentMethod,
        shippingAddress: {
          ...address,
          email: originalEmail,
          ...(originalTempId ? { tempId: originalTempId } : {}),
          province: provinces.find(p => p.id === selectedProvince)?.name || "",
          city: cities.find(c => c.id === selectedCity)?.name || "",
          district: districts.find(d => d.id === selectedDistrict)?.name || "",
          area: villages.find(v => v.id === selectedVillage)?.name || "",
          provinceId: selectedProvince,
          cityId: selectedCity,
          districtId: selectedDistrict,
          areaId: selectedVillage,
          courierInfo: selectedService ? `${selectedService.company.toUpperCase()} ${selectedService.courier_service_name}` : ""
        },
        total: finalTotal > 0 ? finalTotal : 0
      };

      fetch(`${config.API_URL}/api/orders/${orderId}/payment-details`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayload)
      })
        .then(res => res.json().then(data => {
          if (!res.ok) throw new Error(data.error || "Gagal memperbarui pesanan");
          return data;
        }))
        .then(data => {
          localStorage.setItem('selectedPaymentMethod', selectedPaymentMethod);
          localStorage.setItem(`savedAddress_${userEmail || 'guest'}`, JSON.stringify(address));

          navigate(`/payment/confirm?orderId=${orderId}`);
        })
        .catch(err => {
          console.error("Order update failed:", err);
          alert(err.message || (language === 'EN' ? "An error occurred while updating your order" : "Terjadi kesalahan saat memperbarui pesanan Anda"));
        })
        .finally(() => {
          setCreating(false);
        });
      return;
    }

    if (selectedPaymentMethod === 'cod' || selectedPaymentMethod === 'midtrans') {
      const tempOrder = {
        id: "temp",
        items,
        total: finalTotal > 0 ? finalTotal : 0,
        paymentMethod: selectedPaymentMethod,
        status: 'pending',
        payment_status: 'pending',
        order_status: 'pending',
        shippingAddress: {
          ...address,
          province: provinces.find(p => p.id === selectedProvince)?.name || "",
          city: cities.find(c => c.id === selectedCity)?.name || "",
          district: districts.find(d => d.id === selectedDistrict)?.name || "",
          area: villages.find(v => v.id === selectedVillage)?.name || "",
          provinceId: selectedProvince,
          cityId: selectedCity,
          districtId: selectedDistrict,
          areaId: selectedVillage,
          courierInfo: selectedService ? `${selectedService.company.toUpperCase()} ${selectedService.courier_service_name}` : ""
        },
        couponCode: appliedCoupon,
        discountAmount: discountAmount,
        referralCode: null,
        email: userEmail || "guest@mail.com",
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('tempCheckoutOrder', JSON.stringify(tempOrder));
      localStorage.setItem('selectedPaymentMethod', selectedPaymentMethod);
      localStorage.setItem(`savedAddress_${userEmail || 'guest'}`, JSON.stringify(address));
      
      navigate(`/payment/confirm?temp=true`);
      return;
    }

    setCreating(true);
    const orderPayload = {
      userId: userEmail || "guest",
      email: userEmail || "guest@mail.com",
      items,
      total: finalTotal > 0 ? finalTotal : 0,
      paymentMethod: selectedPaymentMethod,
      status: 'pending',
      payment_status: 'pending',
      order_status: 'pending',
      shippingAddress: {
        ...address,
        province: provinces.find(p => p.id === selectedProvince)?.name || "",
        city: cities.find(c => c.id === selectedCity)?.name || "",
        district: districts.find(d => d.id === selectedDistrict)?.name || "",
        area: villages.find(v => v.id === selectedVillage)?.name || "",
        provinceId: selectedProvince,
        cityId: selectedCity,
        districtId: selectedDistrict,
        areaId: selectedVillage,
        courierInfo: selectedService ? `${selectedService.company.toUpperCase()} ${selectedService.courier_service_name}` : ""
      },
      couponCode: appliedCoupon,
      discountAmount: discountAmount,
      referralCode: null
    };

    fetch(`${config.API_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload)
    })
      .then(res => res.json().then(data => {
        if (!res.ok) throw new Error(data.error || "Gagal membuat pesanan");
        return data;
      }))
      .then(data => {
        const realOrderId = data.orderId;
        localStorage.setItem('lastOrderId', realOrderId);
        localStorage.setItem('selectedPaymentMethod', selectedPaymentMethod);
        localStorage.setItem(`savedAddress_${userEmail || 'guest'}`, JSON.stringify(address));

        // Clear cart and checkout coupons
        clearCart();
        localStorage.removeItem('cart');
        localStorage.removeItem('appliedCoupon');
        localStorage.removeItem('discountAmount');
        localStorage.removeItem('referral_code');

        navigate(`/payment/confirm?orderId=${realOrderId}`);
      })
      .catch(err => {
        console.error("Order creation failed:", err);
        alert(err.message || (language === 'EN' ? "An error occurred while processing your order" : "Terjadi kesalahan saat memproses pesanan Anda"));
      })
      .finally(() => {
        setCreating(false);
      });
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
                  value={selectedProvince} onChange={e => {
                    setSelectedProvince(e.target.value);
                    setSelectedCity("");
                    setSelectedDistrict("");
                    setSelectedVillage("");
                    localStorage.removeItem('sel_city');
                    localStorage.removeItem('sel_dist');
                    localStorage.removeItem('sel_vill');
                    localStorage.removeItem('selectedService');
                  }}
                >
                  <option value="">{isId ? "Pilih Provinsi" : "Select Province"}</option>
                  {provinceOptions}
                </select>

                <select 
                  className="w-full p-4 bg-white dark:bg-gray-800 border-none rounded shadow-sm focus:ring-1 focus:ring-black dark:text-white"
                  value={selectedCity} onChange={e => {
                    setSelectedCity(e.target.value);
                    setSelectedDistrict("");
                    setSelectedVillage("");
                    localStorage.removeItem('sel_dist');
                    localStorage.removeItem('sel_vill');
                    localStorage.removeItem('selectedService');
                  }}
                  disabled={!selectedProvince}
                >
                  <option value="">{isId ? "Pilih Kota/Kabupaten" : "Select City/Regency"}</option>
                  {cityOptions}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select 
                  className="w-full p-4 bg-white dark:bg-gray-800 border-none rounded shadow-sm focus:ring-1 focus:ring-black dark:text-white"
                  value={selectedDistrict} onChange={e => {
                    setSelectedDistrict(e.target.value);
                    setSelectedVillage("");
                    localStorage.removeItem('sel_vill');
                    localStorage.removeItem('selectedService');
                  }}
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
            <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">2</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isId ? 'Metode Pengiriman' : 'Shipping Method'}</h2>
              </div>

              {!selectedVillage ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                  <span className="text-2xl mb-2">📍</span>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                    {isId ? 'Alamat Belum Lengkap' : 'Address Incomplete'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {isId ? 'Lengkapi alamat pengiriman Anda terlebih dahulu untuk melihat pilihan kurir.' : 'Complete your shipping address first to calculate rates.'}
                  </p>
                </div>
              ) : loadingShipping ? (
                /* Loading Skeleton */
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 animate-pulse flex justify-between items-center">
                    <div className="space-y-2 w-2/3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    </div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest text-center animate-pulse">
                    {isId ? 'Menghitung biaya pengiriman terbaik...' : 'Calculating best shipping rates...'}
                  </p>
                </div>
              ) : shippingError && !shippingError.startsWith('Note:') && shippingOptions.length === 0 ? (
                /* Error state */
                <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20 text-center space-y-2">
                  <span className="text-xl">⚠️</span>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                    {isId ? 'Gagal Mendapatkan Ongkir' : 'Failed to Retrieve Shipping'}
                  </p>
                  <p className="text-xs text-red-500">{shippingError}</p>
                </div>
              ) : selectedService ? (
                /* Premium Selected Courier Card (Shopify Style) */
                <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-4 justify-between sm:items-center hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-10 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center font-black text-xs text-gray-800 dark:text-gray-200 uppercase whitespace-nowrap shrink-0">
                      {selectedService.company}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white uppercase break-words">
                        {selectedService.company.toUpperCase()} - {selectedService.courier_service_name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {isId ? 'Estimasi:' : 'Estimated:'} {selectedService.duration}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t border-gray-100 dark:border-gray-700 sm:border-t-0">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      Rp {Number(selectedService.price).toLocaleString('id-ID')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsShippingModalOpen(true)}
                      className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-bold border border-gray-200 dark:border-gray-850 hover:bg-gray-100 dark:hover:bg-gray-850 hover:text-black dark:hover:text-white transition whitespace-nowrap"
                    >
                      {isId ? 'Ubah' : 'Change'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Fallback empty state */
                <p className="text-sm text-gray-500 italic text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
                  {isId ? 'Tidak ada layanan kurir yang tersedia.' : 'No shipping options available.'}
                </p>
              )}
            </section>

            {/* 3. Payment Method */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">3</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isId ? 'Metode Pembayaran' : 'Payment Method'}</h2>
              </div>

              {/* Methods Tab */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
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
                    <div className="w-16 h-16 bg-white dark:bg-gray-100 rounded overflow-hidden relative border border-gray-200 dark:border-gray-600 shrink-0">
                      <img
                        src={getImageUrl(item?.image || (item?.images && item?.images?.[0]))}
                        alt={item.name}
                        className="w-full h-full object-contain p-1 mix-blend-multiply"
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
              {hasActiveCoupons && (
                <div className="flex gap-2 mb-8 animate-fadeIn">
                  <input
                    type="text"
                    placeholder={language === 'EN' ? "Promo Code" : "Kode Promo"}
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-transparent dark:text-white"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={appliedCoupon}
                  />
                  {appliedCoupon ? (
                    <button onClick={() => { setAppliedCoupon(null); setDiscountAmount(0); setCouponCode(""); localStorage.removeItem('appliedCoupon'); localStorage.removeItem('discountAmount'); }} className="bg-red-500 text-white px-4 py-2 text-sm font-bold rounded">{language === 'EN' ? 'Cancel' : 'Batal'}</button>
                  ) : (
                    <button onClick={handleApplyCoupon} className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-bold rounded">{language === 'EN' ? 'Apply' : 'Gunakan'}</button>
                  )}
                </div>
              )}

              {/* Counts */}
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between">
                  <span>{t('cart.subtotal')}</span>
                  <span className="font-bold text-gray-900 dark:text-white">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('cart.shipping')}</span>
                  <span className={`font-bold ${shippingCost === 0 ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                    {shippingCost === 0 ? t('cart.free') : `Rp ${Number(shippingCost).toLocaleString('id-ID')}`}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>{language === 'EN' ? 'Discount' : 'Diskon'} ({appliedCoupon})</span>
                    <span className="font-bold">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
              {/* Total */}
              <div className="flex justify-between items-end mb-8">
                <span className="text-lg font-bold">{t('cart.total')}</span>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block mb-1">IDR</span>
                  <span className="text-3xl font-[900] tracking-tight text-red-600 dark:text-red-500">
                    Rp{Math.max(0, Math.round(subtotal - discountAmount - referralDiscount) + Number(shippingCost)).toLocaleString('id-ID')}
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
      {/* Shipping Method Selection Modal */}
      {isShippingModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsShippingModalOpen(false)}
          ></div>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 max-w-md w-full relative z-10 shadow-2xl rounded-2xl transform transition-all animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setIsShippingModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black dark:hover:text-white text-xl font-bold"
            >
              &times;
            </button>
            <h3 className="text-lg font-black uppercase tracking-tight mb-4 dark:text-white">
              {isId ? 'Pilih Metode Pengiriman' : 'Select Shipping Method'}
            </h3>
            <p className="text-xs text-gray-500 mb-6 font-light">
              {isId 
                ? 'Kami menampilkan seluruh pilihan pengiriman otomatis terjangkau langsung dari RajaOngkir.' 
                : 'All available delivery options pulled directly from RajaOngkir.'}
            </p>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {shippingOptions.map((opt, idx) => {
                const isSelected = selectedService?.courier_service_code === opt.courier_service_code && selectedService?.company === opt.company;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      handleServiceChange(opt);
                      setIsShippingModalOpen(false);
                    }}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-850 ring-1 ring-black dark:ring-white' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-900'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center font-bold text-[10px] text-gray-700 dark:text-gray-300 uppercase border border-gray-100 dark:border-gray-800 whitespace-nowrap">
                        {opt.company}
                      </div>
                      <div>
                        <div className="font-bold text-xs uppercase text-gray-900 dark:text-white">
                          {opt.company.toUpperCase()} - {opt.courier_service_name}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium">
                          {isId ? 'Estimasi:' : 'Estimated:'} {opt.duration}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-xs text-gray-900 dark:text-white">
                        {subtotal > 500000 ? (isId ? 'Gratis' : 'Free') : `Rp ${Number(opt.price).toLocaleString('id-ID')}`}
                      </span>
                      {isSelected && (
                        <span className="text-green-600 font-black text-sm">✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <button 
              onClick={() => setIsShippingModalOpen(false)}
              className="mt-6 w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition hover:opacity-90 active:scale-95 shadow-lg"
            >
              {isId ? 'Tutup' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDashboard;
