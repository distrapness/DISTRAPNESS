import React from 'react';
import { Link } from 'react-router-dom';
import { useCurrency } from './CurrencyContext.jsx';

const categories = [
    { name: 'TOPS', image: '/assets/category-tops.jpg', link: '/shop?category=Tops' },
    { name: 'BOTTOMS', image: '/assets/category-bottoms.jpg', link: '/shop?category=Bottoms' },
    { name: 'PANTS', image: '/assets/category-pants.jpg', link: '/shop?category=Pants' },
];

const CategoryGrid = () => {
    const { t } = useCurrency();
    return (
        <section className="py-20 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4">
                <h3 className="text-4xl md:text-5xl font-[900] uppercase tracking-tighter leading-none mb-10 text-gray-900 dark:text-white font-sans text-center md:text-left">
                    {t('home.shopCategory')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="relative group overflow-hidden h-[350px] md:h-[400px] bg-gray-100 dark:bg-gray-800">
                            {/* Image Placeholder if actual image missing */}
                            <img
                                src={cat.image}
                                alt={cat.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x800/e2e8f0/1e293b?text=" + cat.name; }}
                            />

                            {/* Button Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Link
                                    to={cat.link}
                                    className="bg-white text-black font-bold py-3 px-10 text-sm tracking-widest uppercase hover:bg-black hover:text-white transition-colors duration-300"
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
