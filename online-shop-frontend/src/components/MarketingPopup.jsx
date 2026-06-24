import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import config from '../config';

const MarketingPopup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [coupon, setCoupon] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchActiveCoupon = async () => {
            const hasSeen = sessionStorage.getItem('marketing_popup_seen');
            if (hasSeen) return;

            try {
                const res = await fetch(`${config.API_URL}/api/coupons/active`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        // Use the first active coupon (most recent)
                        setCoupon(data[0]);
                        
                        // Show popup after 3 seconds
                        const timer = setTimeout(() => {
                            setIsOpen(true);
                            sessionStorage.setItem('marketing_popup_seen', 'true');
                        }, 3000);
                        return () => clearTimeout(timer);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch active coupon for popup:", err);
            }
        };

        fetchActiveCoupon();
    }, []);

    if (!isOpen || !coupon) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(coupon.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const valueNum = Number(coupon.value);
    const displayValue = coupon.type === 'percent'
        ? `${valueNum}%`
        : `Rp${valueNum >= 1000 ? (valueNum / 1000) + 'K' : valueNum}`;

    const displayTypeLabel = coupon.type === 'percent' ? 'Discount' : 'Off';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-sm w-full relative overflow-hidden transform transition-all scale-100 animate-fadeInUp">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-black dark:text-gray-400 dark:hover:text-white bg-transparent p-2 z-10"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="flex flex-col text-center">
                    <div className="h-40 bg-black dark:bg-gray-950 flex flex-col items-center justify-center text-white relative">
                        <span className="text-6xl font-[900] uppercase tracking-tighter text-[#FF0000] drop-shadow-lg animate-pulse">{displayValue}</span>
                        <span className="text-xl font-bold uppercase tracking-widest mt-2">{displayTypeLabel}</span>
                    </div>
                    <div className="p-8">
                        <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white uppercase tracking-tight">Special Offer!</h3>
                        <p className="text-gray-500 dark:text-gray-300 mb-6 text-xs leading-relaxed">
                            Use the voucher code below to get <span className="font-bold text-black dark:text-white">{displayValue} OFF</span>.
                            {Number(coupon.min_purchase) > 0 && (
                                <span className="block mt-1 text-[10px] text-gray-400">
                                    *Minimum purchase of Rp {Number(coupon.min_purchase).toLocaleString('id-ID')}
                                </span>
                            )}
                        </p>

                        <div className="mb-6 relative group cursor-pointer" onClick={handleCopy}>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 p-3 rounded bg-gray-50 dark:bg-gray-900 group-hover:bg-gray-100 dark:group-hover:bg-gray-800 transition-colors">
                                <span className="text-xl font-mono font-bold text-black dark:text-white tracking-widest">{coupon.code}</span>
                            </div>
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 text-[10px] uppercase font-bold px-2 text-gray-400 group-hover:text-red-500 transition-colors">
                                {copied ? "Copied!" : "Click to copy"}
                            </span>
                        </div>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-full bg-[#FF0000] hover:bg-red-700 text-white py-3 font-bold uppercase tracking-widest transition-all rounded text-sm shadow-lg active:scale-95"
                        >
                            Shop Now
                        </button>

                        <button onClick={() => setIsOpen(false)} className="mt-4 text-[10px] text-gray-400 underline hover:text-black dark:hover:text-white uppercase tracking-wide">
                            No thanks, continue shopping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketingPopup;

