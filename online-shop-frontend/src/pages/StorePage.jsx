import React from "react";
import { useCurrency } from "../components/CurrencyContext.jsx";

const StorePage = () => {
  const { t } = useCurrency();
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col justify-start items-center px-4 pt-4 pb-12 w-full">
      <div className="w-full max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-gray-100 mb-8 text-center w-full">{t('store.title')}</h1>
        <p className="text-gray-700 dark:text-gray-200 mb-4 text-center w-full transition-colors duration-[900ms] ease-in-out">{t('store.desc')}</p>
        <div className="mb-4 text-center w-full">
          <strong>{t('store.address')}:</strong> {t('store.addressValue')}
        </div>
        <div className="mb-4 text-center w-full">
          <strong>{t('store.hours')}:</strong>
          <div>{t('store.hoursValue1')}</div>
          <div>{t('store.hoursValue2')}</div>
        </div>
        <div className="mb-4 text-center w-full">
          <strong>{t('store.phone')}:</strong> <a href="tel:02112345678" className="text-black hover:underline">021-12345678</a>
        </div>
        <iframe
          title="Lokasi Toko"
          src="https://www.google.com/maps?q=-6.632422,106.689713&z=18&output=embed"
          width="100%"
          height="300"
          className="rounded border"
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
};

export default StorePage;
