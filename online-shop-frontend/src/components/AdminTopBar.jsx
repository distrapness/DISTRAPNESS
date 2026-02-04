import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaTachometerAlt, FaSignOutAlt, FaUserCog } from 'react-icons/fa';

const AdminTopBar = () => {
    const { logout } = useAuth();

    return (
        <div className="bg-gray-900 text-white text-sm py-2 px-4 flex justify-between items-center fixed top-0 left-0 right-0 z-[60]">
            <div className="flex items-center gap-4">
                <span className="font-bold text-yellow-500 flex items-center gap-2">
                    <FaUserCog /> Admin Mode
                </span>
                <Link to="/admin" className="hover:text-blue-300 flex items-center gap-1 transition-colors">
                    <FaTachometerAlt /> Dashboard
                </Link>
                <Link to="/product-admin" className="hover:text-blue-300 hidden md:inline transition-colors">
                    Manage Products
                </Link>
            </div>
            <div>
                <button onClick={logout} className="hover:text-red-300 flex items-center gap-2 transition-colors">
                    <FaSignOutAlt /> Logout
                </button>
            </div>
        </div>
    );
};

export default AdminTopBar;
