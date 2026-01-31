import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "./CartContext";
import { useCurrency, CURRENCY_OPTIONS } from "../components/CurrencyContext";
import { useAuth } from "../contexts/AuthContext";

import config from "../config.js";
import { getImageUrl } from "../utils/imageHelper";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const logoUrl = getImageUrl(dark && brand.logoWhite ? brand.logoWhite : brand.logo);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-md`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-[88px]">
        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden p-2 -ml-2 text-gray-800 dark:text-white focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Logo Section */}
        <div className="flex-shrink-0 flex items-center justify-center md:justify-start flex-1 md:flex-none">
          {brand.logo && (
            <Link to="/" className="flex items-center h-full no-underline">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-12 md:h-20 w-auto object-contain"
              />
              <span className="hidden md:inline-block text-black dark:text-white font-extrabold text-2xl tracking-tight uppercase leading-none" style={{ marginLeft: '-15px' }}>
                DISTRAPNESS
              </span>
            </Link>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 justify-center">
          <nav className="flex items-center gap-6">
            <Link to="/" className={`hover:text-blue-600 transition ${location.pathname === "/" ? "font-bold text-blue-600" : ""}`}>Home</Link>
            <Link to="/shop" className={`hover:text-blue-600 transition ${location.pathname.startsWith("/shop") ? "font-bold text-blue-600" : ""}`}>Shop</Link>
            <Link to="/contact" className={`hover:text-blue-600 transition ${location.pathname === "/contact" ? "font-bold text-blue-600" : ""}`}>Contact</Link>
            <Link to="/store" className={`hover:text-blue-600 transition ${location.pathname === "/store" ? "font-bold text-blue-600" : ""}`}>Store</Link>
            <Link to="/about" className={`hover:text-blue-600 transition ${location.pathname === "/about" ? "font-bold text-blue-600" : ""}`}>About</Link>
          </nav>
        </div>

        {/* Right Controls */}
        <div className="flex gap-3 md:gap-4 items-center">
          {/* Dark Mode (Hidden on extremely small screens if needed, but better kept) */}
          <button
            onClick={() => setDark((d) => !d)}
            className="hidden md:block px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow hover:bg-gray-300 dark:hover:bg-gray-600 font-bold text-sm"
          >
            {dark ? "☀️" : "🌙"}
          </button>

          {/* Cart Icon */}
          <button
            onClick={onCartClick}
            className="relative focus:outline-none ml-2 p-1"
            aria-label="Keranjang"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-7 h-7 md:w-8 md:h-8 text-gray-700 dark:text-gray-100">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m13-9l2 9m-5-9V6a2 2 0 10-4 0v3" />
            </svg>
            {totalQty > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[10px] md:text-xs font-bold min-w-[18px] text-center">
                {totalQty}
              </span>
            )}
          </button>

          {/* Account Menu (Desktop & Mobile) */}
          <div className="relative account-menu-parent text-gray-800 dark:text-white">
            <button
              onClick={() => setShowAccountMenu(v => !v)}
              className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 hover:bg-blue-600 transition"
              aria-label="Login akun"
            >
              {isLoggedIn && userEmail ? (
                <span className="w-full h-full flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-base md:text-lg uppercase">
                  {userEmail.charAt(0)}
                </span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-8 0v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
              )}
            </button>
            {showAccountMenu && (
              <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl py-2 z-50 border border-gray-100 dark:border-gray-700 animate-fadein ring-1 ring-black ring-opacity-5">
                {!isLoggedIn ? (
                  <>
                    <Link to="/login" className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">Login</Link>
                    <Link to="/register" className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">Register</Link>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 mb-1">
                      Signed in as <br /> <strong className="text-gray-900 dark:text-white truncate block">{userEmail}</strong>
                    </div>
                    <Link to="/profile" className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">My Profile</Link>
                    <Link to="/orders" className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">Order History</Link>
                    <div className="border-t dark:border-gray-700 my-1"></div>
                    <button onClick={() => { logout(); window.location.href = "/login"; }} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium">Sign out</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown (Full Width/Height animation) */}
      <div className={`md:hidden bg-white dark:bg-gray-900 transition-all duration-300 ease-in-out border-t border-gray-200 dark:border-gray-700 ${mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <nav className="flex flex-col p-6 space-y-6">
          <Link to="/" className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white hover:text-blue-600">Home</Link>
          <Link to="/shop" className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white hover:text-blue-600">Shop</Link>
          <Link to="/store" className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white hover:text-blue-600">Store</Link>
          <Link to="/about" className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white hover:text-blue-600">About</Link>
          <Link to="/contact" className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white hover:text-blue-600">Contact</Link>

          <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setDark((d) => !d)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 font-bold text-gray-800 dark:text-white"
            >
              <span>Appearance</span>
              <span>{dark ? "🌙 Dark Mode" : "☀️ Light Mode"}</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
