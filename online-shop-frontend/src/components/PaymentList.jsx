import React, { useEffect, useState } from "react";

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5001/api/midtrans/payments");
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
          {payments.map((p) => (
            <tr key={p.id} className="text-center hover:bg-gray-50 dark:hover:bg-gray-900">
              <td className="py-2 px-3 border-b">{p.order_id}</td>
              <td className="py-2 px-3 border-b">{p.customer}</td>
              <td className="py-2 px-3 border-b">{p.email}</td>
              <td className="py-2 px-3 border-b">Rp{p.amount.toLocaleString()}</td>
              <td className="py-2 px-3 border-b">{p.method}</td>
              <td className="py-2 px-3 border-b">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${p.status === 'paid' ? 'bg-green-100 text-green-700' : p.status === 'waiting_payment' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{p.status}</span>
              </td>
              <td className="py-2 px-3 border-b">{p.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentList;
