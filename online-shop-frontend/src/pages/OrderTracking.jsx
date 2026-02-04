import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getImageUrl } from "../utils/imageHelper";

const dummyTracking = {
  orderId: `INV${Date.now().toString().slice(-6)}`,
  status: "On the way",
  courier: "JNE Express",
  trackingNumber: "JNE1234567890",
  estimatedDelivery: "Friday, Oct 24th",
  steps: [
    { label: "Order Placed", date: "Oct 20, 9:00 AM", completed: true },
    { label: "Processing", date: "Oct 21, 10:00 AM", completed: true },
    { label: "Shipped", date: "Oct 21, 2:00 PM", completed: true },
    { label: "Delivered", date: "", completed: false },
  ],
  history: [
    { status: "Out for Delivery", date: "Today, 10:00 AM", location: "Seattle, WA", icon: "truck" },
    { status: "Arrived at Facility", date: "Yesterday, 4:00 PM", location: "Tacoma, WA", icon: "warehouse" },
    { status: "Shipped", date: "Oct 21, 2:00 PM", location: "Portland, OR", icon: "box" },
    { status: "Order Placed", date: "Oct 20, 9:00 AM", location: "", icon: "file" },
  ]
};

const OrderTracking = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Attempt to get items from localStorage (mocking "last order")
    // In real app, we would fetch from API using ID from URL
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const storedTotal = localStorage.getItem("cartTotal") || 0;

    // If empty (because success page cleared it), use dummy
    if (storedCart.length > 0) {
      setItems(storedCart);
      setTotal(parseFloat(storedTotal));
    } else {
      setItems([
        { name: "Cotton Crew Neck T-Shirt", price: 25000, qty: 1, image: "dummy1" },
        { name: "Distrapness Runner Pro", price: 120000, qty: 1, image: "dummy2" },
      ]);
      setTotal(167500);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 pt-24 pb-12 px-4 md:px-8 transition-colors duration-[900ms]">
      <div className="max-w-7xl mx-auto">

        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Track Your Order</h1>
            <p className="text-gray-500 text-sm mt-1">Order Number: <span className="text-black dark:text-gray-300 font-mono font-bold">#{dummyTracking.orderId}</span></p>
          </div>
          <Link to="/order-status" className="text-red-500 font-bold text-sm hover:underline">
            &larr; Back to Orders
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* MAIN COLUMN (Tracking) */}
          <div className="flex-1 space-y-8">

            {/* Status Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Status</p>
                  <h2 className="text-2xl font-bold text-[#FF0000] flex items-center gap-2">
                    {dummyTracking.status} <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Estimated Delivery</p>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{dummyTracking.estimatedDelivery}</h2>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative mb-4">
                <div className="absolute top-1/2 left-0 w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full -translate-y-1/2"></div>
                <div className="absolute top-1/2 left-0 w-[75%] h-2 bg-gradient-to-r from-red-500 to-red-600 rounded-full -translate-y-1/2 transition-all duration-1000"></div>

                <div className="relative flex justify-between w-full">
                  {dummyTracking.steps.map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 group cursor-default">
                      <div className={`w-4 h-4 rounded-full border-2 z-10 transition-colors ${step.completed ? 'bg-red-600 border-red-600' : 'bg-white border-gray-300'}`}></div>
                      <span className={`text-xs font-bold ${step.completed ? 'text-black dark:text-white' : 'text-gray-400'}`}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-gray-400 mt-8 px-1">
                <span>Order Placed</span>
                <span>Delivered</span>
              </div>
            </div>

            {/* Tracking History */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold mb-6">Tracking History</h3>
              <div className="space-y-8 relative pl-2">
                <div className="absolute left-[19px] top-2 bottom-4 w-[2px] bg-gray-100 dark:bg-gray-700"></div>

                {dummyTracking.history.map((event, idx) => (
                  <div key={idx} className="relative flex gap-6 items-start">
                    <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center shrink-0 z-10 border-4 border-white dark:border-gray-800">
                      {/* Icons based on type */}
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{event.status}</h4>
                      <p className="text-sm text-gray-500">{event.date} {event.location && `- ${event.location}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Need Help Footer */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <div>
                  <h4 className="font-bold text-sm">Need help with your shipment?</h4>
                  <p className="text-xs text-gray-500">Our support team is available 24/7.</p>
                </div>
              </div>
              <button className="px-4 py-2 border border-gray-300 rounded text-sm font-bold hover:bg-gray-50 transition">Contact Support</button>
            </div>

          </div>

          {/* RIGHT COLUMN (Sidebar) */}
          <div className="w-full lg:w-[380px]">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 sticky top-28">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                Order Summary
              </h3>

              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x100?text=Prod"; }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-gray-500">Qty: {item.qty}</p>
                    </div>
                    <div className="font-bold text-sm">Rp {items.length > 0 ? item.price?.toLocaleString('id-ID') : 0}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4 space-y-2 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-bold">Rp {items.reduce((acc, item) => acc + (item.price || 0) * (item.qty || 1), 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-bold">Rp 10.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-bold">Rp 1.500</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-red-600 pt-2">
                  <span>Total</span>
                  <span>Rp {(items.reduce((acc, item) => acc + (item.price || 0) * (item.qty || 1), 0) + 11500).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <button className="w-full bg-[#FF0000] hover:bg-red-700 text-white font-bold py-3 rounded shadow-lg uppercase tracking-wide text-sm transition-all flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download Invoice
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
