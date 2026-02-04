import React from 'react';
import { Link } from 'react-router-dom';
import { useCurrency } from './CurrencyContext.jsx';

const PhilosophySection = () => {
    const { t } = useCurrency();
    return (
        <section className="bg-white dark:bg-gray-900 py-20">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">

                    {/* Left: Image (Abstract/Fabric) */}
                    <div className="w-full md:w-1/2">
                        <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-800 overflow-hidden relative">
                            <img
                                src="/assets/philosophy-image.jpg"
                                alt="Philosophy"
                                className="w-full h-full object-cover grayscale brightness-110 contrast-125"
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/800x600/e2e8f0/1e293b?text=Simply+Better"; }}
                            />
                            {/* Optional overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-gray-200/20 to-transparent mix-blend-multiply" />
                        </div>
                    </div>

                    {/* Right: Text Content */}
                    <div className="w-full md:w-1/2 text-left">
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">{t('home.philosophy')}</h4>
                        <h2 className="text-4xl md:text-6xl font-[900] text-black dark:text-white uppercase leading-[0.9] mb-8 tracking-tighter">
                            {t('home.simplyBetter')}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-8 max-w-md">
                            {t('home.philosophyText')}
                        </p>
                        <Link
                            to="/about"
                            className="inline-block border-b-2 border-black dark:border-white pb-1 text-black dark:text-white font-bold uppercase tracking-widest text-sm hover:opacity-70 transition-opacity"
                        >
                            {t('home.readMore')}
                        </Link>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default PhilosophySection;
