import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getImageUrl } from "../utils/imageHelper";
import { useCurrency } from "../components/CurrencyContext.jsx";
import config from "../config";
import Footer from "../components/Footer";

const OrderTracking = () => {
  const [searchParams] = useSearchParams();
  const orderIdFromParams = searchParams.get("orderId");
  const { t, currency } = useCurrency();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderIdFromParams) {
        setLoading(false);
        return;
    }

    fetch(`${config.API_URL}/api/orders/${orderIdFromParams}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) throw new Error(data.error);
        setOrder(data);
    })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
  }, [orderIdFromParams]);

  const handleConfirmDelivery = async () => {
    if (!window.confirm("Apakah Anda yakin telah menerima pesanan ini? Status pesanan akan diubah menjadi Selesai.")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${config.API_URL}/api/orders/${orderIdFromParams}/confirm-delivery`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Terima kasih! Pesanan telah dikonfirmasi selesai.");
        // Fetch order details again
        const res2 = await fetch(`${config.API_URL}/api/orders/${orderIdFromParams}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data2 = await res2.json();
        if (!data2.error) setOrder(data2);
      } else {
        alert(data.error || "Gagal mengonfirmasi penerimaan pesanan");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black dark:border-white"></div>
    </div>
  );

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

  const activeStepIndex = order ? getActiveStepIndex(order.status) : 0;

  const shopeeSteps = [
    { key: 'placed', labelID: 'Pesanan Dibuat', labelEN: 'Order Created', icon: 'doc' },
    { key: 'picked_up', labelID: 'Paket Dikirim', labelEN: 'Picked Up', icon: 'picked' },
    { key: 'sorting', labelID: 'Penyortiran', labelEN: 'Penyortiran', icon: 'sorting' },
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

  const getParsedData = (data, defaultVal) => {
    if (!data) return defaultVal;
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        return defaultVal;
      }
    }
    return data;
  };

  const items = order ? getParsedData(order.items, []) : [];
  const address = order ? getParsedData(order.shipping_address, {}) : {};

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

    // Spacing times realistically across days to match the Shopee screenshot
    const hr = 60 * 60 * 1000;

    // 1. Order Placed (Day 0, 0h)
    const t1Date = getSafeDate(0, 0);
    timeline.push({
      title: language === 'ID' 
        ? `[System] Pesanan berhasil dibuat. Metode pembayaran: ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'COD'}.`
        : `[System] Order placed successfully. Payment method: ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'COD'}.`,
      date: formatDate(t1Date),
      time: formatTime(t1Date)
    });

    if (order.status === 'cancelled' || order.status === 'expired' || order.status === 'failed') {
      const tCancelDate = getSafeDate(30 * 60 * 1000, 1);
      timeline.unshift({
        title: language === 'ID'
          ? `[System] Pesanan dibatalkan. Alasan: ${order.status === 'expired' ? 'Batas waktu pembayaran habis (24 jam)' : 'Dibatalkan oleh pembeli/admin'}.`
          : `[System] Order cancelled. Reason: ${order.status === 'expired' ? 'Payment time limit exceeded (24 hours)' : 'Cancelled by customer/admin'}.`,
        date: formatDate(tCancelDate),
        time: formatTime(tCancelDate)
      });
      return timeline;
    }

    // 2. Payment Confirmed (Day 0, +1 hour)
    if (['paid', 'processing', 'shipped', 'completed'].includes(order.status)) {
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
    if (['paid', 'processing', 'shipped', 'completed'].includes(order.status)) {
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
    if (['shipped', 'completed'].includes(order.status)) {
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
    if (['shipped', 'completed'].includes(order.status)) {
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
    if (order.status === 'completed') {
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

  const timelineItems = generateTimeline(order);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-955 pt-4 md:pt-6 pb-12 transition-colors duration-700">
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* Page Header */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-[900] uppercase tracking-tighter text-gray-900 dark:text-white">{t('orderTracking.title')}</h1>
            <p className="text-gray-500 text-xs uppercase tracking-widest mt-2">{t('orderTracking.orderNumber')}: <span className="text-black dark:text-gray-300 font-bold">#{orderIdFromParams}</span></p>
          </div>
          <Link to="/profile" className="text-xs font-bold uppercase tracking-widest border-b-2 border-black dark:border-white pb-1 hover:opacity-60 transition-opacity">
            {t('orderTracking.backToOrders')}
          </Link>
        </div>

        {!order ? (
          <div className="bg-white dark:bg-gray-900 p-20 rounded-3xl text-center border-2 border-dashed border-gray-100 dark:border-gray-800">
             <p className="text-gray-400 font-medium italic">{error || "Order not found or invalid ID."}</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">

            {/* MAIN COLUMN (Tracking) */}
            <div className="flex-1 space-y-8">

              {/* Shopee-style Horizontal Progress Bar */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm p-8 md:p-12 border border-gray-100 dark:border-gray-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 dark:bg-black/10 rounded-full -mr-16 -mt-16"></div>
                
                <div className="relative flex items-center justify-between w-full mt-6 mb-12">
                  {/* Background Gray Line */}
                  <div className="absolute left-0 right-0 top-6 h-1 bg-gray-100 dark:bg-gray-800 -z-0 rounded-full"></div>
                  
                  {/* Active Green Line */}
                  <div 
                    className="absolute left-0 top-6 h-1 bg-emerald-500 transition-all duration-1000 -z-0 rounded-full"
                    style={{ width: `${(activeStepIndex / (shopeeSteps.length - 1)) * 100}%` }}
                  ></div>

                  {shopeeSteps.map((step, idx) => {
                    const isActive = activeStepIndex >= idx;
                    const isCurrent = activeStepIndex === idx;
                    return (
                      <div key={step.key} className="flex flex-col items-center flex-1 relative z-10">
                        {/* Circle Icon */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 bg-white dark:bg-gray-900 ${
                          isActive 
                            ? 'border-emerald-500 dark:border-emerald-500 shadow-md shadow-emerald-100 dark:shadow-none' 
                            : 'border-gray-100 dark:border-gray-800'
                        } ${isCurrent ? 'scale-110 ring-4 ring-emerald-500/20' : ''}`}>
                          {renderStepIcon(step.icon, isActive)}
                        </div>
                        {/* Label */}
                        <span className={`text-[9px] md:text-[10px] font-black mt-3 text-center px-1 uppercase tracking-wider ${
                          isActive ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-gray-400 dark:text-gray-600'
                        }`}>
                          {language === 'ID' ? step.labelID : step.labelEN}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shopee-style Package Info & Chronological Timeline details */}
              <div className="grid md:grid-cols-12 gap-8">
                {/* Left Card: Package Information */}
                <div className="md:col-span-4 bg-white dark:bg-gray-900 rounded-3xl shadow-sm p-8 border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 border-b pb-4 dark:text-white">Package Information</h3>
                    
                    <div className="space-y-5 text-xs">
                      <div>
                        <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">Tracking Number</p>
                        <p className="font-mono text-base font-black text-black dark:text-white uppercase tracking-wider">
                          {order.tracking_number || "SPEPH01206896633A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">Recipient Name</p>
                        <p className="font-bold text-gray-800 dark:text-gray-250">
                          {address.name ? maskName(address.name) : `${maskName(address.firstName)} ${maskName(address.lastName || '')}`.trim()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">Tel Number</p>
                        <p className="font-bold text-gray-850 dark:text-gray-300 font-mono">
                          {maskPhone(address.phone)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">Courier Service</p>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-[10px]">
                          🚚 {address.courierInfo || "STANDARD DELIVERY"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-gray-50 dark:border-gray-800">
                    <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">Full Shipping Address</p>
                    <p className="text-[11px] text-gray-500 leading-relaxed italic">
                      {address.address}, Kel. {address.area}, Kec. {address.district}, {address.city}, {address.province} - {address.postalCode}
                    </p>
                  </div>
                </div>

                {/* Right Card: Chronological Timeline Detail */}
                <div className="md:col-span-8 bg-white dark:bg-gray-900 rounded-3xl shadow-sm p-8 border border-gray-100 dark:border-gray-800">
                  <div className="mb-6 border-b pb-4">
                    <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 capitalize">
                      {t(`admin.status.${order.status}`)}
                    </h2>
                  </div>

                  {timelineItems.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 italic">No tracking updates available.</div>
                  ) : (
                    <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-4 md:ml-32 pl-8 md:pl-10 py-2 space-y-10">
                      {timelineItems.map((item, idx) => {
                        const isLatest = idx === 0;
                        const showDate = idx === 0 || timelineItems[idx - 1].date !== item.date;
                        return (
                          <div key={idx} className="relative group">
                            
                            {/* Time / Date Column on the absolute left for desktop */}
                            <div className="hidden md:block absolute -left-44 top-0.5 w-32 text-right">
                              {showDate ? (
                                <>
                                  <p className={`text-[11px] font-black uppercase tracking-wider ${isLatest ? 'text-emerald-500' : 'text-gray-800 dark:text-gray-300'}`}>
                                    {item.date}
                                  </p>
                                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.time}</p>
                                </>
                              ) : (
                                <p className="text-[10px] text-gray-400 font-mono">{item.time}</p>
                              )}
                            </div>

                            {/* Bullet Dot */}
                            <span className="absolute -left-[41px] top-1 flex items-center justify-center bg-white dark:bg-gray-900 rounded-full p-1 z-10">
                              {isLatest ? (
                                <span className="relative flex h-3.5 w-3.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                                </span>
                              ) : (
                                <span className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700"></span>
                              )}
                            </span>

                            {/* Mobile Time display (inside description container) */}
                            <div className="md:hidden mb-2">
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${isLatest ? 'text-emerald-500' : 'text-gray-500'}`}>
                                {showDate ? `${item.date} · ` : ""}<span className="font-mono">{item.time}</span>
                              </span>
                            </div>

                            {/* Description */}
                            <div className="transition-all duration-300">
                              <p className={`text-xs md:text-sm leading-relaxed ${isLatest ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-gray-500 dark:text-gray-400 font-medium'}`}>
                                {item.title}
                              </p>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Need Help Footer */}
              <div className="bg-black dark:bg-white text-white dark:text-black rounded-3xl shadow-xl p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex gap-6 items-center">
                  <div className="w-14 h-14 bg-white/10 dark:bg-black/5 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{t('orderTracking.needHelp')}</h4>
                    <p className="text-xs opacity-60 tracking-wider uppercase">{t('orderTracking.support247')}</p>
                  </div>
                </div>
                <button className="px-8 py-3 bg-white dark:bg-black text-black dark:text-white rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">
                    {t('orderTracking.contactSupport')}
                </button>
              </div>

            </div>

            {/* RIGHT COLUMN (Sidebar Summary) */}
            <div className="w-full lg:w-[400px]">
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-8 border border-gray-100 dark:border-gray-700 sticky top-32">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  {t('orderTracking.orderSummary')}
                </h3>

                <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-5 items-center">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                        <img
                          src={getImageUrl(item.image || item.images?.[0])}
                          alt={item.name}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/200x200?text=Product"; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{item.name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Qty: {item.qty} | {item.selectedSize}</p>
                      </div>
                      <div className="font-bold text-sm">
                        {item.price?.toLocaleString(currency.locale)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-gray-100 dark:border-gray-700 pt-6 space-y-4 text-sm mb-10">
                  <div className="flex justify-between">
                    <span className="text-gray-400 uppercase text-[10px] font-bold tracking-widest">{t('orderTracking.subtotal')}</span>
                    <span className="font-bold">{items.reduce((acc, i) => acc + (i.price * i.qty), 0).toLocaleString(currency.locale)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 uppercase text-[10px] font-bold tracking-widest">{t('orderTracking.total')}</span>
                    <span className="text-xl font-[900] text-black dark:text-white">
                        {order.total?.toLocaleString(currency.locale)}
                    </span>
                  </div>
                </div>

                {order.status === 'shipped' && (
                  <button
                    onClick={handleConfirmDelivery}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-[0.25em] py-5 rounded-2xl shadow-xl transition-all hover:scale-[0.98] active:scale-95 flex items-center justify-center gap-2 mb-4"
                  >
                    ✓ Konfirmasi Pesanan Diterima
                  </button>
                )}

                <button className="w-full bg-black dark:bg-white text-white dark:text-black font-black uppercase text-[10px] tracking-[0.3em] py-5 rounded-2xl shadow-xl transition-all hover:scale-[0.98] active:scale-95 flex items-center justify-center gap-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  {t('orderTracking.downloadInvoice')}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default OrderTracking;
