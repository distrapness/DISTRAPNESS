import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../components/CurrencyContext.jsx';
import {
    FaHome, FaBoxOpen, FaShoppingCart, FaTags,
    FaCog, FaSignOutAlt, FaBars, FaTimes, FaArrowLeft, FaImage, FaStar, FaWallet
} from 'react-icons/fa';

const AdminLayout = ({ children }) => {
    const { t } = useCurrency();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { logout, userEmail } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const menuGroups = [
        {
            title: t('admin.menuGroups.summary') || 'Ringkasan',
            items: [
                { path: '/admin', label: t('admin.dashboard') || 'Dashboard', icon: <FaHome /> },
                { path: '/admin/orders', label: t('admin.orders') || 'Daftar Pesanan', icon: <FaShoppingCart /> },
            ]
        },
        {
            title: t('admin.menuGroups.catalog') || 'Katalog',
            items: [
                { path: '/product-admin', label: t('admin.manageProducts') || 'Produk Toko', icon: <FaBoxOpen /> },
                { path: '/admin/categories', label: t('admin.categories') || 'Kategori Produk', icon: <FaTags /> },
            ]
        },
        {
            title: t('admin.menuGroups.promoBrand') || 'Promosi & Brand',
            items: [
                { path: '/banner-admin', label: t('admin.banners') || 'Banner Utama', icon: <FaImage /> },
                { path: '/brand-admin', label: t('admin.brands') || 'Identitas Toko', icon: <FaStar /> },
                { path: '/admin/discounts', label: t('admin.discounts') || 'Kupon Diskon', icon: <FaTags /> },
            ]
        },
        {
            title: t('admin.menuGroups.systemFeedback') || 'Sistem & Feedback',
            items: [
                { path: '/admin/shipping', label: t('admin.shippingManual') || 'Ongkir Manual', icon: <FaBoxOpen /> },
                { path: '/admin/reviews', label: t('admin.reviews') || 'Ulasan Pelanggan', icon: <FaStar /> },
                { path: '/admin/settings', label: t('admin.settings') || 'Pengaturan Web', icon: <FaCog /> },
            ]
        }
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex transition-colors duration-500">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static border-r border-gray-200 dark:border-gray-700 flex flex-col`}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300">
                        Admin Panel
                    </span>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500">
                        <FaTimes />
                    </button>
                </div>

                <nav className="p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    {menuGroups.map((group, gIdx) => (
                        <div key={gIdx}>
                            <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-3">
                                {group.title}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-300 group ${isActive
                                                ? 'bg-black dark:bg-white text-white dark:text-black font-bold shadow-lg shadow-black/10'
                                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-black dark:hover:text-white'
                                                }`}
                                        >
                                            <span className={`mr-3 text-sm transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                                {item.icon}
                                            </span>
                                            <span className="text-xs uppercase tracking-wider">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <Link
                        to="/"
                        className="flex items-center w-full px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors mb-1"
                    >
                        <FaArrowLeft className="mr-3" />
                        {t('admin.backToSite') || 'Back to Website'}
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <FaSignOutAlt className="mr-3" />
                        {t('admin.logout') || 'Logout'}
                    </button>
                    <div className="mt-4 px-4 text-xs text-gray-400 truncate">
                        {userEmail}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 h-16 flex items-center px-4 md:hidden">
                    <button onClick={() => setSidebarOpen(true)} className="text-gray-600 dark:text-gray-300 p-2">
                        <FaBars size={20} />
                    </button>
                    <span className="ml-4 font-bold text-gray-800 dark:text-white">Menu</span>
                </header>

                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
