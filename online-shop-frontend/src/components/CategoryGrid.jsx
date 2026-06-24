import React from 'react';
import { Link } from 'react-router-dom';
import { useCurrency } from './CurrencyContext.jsx';
import config from '../config.js';
import { getImageUrl } from '../utils/imageHelper';
import { useQuery } from '@tanstack/react-query';

const fetchCategories = async () => {
    const res = await fetch(`${config.API_URL}/api/categories`);
    if (!res.ok) throw new Error("Gagal mengambil kategori");
    return res.json();
};

const CategoryGrid = () => {
    const { t } = useCurrency();
    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories,
    });

    if (isLoading || categories.length === 0) return null;

    return (
        <section className="py-12 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4">
                <h3 className="text-3xl md:text-4xl font-[900] uppercase tracking-tighter leading-none mb-8 text-center text-gray-900 dark:text-white font-sans">
                    {t('home.shopCategory')}
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-6">
                    {categories.map((cat) => (
                        <Link
                            key={cat.id}
                            to={`/shop?category=${encodeURIComponent(cat.name)}`}
                            className="relative group overflow-hidden h-[220px] md:h-[440px] bg-gray-50 dark:bg-gray-100 rounded-2xl border border-gray-200/50 dark:border-gray-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer flex flex-col justify-between"
                        >
                            {/* Image Wrapper */}
                            <div className="w-full h-full flex items-center justify-center p-4 md:p-8 overflow-hidden">
                                <img
                                    src={getImageUrl(cat.image) || "https://placehold.co/600x800/e2e8f0/1e293b?text=" + cat.name}
                                    alt={cat.name}
                                    className="w-[90%] h-[90%] object-contain transition-transform duration-700 ease-out group-hover:scale-[1.03] mix-blend-multiply"
                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x800/e2e8f0/1e293b?text=" + cat.name; }}
                                />
                            </div>

                            {/* Subtle overlay shading */}
                            <div className="absolute inset-0 bg-black/[0.01] group-hover:bg-black/[0.04] transition-colors duration-300" />

                            {/* Floating glassmorphic category tag at the bottom */}
                            <div className="absolute bottom-3 left-3 right-3 md:bottom-4 md:left-4 md:right-4 bg-white/95 backdrop-blur-md border border-white/20 py-2.5 px-4 md:py-3.5 md:px-5 rounded-xl flex items-center justify-between shadow-lg transform group-hover:-translate-y-1 transition-all duration-300">
                                <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-gray-900">
                                    {cat.name}
                                </span>
                                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-black text-white flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                                    <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CategoryGrid;
