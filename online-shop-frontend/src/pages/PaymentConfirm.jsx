import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import config from '../config.js';
import { getImageUrl } from "../utils/imageHelper";
import { useCurrency } from "../components/CurrencyContext.jsx";
import { useCart } from "../components/CartContext.jsx";
import { formatDisplayOrderId } from "../utils/orderHelper";

const PaymentConfirm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const orderIdParam = searchParams.get("orderId");
  const isTemp = searchParams.get("temp") === "true" || (orderIdParam && orderIdParam.startsWith('temp-'));
  const { cart, clearCart } = useCart();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t, language } = useCurrency();

  const [snapToken, setSnapToken] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [tempOrderId, setTempOrderId] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);


  // Guard: prevent duplicate pending-order creation across onClose/onError/handleGoBack/unmount
  const pendingCreatedRef = useRef(false);
  const paymentDataRef = useRef(null);
  const tempOrderIdRef = useRef("");
  const paymentAttemptedRef = useRef(false);
  const isNavigatingBackRef = useRef(false);

  useEffect(() => {
    paymentDataRef.current = paymentData;
  }, [paymentData]);

  useEffect(() => {
    tempOrderIdRef.current = tempOrderId;
  }, [tempOrderId]);

  const onUnmountRef = useRef(null);

  useEffect(() => {
    onUnmountRef.current = createAndSavePendingOrderRef;
  });

  const logDebug = (msg) => {
    try {
      const logs = JSON.parse(localStorage.getItem('debug_autosave_logs') || '[]');
      logs.push(`${new Date().toLocaleTimeString()}: ${msg}`);
      localStorage.setItem('debug_autosave_logs', JSON.stringify(logs.slice(-50)));
    } catch(e){}
  };

  const createAndSavePendingOrderRef = (isUnload = false) => {
    logDebug(`createAndSavePendingOrderRef: triggered (isUnload=${isUnload})`);
    if (pendingCreatedRef.current) {
      logDebug("createAndSavePendingOrderRef: Abort (already saved)");
      return;
    }
    // Prevent auto-save if they are just navigating back to payment edit
    if (isNavigatingBackRef.current) {
      logDebug("createAndSavePendingOrderRef: Abort (navigating back to payment edit)");
      return;
    }
    // Prevent auto-save if they are navigating back to payment or cart page (e.g. browser back button)
    const destPath = window.location.pathname;
    if (destPath === '/payment' || destPath === '/cart') {
      logDebug(`createAndSavePendingOrderRef: Abort (navigating back to ${destPath})`);
      return;
    }
    let currentPaymentData = paymentDataRef.current;
    if (!currentPaymentData) {
      logDebug("createAndSavePendingOrderRef: paymentData state is null, falling back to localStorage tempCheckoutOrder");
      const tempStr = localStorage.getItem('tempCheckoutOrder') || localStorage.getItem('tempCodOrder') || localStorage.getItem('tempMidtransOrder');
      if (tempStr) {
        try {
          currentPaymentData = JSON.parse(tempStr);
        } catch (e) {
          logDebug("createAndSavePendingOrderRef: failed to parse tempCheckoutOrder from localStorage");
        }
      }
    }
    if (!currentPaymentData) {
      logDebug("createAndSavePendingOrderRef: Abort (paymentData is null)");
      return;
    }
    if (currentPaymentData.id !== 'temp') {
      logDebug(`createAndSavePendingOrderRef: Abort (id is not temp: ${currentPaymentData.id})`);
      return;
    }
    pendingCreatedRef.current = true;

    let savedService = null;
    try {
      const savedServiceStr = localStorage.getItem('selectedService');
      if (savedServiceStr) savedService = JSON.parse(savedServiceStr);
    } catch(e){}

    const email = (currentPaymentData.shippingAddress && currentPaymentData.shippingAddress.email) || currentPaymentData.email || "customer@mail.com";
    const uniqueTempId = tempOrderIdRef.current || `midtrans-${Date.now()}`;
    const payload = {
      id: `temp-${uniqueTempId}`,
      userId: currentPaymentData.userId || "guest",
      email: email,
      items: currentPaymentData.items,
      total: currentPaymentData.total,
      paymentMethod: currentPaymentData.paymentMethod || "midtrans",
      status: 'pending',
      payment_status: 'pending',
      order_status: 'pending',
      shippingAddress: {
        ...(currentPaymentData.shippingAddress || {}),
        tempId: uniqueTempId
      },
      couponCode: currentPaymentData.couponCode,
      discountAmount: currentPaymentData.discountAmount,
      referralCode: currentPaymentData.referralCode,
      selectedCourier: localStorage.getItem('selectedCourier') || 'jne',
      selectedService: savedService,
      createdAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('tempPendingOrder', JSON.stringify(payload));
      logDebug("createAndSavePendingOrderRef: Saved tempPendingOrder to localStorage.");
    } catch (err) {
      logDebug(`createAndSavePendingOrderRef: localStorage error: ${err.message}`);
    }

    // Clear cart & temp data
    clearCart();
    localStorage.removeItem('cart');
    localStorage.removeItem('tempCodOrder');
    localStorage.removeItem('tempCheckoutOrder');
    logDebug("createAndSavePendingOrderRef: Cart and temp checkout cleared.");
  };

  useEffect(() => {
    // Clear paymentAttempted on new mount to ensure fresh status
    localStorage.removeItem('paymentAttempted');
    paymentAttemptedRef.current = false;
    
    logDebug("PaymentConfirm: mounted");
    return () => {
      logDebug("PaymentConfirm: unmounting cleanup running via onUnmountRef");
      if (onUnmountRef.current) {
        onUnmountRef.current();
      }
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      logDebug("beforeunload: triggered");
      createAndSavePendingOrderRef(true);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);



  // Address editing states
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddressDetail, setEditAddressDetail] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editPostalCode, setEditPostalCode] = useState("");
  const [editProvince, setEditProvince] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editArea, setEditArea] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const handleStartEditAddress = () => {
    if (!paymentData || !paymentData.shippingAddress) return;
    const addr = paymentData.shippingAddress;
    setEditFirstName(addr.firstName || "");
    setEditLastName(addr.lastName || "");
    setEditPhone(addr.phone || "");
    setEditAddressDetail(addr.address || "");
    setEditNote(addr.note || "");
    setEditPostalCode(addr.postalCode || "");
    setEditProvince(addr.province || "");
    setEditCity(addr.city || "");
    setEditDistrict(addr.district || "");
    setEditArea(addr.area || "");
    setEditError("");
    setIsEditingAddress(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!editFirstName.trim() || !editPhone.trim() || !editAddressDetail.trim()) {
      setEditError(language === 'EN' ? "Name, Phone, and Address are required." : "Nama, Telepon, dan Alamat wajib diisi.");
      return;
    }
    setEditSaving(true);
    setEditError("");

    const updatedShippingAddress = {
      ...paymentData.shippingAddress,
      firstName: editFirstName,
      lastName: editLastName,
      phone: editPhone,
      address: editAddressDetail,
      note: editNote,
      postalCode: editPostalCode,
      province: editProvince,
      city: editCity,
      district: editDistrict,
      area: editArea
    };

    try {
      if (isTemp) {
        // Just update local storage and state
        const tempStr = localStorage.getItem('tempCheckoutOrder') || localStorage.getItem('tempCodOrder') || localStorage.getItem('tempMidtransOrder');
        if (tempStr) {
          try {
            const tempData = JSON.parse(tempStr);
            tempData.shippingAddress = updatedShippingAddress;
            tempData.shipping_address = updatedShippingAddress;
            localStorage.setItem('tempCheckoutOrder', JSON.stringify(tempData));
          } catch (e) {}
        }
        setPaymentData(prev => ({
          ...prev,
          shippingAddress: updatedShippingAddress,
          shipping_address: updatedShippingAddress
        }));
        setIsEditingAddress(false);
      } else {
        const res = await fetch(`${config.API_URL}/api/orders/${paymentData.id}/shipping-address`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shippingAddress: updatedShippingAddress })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memperbarui alamat");

        setPaymentData(prev => ({
          ...prev,
          shippingAddress: updatedShippingAddress,
          shipping_address: updatedShippingAddress
        }));
        setIsEditingAddress(false);
      }
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const fetchSnapToken = async (order) => {
    try {
      setTokenLoading(true);
      setTokenError("");
      
      const email = (order.shipping_address && order.shipping_address.email) || order.email || "customer@mail.com";
      
      let res;
      if (order.id === 'temp') {
        const orderPayload = {
          userId: order.userId || "guest",
          email: email,
          items: order.items,
          total: order.total,
          paymentMethod: order.paymentMethod || "midtrans",
          shippingAddress: order.shippingAddress || order.shipping_address,
          couponCode: order.couponCode,
          discountAmount: order.discountAmount,
          referralCode: order.referralCode
        };
        res = await fetch(`${config.API_URL}/api/midtrans/prepare`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderPayload,
            total: order.total,
            email: email
          })
        });
      } else {
        res = await fetch(`${config.API_URL}/api/midtrans/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            total: order.total,
            email: email
          })
        });
      }

      const data = await res.json();
      if (!data.token) throw new Error(data.detail || "Gagal mendapatkan token pembayaran");
      
      setSnapToken(data.token);
      if (order.id === 'temp' && data.tempId) {
        setTempOrderId(data.tempId);
      }
    } catch (err) {
      console.error("Token prefetch error:", err);
      setTokenError(err.message || "Gagal membuat token pembayaran");
    } finally {
      setTokenLoading(false);
    }
  };

  useEffect(() => {
    const isTempParam = searchParams.get("temp") === "true";
    if (isTempParam) {
      const tempStr = localStorage.getItem('tempCheckoutOrder') || localStorage.getItem('tempCodOrder') || localStorage.getItem('tempMidtransOrder');
      if (tempStr) {
        try {
          const tempData = JSON.parse(tempStr);
          // Normalize address field
          tempData.shippingAddress = tempData.shippingAddress || tempData.shipping_address;
          tempData.shipping_address = tempData.shippingAddress;
          tempData.payment_status = tempData.payment_status || tempData.status || 'pending';
          tempData.order_status = tempData.order_status || tempData.status || 'pending';
          setPaymentData(tempData);
          setError("");
          setLoading(false);
          
          if (tempData.paymentMethod && tempData.paymentMethod !== "cod" && tempData.paymentMethod !== "mandiri_tf") {
            fetchSnapToken(tempData);
          }
          return;
        } catch(e){}
      }
    }

    const orderId = searchParams.get("orderId") || localStorage.getItem("lastOrderId");

    if (orderId && orderId.startsWith('temp-')) {
      const tempPendingStr = localStorage.getItem('tempPendingOrder');
      if (tempPendingStr) {
        try {
          const tempData = JSON.parse(tempPendingStr);
          // Normalize address field
          tempData.shippingAddress = tempData.shippingAddress || tempData.shipping_address;
          tempData.shipping_address = tempData.shippingAddress;
          const parsedOrder = {
            ...tempData,
            id: 'temp',
            payment_status: tempData.payment_status || tempData.status || 'pending',
            order_status: tempData.order_status || tempData.status || 'pending',
          };
          setPaymentData(parsedOrder);
          setError("");
          setLoading(false);
          
          if (parsedOrder.paymentMethod && parsedOrder.paymentMethod !== "cod" && parsedOrder.paymentMethod !== "mandiri_tf") {
            fetchSnapToken(parsedOrder);
          }
          return;
        } catch (e) {
          console.error("Error parsing tempPendingOrder:", e);
        }
      }
      setError("Data pesanan tidak ditemukan");
      setLoading(false);
      return;
    }

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
          items = cart;
        }

        const parsedOrder = {
          ...data,
          items: items,
          total: parseFloat(data.total),
          // Normalize address field
          shippingAddress: data.shipping_address || data.shippingAddress,
          shipping_address: data.shipping_address || data.shippingAddress,
          payment_status: data.payment_status || data.status || 'pending',
          order_status: data.order_status || data.status || 'pending'
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

  }, [searchParams, isTemp]);

  // Countdown timer for unpaid/pending orders (24 hours limit)
  useEffect(() => {
    if (!paymentData || !['pending', 'waiting_payment'].includes(paymentData.payment_status)) {
      return;
    }

    const createdAtTime = new Date(paymentData.createdAt || paymentData.created_at).getTime();
    if (isNaN(createdAtTime)) return;

    const deadline = createdAtTime + 24 * 60 * 60 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const distance = deadline - now;

      if (distance <= 0) {
        setTimeLeft("00:00:00");
        setIsExpired(true);
        return true; // indicates expired
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      const formatNum = (num) => String(num).padStart(2, "0");
      setTimeLeft(`${formatNum(hours)}:${formatNum(minutes)}:${formatNum(seconds)}`);
      setIsExpired(false);
      return false;
    };

    // Run once immediately
    const expired = updateTimer();
    if (expired) return;

    const timer = setInterval(() => {
      const expired = updateTimer();
      if (expired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentData]);

  // Load Midtrans script
  useEffect(() => {
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
  }, []);


  const getOrderDisplayStatus = (order) => {
    if (!order) return { key: 'pending', label: language === 'EN' ? 'Waiting for Payment' : 'Menunggu Pembayaran', colorClass: 'bg-yellow-100 text-yellow-700 animate-pulse' };
    
    if (order.order_status === 'completed') {
      return { key: 'completed', label: language === 'EN' ? '✔ Completed' : '✔ Selesai', colorClass: 'bg-emerald-100 text-emerald-700' };
    }
    if (order.order_status === 'shipped') {
      return { key: 'shipped', label: language === 'EN' ? '🚚 Shipped' : '🚚 Dikirim', colorClass: 'bg-blue-100 text-blue-700' };
    }
    if (order.order_status === 'processing') {
      return { key: 'processing', label: language === 'EN' ? '⚙ Processing' : '⚙ Diproses', colorClass: 'bg-teal-100 text-teal-700' };
    }
    if (order.order_status === 'cancelled') {
      return { key: 'cancelled', label: language === 'EN' ? '✘ Cancelled' : '✘ Dibatalkan', colorClass: 'bg-red-100 text-red-700' };
    }
    if (order.order_status === 'waiting_verification' || order.payment_status === 'waiting_verification') {
      return { key: 'waiting_verification', label: language === 'EN' ? '⌛ Waiting Verification' : '⌛ Menunggu Verifikasi', colorClass: 'bg-amber-100 text-amber-700 animate-pulse' };
    }
    if (order.payment_status === 'paid') {
      return { key: 'paid', label: language === 'EN' ? '✔ Paid' : '✔ Lunas', colorClass: 'bg-green-100 text-green-700' };
    }
    if (order.payment_status === 'failed') {
      return { key: 'failed', label: language === 'EN' ? '✘ Failed' : '✘ Gagal', colorClass: 'bg-red-100 text-red-700' };
    }
    if (order.payment_status === 'expired') {
      return { key: 'expired', label: language === 'EN' ? '✘ Expired' : '✘ Kedaluwarsa', colorClass: 'bg-red-100 text-red-700' };
    }
    return { key: 'pending', label: language === 'EN' ? '⌛ Waiting for Payment' : '⌛ Menunggu Pembayaran', colorClass: 'bg-yellow-100 text-yellow-700 animate-pulse' };
  };

  const getActiveStepIndex = (status) => {
    switch (status) {
      case 'completed': return 4;
      case 'shipped': return 3;
      case 'paid':
      case 'processing':
      case 'waiting_verification': return 1;
      case 'pending':
      case 'waiting_payment': return 0;
      default: return 0;
    }
  };

  const shopeeSteps = [
    { key: 'placed', labelID: 'Pesanan Dibuat', labelEN: 'Order Created', icon: 'doc' },
    { key: 'picked_up', labelID: 'Paket Dikirim', labelEN: 'Picked Up', icon: 'picked' },
    { key: 'sorting', labelID: 'Penyortiran', labelEN: 'Sorting', icon: 'sorting' },
    { key: 'delivery', labelID: 'Pengiriman Kurir', labelEN: 'Courier Delivery', icon: 'delivery' },
    { key: 'delivered', labelID: 'Diterima', labelEN: 'Delivered', icon: 'delivered' },
  ];

  const renderStepIcon = (icon, isActive) => {
    const activeColor = "text-emerald-500 dark:text-emerald-400";
    const inactiveColor = "text-gray-300 dark:text-gray-600";
    const strokeColor = "currentColor";

    switch (icon) {
      case "doc":
        return (
          <svg className={`w-5 h-5 ${isActive ? activeColor : inactiveColor}`} fill="none" stroke={strokeColor} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "picked":
        return (
          <svg className={`w-5 h-5 ${isActive ? activeColor : inactiveColor}`} fill="none" stroke={strokeColor} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l2 2 4-4" />
          </svg>
        );
      case "sorting":
        return (
          <svg className={`w-5 h-5 ${isActive ? activeColor : inactiveColor}`} fill="none" stroke={strokeColor} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case "delivery":
        return (
          <svg className={`w-5 h-5 ${isActive ? activeColor : inactiveColor}`} fill="none" stroke={strokeColor} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
        );
      case "delivered":
        return (
          <svg className={`w-5 h-5 ${isActive ? activeColor : inactiveColor}`} fill="none" stroke={strokeColor} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const maskPhone = (phone) => {
    if (!phone) return "—";
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length >= 4) {
      const lastFour = digitsOnly.slice(-4);
      return `*** **** **** ${lastFour}`;
    }
    return phone;
  };

  const maskName = (name) => {
    if (!name) return "—";
    const parts = name.trim().split(/\s+/);
    return parts.map(part => {
      if (part.length <= 1) return part;
      return part.charAt(0) + "*".repeat(part.length - 1);
    }).join(" ");
  };

  const generateTimeline = (order) => {
    if (!order) return [];
    
    const createdDate = new Date(order.createdAt || order.created_at);
    const now = new Date();
    const address = order.shippingAddress || order.shipping_address || {};

    const getSafeDate = (offsetMs, index) => {
      const target = new Date(createdDate.getTime() + offsetMs);
      if (target > now) {
        return new Date(now.getTime() - (10 - index) * 1000);
      }
      return target;
    };

    const formatDate = (date) => {
      const options = { day: 'numeric', month: 'short', year: 'numeric' };
      return date.toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US', options);
    };

    const formatTime = (date) => {
      return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const recipientCity = address.city || "Kota Tujuan";
    const courierName = address.courierInfo || "Standard Delivery";

    const timeline = [];
    const hr = 60 * 60 * 1000;

    // 1. Order Placed (Day 0, +0 mins)
    const t1Date = getSafeDate(0, 1);
    timeline.push({
      title: language === 'ID' 
        ? `[System] Pesanan berhasil dibuat dengan Nomor Resi Internal #${order.id ? order.id.slice(0, 8) : 'GUDANG'}.`
        : `[System] Order placed successfully with Internal Reference #${order.id ? order.id.slice(0, 8) : 'WH'}.`,
      date: formatDate(t1Date),
      time: formatTime(t1Date)
    });

    const displayKey = getOrderDisplayStatus(order).key;

    if (displayKey === 'cancelled' || order.payment_status === 'expired' || order.payment_status === 'failed') {
      const tCancelDate = getSafeDate(30 * 60 * 1000, 1);
      timeline.unshift({
        title: language === 'ID'
          ? `[System] Pesanan dibatalkan. Alasan: ${order.payment_status === 'expired' ? 'Batas waktu pembayaran habis (24 jam)' : 'Dibatalkan oleh pembeli/admin'}.`
          : `[System] Order cancelled. Reason: ${order.payment_status === 'expired' ? 'Payment time limit exceeded (24 hours)' : 'Cancelled by customer/admin'}.`,
        date: formatDate(tCancelDate),
        time: formatTime(tCancelDate)
      });
      return timeline;
    }

    // 2. Payment Confirmed (Day 0, +1 hour)
    if (['paid', 'processing', 'shipped', 'completed'].includes(displayKey)) {
      const t2Date = getSafeDate(1 * hr, 2);
      timeline.unshift({
        title: language === 'ID'
          ? `[System] Pembayaran berhasil diverifikasi. Pesanan sedang diproses di gudang.`
          : `[System] Payment confirmed. Preparing order at warehouse.`,
        date: formatDate(t2Date),
        time: formatTime(t2Date)
      });
    }

    // 3. Picked Up (Day 1, +26 hours)
    if (['processing', 'shipped', 'completed'].includes(displayKey)) {
      const t3Date = getSafeDate(26 * hr, 3);
      timeline.unshift({
        title: language === 'ID'
          ? `[Warehouse] Paket telah dikemas dan diserahkan ke kurir pengantar (${courierName}).`
          : `[Warehouse] Package has been packed and picked up by courier (${courierName}).`,
        date: formatDate(t3Date),
        time: formatTime(t3Date)
      });
    }

    // 4. Sorting Center Arrival (Day 2, +48 hours)
    if (['shipped', 'completed'].includes(displayKey)) {
      const t4Date = getSafeDate(48 * hr, 4);
      timeline.unshift({
        title: language === 'ID'
          ? `[Jakarta Sorting Center] Paket telah diterima di pusat penyortiran.`
          : `[Jakarta Sorting Center] Package has been received by sorting center.`,
        date: formatDate(t4Date),
        time: formatTime(t4Date)
      });

      // 4b. Sorting Center Transit (Day 2, +60 hours)
      const t5Date = getSafeDate(60 * hr, 5);
      timeline.unshift({
        title: language === 'ID'
          ? `[Jakarta Sorting Center] Paket sedang dalam perjalanan menuju [Hub ${recipientCity}].`
          : `[Jakarta Sorting Center] Package is being transported to [${recipientCity} Hub].`,
        date: formatDate(t5Date),
        time: formatTime(t5Date)
      });
    }

    // 5. Hub Arrival (Day 3, +74 hours)
    if (['shipped', 'completed'].includes(displayKey)) {
      const t6Date = getSafeDate(74 * hr, 6);
      timeline.unshift({
        title: language === 'ID'
          ? `[Hub ${recipientCity}] Paket telah tiba di hub pengiriman wilayah tujuan.`
          : `[${recipientCity} Hub] Package has been received by delivery hub.`,
        date: formatDate(t6Date),
        time: formatTime(t6Date)
      });

      // 5b. Delivery Courier (Day 4, +98 hours)
      const t7Date = getSafeDate(98 * hr, 7);
      timeline.unshift({
        title: language === 'ID'
          ? `[Hub ${recipientCity}] Paket sedang dibawa oleh kurir menuju alamat penerima.`
          : `[${recipientCity} Hub] Package is being delivered by courier to recipient's address.`,
        date: formatDate(t7Date),
        time: formatTime(t7Date)
      });
    }

    // 6. Delivered (Day 4, +110 hours)
    if (displayKey === 'completed') {
      const t8Date = getSafeDate(110 * hr, 8);
      const recipientName = address.name || `${address.firstName || ''} ${address.lastName || ''}`.trim() || 'Penerima';
      timeline.unshift({
        title: language === 'ID'
          ? `[Hub ${recipientCity}] Paket telah berhasil diterima oleh: ${maskName(recipientName)} [Bukti pengiriman: foto diunggah oleh kurir].`
          : `[${recipientCity} Hub] Package has been successfully delivered. Received by: ${maskName(recipientName)} [Proof of delivery: photo uploaded].`,
        date: formatDate(t8Date),
        time: formatTime(t8Date)
      });
    }

    return timeline;
  };

  const updateCustomerStatus = async (orderId, status) => {
    try {
      await fetch(`${config.API_URL}/api/orders/${orderId}/customer-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (e) {
      console.error("Failed to update customer status:", e);
    }
  };

  const handleCreateDatabaseOrder = async (orderStatus) => {
    const email = (paymentData.shippingAddress && paymentData.shippingAddress.email) || paymentData.email || "customer@mail.com";
    const createRes = await fetch(`${config.API_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: paymentData.userId || "guest",
        email: email,
        items: paymentData.items,
        total: paymentData.total,
        paymentMethod: "midtrans",
        status: orderStatus,
        shippingAddress: {
          ...(paymentData.shippingAddress || {}),
          tempId: tempOrderId
        },
        couponCode: paymentData.couponCode,
        discountAmount: paymentData.discountAmount,
        referralCode: paymentData.referralCode
      })
    });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(createData.error || "Gagal membuat pesanan");
    return createData.orderId;
  };

  /**
   * Saves a temp Midtrans order as "pending" in the DB (once only).
   * Returns the newly created orderId, or null if already created.
   */
  const createAndSavePendingOrder = async () => {
    if (pendingCreatedRef.current) return null;   // already saved
    if (!paymentData || paymentData.id !== 'temp') return null; // not a temp order
    // Check if payment was attempted (clicked Pay Now)
    if (!paymentAttemptedRef.current && localStorage.getItem('paymentAttempted') !== 'true') {
      return null;
    }
    pendingCreatedRef.current = true;
    try {
      const newOrderId = await handleCreateDatabaseOrder('pending');
      // Clear cart & temp data
      clearCart();
      localStorage.removeItem('cart');
      localStorage.removeItem('tempCodOrder');
      localStorage.removeItem('tempCheckoutOrder');
      return newOrderId;
    } catch (err) {
      console.error("Failed to save pending order:", err);
      pendingCreatedRef.current = false; // allow retry on error
      return null;
    }
  };

  const [processing, setProcessing] = useState(false);
  const method = paymentData?.paymentMethod;

  const handlePayment = async () => {
    if (!method) return;

    try {
      setProcessing(true);

      // ─── COD FLOW ───────────────────────────────────────────────────
      if (method === "cod") {
        if (isTemp) {
          pendingCreatedRef.current = true; // Set guard immediately
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
          clearCart();
          localStorage.removeItem('cart');
          localStorage.removeItem('tempCodOrder');
          localStorage.removeItem('tempCheckoutOrder');
          localStorage.removeItem('tempPendingOrder');
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

          // Save success metadata for Success page (same as temp flow)
          localStorage.setItem('lastOrderId', paymentData.id);
          localStorage.setItem('cartTotal', paymentData.total);
          localStorage.setItem('lastOrderItems', JSON.stringify(paymentData.items));
          localStorage.setItem('lastOrderEmail', paymentData.shippingAddress?.email || paymentData.email || "");

          clearCart();
          localStorage.removeItem('cart');
          localStorage.removeItem('tempCodOrder');
          localStorage.removeItem('tempCheckoutOrder');
          localStorage.removeItem('tempPendingOrder');
          localStorage.removeItem('referral_code');
          localStorage.removeItem('appliedCoupon');
          localStorage.removeItem('discountAmount');

          navigate("/payment-success");
          return;
        }
      }

      // ─── MIDTRANS FLOW ──────────────────────────────────────────────
      if (!window.snap) {
        throw new Error(language === 'EN' ? "Midtrans payment system is not ready. Please refresh the page and try again in a few seconds." : "Sistem pembayaran Midtrans belum siap. Silakan refresh halaman dan coba beberapa detik lagi.");
      }

      let activeSnapToken = snapToken;
      let activeOrderId = paymentData.id;

      if (!activeSnapToken) {
        if (tokenError) throw new Error(tokenError);
        throw new Error(language === 'EN' ? "Payment token is not ready. Please try again." : "Token pembayaran belum siap. Silakan coba kembali.");
      }

      // Mark payment as attempted
      paymentAttemptedRef.current = true;
      localStorage.setItem('paymentAttempted', 'true');
      logDebug("handlePayment: paymentAttempted flags set to true");

      window.snap.pay(activeSnapToken, {
        onSuccess: async () => {
          let finalOrderId = activeOrderId;
          if (isTemp) {
            try {
              pendingCreatedRef.current = true; // Set guard immediately
              finalOrderId = await handleCreateDatabaseOrder('paid');
            } catch (err) {
              alert(err.message || "Gagal menyimpan data pesanan Anda.");
              return;
            }
          } else {
            await updateCustomerStatus(activeOrderId, 'paid');
          }

          // Save success metadata for Success page
          localStorage.setItem('lastOrderId', finalOrderId);
          localStorage.setItem('cartTotal', paymentData.total);
          localStorage.setItem('lastOrderItems', JSON.stringify(paymentData.items));
          localStorage.setItem('lastOrderEmail', paymentData.email || "guest@mail.com");

          // Clear remaining temp files
          localStorage.removeItem('tempCodOrder');
          localStorage.removeItem('tempCheckoutOrder');
          localStorage.removeItem('tempPendingOrder');
          localStorage.removeItem('referral_code');
          localStorage.removeItem('appliedCoupon');
          localStorage.removeItem('discountAmount');

          // Clear cart
          clearCart();
          localStorage.removeItem('cart');

          navigate("/payment-success");
        },
        onPending: async (result) => {
          console.log("Midtrans pending result:", result);
          const payType = (result?.payment_type || '').toLowerCase();
          const isPayLater = ['bank_transfer', 'echannel', 'cstore'].includes(payType) || payType.includes('va') || payType.includes('transfer') || payType.includes('bill');

          if (!isPayLater) {
            console.log("Immediate payment pending, waiting for success or close/error.");
            return;
          }

          let finalOrderId = activeOrderId;
          if (isTemp) {
            try {
              pendingCreatedRef.current = true; // Set guard immediately
              finalOrderId = await handleCreateDatabaseOrder('waiting_payment');
            } catch (err) {
              alert(err.message || "Gagal menyimpan data pesanan Anda.");
              return;
            }
          } else {
            await updateCustomerStatus(activeOrderId, 'waiting_payment');
          }

          localStorage.removeItem('tempCodOrder');
          localStorage.removeItem('tempCheckoutOrder');
          localStorage.removeItem('tempPendingOrder');

          // Clear cart
          clearCart();
          localStorage.removeItem('cart');

          alert(language === 'EN' ? "Waiting for payment..." : "Menunggu pembayaran...");
          navigate("/profile");
        },
        onError: async () => {
          if (isTemp) {
            alert(language === 'EN' ? "Payment failed. Please try again." : "Pembayaran gagal. Silakan coba kembali.");
          } else {
            await updateCustomerStatus(activeOrderId, 'pending');
            localStorage.removeItem('tempCodOrder');
            localStorage.removeItem('tempCheckoutOrder');
            clearCart();
            localStorage.removeItem('cart');
            alert(language === 'EN' ? "Payment failed or pending. You can pay later from your profile menu." : "Pembayaran gagal atau ditunda. Anda dapat membayarnya nanti dari menu profil.");
            navigate("/profile");
          }
        },
        onClose: async () => {
          if (isTemp) {
            alert(language === 'EN'
              ? "Payment window closed. You can try paying again by clicking Pay Now."
              : "Jendela pembayaran ditutup. Anda dapat mencoba membayar kembali dengan mengklik Bayar Sekarang.");
          } else {
            await updateCustomerStatus(activeOrderId, 'pending');
            localStorage.removeItem('tempCodOrder');
            localStorage.removeItem('tempCheckoutOrder');
            clearCart();
            localStorage.removeItem('cart');
            alert(language === 'EN' ? "Payment pending or closed. You can pay later from your profile menu." : "Pembayaran ditunda atau ditutup. Anda dapat membayarnya nanti dari menu profil.");
            navigate("/profile");
          }
        }
      });
    } catch (err) {
      console.error("Payment Error:", err);
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleGoBack = async () => {
    if (isTemp) {
      isNavigatingBackRef.current = true;
      if (orderIdParam && orderIdParam.startsWith('temp-')) {
        navigate(`/payment?orderId=${orderIdParam}`);
      } else {
        navigate('/payment');
      }
      return;
    }

    if (paymentData && paymentData.id && paymentData.id !== 'temp') {
      navigate(`/payment?orderId=${paymentData.id}`);
      return;
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
        alert(language === 'EN' ? "Proof submitted! Admin will verify." : "Bukti terkirim! Admin akan memverifikasi.");
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-955 pt-4 md:pt-6 pb-36 md:pb-12 transition-colors duration-700">
      <div className="max-w-xl mx-auto px-4 md:px-6">
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 md:p-14 rounded-2xl md:rounded-[40px] shadow-2xl border border-gray-100 dark:border-gray-800 text-center relative overflow-hidden">
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
                {(() => {
                  const displayStatus = getOrderDisplayStatus(paymentData);
                  return (
                    <>
                      <div className="flex flex-col items-center mb-10">
                         <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-4 block italic">Order Status</span>
                         <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${displayStatus.colorClass}`}>
                            {displayStatus.label}
                         </div>
                      </div>

                      {/* Shopee-style Horizontal Progress Bar */}
                      {['paid', 'processing', 'shipped', 'completed', 'waiting_verification'].includes(displayStatus.key) && (
                        <div className="mb-8 bg-gray-50/50 dark:bg-gray-800/40 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-850">
                          <div className="relative flex items-start justify-between w-full mt-2 mb-2">
                            {/* Background Gray Line */}
                            <div className="absolute left-0 right-0 top-5 h-[2px] bg-gray-200 dark:bg-gray-700 -z-0 rounded-full"></div>
                            
                            {/* Active Green Line */}
                            <div 
                              className="absolute left-0 top-5 h-[2px] bg-emerald-500 transition-all duration-1000 -z-0 rounded-full"
                              style={{ width: `${(getActiveStepIndex(displayStatus.key) / (shopeeSteps.length - 1)) * 100}%` }}
                            ></div>

                            {shopeeSteps.map((step, idx) => {
                              const isActive = getActiveStepIndex(displayStatus.key) >= idx;
                              const isCurrent = getActiveStepIndex(displayStatus.key) === idx;
                              return (
                                <div key={step.key} className="flex flex-col items-center flex-1 relative z-10">
                                  {/* Circle Icon */}
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white dark:bg-gray-900 transition-all duration-500 ${
                                    isActive 
                                      ? 'border-emerald-500 dark:border-emerald-500 shadow-sm' 
                                      : 'border-gray-100 dark:border-gray-800'
                                  } ${isCurrent ? 'scale-105 ring-2 ring-emerald-500/10' : ''}`}>
                                    {renderStepIcon(step.icon, isActive)}
                                  </div>
                                  {/* Label */}
                                  <span className={`text-[8px] md:text-[10px] font-black mt-2 text-center px-0.5 uppercase tracking-wider break-words leading-tight w-full max-w-[55px] md:max-w-none mx-auto block ${
                                    isActive ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-gray-400 dark:text-gray-650'
                                  }`}>
                                    {language === 'ID' ? step.labelID : step.labelEN}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Shopee-style Tracking History Timeline */}
                      {['paid', 'processing', 'shipped', 'completed', 'waiting_verification'].includes(displayStatus.key) && (() => {
                        const timelineItems = generateTimeline(paymentData);
                        return (
                          <div className="mb-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-4 md:p-8">
                            <div className="mb-6 border-b pb-4">
                              <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 capitalize">
                                {displayStatus.label}
                              </h2>
                            </div>

                            <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-2 pl-6 py-1 space-y-6">
                              {timelineItems.map((item, idx) => {
                                const isLatest = idx === 0;
                                const showDate = idx === 0 || timelineItems[idx - 1].date !== item.date;
                                return (
                                  <div key={idx} className="relative">
                                    {/* Bullet dot */}
                                    <span className="absolute -left-[31px] top-1 flex items-center justify-center bg-white dark:bg-gray-900 rounded-full p-0.5 z-10">
                                      {isLatest ? (
                                        <span className="relative flex h-3 w-3">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                        </span>
                                      ) : (
                                        <span className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700"></span>
                                      )}
                                    </span>
                                    
                                    {/* Description and Date/Time */}
                                    <div>
                                      <p className={`text-xs ${isLatest ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-gray-500 dark:text-gray-400 font-medium'}`}>
                                        {item.title}
                                      </p>
                                      <span className="text-[9px] text-gray-400 block mt-1 tracking-wider">
                                        {showDate ? `${item.date} · ` : ""}{item.time}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  );
                })()}

                {/* Invoice / Receipt Details */}
                <div className="mb-6 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 bg-gray-50/30 dark:bg-gray-800/20 space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b pb-2">
                    {language === 'EN' ? 'Invoice & Shipping Details' : 'Rincian Nota & Pengiriman'}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-gray-400 mb-1 block">
                        {language === 'EN' ? 'Invoice No. / ID' : 'No. Invoice / ID'}
                      </span>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 break-all">
                        {paymentData.id === 'temp' ? 'DRAFT_COD' : formatDisplayOrderId(paymentData.id)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-gray-400 mb-1 block">
                        {language === 'EN' ? 'Date' : 'Tanggal'}
                      </span>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {paymentData.createdAt ? new Date(paymentData.createdAt).toLocaleDateString(language === 'EN' ? 'en-US' : 'id-ID', {
                          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : new Date().toLocaleDateString(language === 'EN' ? 'en-US' : 'id-ID', {
                          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-gray-400 mb-1 block">
                        {language === 'EN' ? 'Payment Method' : 'Metode Pembayaran'}
                      </span>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase">
                        {paymentData.paymentMethod === 'cod' ? (language === 'EN' ? 'COD (Cash on Delivery)' : 'COD (Bayar di Tempat)') :
                         paymentData.paymentMethod === 'mandiri_tf' ? (language === 'EN' ? 'Mandiri Bank Transfer' : 'Transfer Bank Mandiri') : 'Midtrans (QRIS/VA/E-Wallet)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-gray-400 mb-1 block">
                        {language === 'EN' ? 'Shipping Method' : 'Metode Pengiriman'}
                      </span>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase">
                        {paymentData.shippingAddress?.courierInfo || (language === 'EN' ? 'Manual / Standard' : 'Manual / Standar')}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 pt-4 text-xs">
                    <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-wider mb-2">
                      {language === 'EN' ? 'Shipping Address' : 'Alamat Pengiriman'}
                    </span>
                    {isEditingAddress ? (
                      <form onSubmit={handleSaveAddress} className="space-y-3 p-4 bg-white dark:bg-gray-800/90 rounded-2xl border border-gray-150 dark:border-gray-750">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editFirstName}
                            onChange={e => setEditFirstName(e.target.value)}
                            placeholder={language === 'EN' ? "First Name" : "Nama Depan"}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs dark:text-white"
                            required
                          />
                          <input
                            type="text"
                            value={editLastName}
                            onChange={e => setEditLastName(e.target.value)}
                            placeholder={language === 'EN' ? "Last Name" : "Nama Belakang"}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs dark:text-white"
                          />
                        </div>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={e => setEditPhone(e.target.value)}
                          placeholder={language === 'EN' ? "Phone Number" : "Nomor Handphone"}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs dark:text-white"
                          required
                        />
                        <textarea
                          value={editAddressDetail}
                          onChange={e => setEditAddressDetail(e.target.value)}
                          placeholder={language === 'EN' ? "Address Detail (Street, No)" : "Detail Alamat (Jalan, No. Rumah)"}
                          rows="2"
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs dark:text-white"
                          required
                        ></textarea>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editProvince}
                            onChange={e => setEditProvince(e.target.value)}
                            placeholder={language === 'EN' ? "Province" : "Provinsi"}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs dark:text-white"
                          />
                          <input
                            type="text"
                            value={editCity}
                            onChange={e => setEditCity(e.target.value)}
                            placeholder={language === 'EN' ? "City" : "Kota/Kabupaten"}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs dark:text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editDistrict}
                            onChange={e => setEditDistrict(e.target.value)}
                            placeholder={language === 'EN' ? "District" : "Kecamatan"}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs dark:text-white"
                          />
                          <input
                            type="text"
                            value={editArea}
                            onChange={e => setEditArea(e.target.value)}
                            placeholder={language === 'EN' ? "Village/Area" : "Desa/Kelurahan"}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs dark:text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editPostalCode}
                            onChange={e => setEditPostalCode(e.target.value)}
                            placeholder={language === 'EN' ? "Postal Code" : "Kode Pos"}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs dark:text-white"
                          />
                          <input
                            type="text"
                            value={editNote}
                            onChange={e => setEditNote(e.target.value)}
                            placeholder={language === 'EN' ? "Notes (Optional)" : "Catatan (Opsional)"}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs dark:text-white"
                          />
                        </div>

                        {editError && <div className="text-[10px] text-red-500 font-bold">{editError}</div>}
                        
                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setIsEditingAddress(false)}
                            className="px-3 py-1.5 bg-gray-150 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-350 text-[10px] font-bold uppercase tracking-wider rounded"
                            disabled={editSaving}
                          >
                            {language === 'EN' ? "Cancel" : "Batal"}
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-wider rounded hover:opacity-90"
                            disabled={editSaving}
                          >
                            {editSaving ? (language === 'EN' ? "Saving..." : "Menyimpan...") : (language === 'EN' ? "Save" : "Simpan")}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="bg-white/50 dark:bg-black/10 p-3 rounded-2xl border border-gray-50 dark:border-gray-800/50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-gray-950 dark:text-white mb-0.5 text-xs">
                              {paymentData.shippingAddress?.firstName} {paymentData.shippingAddress?.lastName || ''}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-[10px] mb-2">
                              📞 {paymentData.shippingAddress?.phone}
                            </p>
                          </div>
                          {['pending', 'waiting_payment'].includes(paymentData.payment_status) && (
                            <button
                              type="button"
                              onClick={handleStartEditAddress}
                              className="text-[9px] bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded font-bold uppercase tracking-wider transition-colors border dark:border-gray-700"
                            >
                              ✏️ {language === 'EN' ? "Edit Address" : "Edit Alamat"}
                            </button>
                          )}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-xs">
                          {paymentData.shippingAddress?.address}, {language === 'EN' ? 'Vil.' : 'Kel.'} {paymentData.shippingAddress?.area}, {language === 'EN' ? 'Dist.' : 'Kec.'} {paymentData.shippingAddress?.district}, {paymentData.shippingAddress?.city}, {paymentData.shippingAddress?.province} - {paymentData.shippingAddress?.postalCode}
                        </p>
                        {paymentData.shippingAddress?.note && (
                          <div className="mt-3 pt-2 border-t border-dashed border-gray-100 dark:border-gray-800 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            <span className="font-bold uppercase text-[9px] block mb-1 opacity-70">
                              {language === 'EN' ? 'Notes:' : 'Catatan:'}
                            </span>
                            "{paymentData.shippingAddress.note}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="mb-10 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 bg-gray-50/30 dark:bg-gray-800/20">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 border-b pb-2">
                    {language === 'EN' ? 'Your Order' : 'Pesanan Anda'}
                  </h3>
                  <div className="space-y-4">
                    {paymentData.items?.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-gray-50 dark:bg-gray-850 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                          <img src={getImageUrl(item?.image || item?.images?.[0])} className="w-full h-full object-contain p-1" alt="item" />
                        </div>
                        <div className="flex-1">
                           <p className="font-bold text-xs uppercase dark:text-white">{item.name}</p>
                           <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Qty: {item.qty}</p>
                        </div>
                        <div className="font-black text-sm dark:text-white">Rp {(item.price * item.qty).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-4 border-t border-dashed flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase text-gray-400">
                      {language === 'EN' ? 'Grand Total' : 'Total Keseluruhan'}
                    </span>
                    <span className="text-2xl font-black dark:text-white">Rp {paymentData.total?.toLocaleString()}</span>
                  </div>
                </div>

                {['pending', 'waiting_payment'].includes(paymentData.payment_status) ? (
                  <div className="space-y-6">
                    {/* Countdown Timer */}
                    {timeLeft && (
                      <div className={`p-5 rounded-3xl text-center border transition-all ${isExpired ? 'bg-red-50 dark:bg-red-950/10 border-red-100 dark:border-red-900/30' : 'bg-amber-50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30'}`}>
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-455 dark:text-gray-500 mb-1">
                          {language === 'EN' ? 'Payment Deadline' : 'Batas Waktu Pembayaran'}
                        </p>
                        {isExpired ? (
                          <p className="text-sm font-black text-red-650 dark:text-red-400 uppercase tracking-wide">
                            {language === 'EN' ? '❌ EXPIRED - PLEASE RE-ORDER' : '❌ WAKTU HABIS - SILAKAN PESAN KEMBALI'}
                          </p>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 animate-pulse tracking-wider">
                              {timeLeft}
                            </span>
                            <span className="text-[9px] text-gray-500 mt-1 uppercase font-bold tracking-tight">
                              {language === 'EN' ? 'Unpaid orders are automatically cancelled' : 'Pesanan otomatis dibatalkan jika tidak dibayar'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {tokenError && (
                      <div className="p-4 bg-red-50 dark:bg-red-955/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-semibold">
                        ⚠️ {tokenError}
                      </div>
                    )}
                    {method === 'mandiri_tf' ? (
                      <div className="space-y-6">
                        <div className="bg-black text-white p-8 rounded-3xl text-center">
                          <p className="text-xs uppercase font-bold mb-2 opacity-50">{language === 'EN' ? 'Mandiri Bank Transfer' : 'Transfer Bank Mandiri'}</p>
                          <p className="text-xl font-black select-all tracking-wider">123-456-7890</p>
                          <p className="text-[9px] opacity-30 mt-2 font-bold uppercase">{language === 'EN' ? 'on behalf of Distrapness Indonesia' : 'a.n. Distrapness Indonesia'}</p>
                        </div>
                        <div className="p-6 border border-gray-100 dark:border-gray-800 rounded-3xl">
                           <input type="file" onChange={e => setProofFile(e.target.files[0])} disabled={isExpired} className="w-full text-xs mb-4" />
                           <button onClick={handleUploadProof} disabled={uploading || isExpired} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest">{uploading ? (language === 'EN' ? 'Processing...' : 'Memproses...') : (language === 'EN' ? 'Submit Proof' : 'Kirim Bukti')}</button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={handlePayment} 
                        disabled={
                          processing || 
                          isExpired ||
                          (method !== 'cod' && (!scriptLoaded || tokenLoading || !snapToken))
                        } 
                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all ${
                          processing || isExpired || (method !== 'cod' && (!scriptLoaded || tokenLoading || !snapToken))
                            ? 'bg-gray-300 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                            : 'bg-black dark:bg-white text-white dark:text-black'
                        }`}
                      >
                        {processing 
                          ? (language === 'EN' ? 'Processing...' : 'Memproses...') 
                          : method === 'cod' 
                            ? (language === 'EN' ? 'Confirm Order' : 'Konfirmasi Pesanan') 
                            : !scriptLoaded 
                              ? (language === 'EN' ? 'Loading Payment System...' : 'Memuat Sistem Pembayaran...') 
                              : tokenLoading 
                                ? (language === 'EN' ? 'Generating Payment Token...' : 'Membuat Token Pembayaran...') 
                                : (language === 'EN' ? 'Pay Now' : 'Bayar Sekarang')}
                      </button>
                    )}

                    <button 
                      onClick={handleGoBack}
                      className="w-full py-4 border border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all"
                    >
                      {language === 'EN' ? '← Back & Change Order' : '← Kembali & Ubah Pesanan'}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => navigate('/shop')} className="w-full bg-gray-100 dark:bg-gray-800 dark:text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px]">{language === 'EN' ? 'Continue Shopping' : 'Lanjutkan Belanja'}</button>
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
      )}
    </div>
  );
};

export default PaymentConfirm;
