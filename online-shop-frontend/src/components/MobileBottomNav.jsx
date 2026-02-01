import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const MobileBottomNav = () => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center h-16 z-50 px-2 pb-safe shadow-lg">
            <Link to="/" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/') ? 'text-[#FF0000]' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isActive('/') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Home</span>
            </Link>

            <Link to="/shop" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/shop') ? 'text-[#FF0000]' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isActive('/shop') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Shop</span>
            </Link>

            <Link to="/wishlist" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/wishlist') ? 'text-[#FF0000]' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isActive('/wishlist') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Wishlist</span>
            </Link>

            <Link to="/profile" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/profile') ? 'text-[#FF0000]' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isActive('/profile') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Profile</span>
            </Link>
        </div>
    );
};

export default MobileBottomNav;
