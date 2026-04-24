import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../utils/imageHelper';
import config from '../config';

const SocialProof = () => {
    const [notification, setNotification] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    const locations = ["Jakarta", "Bandung", "Surabaya", "Medan", "Bali", "Makassar", "Yogyakarta", "Semarang"];
    const actions = ["baru saja membeli", "menambahkan ke keranjang", "sedang melihat"];
    
    const [products, setProducts] = useState([]);

    useEffect(() => {
        // Fetch products to show in notifications
        fetch(`${config.API_URL}/api/products`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setProducts(data);
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (products.length === 0) return;

        const showRandomNotification = () => {
            const randomProduct = products[Math.floor(Math.random() * products.length)];
            const randomLocation = locations[Math.floor(Math.random() * locations.length)];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            const randomName = ["Andi", "Budi", "Chandra", "Dedi", "Eka", "Fani", "Gita", "Hadi"][Math.floor(Math.random() * 8)];

            setNotification({
                name: randomName,
                location: randomLocation,
                action: randomAction,
                product: randomProduct
            });

            setIsVisible(true);

            // Hide after 5 seconds
            setTimeout(() => {
                setIsVisible(false);
            }, 5000);
        };

        // Show first after 10s
        const initialTimer = setTimeout(showRandomNotification, 10000);

        // Repeat every 25-40 seconds
        const interval = setInterval(() => {
            showRandomNotification();
        }, Math.random() * 15000 + 25000);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [products]);

    if (!notification) return null;

    return (
        <div 
            className={`fixed bottom-24 left-4 md:bottom-8 md:left-8 z-[100] transition-all duration-700 transform 
                ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95 pointer-events-none'}`}
        >
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-[280px] md:max-w-[320px]">
                <div className="w-14 h-14 rounded-xl bg-gray-50 dark:bg-gray-800 shrink-0 overflow-hidden border border-gray-50 dark:border-gray-700">
                    <img 
                        src={getImageUrl(notification.product.images?.[0] || notification.product.image)} 
                        alt="Product"
                        className="w-full h-full object-contain p-1"
                    />
                </div>
                <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 italic">
                        {notification.location} • Just Now
                    </div>
                    <div className="text-[11px] font-medium leading-tight text-gray-800 dark:text-gray-200">
                        <span className="font-black text-black dark:text-white uppercase">{notification.name}</span> {notification.action} <span className="font-bold">{notification.product.name}</span>
                    </div>
                </div>
                <button 
                    onClick={() => setIsVisible(false)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-xs shadow-lg hover:scale-110 transition-transform"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};

export default SocialProof;
