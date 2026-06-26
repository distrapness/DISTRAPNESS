import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import config from "../config.js";
import { io } from "socket.io-client";
import { getImageUrl } from "../utils/imageHelper";
import { useCurrency } from "../components/CurrencyContext.jsx";
import { formatDisplayOrderId } from "../utils/orderHelper";
import {
  FaBoxOpen, FaShoppingCart, FaMoneyBillWave, FaArrowRight,
  FaTags, FaCog, FaUserFriends, FaExclamationTriangle, FaChartLine, FaWallet
} from "react-icons/fa";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0, totalOrders: 0, totalProducts: 0,
    adminBalance: 0,
    lowStock: [], bestSellers: [], chartData: [],
    thisMonthRevenue: 0, lastMonthRevenue: 0,
    statusCounts: { success: 0, pending: 0, failed: 0 },
    paymentMethodStats: {}
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
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Ikhtisar Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Inilah yang terjadi di toko Anda hari ini.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Saldo Akun Admin"
              value={formatCurrency(stats.adminBalance || 0)}
              trend="Dana Masuk Selesai"
              trendColor="text-indigo-500"
              icon={<FaWallet className="text-indigo-600 text-xl" />}
              color="indigo"
            />
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

          {/* Detailed Sales Reports & Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* MoM Revenue and Order Status Ratio */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
              <div>
                <h3 className="font-bold text-base text-gray-800 dark:text-white mb-4">Perbandingan Pendapatan Bulanan</h3>
                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Bulan Ini</span>
                    <span className="text-xl font-black text-gray-900 dark:text-white">{formatCurrency(stats.thisMonthRevenue)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Bulan Lalu</span>
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{formatCurrency(stats.lastMonthRevenue)}</span>
                  </div>
                </div>
                
                {/* Growth indicator */}
                {(() => {
                   const diff = stats.thisMonthRevenue - stats.lastMonthRevenue;
                   const pct = stats.lastMonthRevenue > 0 ? (diff / stats.lastMonthRevenue) * 100 : (stats.thisMonthRevenue > 0 ? 100 : 0);
                   const isUp = diff >= 0;
                   const isNew = stats.lastMonthRevenue === 0 && stats.thisMonthRevenue > 0;
                   return (
                     <div className="mt-3 flex items-center gap-2 text-xs font-bold">
                       <span className={isUp ? "text-green-600 bg-green-50 dark:bg-green-900/10 px-2 py-1 rounded-lg" : "text-red-600 bg-red-50 dark:bg-red-900/10 px-2 py-1 rounded-lg"}>
                         {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}% MoM Growth {isNew && "(Baru)"}
                       </span>
                       <span className="text-gray-400 dark:text-gray-500 font-normal">selisih {formatCurrency(Math.abs(diff))}</span>
                     </div>
                   );
                 })()}
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <h3 className="font-bold text-base text-gray-800 dark:text-white mb-4">Rasio Status Pesanan</h3>
                {(() => {
                  const status = stats.statusCounts || { success: 0, pending: 0, failed: 0 };
                  const total = status.success + status.pending + status.failed || 1;
                  const successPct = (status.success / total) * 100;
                  const pendingPct = (status.pending / total) * 100;
                  const failedPct = (status.failed / total) * 100;

                  return (
                    <div className="space-y-4">
                      {/* Success Bar */}
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Berhasil (Lunas/Diproses)</span>
                          <span className="text-green-600">{status.success} ({successPct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: `${successPct}%` }}></div>
                        </div>
                      </div>
                      
                      {/* Pending Bar */}
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Menunggu Pembayaran</span>
                          <span className="text-yellow-600">{status.pending} ({pendingPct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div className="bg-yellow-500 h-full rounded-full transition-all duration-1000" style={{ width: `${pendingPct}%` }}></div>
                        </div>
                      </div>

                      {/* Failed Bar */}
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Batal / Kedaluwarsa</span>
                          <span className="text-red-600">{status.failed} ({failedPct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div className="bg-red-500 h-full rounded-full transition-all duration-1000" style={{ width: `${failedPct}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Payment Method Performance Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-bold text-base text-gray-800 dark:text-white mb-4">Performa Metode Pembayaran</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700 uppercase font-black tracking-wider text-[10px]">
                      <th className="py-3 px-4 rounded-l-lg text-left">Metode</th>
                      <th className="py-3 px-4 text-center">Transaksi</th>
                      <th className="py-3 px-4 text-right">Pendapatan</th>
                      <th className="py-3 px-4 text-right rounded-r-lg">Rata-rata (AOV)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {Object.entries(stats.paymentMethodStats || {}).map(([method, data]) => (
                      <tr key={method} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-800 dark:text-gray-200 capitalize">
                          {method === 'midtrans' ? 'Midtrans (VA/QRIS)' : method.toUpperCase()}
                        </td>
                        <td className="py-3.5 px-4 text-center text-gray-600 dark:text-gray-400 font-semibold">{data.count}</td>
                        <td className="py-3.5 px-4 text-right font-black text-gray-900 dark:text-white">{formatCurrency(data.total)}</td>
                        <td className="py-3.5 px-4 text-right text-gray-500 font-medium">{formatCurrency(data.total / (data.count || 1))}</td>
                      </tr>
                    ))}
                    {Object.keys(stats.paymentMethodStats || {}).length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-6 text-gray-400 italic">Belum ada data pembayaran lunas.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800 mt-4">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  💡 <strong>Analisis:</strong> Pendapatan di atas hanya dihitung dari pesanan yang sukses (lunas/proses). Gunakan data ini untuk mengoptimalkan metode pembayaran yang paling disukai pelanggan.
                </p>
              </div>
            </div>
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
                      <td className="px-4 py-4 font-bold text-gray-900 dark:text-white break-all">{formatDisplayOrderId(order.id)}</td>
                      <td className="px-4 py-4">
                        <div className="text-gray-900 dark:text-white font-medium">{formatCurrency(order.total)}</div>
                        <div className="text-xs text-gray-500">{order.paymentMethod}</div>
                      </td>
                      <td className="px-4 py-4 text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block
                          ${order.order_status === 'completed' || order.order_status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.order_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                            order.order_status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          {order.order_status}
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
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  const strokeColor = color === "green" ? "#10b981" : color === "indigo" ? "#6366f1" : "#3b82f6";

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible opacity-75">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <path
        d={`M0,${height} L${points} L${width},${height} Z`}
        fill={`url(#grad-${color})`}
      />
    </svg>
  );
};

const StatCard = ({ title, value, trend, trendColor, icon, chartData, color }) => {
  const borderTopColor = color === 'green' ? 'border-t-4 border-green-500' :
                         color === 'indigo' ? 'border-t-4 border-indigo-500' :
                         'border-t-4 border-blue-500';
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:shadow-md transition-all flex flex-col justify-between h-full ${borderTopColor}`}>
      <div>
        <div className="flex justify-between items-center mb-4 relative z-10 gap-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{title}</p>
          <div className={`p-3 rounded-xl flex-shrink-0 ${
            color === 'green' ? 'bg-green-50 text-green-600' :
            color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
            'bg-blue-50 text-blue-600'
          } dark:bg-opacity-10 transition-transform group-hover:scale-110`}>
            {icon}
          </div>
        </div>
        <div className="relative z-10 mb-4">
          <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis" title={value}>{value}</h3>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2 relative z-10">
        <span className={`text-[10px] font-black uppercase ${
          trendColor === 'text-green-500' ? 'text-green-600 bg-green-50' :
          trendColor === 'text-indigo-500' ? 'text-indigo-600 bg-indigo-50' :
          'text-blue-600 bg-blue-50'
        } dark:bg-opacity-10 px-2 py-1 rounded-lg`}>
          {trend}
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30 grayscale group-hover:grayscale-0 transition-all duration-700">
        {chartData && <Sparkline data={chartData} color={color} height={48} />}
      </div>
    </div>
  );
};

export default AdminDashboard;
