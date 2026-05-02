import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import config from "../config.js";
import { io } from "socket.io-client";
import { getImageUrl } from "../utils/imageHelper";
import { useCurrency } from "../components/CurrencyContext.jsx";
import {
  FaBoxOpen, FaShoppingCart, FaMoneyBillWave, FaArrowRight,
  FaTags, FaCog, FaUserFriends, FaExclamationTriangle, FaChartLine
} from "react-icons/fa";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0, totalOrders: 0, totalProducts: 0,
    lowStock: [], bestSellers: [], chartData: []
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [loading, setLoading] = useState(true);
  const { t } = useCurrency();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Use dynamic API_URL from config
      const statsRes = await axios.get(`${config.API_URL}/api/admin/stats`, { headers });
      const chartRes = await axios.get(`${config.API_URL}/api/orders/stats/chart`, { headers });
      
      setStats({
        ...statsRes.data,
        chartData: chartRes.data.map(d => d.revenue) // Use real revenue data for charts
      });

      const ordersRes = await axios.get(`${config.API_URL}/api/orders`, { headers });
      setRecentOrders(ordersRes.data.slice(0, 5));
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      if (error.response && error.response.status === 401) {
        // Token truly invalid or expired -> Logout
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/login";
      } else if (error.response && error.response.status === 403) {
        const debug = error.response.data.debug;
        const msg = debug 
          ? `Akses Terbatas: Backend melihat role Anda sebagai "${debug.receivedRole}" (Email: ${debug.email}).`
          : `Akses Terbatas: Akun Anda belum memiliki akses Admin penuh.`;
        alert(msg);
        // window.location.href = "/";
      } else {
        // Other errors (network, 500, etc) -> Keep session, just show error in console
        console.error("Dashboard data fetch failed:", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return 'Rp' + new Intl.NumberFormat("id-ID", { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${config.API_URL}/api/orders/export/csv`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders-${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Gagal mengekspor data");
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-500">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Ikhtisar Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Inilah yang terjadi di toko Anda hari ini.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportCSV}
            className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition"
          >
            📊 Export Data
          </button>
          <Link to="/admin/discounts" className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl shadow-xl text-xs font-black uppercase tracking-widest hover:scale-95 transition flex items-center">
            🎟️ Kupon
          </Link>
          <Link to="/product-admin" className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow-lg text-xs font-black uppercase tracking-widest hover:scale-95 transition flex items-center">
            + Produk
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN (Main Content) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Revenue Chart Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg text-gray-800 dark:text-white">Analisis Pendapatan (30 Hari Terakhir)</h2>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Pertumbuhan Harian</span>
            </div>
            <div className="h-48 w-full">
              {stats.chartData && <Sparkline data={stats.chartData} color="green" height={180} />}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              title="Total Pendapatan"
              value={formatCurrency(stats.totalRevenue)}
              trend="+12% vs minggu lalu"
              trendColor="text-green-500"
              icon={<FaMoneyBillWave className="text-green-600 text-xl" />}
              chartData={stats.chartData}
              color="green"
            />
            <StatCard
              title="Total Pesanan"
              value={stats.totalOrders}
              trend="+5% vs minggu lalu"
              trendColor="text-green-500"
              icon={<FaShoppingCart className="text-blue-600 text-xl" />}
              chartData={stats.chartData}
              color="blue"
            />
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg text-gray-800 dark:text-white">Pesanan Terbaru</h2>
              <Link to="/admin/orders" className="text-blue-600 dark:text-blue-400 text-sm hover:underline font-medium">
                Lihat Semua Pesanan
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">ID Pesanan</th>
                    <th className="px-4 py-3 font-semibold">Total / Pembayaran</th>
                    <th className="px-4 py-3 font-semibold">Tanggal</th>
                    <th className="px-4 py-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {recentOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-4 py-4 font-bold text-gray-900 dark:text-white">#{order.id}</td>
                      <td className="px-4 py-4">
                        <div className="text-gray-900 dark:text-white font-medium">{formatCurrency(order.total)}</div>
                        <div className="text-xs text-gray-500">{order.paymentMethod}</div>
                      </td>
                      <td className="px-4 py-4 text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block
                          ${order.status === 'paid' || order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-500">Belum ada pesanan terbaru.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Sidebar) */}
        <div className="space-y-8">

          {/* Inventory Alert */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <FaExclamationTriangle className="text-orange-500" /> Peringatan Stok
              </h3>
              {stats.lowStock?.length > 0 && (
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded">
                  {stats.lowStock.length} items
                </span>
              )}
            </div>

            <div className="space-y-4">
              {stats.lowStock && stats.lowStock.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <img
                    src={getImageUrl(p.images[0]) || "https://via.placeholder.com/50"}
                    className="w-12 h-12 object-cover rounded-md"
                    alt={p.name}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-red-500 font-bold">Sisa {p.stock} di stok</p>
                  </div>
                  <Link to={`/product-admin?edit=${p.id}`} className="text-blue-600 text-xs font-bold hover:underline">
                    Restok
                  </Link>
                </div>
              ))}
              {(!stats.lowStock || stats.lowStock.length === 0) && (
                <p className="text-sm text-gray-500">Semua stok dalam kondisi aman.</p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
              <Link to="/product-admin" className="text-gray-500 text-sm hover:text-gray-800 dark:hover:text-white transition">
                Lihat Semua Inventaris
              </Link>
            </div>
          </div>

          {/* Top Performing */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-white mb-6">Produk Terbaik</h3>
            <div className="space-y-6">
              {stats.bestSellers && stats.bestSellers.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-gray-400 font-bold text-lg w-6">0{idx + 1}</div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.sales} Penjualan</p>
                    </div>
                  </div>
                  <div className="text-green-500 font-bold text-sm">+{p.growth}%</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// CSS Sparkline Chart Component
const Sparkline = ({ data, color = "green", height = 40 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible opacity-50">
      <polyline
        fill="none"
        stroke={color === "green" ? "#22c55e" : "#3b82f6"}
        strokeWidth="2"
        points={points}
      />
      <path
        d={`M0,${height} L${points} L${width},${height} Z`}
        fill={color === "green" ? "#22c55e" : "#3b82f6"}
        fillOpacity="0.1"
      />
    </svg>
  );
};

const StatCard = ({ title, value, trend, trendColor, icon, chartData, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">{value}</h3>
      </div>
      <div className={`p-4 rounded-2xl ${color === 'green' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'} dark:bg-opacity-10 transition-transform group-hover:scale-110`}>
        {icon}
      </div>
    </div>

    <div className="flex items-center gap-2 mb-6 relative z-10">
      <span className={`text-[10px] font-black uppercase ${trendColor === 'text-green-500' ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50'} dark:bg-opacity-10 px-2 py-1 rounded-lg`}>
        {trend}
      </span>
    </div>

    <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30 grayscale group-hover:grayscale-0 transition-all duration-700">
      {chartData && <Sparkline data={chartData} color={color} height={48} />}
    </div>
  </div>
);

export default AdminDashboard;
