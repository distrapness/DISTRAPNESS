import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaCheck, FaTimes, FaSearch } from "react-icons/fa";
import config from '../config.js';
import { useCurrency } from '../components/CurrencyContext.jsx';
import { formatDisplayOrderId } from '../utils/orderHelper';

// statusColors omitted in favor of inline logic

const AdminOrderDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();
  const { t } = useCurrency();
  const [selectedIds, setSelectedIds] = useState([]);
  const [updatingBulk, setUpdatingBulk] = useState(false);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (e, orderId) => {
    e.stopPropagation();
    if (selectedIds.includes(orderId)) {
      setSelectedIds(prev => prev.filter(id => id !== orderId));
    } else {
      setSelectedIds(prev => [...prev, orderId]);
    }
  };

  const handleBulkUpdateStatus = async (newStatus) => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Ubah status ${selectedIds.length} pesanan terpilih menjadi ${getStatusLabel(newStatus)}?`)) return;
    setUpdatingBulk(true);
    try {
      const res = await fetch(`${config.API_URL}/api/orders/bulk-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ orderIds: selectedIds, status: newStatus })
      });
      if (res.ok) {
        alert("Status pesanan terpilih berhasil diperbarui!");
        setSelectedIds([]);
        fetchOrders();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal memperbarui status secara massal");
      }
    } catch (e) {
      console.error(e);
      alert("Gagal memperbarui status secara massal");
    } finally {
      setUpdatingBulk(false);
    }
  };

  const handleBulkPrint = () => {
    if (selectedIds.length === 0) return;
    const selectedOrders = orders.filter(o => selectedIds.includes(o.id));
    
    const win = window.open('', '', 'height=800,width=1000');
    win.document.write('<html><head><title>Cetak Label Pengiriman Massal</title>');
    win.document.write('<style>');
    win.document.write(`
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
      .label-card { border: 2px dashed #000; padding: 20px; margin-bottom: 30px; page-break-inside: avoid; border-radius: 12px; max-width: 700px; margin-left: auto; margin-right: auto; }
      .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
      .brand { font-size: 20px; font-weight: 900; letter-spacing: 2px; }
      .courier { font-size: 16px; font-weight: 800; text-transform: uppercase; color: #e53e3e; }
      .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
      .col { flex: 1; }
      .col-left { border-right: 1px solid #ddd; padding-right: 15px; }
      .col-right { padding-left: 15px; }
      .title { font-size: 10px; color: #666; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; display: block; }
      .name { font-size: 14px; font-weight: bold; text-transform: uppercase; }
      .address { font-size: 12px; font-style: italic; line-height: 1.4; color: #555; }
      .items-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
      .items-table th, .items-table td { border: 1px solid #ddd; padding: 6px 10px; font-size: 11px; text-align: left; }
      .items-table th { background-color: #f7f7f7; font-weight: bold; }
      .footer-card { border-top: 1px dashed #ddd; margin-top: 15px; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; }
      .order-id { font-family: monospace; font-size: 12px; font-weight: bold; }
    `);
    win.document.write('</style></head><body>');

    selectedOrders.forEach(order => {
      let shipping = {};
      try {
        shipping = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address || {};
      } catch(e){}

      let items = [];
      try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
      } catch(e){}

      const itemsRows = items.map(item => `
        <tr>
          <td>${item.name} ${item.selectedSize ? `(${item.selectedSize.toUpperCase()})` : ''}</td>
          <td style="text-align: center;">x${item.qty}</td>
        </tr>
      `).join('');

      win.document.write(`
        <div class="label-card">
          <div class="header">
            <span class="brand">DISTRAPNESS</span>
            <span class="courier">🚚 \${shipping.courierInfo || 'STANDARD DELIVERY'}</span>
          </div>
          <div class="row">
            <div class="col col-left" style="width: 50%;">
              <span class="title">PENERIMA:</span>
              <div class="name">\${shipping.firstName || ''} \${shipping.lastName || ''}</div>
              <div style="font-weight: bold; margin-bottom: 5px;">\${shipping.phone || ''}</div>
              <div class="address">\${shipping.address || ''}, Kel. \${shipping.area || ''}, Kec. \${shipping.district || ''}, \${shipping.city || ''}, \${shipping.province || ''} \${shipping.postalCode || ''}</div>
            </div>
            <div class="col col-right" style="width: 50%;">
              <span class="title">PENGIRIM:</span>
              <div class="name">DISTRAPNESS INDONESIA</div>
              <div style="font-weight: bold; margin-bottom: 5px;">085888159265</div>
              <div class="address">Jakarta, DKI Jakarta, Indonesia</div>
            </div>
          </div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Nama Produk</th>
                <th style="width: 60px; text-align: center;">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              \${itemsRows}
            </tbody>
          </table>
          <div class="footer-card">
            <span class="order-id">INV ID: #\${order.id}</span>
            <span style="font-size: 10px; font-weight: bold; background: #000; color: #fff; padding: 3px 8px; border-radius: 4px;">COD / PREPAID</span>
          </div>
        </div>
      `);
    });

    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

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
      res = res.filter(o => o.order_status === statusFilter || o.payment_status === statusFilter);
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


        {selectedIds.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-5 bg-black dark:bg-white text-white dark:text-black rounded-3xl shadow-2xl animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest bg-gray-800 dark:bg-gray-100 text-white dark:text-black px-3 py-1.5 rounded-lg">
                Terpilih: {selectedIds.length} Pesanan
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleBulkPrint}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition"
              >
                🖨️ Cetak Label Massal
              </button>
              
              <div className="h-6 w-[1px] bg-gray-700 dark:bg-gray-200 hidden sm:block"></div>
              
              <button
                onClick={() => handleBulkUpdateStatus('completed')}
                disabled={updatingBulk}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition disabled:opacity-50"
              >
                ✓ Tandai Selesai
              </button>
              
              <button
                onClick={() => handleBulkUpdateStatus('shipped')}
                disabled={updatingBulk}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition disabled:opacity-50"
              >
                🚚 Tandai Dikirim
              </button>

              <button
                onClick={() => handleBulkUpdateStatus('cancelled')}
                disabled={updatingBulk}
                className="px-5 py-2.5 bg-red-650 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition disabled:opacity-50"
              >
                ✘ Batalkan
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="px-5 py-2.5 bg-gray-800 dark:bg-gray-200 hover:opacity-85 text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">Memuat data pesanan...</p>
           </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-[30px] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                    <th className="px-6 py-5 w-12 text-center">
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAll} 
                        checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length}
                        className="cursor-pointer accent-black dark:accent-white"
                      />
                    </th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-gray-400">ID Pesanan</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-gray-400">Info Pembeli</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-gray-400">Total Tagihan</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-gray-400">Tanggal</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-gray-400">Status Pembayaran</th>
<th className="px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-gray-400">Status Pesanan</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all cursor-pointer group" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                      <td className="px-6 py-6 text-center" onClick={e => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(order.id)}
                          onChange={(e) => handleSelectOne(e, order.id)}
                          className="cursor-pointer accent-black dark:accent-white"
                        />
                      </td>
                      <td className="px-8 py-6">
                        <span className="whitespace-nowrap bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest">{formatDisplayOrderId(order.id)}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-black text-black dark:text-white uppercase tracking-tight mb-1 text-xs break-all">{String(order.userId || "Guest Customer")}</div>
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
  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-block ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
    {t(`admin.status.payment_${order.payment_status}`) || order.payment_status}
  </span>
</td>
<td className="px-8 py-6">
  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-block ${order.order_status === 'completed' || order.order_status === 'delivered' ? 'bg-gray-100 text-gray-700' : order.order_status === 'shipped' ? 'bg-purple-100 text-purple-700' : order.order_status === 'processing' ? 'bg-teal-100 text-teal-700' : order.order_status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
    {t(`admin.status.order_${order.order_status}`) || order.order_status}
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

                          {order.payment_status === "waiting_verification" && (
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
