import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    FaHome, FaBoxOpen, FaShoppingCart, FaTags,
    FaCog, FaSignOutAlt, FaBars, FaTimes, FaArrowLeft
} from 'react-icons/fa';

const AdminLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { logout, userEmail } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { path: '/admin', label: 'Dashboard', icon: <FaHome /> },
        { path: '/admin/orders', label: 'Orders', icon: <FaShoppingCart /> },
        { path: '/product-admin', label: 'Products', icon: <FaBoxOpen /> },
        { path: '/admin/categories', label: 'Categories', icon: <FaTags /> },
        { path: '/admin/settings', label: 'Settings', icon: <FaCog /> },
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

                <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <span className="mr-3 text-lg">{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <Link
                        to="/"
                        className="flex items-center w-full px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors mb-1"
                    >
                        <FaArrowLeft className="mr-3" />
                        Ke Website
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <FaSignOutAlt className="mr-3" />
                        Logout
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
