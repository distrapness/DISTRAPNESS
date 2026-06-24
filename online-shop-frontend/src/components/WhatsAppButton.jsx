import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCurrency } from './CurrencyContext.jsx';

const WhatsAppButton = () => {
    const [hover, setHover] = useState(false);
    const location = useLocation();
    const { brand } = useCurrency();

    // Don't show on admin pages
    if (location.pathname.includes('admin') || location.pathname.startsWith('/admin')) {
        return null;
    }

    const phone = brand.phone ? brand.phone.replace(/[^0-9]/g, '') : "6285888159265";

    // Default message based on page
    let message = "Halo, saya tertarik dengan produk di Distrapness.";
    if (location.pathname.startsWith('/shop/')) {
        message = "Halo, saya ingin bertanya tentang produk ini.";
    }

    const handleClick = () => {
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <div
            className="fixed bottom-24 left-6 z-50 flex flex-row-reverse items-center gap-2"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <div
                className={`bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-2 rounded-lg shadow-lg text-[10px] font-bold transition-all duration-300 transform origin-left ${hover ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
            >
                Chat with us!
            </div>
            <button
                onClick={handleClick}
                className="transition-transform hover:scale-110 active:scale-95 flex items-center justify-center filter drop-shadow-md"
                aria-label="Chat on WhatsApp"
            >
                <img
                    src="/assets/whatsapp.png"
                    alt="WhatsApp"
                    className="w-14 h-14 md:w-16 md:h-16 object-contain"
                />
            </button>
        </div>
    );
};

export default WhatsAppButton;
