import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import config from "../config.js";
import { io } from "socket.io-client";
import { getImageUrl } from "../utils/imageHelper";
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch Advanced Stats
      const statsRes = await axios.get(`${config.API_URL}/api/admin/stats`, { headers });
      setStats(statsRes.data);

      // Fetch Recent Orders
      const ordersRes = await axios.get(`${config.API_URL}/api/orders`, { headers });
      setRecentOrders(ordersRes.data.slice(0, 5));
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(amount);
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-500">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Here’s what’s happening with your store today.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 font-medium hover:bg-gray-50 transition">
            Export Data
          </button>
          <Link to="/admin/discounts" className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg font-bold hover:bg-purple-700 transition flex items-center">
            🎟️ Coupons
          </Link>
          <Link to="/product-admin" className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg font-bold hover:bg-blue-700 transition flex items-center">
            + Add Product
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN (Main Content) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              trend="+12% vs last week"
              trendColor="text-green-500"
              icon={<FaMoneyBillWave className="text-green-600 text-xl" />}
              chartData={stats.chartData} // Pass data for sparkline
              color="green"
            />
            <StatCard
              title="Total Orders"
              value={stats.totalOrders}
              trend="+5% vs last week"
              trendColor="text-green-500"
              icon={<FaShoppingCart className="text-blue-600 text-xl" />}
              chartData={stats.chartData}
              color="blue"
            />
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg text-gray-800 dark:text-white">Recent Orders</h2>
              <Link to="/admin/orders" className="text-blue-600 dark:text-blue-400 text-sm hover:underline font-medium">
                View All Orders
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Order ID</th>
                    <th className="px-4 py-3 font-semibold">Payment / Total</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
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
                      <td colSpan="4" className="text-center py-8 text-gray-500">No recent orders yet.</td>
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
                <FaExclamationTriangle className="text-orange-500" /> Inventory Alert
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
                    <p className="text-xs text-red-500 font-bold">Only {p.stock} left in stock</p>
                  </div>
                  <Link to={`/product-admin?edit=${p.id}`} className="text-blue-600 text-xs font-bold hover:underline">
                    Restock
                  </Link>
                </div>
              ))}
              {(!stats.lowStock || stats.lowStock.length === 0) && (
                <p className="text-sm text-gray-500">All stock levels are healthy.</p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
              <Link to="/product-admin" className="text-gray-500 text-sm hover:text-gray-800 dark:hover:text-white transition">
                View Full Inventory
              </Link>
            </div>
          </div>

          {/* Top Performing */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-white mb-6">Top Performing</h3>
            <div className="space-y-6">
              {stats.bestSellers && stats.bestSellers.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-gray-400 font-bold text-lg w-6">0{idx + 1}</div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.sales} sales</p>
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
const Sparkline = ({ data, color = "green" }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 40;
  const width = 100;

  // Create SVG path
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
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
    <div className="flex justify-between items-start mb-2 relative z-10">
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color === 'green' ? 'bg-green-50' : 'bg-blue-50'} dark:bg-opacity-10`}>
        {icon}
      </div>
    </div>

    <div className="flex items-center gap-2 mb-4 relative z-10">
      <span className={`text-xs font-bold ${trendColor} bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded`}>
        {trend}
      </span>
    </div>

    {/* Sparkline at bottom */}
    <div className="absolute bottom-0 left-0 right-0 h-16">
      {chartData && <Sparkline data={chartData} color={color} />}
    </div>
  </div>
);

export default AdminDashboard;
