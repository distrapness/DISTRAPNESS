import React, { useState } from "react";
import config from "../config";
import { useCurrency } from "../components/CurrencyContext.jsx";

const ContactPage = () => {
  const { t, brand } = useCurrency();
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center px-4 py-20 w-full transition-colors duration-500">
      <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
        {/* Left: Info */}
        <div className="lg:w-1/3 text-center lg:text-left">
          <h1 className="text-5xl md:text-6xl font-[900] text-black dark:text-white mb-6 tracking-tighter uppercase italic">{t('contact.title')}</h1>
          <p className="text-gray-500 text-sm uppercase tracking-widest font-black mb-8 opacity-60">{t('contact.subtitle')}</p>
          <div className="space-y-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
            <div className="flex flex-col gap-1">
              <span className="text-black dark:text-white">{t('contact.emailSupport')}</span>
              <a href="mailto:distrapness@gmail.com" className="hover:text-black dark:hover:text-white transition-colors">distrapness@gmail.com</a>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-black dark:text-white">{t('contact.directMessage')}</span>
              <a href={`https://wa.me/${brand.phone.replace(/[^0-9]/g, '')}`} className="hover:text-black dark:hover:text-white transition-colors">{brand.phone}</a>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-black dark:text-white">{t('contact.headquarters')}</span>
              <span>Bogor, Indonesia</span>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="lg:w-2/3 w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{t('contact.fullName')}</label>
                <input
                  className="w-full bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none dark:text-white transition-all font-bold"
                  type="text"
                  name="nama"
                  placeholder={t('contact.namePlaceholder')}
                  value={form.nama}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{t('contact.email')}</label>
                <input
                  className="w-full bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none dark:text-white transition-all font-bold"
                  type="email"
                  name="email"
                  placeholder={t('contact.emailPlaceholder')}
                  value={form.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{t('contact.message')}</label>
              <textarea
                className="w-full bg-gray-50 dark:bg-gray-700/50 border-none rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-black outline-none dark:text-white transition-all font-bold"
                name="pesan"
                placeholder={t('contact.messagePlaceholder')}
                rows={6}
                value={form.pesan}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            {status === 'success' && <div className="text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-widest animate-bounce">{t('contact.success')}</div>}
            {status === 'error' && <div className="text-red-500 text-xs font-bold uppercase tracking-widest">{t('contact.error')}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black px-8 py-5 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? t('contact.sending') : t('contact.submitButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
