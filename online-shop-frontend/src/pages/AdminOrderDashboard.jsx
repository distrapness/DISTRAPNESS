import React, { useEffect, useState } from "react";

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

  const fetchOrders = async () => {
    setLoading(true);
    const res = await fetch(`${config.API_URL}/api/orders`);
    const data = await res.json();
    setOrders(data);
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
                <tr key={order.id} className="border-b hover:bg-blue-50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <td className="py-2 px-4">{order.id}</td>
                  <td className="py-2 px-4">{order.userId || "-"}</td>
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
      {/* Modal detail order */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-2xl" onClick={() => setSelectedOrder(null)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Detail Order #{selectedOrder.id}</h2>
            <div className="mb-2"><b>User ID:</b> {selectedOrder.userId || '-'}</div>
            <div className="mb-2"><b>Total:</b> Rp {Number(selectedOrder.total).toLocaleString("id-ID")}</div>
            <div className="mb-2"><b>Status:</b> {statusLabels[selectedOrder.status] || selectedOrder.status}</div>
            <div className="mb-2"><b>Metode:</b> {selectedOrder.paymentMethod}</div>
            <div className="mb-2"><b>Items:</b>
              <ul className="list-disc ml-6">
                {JSON.parse(selectedOrder.items).map((item, idx) => (
                  <li key={idx}>{item.name} x{item.qty} (Rp {Number(item.price * item.qty).toLocaleString("id-ID")})</li>
                ))}
              </ul>
            </div>
            {selectedOrder.paymentProof && (
              <div className="mb-2">
                <b>Bukti Transfer:</b><br />
                <img src={`http://localhost:5001${selectedOrder.paymentProof}`} alt="Bukti Transfer" className="w-60 rounded shadow mt-2" />
              </div>
            )}
            {selectedOrder.status === "waiting_verification" && (
              <div className="flex gap-3 mt-4">
                <button className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded" onClick={() => handleVerify(selectedOrder.id, "paid")} disabled={verifying}>Verifikasi</button>
                <button className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded" onClick={() => handleVerify(selectedOrder.id, "failed")} disabled={verifying}>Tolak</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDashboard;
