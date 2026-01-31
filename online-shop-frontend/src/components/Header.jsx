import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "./CartContext";
import { useCurrency, CURRENCY_OPTIONS } from "../components/CurrencyContext";
import { useAuth } from "../contexts/AuthContext";

import config from "../config";

const API_URL = `${config.API_URL}/api/products`;
const BRAND_API_URL = `${config.API_URL}/api/brand`;

const Header = ({ onCartClick }) => {
  const { cart } = useCart();
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [brand, setBrand] = useState({ brandName: "Online Shop", logo: "", logoWhite: "" });
  const { currency, setCurrency, dark, setDark } = useCurrency();
  const { isLoggedIn, userEmail, logout } = useAuth();
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    fetch(BRAND_API_URL)
      .then((res) => res.json())
      .then(setBrand)
      .catch(() => setBrand({ brandName: "Online Shop", logo: "", logoWhite: "" }));
  }, []);

  // Ensure dark mode is synced with <html> tag
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  useEffect(() => {
    function handleClick(e) {
      if (!e.target.closest(".account-menu-parent")) setShowAccountMenu(false);
    }
    if (showAccountMenu) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAccountMenu]);

  const logoUrl = dark && brand.logoWhite ? brand.logoWhite : brand.logo;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-md`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4" style={{ height: '88px' }}>
        {/* Logo + Brand name */}
        <div className="flex-shrink-0 flex items-center justify-start" style={{ height: '88px', minWidth: 'fit-content' }}>
          {brand.logo && (
            <Link to="/" style={{ display: 'flex', alignItems: 'center', height: '88px', textDecoration: 'none' }}>
              <img
                src={logoUrl}
                alt="Logo"
                className="h-20 w-20 object-contain bg-transparent rounded-none shadow-none border-0 p-0 m-0"
                style={{ background: 'transparent', margin: 0, padding: 0 }}
              />
              <span className="text-black dark:text-white font-extrabold text-2xl tracking-tight select-none uppercase leading-none" style={{ letterSpacing: '-0.04em', lineHeight: '1', display: 'inline-block', verticalAlign: 'middle', marginLeft: '-25px' }}>
                DISTRAPNESS
              </span>
            </Link>
          )}
        </div>
        {/* Brand name dan nav di tengah */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <nav className="flex items-center gap-6">
            <Link to="/" className={`hover:text-blue-600 transition ${location.pathname === "/" ? "font-bold text-blue-600" : ""}`}>Home</Link>
            <Link to="/shop" className={`hover:text-blue-600 transition ${location.pathname.startsWith("/shop") ? "font-bold text-blue-600" : ""}`}>Shop</Link>
            <Link to="/contact" className={`hover:text-blue-600 transition ${location.pathname === "/contact" ? "font-bold text-blue-600" : ""}`}>Contact</Link>
            <Link to="/store" className={`hover:text-blue-600 transition ${location.pathname === "/store" ? "font-bold text-blue-600" : ""}`}>Store</Link>
            <Link to="/about" className={`hover:text-blue-600 transition ${location.pathname === "/about" ? "font-bold text-blue-600" : ""}`}>About</Link>
          </nav>
        </div>
        {/* Control di kanan */}
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setDark((d) => !d)}
            className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow hover:bg-gray-300 dark:hover:bg-gray-600 font-bold text-sm"
            aria-label="Toggle dark mode"
          >
            {dark ? "☀️ Light" : "🌙 Dark"}
          </button>
          <select
            value={currency.code}
            onChange={e => setCurrency(CURRENCY_OPTIONS.find(opt => opt.code === e.target.value))}
            className="px-3 py-1 rounded-full border font-bold text-xs uppercase bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Pilih mata uang"
          >
            {CURRENCY_OPTIONS.map(opt => (
              <option key={opt.code} value={opt.code}>{opt.label}</option>
            ))}
          </select>
          {/* Cart Icon */}
          <button
            onClick={onCartClick}
            className="relative focus:outline-none ml-2"
            aria-label="Keranjang"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-gray-700 dark:text-gray-100">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m13-9l2 9m-5-9V6a2 2 0 10-4 0v3" />
            </svg>
            {totalQty > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                {totalQty}
              </span>
            )}
          </button>
          {/* Akun/Login menu */}
          <div className="relative account-menu-parent">
            <button
              onClick={() => setShowAccountMenu(v => !v)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-blue-600 transition"
              style={{ lineHeight: 1 }}
              aria-label="Login akun"
            >
              {isLoggedIn && userEmail ? (
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg uppercase">
                  {userEmail.charAt(0)}
                </span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-gray-600 hover:text-white transition">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-8 0v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
              )}
            </button>
            {/* Dropdown menu akun */}
            {showAccountMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded shadow-lg py-2 z-50 border border-gray-100 dark:border-gray-700 animate-fadein">
                {!isLoggedIn ? (
                  <>
                    <Link to="/login" className="block px-4 py-2 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">Login</Link>
                    <Link to="/register" className="block px-4 py-2 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">Register</Link>
                  </>
                ) : (
                  <>
                    <Link to="/profile" className="block px-4 py-2 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">Profile</Link>
                    <Link to="/orders" className="block px-4 py-2 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">Order History</Link>
                    <button onClick={() => { logout(); setShowAccountMenu(false); window.location.href = "/login"; }} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700">Logout</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
