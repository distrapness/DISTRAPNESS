import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCurrency } from "../components/CurrencyContext.jsx";
import config from "../config";
import { getImageUrl } from "../utils/imageHelper";
import { useCart } from "../components/CartContext";

export default function Profile() {
  const { userEmail, logout } = useAuth();
  const { t, currency } = useCurrency();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");
  const [savedAddress, setSavedAddress] = useState(null);
  const [profile, setProfile] = useState(null);
  const [reorderToast, setReorderToast] = useState('');
  const [copyStatus, setCopyStatus] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [withdrawStatus, setWithdrawStatus] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);

  useEffect(() => {
    if (userEmail) {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const addr = localStorage.getItem(`savedAddress_${userEmail}`);
      if (addr) {
        try { setSavedAddress(JSON.parse(addr)); } catch (e) { }
      }
      setLoading(true);
      
      // Fetch Profile (Referral Info)
      fetch(`${config.API_URL}/api/profile`, { headers })
        .then(res => res.json())
        .then(data => setProfile(data))
        .catch(err => console.error("Profile fetch error:", err));

      fetch(`${config.API_URL}/api/orders/user?email=${encodeURIComponent(userEmail)}`)
        .then((res) => res.json())
        .then((data) => {
          setOrders(Array.isArray(data) ? data : []);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));

      // Fetch Withdrawals
      fetch(`${config.API_URL}/api/affiliate/stats`, { headers })
        .then(res => res.json())
        .then(data => setWithdrawals(data.withdrawals || []))
        .catch(err => console.error("Withdrawals fetch error:", err));
    } else {
      setLoading(false);
    }
  }, [userEmail]);

  const handleLogout = () => {
    logout();
    navigate("/login");
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
      case "pending": return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
      case "shipped": return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
      case "cancelled": return "text-red-600 bg-red-50 dark:bg-red-900/20";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    setWithdrawStatus({ type: 'loading', message: 'Memproses...' });

    try {
      const res = await fetch(`${config.API_URL}/api/affiliate/withdraw`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: withdrawAmount, bank_account: bankAccount })
      });
      const data = await res.json();
      if (data.success) {
        setWithdrawStatus({ type: 'success', message: 'Permintaan penarikan berhasil dikirim!' });
        setWithdrawAmount('');
        setBankAccount('');
        // Refresh profile & withdrawals
        const headers = { Authorization: `Bearer ${token}` };
        fetch(`${config.API_URL}/api/profile`, { headers }).then(r => r.json()).then(setProfile);
        fetch(`${config.API_URL}/api/affiliate/stats`, { headers }).then(r => r.json()).then(d => setWithdrawals(d.withdrawals));
      } else {
        setWithdrawStatus({ type: 'error', message: data.error || 'Gagal mengirim permintaan' });
      }
    } catch (err) {
      setWithdrawStatus({ type: 'error', message: 'Server error' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500">

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
                className={`text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${activeTab === 'orders' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {t('profile.myOrders')}
              </button>
              <button
                onClick={() => setActiveTab("referral")}
                className={`text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${activeTab === 'referral' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Referral Program
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${activeTab === 'profile' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {t('profile.accountDetails')}
              </button>
              <button
                onClick={() => setActiveTab("affiliate")}
                className={`text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${activeTab === 'affiliate' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Affiliate & Komisi
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
          {activeTab === "referral" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 md:p-8 min-h-[400px]">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                <h2 className="text-xl font-bold uppercase tracking-wide text-black dark:text-white">Referral Program</h2>
                <div className="flex gap-2">
                   <div className="text-center bg-gray-50 dark:bg-gray-700 p-2 rounded min-w-[80px]">
                      <div className="text-[10px] text-gray-500 uppercase font-bold">Total Poin</div>
                      <div className="text-lg font-bold text-black dark:text-white">{profile?.points || 0}</div>
                   </div>
                   <div className="text-center bg-gray-50 dark:bg-gray-700 p-2 rounded min-w-[80px]">
                      <div className="text-[10px] text-gray-500 uppercase font-bold">Referrals</div>
                      <div className="text-lg font-bold text-black dark:text-white">{profile?.referrals_count || 0}</div>
                   </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 p-8 rounded-2xl text-white mb-8 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-colors"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-2 uppercase tracking-[0.2em]">Bagikan Gaya, Dapatkan Hadiah</h3>
                  <p className="text-gray-400 text-sm mb-6 max-w-sm">Ajak temanmu berbelanja di Distrapness dan dapatkan poin eksklusif serta diskon khusus untuk setiap pembelian pertama mereka.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Kode Referral Anda</label>
                      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 flex justify-between items-center border border-white/10">
                        <span className="font-mono text-xl font-bold tracking-[0.3em]">{profile?.referral_code || 'LOADING...'}</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(profile?.referral_code || '');
                            setCopyStatus('code');
                            setTimeout(() => setCopyStatus(false), 2000);
                          }}
                          className="px-4 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-wider rounded hover:bg-gray-200 transition-colors"
                        >
                          {copyStatus === 'code' ? 'TERSALIN' : 'SALIN KODE'}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Halaman Referral</label>
                      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center border border-white/10 gap-4">
                        <span className="text-xs text-gray-300 break-all font-light">{`${window.location.origin}?ref=${profile?.referral_code}`}</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}?ref=${profile?.referral_code}`);
                            setCopyStatus('link');
                            setTimeout(() => setCopyStatus(false), 2000);
                          }}
                          className="px-4 py-2 bg-gray-700 text-white text-[10px] font-bold uppercase tracking-wider rounded border border-white/20 hover:bg-gray-600 transition-colors whitespace-nowrap"
                        >
                          {copyStatus === 'link' ? 'TERSALIN' : 'SALIN LINK'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border border-gray-100 dark:border-gray-700 rounded-xl">
                  <h4 className="font-bold text-sm uppercase mb-4 tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center text-[10px]">1</span>
                    Cara Kerja
                  </h4>
                  <ul className="space-y-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    <li>• Bagikan kode/link toko atau link produk spesifik ke teman-temanmu.</li>
                    <li>• Temanmu mendapatkan poin/potongan harga otomatis.</li>
                    <li>• Kamu mendapatkan <strong>Komisi Tunai 10%</strong> + Poin setelah transaksi selesai.</li>
                  </ul>
                </div>
                <div className="p-6 border border-gray-100 dark:border-gray-700 rounded-xl">
                  <h4 className="font-bold text-sm uppercase mb-4 tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center text-[10px]">2</span>
                    Keuntungan Poin
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Poin yang terkumpul dapat ditukarkan dengan Merchandise Eksklusif, Voucher Potongan Langsung, hingga Akses Early Bird untuk drop produk terbaru.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "affiliate" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 md:p-8 min-h-[400px]">
              <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                <h2 className="text-xl font-bold uppercase tracking-wide text-black dark:text-white">Affiliate Dashboard</h2>
                <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl border border-green-100 dark:border-green-800 text-right">
                  <div className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase tracking-widest">Saldo Komisi (IDR)</div>
                  <div className="text-2xl font-black text-green-600 dark:text-green-400">Rp {Number(profile?.balance || 0).toLocaleString('id-ID')}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left: Withdrawal Form */}
                <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-2xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                    💵 Tarik Komisi
                  </h3>
                  <form onSubmit={handleWithdraw} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Jumlah Penarikan (Min Rp 50.000)</label>
                      <input 
                        type="number" 
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Contoh: 100000"
                        className="w-full bg-white dark:bg-gray-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-black transition-all"
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Informasi Rekening (Bank & Atas Nama)</label>
                      <textarea 
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="Contoh: BCA 1234567890 a/n Distrapness Partner"
                        className="w-full bg-white dark:bg-gray-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-black transition-all"
                        rows="3"
                        required
                      ></textarea>
                    </div>
                    
                    {withdrawStatus && (
                      <div className={`p-3 rounded-lg text-xs font-bold ${withdrawStatus.type === 'success' ? 'bg-green-100 text-green-700' : withdrawStatus.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {withdrawStatus.message}
                      </div>
                    )}

                    <button 
                      type="submit"
                      disabled={withdrawStatus?.type === 'loading'}
                      className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg"
                    >
                      Kirim Permintaan
                    </button>
                  </form>
                </div>

                {/* Right: History */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                    🕒 Riwayat Penarikan
                  </h3>
                  {withdrawals.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-400 italic">Belum ada riwayat penarikan</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {withdrawals.map((w) => (
                        <div key={w.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                          <div>
                            <div className="text-sm font-bold text-black dark:text-white">Rp {Number(w.amount).toLocaleString('id-ID')}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-tight">{new Date(w.created_at).toLocaleDateString()}</div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter shadow-sm
                            ${w.status === 'approved' ? 'bg-green-100 text-green-700' : w.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {w.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-12 bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-800">
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Bagaimana cara mendapatkan komisi?</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  Gunakan kode referral Anda di tab <strong>Referral Program</strong>. Setiap kali seseorang berbelanja menggunakan kode Anda, Anda akan mendapatkan <strong>Komisi Tunai sebesar 10%</strong> dari total belanja mereka (setelah pembayaran selesai). Komisi akan otomatis masuk ke Saldo Anda dan dapat ditarik setelah mencapai Rp 50.000.
                </p>
              </div>
            </div>
          )}

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

                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                          <button
                            onClick={() => handleReorder(order)}
                            className="text-xs font-bold uppercase tracking-wider bg-black dark:bg-white text-white dark:text-black px-4 py-2 hover:opacity-80 transition-opacity flex items-center gap-1"
                          >
                            🔄 Pesan Lagi
                          </button>
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
