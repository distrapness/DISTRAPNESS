import React, { useState } from "react";
import config from "../config";
import { useCurrency } from "../components/CurrencyContext.jsx";

const ContactPage = () => {
  const { t } = useCurrency();
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [form, setForm] = useState({ nama: '', email: '', pesan: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.email || !form.pesan) {
      setStatus('error');
      return;
    }
    if (!validateEmail(form.email)) {
      setStatus('error');
      return;
    }
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch(`${config.API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.nama,
          email: form.email,
          message: form.pesan
        })
      });

      if (res.ok) {
        setStatus('success');
        setForm({ nama: '', email: '', pesan: '' });
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col justify-center items-center px-4 py-12 w-full">
      <div className="w-full max-w-5xl mx-auto">
        <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col gap-4 border-2 border-black dark:border-transparent transition-colors duration-500">
          <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-gray-100 mb-8 text-center w-full">{t('contact.title')}</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              className="border border-gray-300 dark:border-gray-700 rounded px-4 py-2 text-black dark:text-white w-full dark:bg-gray-700"
              type="text"
              name="nama"
              placeholder={t('contact.name')}
              value={form.nama}
              onChange={handleChange}
              disabled={loading}
            />
            <input
              className="border border-gray-300 dark:border-gray-700 rounded px-4 py-2 text-black dark:text-white w-full dark:bg-gray-700"
              type="email"
              name="email"
              placeholder={t('contact.email')}
              value={form.email}
              onChange={handleChange}
              disabled={loading}
            />
            <textarea
              className="border border-gray-300 dark:border-gray-700 rounded px-4 py-2 text-black dark:text-white w-full dark:bg-gray-700"
              name="pesan"
              placeholder={t('contact.message')}
              rows={5}
              value={form.pesan}
              onChange={handleChange}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white px-6 py-2 rounded font-bold hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? t('contact.sending') : t('contact.send')}
            </button>
            {status === 'success' && <div className="mt-2 text-green-600 dark:text-green-400">{t('contact.success')}</div>}
            {status === 'error' && <div className="mt-2 text-red-600 dark:text-red-400">{t('contact.error')}</div>}
          </form>
          <div className="mt-8 text-center w-full">
            <div>Email: <a href="distrapness@gmail.com" className="text-black hover:underline">distrapness@gmail.com</a></div>
            <div>WhatsApp: <a href="https://wa.me/6885888159265" className="text-black hover:underline">085888159265</a></div>
            <div>Alamat: Bogor, Indonesia</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
