import React from "react";
import { useCurrency } from "../components/CurrencyContext.jsx";

const AboutPage = () => {
  const { t } = useCurrency();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center px-4 py-20 w-full transition-colors duration-500">
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-12 md:p-16 flex flex-col items-center border border-gray-100 dark:border-gray-700">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-4 italic">Our Vision</span>
        <h1 className="text-4xl md:text-6xl font-[900] text-black dark:text-white mb-10 text-center tracking-tighter uppercase italic">{t('about.title')}</h1>
        <div className="w-20 h-1 bg-black dark:bg-white mb-10"></div>
        <div className="space-y-6 max-w-2xl">
          <p className="text-lg md:text-xl text-gray-800 dark:text-gray-200 text-center leading-relaxed font-medium italic opacity-90">"{t('about.p1')}"</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-loose tracking-wide">{t('about.p2')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-loose tracking-wide">{t('about.p3')}</p>
        </div>
        <div className="mt-12 flex gap-4">
          <div className="w-2 h-2 rounded-full bg-black dark:bg-white animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-black/40 dark:bg-white/40"></div>
          <div className="w-2 h-2 rounded-full bg-black/20 dark:bg-white/20"></div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
