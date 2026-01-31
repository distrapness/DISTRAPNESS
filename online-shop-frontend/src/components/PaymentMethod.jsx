import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PaymentMethod = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/midtrans/methods');
        setPaymentMethods(response.data);
        setLoading(false);
      } catch (err) {
        setError('Gagal mengambil metode pembayaran');
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  if (loading) return <div>Memuat metode pembayaran...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Metode Pembayaran */}
        <div>
          <h1 className="text-2xl font-bold mb-6">Pilih Metode Pembayaran</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethods.map((method) => (
              <div 
                key={method.code} 
                className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition"
              >
                <img 
                  src={method.icon} 
                  alt={method.name} 
                  className="w-16 h-16 mx-auto mb-4"
                />
                <h2 className="text-center font-semibold">{method.name}</h2>
                <p className="text-center text-gray-500 text-sm">{method.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Lokasi Toko */}
        <div>
          <h1 className="text-2xl font-bold mb-6">Lokasi Toko</h1>
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="mb-4">
              <strong className="block text-lg mb-2">Alamat:</strong>
              <p className="text-gray-700">Jl. Raya Pajajaran, Bogor, Jawa Barat 16143</p>
            </div>
            <div className="mb-4">
              <strong className="block text-lg mb-2">Jam Operasional:</strong>
              <p className="text-gray-700">
                Senin - Sabtu: 09.00 - 18.00 WIB<br />
                Minggu & Libur Nasional: Tutup
              </p>
            </div>
            <div className="mb-4">
              <strong className="block text-lg mb-2">Telepon:</strong>
              <a 
                href="tel:02112345678" 
                className="text-blue-600 hover:underline"
              >
                021-12345678
              </a>
            </div>
            <div>
              <strong className="block text-lg mb-2">Peta Lokasi:</strong>
              <iframe
                title="Lokasi Toko"
                src="https://www.google.com/maps?q=-6.632422,106.689713&z=18&output=embed"
                width="100%"
                height="250"
                className="rounded border"
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethod;
