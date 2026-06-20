import React, { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import config from '../config';
import { useCurrency } from '../components/CurrencyContext.jsx';

const FAQPage = () => {
    const { t, brand } = useCurrency();

    const faqItems = t('faq.items') || [];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 pt-4 md:pt-6 transition-colors duration-500">
            <div className="max-w-4xl mx-auto px-6 pb-20">
                <h1 className="text-3xl md:text-4xl font-[900] uppercase tracking-tighter mb-4 text-center text-black dark:text-white">{t('faq.title')}</h1>
                <p className="text-center text-gray-500 mb-12 max-w-lg mx-auto">{t('faq.subtitle')}</p>

                <div className="space-y-4">
                    {faqItems.map((f, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 hover:shadow-sm transition-shadow">
                            <h3 className="text-sm font-black uppercase tracking-widest mb-3 text-black dark:text-white flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px]">Q</span> {f.q}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base ml-6">{f.a}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center bg-gray-50 dark:bg-gray-800 p-12 rounded-3xl border border-gray-100 dark:border-gray-700">
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-4 text-black dark:text-white">{t('faq.stillQuestions')}</h3>
                    <p className="text-sm text-gray-500 mb-10 max-w-sm mx-auto">{t('faq.stillQuestionsDesc')}</p>
                    <a href={`https://wa.me/${brand.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="inline-block bg-black dark:bg-white text-white dark:text-black px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-105 transition-all">
                        {t('faq.chatWa')}
                    </a>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default FAQPage;
