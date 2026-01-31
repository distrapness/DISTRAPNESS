import React, { useEffect, useState } from "react";

const PaymentMethodModal = ({ open, onClose, onSelect }) => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("http://localhost:5001/api/midtrans/methods")
      .then(res => {
        if (!res.ok) throw new Error("Gagal mengambil metode pembayaran");
        return res.json();
      })
      .then(data => {
        setMethods(data);
        setSelected(data[0]?.value || "");
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative animate-fadeIn">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-2xl px-2 py-1 rounded-full border border-gray-200 hover:bg-gray-100 transition"
          onClick={onClose}
          aria-label="Tutup Modal"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4 text-center text-blue-700 dark:text-blue-300">Pilih Metode Pembayaran</h2>
        {loading ? (
          <div className="text-center py-4">Memuat...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">{error}</div>
        ) : (
          <form
            onSubmit={e => {
              e.preventDefault();
              if (selected) onSelect(selected);
            }}
            className="flex flex-col gap-4"
          >
            {methods.map((m) => (
              <label key={m.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={m.value}
                  checked={selected === m.value}
                  onChange={() => setSelected(m.value)}
                  className="accent-blue-600"
                />
                <span>{m.label}</span>
              </label>
            ))}
            <button
              type="submit"
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              disabled={!selected}
            >
              Lanjut
            </button>
          </form>
        )}
      </div>
      <style>{`.animate-fadeIn { animation: fadeIn .3s; } @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
};

export default PaymentMethodModal;
