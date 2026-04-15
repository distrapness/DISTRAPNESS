import React, { useEffect, useState } from "react";
import config from "../config";

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${config.API_URL}/api/midtrans/payments`);
        if (!res.ok) throw new Error("Gagal mengambil data pembayaran");
        const data = await res.json();
        setPayments(data);
      } catch (err) {
        setError(err.message || "Terjadi error");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  if (loading) return <div className="text-center py-6">Memuat data pembayaran...</div>;
  if (error) return <div className="text-center text-red-500 py-6">{error}</div>;
  if (!payments.length) return <div className="text-center py-6">Belum ada data pembayaran.</div>;

  return (
    <div className="overflow-x-auto w-full mb-6">
      <table className="min-w-full border border-gray-300 bg-white dark:bg-gray-800 rounded shadow">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700">
            <th className="py-2 px-3 border-b">Order ID</th>
            <th className="py-2 px-3 border-b">Customer</th>
            <th className="py-2 px-3 border-b">Email</th>
            <th className="py-2 px-3 border-b">Jumlah</th>
            <th className="py-2 px-3 border-b">Metode</th>
            <th className="py-2 px-3 border-b">Status</th>
            <th className="py-2 px-3 border-b">Tanggal</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => {
            const dateObj = new Date(p.date || p.created_at || Date.now());
            const formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

            return (
              <tr key={p.id} className="text-center hover:bg-gray-50 dark:hover:bg-gray-900 border-b border-gray-100 dark:border-gray-700 transition-colors">
                <td className="py-3 px-3 text-sm font-mono text-gray-500">{p.order_id}</td>
                <td className="py-3 px-3 text-sm font-bold capitalize text-gray-900 dark:text-white">{p.customer}</td>
                <td className="py-3 px-3 text-sm text-gray-500">{p.email}</td>
                <td className="py-3 px-3 text-sm font-bold text-gray-900 dark:text-white">Rp {p.amount ? p.amount.toLocaleString('id-ID') : '0'}</td>
                <td className="py-3 px-3 text-sm uppercase text-xs tracking-wider font-bold text-gray-500">{p.method ? p.method.replace('_', ' ') : '-'}</td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider border ${p.status === 'paid' ? 'bg-green-50 text-green-600 border-green-200' : p.status === 'waiting_payment' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                    {p.status ? p.status.replace('_', ' ') : 'Unknown'}
                  </span>
                </td>
                <td className="py-3 px-3 text-xs text-gray-400">{formattedDate}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentList;
