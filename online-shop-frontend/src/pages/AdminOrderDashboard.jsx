import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaCheck, FaTimes, FaSearch } from "react-icons/fa";
import config from '../config.js';
import { useCurrency } from '../components/CurrencyContext.jsx';

const statusColors = {
  pending: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  waiting_payment: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
  waiting_verification: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  processing: "bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400",
  shipped: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  completed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  cancelled: "bg-red-50 text-red-500 dark:bg-red-900/10 dark:text-red-400"
};

const AdminOrderDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();
  const { t } = useCurrency();

  const getStatusLabel = (status) => {
    const map = {
      pending: t('admin.orders.unpaid') || "Belum Bayar",
      waiting_payment: t('admin.orders.unpaid') || "Belum Bayar",
      waiting_verification: t('admin.orders.needVerification') || "Butuh Verifikasi",
      paid: t('admin.orders.readyToShip') || "Siap Kirim (Paid)",
      processing: "Diproses (COD)",
      shipped: t('admin.orders.shipped') || "Dikirim",
      completed: t('admin.orders.completed') || "Selesai",
      failed: t('admin.orders.failed') || "Gagal",
      cancelled: "Dibatalkan",
    };
    return map[status] || status;
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${config.API_URL}/api/orders`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const sorted = data.sort((a, b) => b.id - a.id);
        setOrders(sorted);
        setFilteredOrders(sorted);
      } else {
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    let res = orders;
    if (search) {
      res = res.filter(o =>
        String(o.id).includes(search) ||
        String(o.userId).toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      res = res.filter(o => o.status === statusFilter);
    }
    setFilteredOrders(res);
  }, [search, statusFilter, orders]);

  const handleVerify = async (orderId, status) => {
    if (!window.confirm(status === 'paid' ? t('admin.orders.confirmVerify') : t('admin.orders.confirmReject'))) return;
    setVerifying(true);
    try {
      await fetch(`${config.API_URL}/api/orders/status/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      fetchOrders();
    } catch (e) {
      alert(t('admin.orders.errorUpdate'));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 pt-24 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block italic">Management</span>
            <h1 className="text-4xl font-[900] text-black dark:text-white uppercase tracking-tighter italic">Manajemen Pesanan</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Cari ID Pesanan atau Pengguna..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-[10px] font-black uppercase tracking-widest border-none bg-gray-50 dark:bg-gray-800/50 rounded-xl dark:text-white focus:ring-2 focus:ring-black outline-none transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-none bg-gray-50 dark:bg-gray-800/50 rounded-xl dark:text-white cursor-pointer outline-none"
            >
              <option value="all">SEMUA STATUS</option>
              <option value="waiting_verification">BUTUH VERIFIKASI</option>
              <option value="pending">BELUM BAYAR</option>
              <option value="paid">SIAP KIRIM (PAID)</option>
              <option value="processing">DIPROSES (COD)</option>
              <option value="shipped">DIKIRIM</option>
              <option value="completed">SELESAI</option>
              <option value="cancelled">DIBATALKAN</option>
              <option value="failed">GAGAL</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">Memuat data pesanan...</p>
           </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-[30px] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-gray-400">ID Pesanan</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-gray-400">Info Pembeli</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-gray-400">Total Tagihan</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-gray-400">Tanggal</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-gray-400">Status</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all cursor-pointer group" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                      <td className="px-8 py-6">
                        <span className="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest">#{order.id}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-black text-black dark:text-white uppercase tracking-tight mb-1 text-xs">{String(order.userId || "Guest Customer")}</div>
                        <div className="flex items-center gap-1">
                           <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">{order.paymentMethod || 'manual'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-[900] text-black dark:text-white text-sm">
                        Rp {Number(order.total).toLocaleString("id-ID")}
                      </td>
                      <td className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-block ${statusColors[order.status] || 'bg-gray-100'}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                            className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black rounded-xl text-gray-400 transition-all"
                            title={t('admin.orders.viewDetail')}
                          >
                            <FaEye size={12} />
                          </button>

                          {order.status === "waiting_verification" && (
                            <>
                              <button
                                className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all"
                                onClick={() => handleVerify(order.id, "paid")}
                                disabled={verifying}
                                title={t('admin.orders.accept')}
                              >
                                <FaCheck size={12} />
                              </button>
                              <button
                                className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all"
                                onClick={() => handleVerify(order.id, "failed")}
                                disabled={verifying}
                                title={t('admin.orders.reject')}
                              >
                                <FaTimes size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-32">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                          </div>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Daftar Pesanan Kosong</h4>
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase mt-2 italic tracking-widest">Menunggu transaksi pertama dari pelanggan...</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrderDashboard;
