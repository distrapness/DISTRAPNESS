import React from 'react';
import { useCurrency } from './CurrencyContext';

const NewsletterSection = () => {
    const { t } = useCurrency();
    return (
        <section className="bg-gray-50 dark:bg-gray-950 py-24 border-t border-gray-100 dark:border-gray-900">
            <div className="max-w-xl mx-auto px-4 text-center">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-8 text-gray-900 dark:text-white">{t('newsletter.title')}</h3>

                <form className="flex flex-col md:flex-row gap-0 border-b border-black dark:border-white pb-2">
                    <input
                        type="email"
                        placeholder={t('newsletter.placeholder')}
                        className="w-full px-0 py-2 bg-transparent border-none text-left text-lg focus:ring-0 placeholder:text-gray-400"
                        required
                    />
                    <button
                        type="submit"
                        className="text-black dark:text-white font-bold uppercase tracking-widest text-xs whitespace-nowrap hover:opacity-70 transition-opacity"
                    >
                        {t('newsletter.subscribe')}
                    </button>
                </form>
            </div>
        </section>
    );
};

export default NewsletterSection;
