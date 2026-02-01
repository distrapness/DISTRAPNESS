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

  const [isScrolled, setIsScrolled] = useState(false);

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

  // Detect scroll to toggle logo/text
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const logoUrl = getImageUrl(dark && brand.logoWhite ? brand.logoWhite : brand.logo);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-sm transition-all duration-300 h-[60px] md:h-[88px]`}>
      <div className="max-w-[1600px] mx-auto flex items-center h-full px-6 md:px-12">

        {/* Mobile Left: Hamburger */}
        <button
          className="md:hidden p-2 -ml-2 text-gray-800 dark:text-white focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* LOGO (Always Left and Visible) */}
        <div className="flex-1 md:flex-none flex justify-center md:justify-start">
          <Link to="/" className="flex items-center gap-2">
            {/* Mobile: Red Logo Text */}
            <span className="md:hidden text-[#FF0000] font-[900] text-xl tracking-tighter uppercase font-sans">
              DISTRAPNESS
            </span>

            {/* Desktop: Clean Static Logo + Text */}
            <div className="hidden md:flex items-center gap-1">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-14 w-auto object-contain"
              />
              <span className="text-black dark:text-white font-[900] text-2xl tracking-tighter uppercase font-sans">
                DISTRAPNESS
              </span>
            </div>
          </Link>
        </div>

        {/* NAVIGATION (Left Aligned next to Logo) */}
        <div className="hidden md:flex ml-12 gap-8 items-center">
          <Link to="/" className={`text-sm font-bold uppercase tracking-wide hover:text-[#FF0000] transition-colors ${location.pathname === "/" ? "text-[#FF0000]" : "text-gray-900 dark:text-gray-100"}`}>Home</Link>
          <Link to="/shop" className={`text-sm font-bold uppercase tracking-wide hover:text-[#FF0000] transition-colors ${location.pathname.startsWith("/shop") ? "text-[#FF0000]" : "text-gray-900 dark:text-gray-100"}`}>Shop</Link>
          <Link to="/contact" className={`text-sm font-bold uppercase tracking-wide hover:text-[#FF0000] transition-colors ${location.pathname === "/contact" ? "text-[#FF0000]" : "text-gray-900 dark:text-gray-100"}`}>Contact</Link>
          <Link to="/store" className={`text-sm font-bold uppercase tracking-wide hover:text-[#FF0000] transition-colors ${location.pathname === "/store" ? "text-[#FF0000]" : "text-gray-900 dark:text-gray-100"}`}>Store</Link>
          <Link to="/about" className={`text-sm font-bold uppercase tracking-wide hover:text-[#FF0000] transition-colors ${location.pathname === "/about" ? "text-[#FF0000]" : "text-gray-900 dark:text-gray-100"}`}>About</Link>
        </div>

        {/* SPACER for Right Alignment */}
        <div className="flex-1"></div>

        {/* RIGHT ICONS */}
        <div className="flex items-center gap-5 justify-end flex-initial">
          {/* Search (Desktop) */}
          <button className="hidden md:block hover:text-[#FF0000] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Wishlist (Desktop) - Optional based on ref */}
          <button className="hidden md:block hover:text-[#FF0000] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Cart Icon */}
          <button onClick={onCartClick} className="relative group hover:text-[#FF0000] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {totalQty > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#FF0000] text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                {totalQty}
              </span>
            )}
          </button>

          {/* User Profile */}
          <div className="hidden md:block relative account-menu-parent">
            <button onClick={() => setShowAccountMenu(!showAccountMenu)} className="flex items-center hover:text-[#FF0000] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            {showAccountMenu && (
              <div className="absolute right-0 mt-4 w-48 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl py-2 z-50">
                {isLoggedIn ? (
                  <>
                    <div className="px-4 py-2 text-xs text-gray-500 font-bold uppercase tracking-wider">{userEmail}</div>
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Profile</Link>
                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700">Sign out</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Sign in</Link>
                    <Link to="/register" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Register</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`md:hidden bg-white dark:bg-gray-900 transition-all duration-300 ease-in-out border-t border-gray-200 dark:border-gray-700 ${mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <nav className="flex flex-col p-6 space-y-6">
          <Link to="/" className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Home</Link>
          <Link to="/shop" className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Shop</Link>
          <Link to="/store" className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Store</Link>
          <Link to="/about" className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">About</Link>
          <Link to="/contact" className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Contact</Link>
          <div className="pt-4">
            <button onClick={() => setDark(!dark)} className="text-sm font-bold bg-gray-100 px-4 py-2 rounded">{dark ? "Light Mode" : "Dark Mode"}</button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
