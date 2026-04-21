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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black dark:border-white"></div>
    </div>
  );

  const trackingSteps = [
    { key: 'placed', status: ['pending', 'paid', 'shipped', 'completed'] },
    { key: 'processing', status: ['paid', 'shipped', 'completed'] },
    { key: 'shipped', status: ['shipped', 'completed'] },
    { key: 'delivered', status: ['completed'] },
  ];

  const currentStatusIndex = order ? trackingSteps.findIndex(s => s.status.includes(order.status)) : -1;
  const progressPercent = ((currentStatusIndex + 1) / trackingSteps.length) * 100;

  const items = order ? (JSON.parse(order.items || "[]")) : [];
  const address = order ? (JSON.parse(order.shipping_address || "{}")) : {};

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 pt-24 pb-12 transition-colors duration-700">
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
          <div className="bg-white dark:bg-gray-800 p-20 rounded-3xl text-center border-2 border-dashed border-gray-100 dark:border-gray-700">
             <p className="text-gray-400 font-medium italic">{error || "Order not found or invalid ID."}</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">

            {/* MAIN COLUMN (Tracking) */}
            <div className="flex-1 space-y-8">

              {/* Status Card */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-8 md:p-12 border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 dark:bg-gray-900/50 rounded-full -mr-16 -mt-16"></div>
                
                <div className="flex justify-between items-start mb-12 relative z-10">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold mb-2">{t('orderTracking.status')}</p>
                    <h2 className="text-3xl font-[900] uppercase tracking-tighter text-black dark:text-white flex items-center gap-3">
                      {t(`admin.status.${order.status}`)} 
                      <span className="w-4 h-4 bg-black dark:bg-white rounded-full animate-pulse"></span>
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold mb-2">{t('orderTracking.estimatedDelivery')}</p>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">3-5 Working Days</h2>
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="mt-16">
                  {/* Progress Line */}
                  <div className="relative mb-8">
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-100 dark:bg-gray-700 -translate-y-1/2"></div>
                    <div 
                        className="absolute top-1/2 left-0 h-[2px] bg-black dark:bg-white -translate-y-1/2 transition-all duration-[2000ms] ease-out"
                        style={{ width: `${progressPercent}%` }}
                    ></div>

                    <div className="relative flex justify-between w-full">
                      {trackingSteps.map((step, idx) => {
                        const isCompleted = currentStatusIndex >= idx;
                        return (
                          <div key={idx} className="flex flex-col items-center gap-4 group">
                            <div className={`w-6 h-6 rounded-full border-2 z-10 transition-all duration-700 flex items-center justify-center ${isCompleted ? 'bg-black border-black dark:bg-white dark:border-white' : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-600'}`}>
                               {isCompleted && <svg className="w-3 h-3 text-white dark:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-black dark:text-white' : 'text-gray-400'}`}>
                                {t(`orderTracking.steps.${step.key}`)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Details */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-8 border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-6 border-b pb-4">{t('cart.shipping')} Info</h3>
                <div className="grid md:grid-cols-2 gap-8 text-sm">
                   <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Receiver</p>
                      <p className="font-bold dark:text-white">{address.name}</p>
                      <p className="text-gray-500">{address.phone}</p>
                      <p className="text-gray-500">{address.email}</p>
                   </div>
                   <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Full Address</p>
                      <p className="text-gray-500 leading-relaxed italic">
                        {address.address}, {address.city}, {address.province}
                      </p>
                   </div>
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
                          className="w-full h-full object-cover"
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
