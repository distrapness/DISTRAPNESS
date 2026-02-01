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
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-full">

        {/* Mobile Left: Hamburger (Hidden if Bottom Nav is used?) Actually Bottom Nav replaces this need? 
            But let's keep it for "About" and other links not in Bottom Nav.
        */}
        <button
          className="md:hidden p-2 -ml-2 text-gray-800 dark:text-white focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo Section */}
        <div className="flex-1 flex justify-center md:justify-start">
          <Link to="/" className="flex items-center">
            {/* Mobile: Red Logo Text always visible */}
            <span className="md:hidden text-[#FF0000] font-[900] text-xl tracking-tighter uppercase font-sans">
              DISTRAPNESS
            </span>

            {/* Desktop: Logic from before */}
            <div className="hidden md:flex items-center relative">
              <div className={`transition-all duration-500 ease-in-out transform ${isScrolled ? 'opacity-0 scale-50 w-0 hidden' : 'opacity-100 scale-100 w-auto flex'}`}>
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-12 md:h-20 w-auto object-contain"
                />
              </div>
              <div className={`transition-all duration-500 ease-in-out ${isScrolled ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-90 w-0 hidden'}`}>
                <span className="text-black dark:text-white font-[900] text-3xl md:text-4xl tracking-tighter uppercase font-serif" style={{ fontFamily: 'Times New Roman, serif' }}>
                  DISTRAPNESS
                </span>
              </div>
              <span className="hidden md:inline-block text-black dark:text-white font-extrabold text-2xl tracking-tight uppercase leading-none ml-3" style={{ opacity: isScrolled ? 0 : 1, transition: 'opacity 0.3s' }}>
                {!isScrolled && "DISTRAPNESS"}
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 justify-center">
          <nav className="flex items-center gap-8">
            <Link to="/" className={`text-sm font-bold uppercase tracking-widest hover:text-[#FF0000] transition-colors ${location.pathname === "/" ? "text-[#FF0000]" : "text-black dark:text-white"}`}>Home</Link>
            <Link to="/shop" className={`text-sm font-bold uppercase tracking-widest hover:text-[#FF0000] transition-colors ${location.pathname.startsWith("/shop") ? "text-[#FF0000]" : "text-black dark:text-white"}`}>Shop</Link>
            <Link to="/contact" className={`text-sm font-bold uppercase tracking-widest hover:text-[#FF0000] transition-colors ${location.pathname === "/contact" ? "text-[#FF0000]" : "text-black dark:text-white"}`}>Contact</Link>
            <Link to="/store" className={`text-sm font-bold uppercase tracking-widest hover:text-[#FF0000] transition-colors ${location.pathname === "/store" ? "text-[#FF0000]" : "text-black dark:text-white"}`}>Store</Link>
            <Link to="/about" className={`text-sm font-bold uppercase tracking-widest hover:text-[#FF0000] transition-colors ${location.pathname === "/about" ? "text-[#FF0000]" : "text-black dark:text-white"}`}>About</Link>
          </nav>
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-4 md:gap-6 justify-end flex-initial w-10 md:w-auto">
          {/* Search Mobile */}
          <button className="md:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Cart Icon */}
          {/* On Mobile, maybe we use Bottom Nav for Cart? Or Header? Reference shows "Bag" icon in Header on Mobile usually, but let's see. 
              The user implementation plan says "Add to Bag" sticky button. 
              Let's keep Cart in Header for consistency.
          */}
          <button onClick={onCartClick} className="relative group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-6 md:w-6 text-black dark:text-white group-hover:text-[#FF0000] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {totalQty > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF0000] text-white text-[10px] font-bold h-4 w-4 md:h-5 md:w-5 flex items-center justify-center rounded-full">
                {totalQty}
              </span>
            )}
          </button>

          {/* Profile Desktop */}
          <div className="hidden md:block relative account-menu-parent">
            <button onClick={() => setShowAccountMenu(!showAccountMenu)} className="flex items-center gap-2 focus:outline-none group">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black dark:text-white group-hover:text-[#FF0000] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            {showAccountMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
                {isLoggedIn ? (
                  <>
                    <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b dark:border-gray-700 font-bold truncate">
                      {userEmail}
                    </div>
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Profile</Link>
                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700">Sign out</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Sign in</Link>
                    <Link to="/register" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Register</Link>
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
