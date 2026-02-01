import React from 'react';
import { useCurrency, CURRENCY_OPTIONS } from './CurrencyContext';

const TopBar = () => {
    const { currency, setCurrency, dark, setDark } = useCurrency();

    return (
        <div className="bg-black dark:bg-white text-white dark:text-black py-2 md:py-1 px-4 md:px-12 text-[10px] md:text-xs font-bold uppercase tracking-widest flex justify-between items-center transition-colors duration-300 relative z-[60]">

            {/* Left: Optional Promo or Blank */}
            <div className="hidden md:block">
                Free shipping on all orders over Rp 500.000
            </div>

            {/* Mobile: Promo text takes full width if needed, or just justify-end */}
            <div className="md:hidden">
                Distrapness
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-6">
                {/* Language (MockUP) */}
                <button className="hover:opacity-70 transition-opacity">EN</button>

                {/* Currency */}
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity relative group">
                    <span>{currency.code}</span>
                    <div className="hidden group-hover:block absolute top-full right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg py-1 min-w-[80px] z-50">
                        {CURRENCY_OPTIONS.map(opt => (
                            <div
                                key={opt.code}
                                onClick={() => setCurrency(opt)}
                                className={`px-4 py-2 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 ${opt.code === currency.code ? 'font-black' : ''}`}
                            >
                                {opt.code}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Theme Toggle (Sun/Moon) */}
                <button onClick={() => setDark(!dark)} className="hover:opacity-70 transition-opacity" aria-label="Toggle Theme">
                    {dark ? (
                        /* Sun Icon */
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    ) : (
                        /* Moon Icon */
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                    )}
                </button>
            </div>
        </div>
    );
};

export default TopBar;
