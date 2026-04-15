import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaCheck, FaTimes, FaSearch } from "react-icons/fa";
import config from '../config.js';

const statusLabels = {
  pending: "Menunggu Pembayaran",
  waiting_payment: "Menunggu Pembayaran",
  waiting_verification: "Menunggu Verifikasi Admin",
  paid: "Lunas",
  shipped: "Dikirim",
  completed: "Selesai",
  failed: "Gagal",
  cancelled: "Dibatalkan"
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  waiting_payment: "bg-orange-100 text-orange-700",
  waiting_verification: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  shipped: "bg-purple-100 text-purple-700",
  completed: "bg-gray-100 text-gray-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-red-50 text-red-500"
};

const AdminOrderDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${config.API_URL}/api/orders`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        // Sort by ID desc (newest first)
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

  useEffect(() => {
    fetchOrders();
  }, []);

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
    if (!window.confirm(status === 'paid' ? "Verifikasi pembayaran ini valid?" : "Tolak pembayaran ini?")) return;

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
      fetchOrders(); // Refresh
    } catch (e) {
      alert("Gagal update");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-24 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Order Management</h1>
            <p className="text-gray-500 dark:text-gray-400">Verifikasi dan proses pesanan masuk.</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search Order ID or User..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border rounded-lg px-4 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="all">Semua Status</option>
              <option value="waiting_verification">Perlu Verifikasi</option>
              <option value="pending">Belum Bayar</option>
              <option value="paid">Siap Kirim (Lunas)</option>
              <option value="shipped">Dikirim</option>
              <option value="completed">Selesai</option>
              <option value="failed">Gagal</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">Loading orders...</div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Order ID</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">User / Info</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Total</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition cursor-pointer" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">#{order.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{String(order.userId || "Guest")}</div>
                        <div className="text-xs text-gray-500">{order.paymentMethod}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-700 dark:text-gray-300">
                        Rp {Number(order.total).toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${statusColors[order.status] || 'bg-gray-100'}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                            className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded text-gray-600 dark:text-white"
                            title="Lihat Detail"
                          >
                            <FaEye />
                          </button>

                          {/* Quick Actions for Verifying */}
                          {order.status === "waiting_verification" && (
                            <>
                              <button
                                className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded font-bold"
                                onClick={() => handleVerify(order.id, "paid")}
                                disabled={verifying}
                                title="Terima Pembayaran"
                              >
                                <FaCheck />
                              </button>
                              <button
                                className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded font-bold"
                                onClick={() => handleVerify(order.id, "failed")}
                                disabled={verifying}
                                title="Tolak"
                              >
                                <FaTimes />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        No orders found matching your filters.
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
