import React from 'react';
import { useLocation } from 'react-router-dom';
import { useCurrency } from './CurrencyContext.jsx';

const ChatWidget = () => {
  const { dark, t, brand } = useCurrency();
  const location = useLocation();

  const phone = brand.phone ? brand.phone.replace(/[^0-9]/g, '') : "6285888159265";

  let message = "Halo, saya tertarik dengan produk di Distrapness.";
  if (location.pathname.startsWith('/shop/')) {
      message = "Halo, saya ingin bertanya tentang produk ini.";
  }

  const handleClick = () => {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed bottom-28 right-6 md:right-10 md:bottom-10 z-[100] flex flex-col items-end">
      <button
        onClick={handleClick}
        className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-black dark:bg-white shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95"
        aria-label="Chat on WhatsApp"
      >
         {/* Pulsing Aura */}
        <span className="absolute inset-0 rounded-full bg-black dark:bg-white animate-ping opacity-20 group-hover:opacity-40"></span>
        
        <img
            src={dark ? "/uploads/logo-hitam.png" : "/uploads/logo-putih.png"}
            alt="DM"
            className="h-8 w-8 object-contain transition-transform duration-500 group-hover:rotate-12"
        />
      </button>
    </div>
  );
};

export default ChatWidget;
