import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from './CartContext';

const MobileBottomNav = ({ onWishlistClick }) => {
    const location = useLocation();
    const { cart } = useCart();
    const cartCount = cart.reduce((a, c) => a + c.qty, 0);

    const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

    const navItems = [
        {
            path: '/',
            exact: true,
            label: 'Home',
            icon: (active) => (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            path: '/shop',
            label: 'Shop',
            icon: (active) => (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            )
        },
        {
            path: '/cart',
            label: 'Cart',
            badge: cartCount,
            icon: (active) => (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        },
        {
            path: '/profile',
            label: 'Profile',
            icon: (active) => (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/98 dark:bg-gray-900/98 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 flex justify-around items-center h-16 z-50 shadow-[0_-2px_20px_rgba(0,0,0,0.08)]">
            {navItems.map(item => {
                const active = item.exact ? location.pathname === item.path : isActive(item.path);
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex flex-col items-center justify-center w-full h-full relative transition-colors duration-300 ${active ? 'text-black dark:text-white' : 'text-gray-300 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400'}`}
                    >
                        <div className="relative">
                            {item.icon(active)}
                            {item.badge > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-black dark:bg-white text-white dark:text-black text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none shadow-lg">
                                    {item.badge > 9 ? '!' : item.badge}
                                </span>
                            )}
                        </div>
                        <span className={`text-[8px] font-black mt-1 uppercase tracking-[0.2em] ${active ? 'opacity-100' : 'opacity-40'}`}>{item.label}</span>
                        {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-black dark:bg-white rounded-b-full shadow-sm" />}
                    </Link>
                );
            })}
        </div>
    );
};

export default MobileBottomNav;
