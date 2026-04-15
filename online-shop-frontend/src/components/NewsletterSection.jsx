import React, { useState } from 'react';
import { useCurrency } from './CurrencyContext.jsx';
import config from '../config.js';

const NewsletterSection = () => {
    const { t } = useCurrency();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const res = await fetch(`${config.API_URL}/api/newsletter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(data.message || 'Subscribed!');
                setEmail('');
            } else {
                setMessage(data.error || 'Failed to subscribe');
            }
        } catch (error) {
            setMessage('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="bg-gray-50 dark:bg-gray-950 py-24 border-t border-gray-100 dark:border-gray-900">
            <div className="max-w-xl mx-auto px-4 text-center">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-8 text-gray-900 dark:text-white">{t('newsletter.title')}</h3>

                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-0 border-b border-black dark:border-white pb-2 relative">
                    <input
                        type="email"
                        placeholder={t('newsletter.placeholder')}
                        className="w-full px-0 py-2 bg-transparent border-none text-left text-lg focus:ring-0 placeholder:text-gray-400 dark:text-white"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="text-black dark:text-white font-bold uppercase tracking-widest text-xs whitespace-nowrap hover:opacity-70 transition-opacity disabled:opacity-50"
                    >
                        {loading ? 'Subscribing...' : t('newsletter.subscribe')}
                    </button>
                    {message && (
                        <div className={`absolute left-0 -bottom-8 text-xs font-bold ${message.includes('success') || message.includes('Subscribed') ? 'text-green-600' : 'text-red-500'}`}>
                            {message}
                        </div>
                    )}
                </form>
            </div>
        </section>
    );
};

export default NewsletterSection;
