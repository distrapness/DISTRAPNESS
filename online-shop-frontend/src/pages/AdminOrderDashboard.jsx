import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton.jsx";

const statusLabels = {
  pending: "Menunggu Pembayaran",
  waiting_payment: "Menunggu Pembayaran",
  waiting_verification: "Menunggu Verifikasi Admin",
  paid: "Lunas",
  failed: "Gagal",
  cancelled: "Dibatalkan"
};

import config from '../config.js';

const AdminOrderDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    const res = await fetch(`${config.API_URL}/api/orders`);
    const data = await res.json();
    if (Array.isArray(data)) {
      setOrders(data);
    } else {
      console.error("Orders data is not array:", data);
      setOrders([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleVerify = async (orderId, status) => {
    setVerifying(true);
    await fetch(`${config.API_URL}/api/orders/status/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setVerifying(false);
    setSelectedOrder(null);
    fetchOrders();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-blue-50 p-8">
      <div className="flex justify-between mb-6">
        <BackButton />
      </div>
      <h1 className="text-3xl font-bold text-blue-700 mb-8">Dashboard Admin - Verifikasi Pembayaran</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded-lg">
            <thead>
              <tr className="bg-blue-100 text-blue-700">
                <th className="py-2 px-4">ID</th>
                <th className="py-2 px-4">User</th>
                <th className="py-2 px-4">Total</th>
                <th className="py-2 px-4">Metode</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-blue-50 cursor-pointer" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                  <td className="py-2 px-4">{order.id}</td>
                  <td className="py-2 px-4">{String(order.userId || "-")}</td>
                  <td className="py-2 px-4">Rp {Number(order.total).toLocaleString("id-ID")}</td>
                  <td className="py-2 px-4">{order.paymentMethod}</td>
                  <td className="py-2 px-4 font-semibold">{statusLabels[order.status] || order.status}</td>
                  <td className="py-2 px-4">
                    {order.status === "waiting_verification" && (
                      <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded mr-2" onClick={e => { e.stopPropagation(); handleVerify(order.id, "paid"); }} disabled={verifying}>Verifikasi</button>
                    )}
                    {order.status === "waiting_verification" && (
                      <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded" onClick={e => { e.stopPropagation(); handleVerify(order.id, "failed"); }} disabled={verifying}>Tolak</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Modal removed - now handled by AdminOrderDetail page */}
    </div>
  );
};

export default AdminOrderDashboard;
