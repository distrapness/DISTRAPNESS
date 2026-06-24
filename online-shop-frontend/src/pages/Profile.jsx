import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCurrency } from "../components/CurrencyContext.jsx";
import config from "../config";
import { getImageUrl } from "../utils/imageHelper";
import { useCart } from "../components/CartContext";
import { formatDisplayOrderId } from "../utils/orderHelper";

export default function Profile() {
  const { userEmail, logout } = useAuth();
  const { t, currency, language } = useCurrency();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  
  // Review states
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");
  const [savedAddress, setSavedAddress] = useState(null);
  const [profile, setProfile] = useState(null);
  const [reorderToast, setReorderToast] = useState('');
  const [copyStatus, setCopyStatus] = useState(false);

  // Profile Form States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [birthDate, setBirthDate] = useState("");
  
  // Geography States
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");
  
  const [profileSaving, setProfileSaving] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [profileToast, setProfileToast] = useState("");
  const [addressToast, setAddressToast] = useState("");

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordToast, setPasswordToast] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const isInitialProv = useRef(true);
  const isInitialCity = useRef(true);
  const isInitialDist = useRef(true);

  useEffect(() => {
    if (userEmail) {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const addr = localStorage.getItem(`savedAddress_${userEmail}`);
      if (addr) {
        try { setSavedAddress(JSON.parse(addr)); } catch (e) { }
      }
      const isPaymentAttempted = localStorage.getItem('paymentAttempted') === 'true';

      const fetchProfileAndOrders = () => {
        setLoading(true);
        // Fetch Profile (Referral Info & Address)
        fetch(`${config.API_URL}/api/profile`, { headers })
          .then(res => {
            if (res.status === 401) {
              logout();
              navigate('/login');
              throw new Error("Session expired");
            }
            return res.json();
          })
          .then(data => {
            setProfile(data);
            
            // Fallback to local storage if database fields are empty
            const savedLocal = localStorage.getItem(`savedAddress_${userEmail}`);
            let localAddr = {};
            if (savedLocal) {
              try { localAddr = JSON.parse(savedLocal); } catch (e) {}
            }

            setFirstName(data.first_name || localAddr.firstName || '');
            setLastName(data.last_name || localAddr.lastName || '');
            setPhone(data.phone || localAddr.phone || '');
            setStreetAddress(data.address || localAddr.address || '');
            setPostalCode(data.postal_code || localAddr.postalCode || '');
            if (data.birth_date) {
              const d = new Date(data.birth_date);
              if (!isNaN(d.getTime())) {
                setBirthDate(d.toISOString().split('T')[0]);
              }
            } else {
              setBirthDate('');
            }

            const provId = data.province_id || localStorage.getItem('sel_prov') || '';
            const cityId = data.city_id || localStorage.getItem('sel_city') || '';
            const distId = data.district_id || localStorage.getItem('sel_dist') || '';
            const villId = data.area_id || localStorage.getItem('sel_vill') || '';

            if (provId) setSelectedProvince(provId);
            if (cityId) setSelectedCity(cityId);
            if (distId) setSelectedDistrict(distId);
            if (villId) setSelectedVillage(villId);
          })
          .catch(err => console.error("Profile fetch error:", err));

        fetch(`${config.API_URL}/api/orders/user?email=${encodeURIComponent(userEmail)}`, { headers })
          .then((res) => {
            if (res.status === 401) {
              logout();
              navigate('/login');
              throw new Error("Session expired");
            }
            return res.json();
          })
          .then((data) => {
            let fetchedOrders = Array.isArray(data) ? data : [];
            const tempPendingStr = localStorage.getItem('tempPendingOrder');
            if (tempPendingStr) {
              try {
                const tempPending = JSON.parse(tempPendingStr);
                const tempPendingTempId = tempPending.shippingAddress?.tempId;

                // Check if any database order already has this tempId (only if tempPendingTempId is valid/not empty)
                const isAlreadyInDB = tempPendingTempId ? fetchedOrders.some(order => {
                  let sa = order.shipping_address || order.shippingAddress;
                  if (typeof sa === 'string') {
                    try { sa = JSON.parse(sa); } catch (e) {}
                  }
                  return sa && sa.tempId === tempPendingTempId;
                }) : false;

                if (isAlreadyInDB) {
                  localStorage.removeItem('tempPendingOrder');
                } else if (tempPending.email === userEmail) {
                  fetchedOrders = [tempPending, ...fetchedOrders];
                }
              } catch (e) {
                console.error("Error parsing tempPendingOrder:", e);
              }
            }
            setOrders(fetchedOrders);
            if (isPaymentAttempted) {
              localStorage.removeItem('paymentAttempted');
            }
          })
          .catch((err) => console.error(err))
          .finally(() => setLoading(false));
      };

      if (isPaymentAttempted) {
        const timer = setTimeout(() => {
          fetchProfileAndOrders();
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        fetchProfileAndOrders();
      }


    } else {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate('/login');
      } else {
        setLoading(false);
      }
    }
  }, [userEmail, navigate]);

  // Load Provinces
  useEffect(() => {
    fetch(`${config.API_URL}/api/shipping/provinces`)
      .then(res => res.json())
      .then(data => setProvinces(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error loading provinces:", err));
  }, []);

  // Fetch Cities
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
    if (selectedProvince) {
      fetch(`${config.API_URL}/api/shipping/cities/${selectedProvince}`)
        .then(res => res.json())
        .then(data => setCities(Array.isArray(data) ? data : []));
    } else {
      setCities([]);
    }
    setSelectedCity("");
    setSelectedDistrict("");
    setSelectedVillage("");
  }, [selectedProvince]);

  // Fetch Districts
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
    if (selectedCity) {
      fetch(`${config.API_URL}/api/shipping/districts/${selectedCity}`)
        .then(res => res.json())
        .then(data => setDistricts(Array.isArray(data) ? data : []));
    } else {
      setDistricts([]);
    }
    setSelectedDistrict("");
    setSelectedVillage("");
  }, [selectedCity]);

  // Fetch Villages
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
    if (selectedDistrict) {
      fetch(`${config.API_URL}/api/shipping/villages/${selectedDistrict}`)
        .then(res => res.json())
        .then(data => setVillages(Array.isArray(data) ? data : []));
    } else {
      setVillages([]);
    }
    setSelectedVillage("");
  }, [selectedDistrict]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileToast('');
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${config.API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          firstName, 
          lastName, 
          phone, 
          birthDate,
          address: streetAddress, 
          province: provinces.find(p => p.id === selectedProvince)?.name || "", 
          city: cities.find(c => c.id === selectedCity)?.name || "", 
          district: districts.find(d => d.id === selectedDistrict)?.name || "", 
          area: villages.find(v => v.id === selectedVillage)?.name || "", 
          postalCode,
          provinceId: selectedProvince,
          cityId: selectedCity,
          districtId: selectedDistrict,
          areaId: selectedVillage
        })
      });
      if (res.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setProfileToast('Profil berhasil diperbarui!');
        // Update local address cache for checkout page to pick it up immediately
        const cachedAddr = {
          firstName,
          lastName,
          address: streetAddress,
          city: cities.find(c => c.id === selectedCity)?.name || "",
          postalCode,
          phone,
          note: ""
        };
        localStorage.setItem(`savedAddress_${userEmail}`, JSON.stringify(cachedAddr));
        localStorage.setItem('sel_prov', selectedProvince);
        localStorage.setItem('sel_city', selectedCity);
        localStorage.setItem('sel_dist', selectedDistrict);
        localStorage.setItem('sel_vill', selectedVillage);
        setSavedAddress(cachedAddr);
        setTimeout(() => setProfileToast(''), 3000);
      } else {
        setProfileToast('Gagal memperbarui profil: ' + (data.error || data.message || 'Database error'));
      }
    } catch (err) {
      setProfileToast('Server error');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordToast('');

    if (newPassword.length < 6) {
      setPasswordToast('err:Password baru minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordToast('err:Konfirmasi password tidak cocok');
      return;
    }

    setPasswordSaving(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${config.API_URL}/api/profile/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: currentPassword || undefined,
          newPassword
        })
      });

      if (res.status === 401 && !currentPassword) {
        logout();
        navigate('/login');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setPasswordToast('ok:Password berhasil diperbarui!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordToast(''), 4000);
      } else {
        setPasswordToast('err:' + (data.message || 'Gagal memperbarui password'));
      }
    } catch (err) {
      setPasswordToast('err:Server error');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleConfirmDelivery = async (orderId) => {
    if (!window.confirm("Apakah Anda yakin telah menerima pesanan ini? Status pesanan akan diubah menjadi Selesai.")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${config.API_URL}/api/orders/${orderId}/confirm-delivery`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Terima kasih! Pesanan telah dikonfirmasi selesai.");
        // Reload orders
        const headers = { Authorization: `Bearer ${token}` };
        fetch(`${config.API_URL}/api/orders/user?email=${encodeURIComponent(userEmail)}`, { headers })
          .then(r => r.json())
          .then(d => {
            if (Array.isArray(d)) setOrders(d);
          });
      } else {
        alert(data.error || "Gagal mengonfirmasi penerimaan pesanan");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi");
    }
  };

  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) return;
    order.items.forEach(item => {
      addToCart({
        id: item.product_id || item.id,
        name: item.name,
        price: item.price,
        image: item.image || (item.images && item.images[0]),
        images: item.images,
        stock: 99, // optimistic, cart will validate
      }, item.qty || 1);
    });
    setReorderToast(`${order.items.length} item ditambahkan ke keranjang!`);
    setTimeout(() => { setReorderToast(''); navigate('/cart'); }, 1500);
  };

  const statusColor = (status) => {
    switch (status) {
      case "paid": return "text-green-600 bg-green-50 dark:bg-green-900/20";
      case "pending": return "text-red-600 bg-red-50 dark:bg-red-900/20";
      case "waiting_payment": return "text-red-600 bg-red-50 dark:bg-red-900/20 animate-pulse";
      case "waiting_verification": return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
      case "cod": return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
      case "processing": return "text-teal-600 bg-teal-50 dark:bg-teal-900/20";
      case "shipped": return "text-purple-600 bg-purple-50 dark:bg-purple-900/20";
      case "delivered": return "text-green-600 bg-green-50 dark:bg-green-900/20";
      case "completed": return "text-gray-600 bg-gray-50 dark:bg-gray-800";
      case "cancelled": return "text-red-600 bg-red-50 dark:bg-red-900/20";
      case "failed": return "text-red-600 bg-red-50 dark:bg-red-900/20";
      case "expired": return "text-red-600 bg-red-50 dark:bg-red-900/20";
      case "refunded": return "text-gray-650 bg-gray-100 dark:bg-gray-800";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "paid": return "Lunas";
      case "pending": return "Belum Dibayar";
      case "waiting_payment": return "Belum Dibayar";
      case "waiting_verification": return "Menunggu Verifikasi";
      case "cod": return "COD (Bayar di Tempat)";
      case "processing": return "Diproses";
      case "shipped": return "Dikirim";
      case "delivered": return "Diterima";
      case "completed": return "Selesai";
      case "cancelled": return "Dibatalkan";
      case "failed": return "Gagal";
      case "expired": return "Kadaluarsa";
      case "refunded": return "Dikembalikan";
      default: return status;
    }
  };

  const handleOpenReviewModal = (item) => {
    setReviewItem(item);
    setReviewRating(5);
    setReviewComment("");
    setReviewError("");
    setReviewSuccess(false);
    setReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setReviewModalOpen(false);
    setReviewItem(null);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewItem) return;
    const prodId = reviewItem.id || reviewItem.product_id;
    if (!prodId) {
      setReviewError(language === 'EN' ? "Product ID not found." : "ID Produk tidak ditemukan.");
      return;
    }
    setReviewSubmitting(true);
    setReviewError("");
    try {
      const res = await fetch(`${config.API_URL}/api/products/${prodId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (language === 'EN' ? "Failed to submit review" : "Gagal mengirim ulasan"));
      }
      setReviewSuccess(true);
      setTimeout(() => {
        handleCloseReviewModal();
      }, 1500);
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-8 pb-32 md:py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500">

      {/* Reorder Toast */}
      {reorderToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl font-bold text-sm animate-bounce">
          ✅ {reorderToast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-[900] uppercase tracking-tighter text-black dark:text-white mb-2">{t('profile.title')}</h1>
          <p className="text-gray-500 text-sm">{t('profile.welcome')} <span className="font-bold text-black dark:text-gray-300">{firstName ? `${firstName} ${lastName}`.trim() : userEmail}</span></p>
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
                className={`text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${activeTab === 'orders' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {t('profile.myOrders')}
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${activeTab === 'profile' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {t('profile.accountDetails')}
              </button>
              <button
                onClick={() => setActiveTab("address")}
                className={`text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${activeTab === 'address' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {t('profile.addresses')}
              </button>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">


          {activeTab === "orders" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 md:p-8 min-h-[400px]">
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
                    const displayId = formatDisplayOrderId(order.id);
                    const orderLabel = t('profile.orderNumber');
                    const cleanLabel = (orderLabel.endsWith('#') && displayId.startsWith('#')) ? orderLabel.slice(0, -1) : orderLabel;
                    return (
                      <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow relative bg-white dark:bg-gray-800/50">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                          <div>
                            <div className="font-bold text-sm text-gray-900 dark:text-white mb-1 break-all">{cleanLabel}{displayId}</div>
                            <div className="text-xs text-gray-500">{t('profile.placedOn')} {new Date(order.createdAt).toLocaleDateString(currency.locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${statusColor(order.payment_status)}`}>
                              Bayar: {getStatusLabel(order.payment_status)}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${statusColor(order.order_status)}`}>
                              Pesanan: {getStatusLabel(order.order_status)}
                            </span>
                          </div>
                        </div>

                        {/* Order Items List */}
                        <div className="space-y-4">
                          {order.items && order.items.map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-center justify-between border-b pb-4 border-dashed border-gray-100 dark:border-gray-850 last:border-b-0 last:pb-0">
                              <div className="flex gap-4 items-center flex-1 min-w-0">
                                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-0.5 border border-gray-100 dark:border-gray-800">
                                  <img src={getImageUrl(item.image || (item.images && item.images[0]))} className="w-full h-full object-contain p-1" alt={item.name} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-xs uppercase tracking-tight text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Qty: {item.qty}</p>
                                  {order.order_status === 'completed' && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleOpenReviewModal(item); }}
                                      className="mt-2 text-[9px] bg-black dark:bg-white text-white dark:text-black font-extrabold uppercase tracking-wider px-2.5 py-1 rounded hover:opacity-80 transition-opacity"
                                    >
                                      {language === 'EN' ? 'Write Review' : 'Tulis Ulasan'}
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-bold text-sm text-gray-900 dark:text-white">Rp {(item.price * item.qty).toLocaleString('id-ID')}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Total */}
                        <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center text-xs">
                          <span className="text-gray-400 font-bold uppercase tracking-wider">Total</span>
                          <span className="font-extrabold text-sm text-black dark:text-white">Rp {order.total.toLocaleString('id-ID')}</span>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                          {order.order_status === 'shipped' ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleConfirmDelivery(order.id); }}
                              className="text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 hover:opacity-95 transition-all flex items-center gap-1.5 rounded-lg shadow-sm"
                            >
                              ✓ Konfirmasi Diterima
                            </button>
                          ) : ["pending", "waiting_payment"].includes(order.payment_status) && order.paymentMethod !== 'cod' ? (
                            <button
                              onClick={() => navigate(`/payment/confirm?orderId=${order.id}`)}
                              className="text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white px-4 py-2 hover:opacity-95 transition-all flex items-center gap-1 animate-pulse rounded"
                            >
                              💳 Bayar Sekarang
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReorder(order)}
                              className="text-xs font-bold uppercase tracking-wider bg-black dark:bg-white text-white dark:text-black px-4 py-2 hover:opacity-80 transition-opacity flex items-center gap-1"
                            >
                              🔄 Pesan Lagi
                            </button>
                          )}
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 md:p-8 min-h-[400px]">
              <h2 className="text-xl font-bold uppercase tracking-wide mb-6 border-b border-gray-100 dark:border-gray-700 pb-4 text-black dark:text-white">
                {t('profile.accountDetails')}
              </h2>
              <form onSubmit={handleUpdateProfile} className="max-w-md space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t('profile.emailAddress')}</label>
                  <input type="text" value={userEmail} disabled className="w-full p-3 bg-gray-100 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 rounded text-gray-400 font-mono text-sm cursor-not-allowed" />
                  <p className="text-[10px] text-gray-400 mt-1 italic">Email tidak dapat diubah.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Nama Depan</label>
                    <input 
                      type="text" 
                      value={firstName} 
                      onChange={e => setFirstName(e.target.value)} 
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700/30 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded text-sm focus:ring-1 focus:ring-black"
                      placeholder="Nama Depan"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Nama Belakang</label>
                    <input 
                      type="text" 
                      value={lastName} 
                      onChange={e => setLastName(e.target.value)} 
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700/30 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded text-sm focus:ring-1 focus:ring-black"
                      placeholder="Nama Belakang"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Nomor Telepon</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    className="w-full p-3 bg-gray-50 dark:bg-gray-700/30 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded text-sm focus:ring-1 focus:ring-black"
                    placeholder="Contoh: 08123456789"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t('register.birthday')}</label>
                  <input 
                    type="date" 
                    value={birthDate} 
                    onChange={e => setBirthDate(e.target.value)} 
                    className="w-full p-3 bg-gray-50 dark:bg-gray-700/30 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded text-sm focus:ring-1 focus:ring-black"
                  />
                </div>

                {profileToast && (
                  <div className={`p-3 rounded text-xs font-bold ${profileToast.includes('Gagal') ? 'bg-red-50 text-red-700 dark:bg-red-900/10' : 'bg-green-50 text-green-700 dark:bg-green-900/10'}`}>
                    {profileToast}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={profileSaving}
                  className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold uppercase text-xs tracking-widest hover:opacity-80 transition disabled:opacity-50"
                >
                  {profileSaving ? 'Menyimpan...' : 'Perbarui Profil'}
                </button>
              </form>

              {/* Password Change Section */}
              <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold uppercase tracking-wide mb-1 text-black dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Ubah Password
                </h3>
                <p className="text-xs text-gray-400 mb-6">Setel atau ubah password untuk login manual menggunakan email dan password.</p>

                <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Password Saat Ini <span className="font-normal text-gray-400">(opsional jika via Google)</span></label>
                    <div className="relative">
                      <input 
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword} 
                        onChange={e => setCurrentPassword(e.target.value)} 
                        className="w-full p-3 pr-12 bg-gray-50 dark:bg-gray-700/30 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded text-sm focus:ring-1 focus:ring-black"
                        placeholder="Kosongkan jika akun dari Google"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showCurrentPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Password Baru <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <input 
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword} 
                        onChange={e => setNewPassword(e.target.value)} 
                        className="w-full p-3 pr-12 bg-gray-50 dark:bg-gray-700/30 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded text-sm focus:ring-1 focus:ring-black"
                        placeholder="Minimal 6 karakter"
                        required
                        minLength={6}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showNewPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                      </button>
                    </div>
                    {newPassword && newPassword.length < 6 && (
                      <p className="text-[10px] text-red-400 mt-1">Minimal 6 karakter</p>
                    )}
                    {newPassword && newPassword.length >= 6 && (
                      <p className="text-[10px] text-green-500 mt-1">✓ Panjang password cukup</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Konfirmasi Password Baru <span className="text-red-400">*</span></label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      className={`w-full p-3 bg-gray-50 dark:bg-gray-700/30 text-black dark:text-white border rounded text-sm focus:ring-1 focus:ring-black ${
                        confirmPassword && confirmPassword !== newPassword 
                          ? 'border-red-400 dark:border-red-500' 
                          : confirmPassword && confirmPassword === newPassword 
                            ? 'border-green-400 dark:border-green-500'
                            : 'border-gray-200 dark:border-gray-700'
                      }`}
                      placeholder="Ulangi password baru"
                      required
                    />
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-[10px] text-red-400 mt-1">Password tidak cocok</p>
                    )}
                    {confirmPassword && confirmPassword === newPassword && (
                      <p className="text-[10px] text-green-500 mt-1">✓ Password cocok</p>
                    )}
                  </div>

                  {passwordToast && (
                    <div className={`p-3 rounded text-xs font-bold flex items-center gap-2 ${
                      passwordToast.startsWith('err:') 
                        ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' 
                        : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    }`}>
                      {passwordToast.startsWith('err:') ? '⚠️' : '✅'} {passwordToast.replace(/^(err:|ok:)/, '')}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={passwordSaving || !newPassword || newPassword !== confirmPassword}
                    className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold uppercase text-xs tracking-widest hover:opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {passwordSaving ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Menyimpan...
                      </span>
                    ) : 'Ubah Password'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === "address" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 md:p-8 min-h-[400px]">
              <h2 className="text-xl font-bold uppercase tracking-wide mb-6 border-b border-gray-100 dark:border-gray-700 pb-4 text-black dark:text-white">
                {t('profile.savedAddresses')}
              </h2>
              
              <form onSubmit={handleUpdateProfile} className="max-w-xl space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Provinsi</label>
                    <select
                      value={selectedProvince}
                      onChange={e => setSelectedProvince(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700/30 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded text-sm focus:ring-1 focus:ring-black"
                      required
                    >
                      <option value="">Pilih Provinsi</option>
                      {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Kota / Kabupaten</label>
                    <select
                      value={selectedCity}
                      onChange={e => setSelectedCity(e.target.value)}
                      disabled={!selectedProvince}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700/30 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded text-sm focus:ring-1 focus:ring-black disabled:opacity-50"
                      required
                    >
                      <option value="">Pilih Kota/Kabupaten</option>
                      {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Kecamatan</label>
                    <select
                      value={selectedDistrict}
                      onChange={e => setSelectedDistrict(e.target.value)}
                      disabled={!selectedCity}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700/30 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded text-sm focus:ring-1 focus:ring-black disabled:opacity-50"
                      required
                    >
                      <option value="">Pilih Kecamatan</option>
                      {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Desa / Kelurahan</label>
                    <select
                      value={selectedVillage}
                      onChange={e => setSelectedVillage(e.target.value)}
                      disabled={!selectedDistrict}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700/30 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded text-sm focus:ring-1 focus:ring-black disabled:opacity-50"
                      required
                    >
                      <option value="">Pilih Desa/Kelurahan</option>
                      {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Detail Alamat (Jalan, No. Rumah, RT/RW)</label>
                  <textarea
                    value={streetAddress}
                    onChange={e => setStreetAddress(e.target.value)}
                    rows="3"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-700/30 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded text-sm focus:ring-1 focus:ring-black"
                    placeholder="Masukkan detail alamat lengkap"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Kode Pos</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-700/30 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded text-sm focus:ring-1 focus:ring-black"
                    placeholder="Kode Pos"
                    required
                  />
                </div>

                {profileToast && (
                  <div className={`p-3 rounded text-xs font-bold ${profileToast.includes('Gagal') ? 'bg-red-50 text-red-700 dark:bg-red-900/10' : 'bg-green-50 text-green-700 dark:bg-green-900/10'}`}>
                    {profileToast}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={profileSaving}
                  className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold uppercase text-xs tracking-widest hover:opacity-80 transition disabled:opacity-50"
                >
                  {profileSaving ? 'Menyimpan...' : 'Perbarui Alamat'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>


      {/* Review Modal */}
      {reviewModalOpen && reviewItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleCloseReviewModal}></div>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 max-w-sm w-full relative z-10 shadow-2xl rounded-2xl animate-in fade-in zoom-in duration-300">
            <button onClick={handleCloseReviewModal} className="absolute top-4 right-4 text-gray-400 hover:text-black dark:hover:text-white text-xl font-bold">&times;</button>
            
            <h3 className="text-lg font-bold uppercase tracking-tight mb-4 dark:text-white">{t('reviews.leaveReview')}</h3>
            <p className="text-xs text-gray-400 mb-6 font-bold uppercase tracking-wide">{language === 'EN' ? 'Product:' : 'Produk:'} {reviewItem.name}</p>

            {reviewSuccess ? (
              <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-xl border border-green-100 dark:border-green-800 text-center animate-in fade-in duration-500">
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-widest">{t('reviews.success')}</div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2">{t('reviews.rating')}</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`text-2xl transition-transform hover:scale-125 focus:outline-none ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        {star <= reviewRating ? "★" : "☆"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2">{language === 'EN' ? 'Comment / Review' : 'Komentar / Ulasan'}</label>
                  <textarea
                    rows="4"
                    placeholder={t('reviews.placeholder')}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-black dark:text-white outline-none"
                    required
                  ></textarea>
                </div>

                {reviewError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold">
                    {reviewError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg"
                >
                  {reviewSubmitting ? t('reviews.submitting') : t('reviews.submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
