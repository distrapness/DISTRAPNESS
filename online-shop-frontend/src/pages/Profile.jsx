import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCurrency } from "../components/CurrencyContext.jsx";
import config from "../config";
import { getImageUrl } from "../utils/imageHelper";

export default function Profile() {
  const { userEmail, logout } = useAuth();
  const { t, currency } = useCurrency();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");
  const [savedAddress, setSavedAddress] = useState(null);

  useEffect(() => {
    if (userEmail) {
      const addr = localStorage.getItem(`savedAddress_${userEmail}`);
      if (addr) {
        try { setSavedAddress(JSON.parse(addr)); } catch (e) { }
      }
      setLoading(true);
      fetch(`${config.API_URL}/api/orders/user?email=${encodeURIComponent(userEmail)}`)
        .then((res) => res.json())
        .then((data) => {
          setOrders(Array.isArray(data) ? data : []);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [userEmail]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const statusColor = (status) => {
    switch (status) {
      case "paid": return "text-green-600 bg-green-50 dark:bg-green-900/20";
      case "pending": return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
      case "shipped": return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
      case "cancelled": return "text-red-600 bg-red-50 dark:bg-red-900/20";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-[900] uppercase tracking-tighter text-black dark:text-white mb-2">{t('profile.title')}</h1>
          <p className="text-gray-500 text-sm">{t('profile.welcome')} <span className="font-bold text-black dark:text-gray-300">{userEmail}</span></p>
        </div>
        <button
          onClick={handleLogout}
          className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black font-bold uppercase text-xs tracking-widest hover:opacity-80 transition-opacity"
        >
          {t('profile.signOut')}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden sticky top-24">
            <nav className="flex flex-col">
              <button
                onClick={() => setActiveTab("orders")}
                className={`text-left px-6 py-4 text-sm font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${activeTab === 'orders' ? 'bg-gray-50 dark:bg-gray-700 text-red-600' : 'text-gray-600 dark:text-gray-300'}`}
              >
                {t('profile.myOrders')}
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`text-left px-6 py-4 text-sm font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${activeTab === 'profile' ? 'bg-gray-50 dark:bg-gray-700 text-red-600' : 'text-gray-600 dark:text-gray-300'}`}
              >
                {t('profile.accountDetails')}
              </button>
              <button
                onClick={() => setActiveTab("address")}
                className={`text-left px-6 py-4 text-sm font-bold uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${activeTab === 'address' ? 'bg-gray-50 dark:bg-gray-700 text-red-600' : 'text-gray-600 dark:text-gray-300'}`}
              >
                {t('profile.addresses')}
              </button>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === "orders" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 md:p-8 min-h-[400px]">
              <h2 className="text-xl font-bold uppercase tracking-wide mb-6 border-b border-gray-100 dark:border-gray-700 pb-4 text-black dark:text-white">{t('profile.recentOrders')}</h2>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-700 animate-pulse rounded"></div>)}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-gray-300 dark:text-gray-600 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  </div>
                  <p className="text-gray-500 mb-6">{t('profile.noOrders')}</p>
                  <Link to="/shop" className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-bold uppercase text-xs tracking-widest hover:opacity-80 transition-opacity">
                    {t('profile.startShopping')}
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => {
                    const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
                    return (
                      <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow relative bg-white dark:bg-gray-800/50">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                          <div>
                            <div className="font-bold text-sm text-gray-900 dark:text-white mb-1">{t('profile.orderNumber')}{order.id}</div>
                            <div className="text-xs text-gray-500">{t('profile.placedOn')} {new Date(order.createdAt).toLocaleDateString(currency.locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="flex gap-4 items-center">
                          {firstItem && (
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden shrink-0">
                              <img src={getImageUrl(firstItem.image || (firstItem.images && firstItem.images[0]))} className="w-full h-full object-cover" alt="Product" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate">{firstItem ? firstItem.name : "Product items hidden"}</p>
                            {order.items && order.items.length > 1 && (
                              <p className="text-xs text-gray-500 mt-1">+ {order.items.length - 1} {t('profile.moreItems')}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-gray-900 dark:text-white">Rp {order.total.toLocaleString('id-ID')}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                          <button
                            onClick={() => navigate(`/payment/confirm?orderId=${order.id}`)}
                            className="text-xs font-bold uppercase tracking-wider border-b border-black dark:border-white hover:text-gray-600 dark:hover:text-gray-400 transition-colors pb-0.5"
                          >
                            {t('profile.viewDetails')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 md:p-8 min-h-[400px]">
              <h2 className="text-xl font-bold uppercase tracking-wide mb-6 border-b border-gray-100 dark:border-gray-700 pb-4 text-black dark:text-white">{t('profile.accountDetails')}</h2>
              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{t('profile.emailAddress')}</label>
                  <input type="text" value={userEmail} disabled className="w-full p-3 bg-gray-100 dark:bg-gray-700 border-none rounded text-gray-500 font-mono text-sm" />
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded text-xs text-yellow-700 dark:text-yellow-400">
                  {t('profile.contactSupport')}
                </div>
              </div>
            </div>
          )}

          {activeTab === "address" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 md:p-8 min-h-[400px]">
              <h2 className="text-xl font-bold uppercase tracking-wide mb-6 border-b border-gray-100 dark:border-gray-700 pb-4 text-black dark:text-white">{t('profile.savedAddresses')}</h2>
              
              {savedAddress ? (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-black dark:bg-white text-white dark:text-black px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-sm">{t('profile.defaultAddress')}</span>
                    <button onClick={() => { localStorage.removeItem(`savedAddress_${userEmail}`); setSavedAddress(null); }} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wider">{t('profile.deleteAddress')}</button>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{savedAddress.firstName} {savedAddress.lastName}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">{savedAddress.phone}</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{savedAddress.address}</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{savedAddress.city}, {savedAddress.postalCode}</p>
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 italic">{t('profile.addressAutoFill')}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500 italic mb-4">{t('profile.noSavedAddress')}</p>
                  <Link to="/shop" className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black font-bold uppercase text-xs tracking-widest hover:opacity-80 transition-opacity">
                    {t('profile.shopNow')}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
