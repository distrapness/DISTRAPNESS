import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrency } from './CurrencyContext.jsx';
import config from '../config.js';

const CategoryGrid = () => {
    const { t } = useCurrency();
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetch(`${config.API_URL}/api/categories`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setCategories(data);
            })
            .catch(err => console.error("Failed to load categories", err));
    }, []);

    if (categories.length === 0) return null;

    return (
        <section className="py-12 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4">
                <h3 className="text-3xl md:text-4xl font-[900] uppercase tracking-tighter leading-none mb-8 text-center text-gray-900 dark:text-white font-sans">
                    {t('home.shopCategory')}
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                    {categories.map((cat) => (
                        <div key={cat.id} className="relative group overflow-hidden h-[180px] md:h-[400px] bg-gray-100 dark:bg-gray-800 rounded-sm">
                            <img
                                src={cat.image || "https://placehold.co/600x800/e2e8f0/1e293b?text=" + cat.name}
                                alt={cat.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x800/e2e8f0/1e293b?text=" + cat.name; }}
                            />

                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />

                            {/* Button Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Link
                                    to={`/shop?category=${encodeURIComponent(cat.name)}`}
                                    className="bg-white/90 backdrop-blur-sm text-black font-[900] py-2 px-4 md:py-4 md:px-8 text-xs md:text-sm tracking-widest uppercase hover:bg-black hover:text-white transition-all duration-300 shadow-xl transform group-hover:-translate-y-2"
                                >
                                    {cat.name}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CategoryGrid;
