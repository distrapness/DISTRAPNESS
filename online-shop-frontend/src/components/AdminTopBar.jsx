import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaTachometerAlt, FaSignOutAlt, FaUserCog } from 'react-icons/fa';
import { useCurrency } from './CurrencyContext';

const AdminTopBar = () => {
    const { logout } = useAuth();
    const { t } = useCurrency();

    return (
        <div className="bg-gray-900 text-white text-sm py-2 px-4 flex justify-between items-center fixed top-0 left-0 right-0 z-[60]">
            <div className="flex items-center gap-4">
                <span className="font-bold text-yellow-500 flex items-center gap-2">
                    <FaUserCog /> {t('admin.mode')}
                </span>
                <Link to="/admin" className="hover:text-blue-300 flex items-center gap-1 transition-colors">
                    <FaTachometerAlt /> {t('nav.home')}
                </Link>
                <Link to="/product-admin" className="hover:text-blue-300 hidden md:inline transition-colors">
                    {t('admin.manageProducts')}
                </Link>
            </div>
            <div>
                <button onClick={logout} className="hover:text-red-300 flex items-center gap-2 transition-colors">
                    <FaSignOutAlt /> {t('nav.signout')}
                </button>
            </div>
        </div>
    );
};

export default AdminTopBar;
