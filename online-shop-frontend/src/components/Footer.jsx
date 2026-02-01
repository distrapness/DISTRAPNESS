import React from "react";
import { Link } from "react-router-dom";

const socials = [
  { href: "https://facebook.com", icon: "fab fa-facebook-f", label: "Facebook" },
  { href: "https://www.instagram.com/distrapness?igsh=amExMnV0ZW9pYmc5&utm_source=qr", icon: "instagram", label: "Instagram" },
  { href: "https://www.tiktok.com/@distrapness?_t=ZS-8vw2GZGHO6c&_r=1", icon: "tiktok", label: "TikTok" },
  { href: "https://shopee.co.id/distrapness", icon: "shopee", label: "Shopee" },
  { href: "https://pinterest.com", icon: "fab fa-pinterest-p", label: "Pinterest" },
  { href: "https://youtube.com", icon: "fab fa-youtube", label: "YouTube" },
];

const Footer = () => (
  <footer className="bg-black text-white pt-12 pb-8 mt-0 border-t border-gray-800">
    <div className="max-w-7xl mx-auto px-6 md:px-4 flex flex-col md:flex-row md:justify-between md:items-start gap-10">
      {/* Newsletter */}
      <div className="flex-1 w-full md:w-auto">
        <div className="text-xs font-bold uppercase mb-4 tracking-widest text-gray-300 text-center md:text-left">Subscribe to our newsletter</div>
        <form className="flex flex-col md:flex-row gap-3 w-full max-w-sm mx-auto md:mx-0">
          <input
            type="email"
            placeholder="Email address*"
            className="px-4 py-3 rounded bg-black border border-gray-600 text-white placeholder-gray-400 text-sm w-full focus:outline-none focus:ring-2 focus:ring-white transition-all"
            required
          />
          <button type="submit" className="w-full md:w-auto px-6 py-3 bg-white text-black font-bold rounded hover:bg-gray-200 text-sm transition-colors whitespace-nowrap">SUBSCRIBE</button>
        </form>
      </div>

      {/* Socials & Links */}
      <div className="flex-1 flex flex-col items-center md:items-end gap-6 w-full">
        <div className="flex flex-wrap justify-center md:justify-end gap-5">
          {socials.map(s => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="hover:scale-110 transition-transform duration-200 opacity-90 hover:opacity-100"
            >
              {s.icon === "instagram" && (
                <svg width="36" height="36" fill="none" viewBox="0 0 24 24">
                  <rect width="24" height="24" rx="6" fill="#fff" fillOpacity="0.12" />
                  <path d="M16.98 7.02a.7.7 0 0 1 1.4 0 .7.7 0 0 1-1.4 0Zm-4.98.68a4.3 4.3 0 1 0 0 8.6 4.3 4.3 0 0 0 0-8.6Zm0 7.1a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6Zm5.18-7.18a2.02 2.02 0 0 0-2.02-2.02H8.82A2.02 2.02 0 0 0 6.8 7.62v6.36a2.02 2.02 0 0 0 2.02 2.02h6.36a2.02 2.02 0 0 0 2.02-2.02V7.62Zm-1.4 6.36c0 .34-.28.62-.62.62H8.82a.62.62 0 0 1-.62-.62V7.62c0-.34.28-.62.62-.62h6.36c.34 0 .62.28.62.62v6.36Z" fill="#fff" />
                </svg>
              )}
              {s.icon === "tiktok" && (
                <svg width="36" height="36" fill="none" viewBox="0 0 24 24">
                  <rect width="24" height="24" rx="6" fill="#fff" fillOpacity="0.12" />
                  <path d="M16.5 7.5c-.6 0-1.1-.5-1.1-1.1V6h-1.5v8.1c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.2 0 .4 0 .6.1V11c-.2 0-.4-.1-.6-.1-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3V10c.3.2.7.3 1.1.3.1 0 .2 0 .3-.1V8.2c-.1 0-.2 0-.3-.1Z" fill="#fff" />
                </svg>
              )}
              {s.icon === "shopee" && (
                <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="10" fill="#fff" fillOpacity="0" />
                  <g>
                    <path d="M24 10c-5.5 0-10 4.5-10 10v8c0 2.2 1.8 4 4 4h12c2.2 0 4-1.8 4-4v-8c0-5.5-4.5-10-10-10z" fill="#FF5722" />
                    <rect x="16" y="18" width="16" height="12" rx="4" fill="#FF5722" />
                    <text x="24" y="29" textAnchor="middle" fontSize="13" fontFamily="Arial" fontWeight="bold" fill="#fff">S</text>
                  </g>
                </svg>
              )}
              {s.icon !== "instagram" && s.icon !== "tiktok" && s.icon !== "shopee" && (
                <div className="w-9 h-9 bg-white/10 rounded-md flex items-center justify-center">
                  <i className={`${s.icon} text-lg`}></i>
                </div>
              )}
            </a>
          ))}
        </div>
        <div className="flex flex-wrap justify-center md:justify-end gap-6 text-xs font-semibold tracking-wide uppercase text-gray-400">
          <Link to="/how-to-order" className="hover:text-white transition">How to Order</Link>
          <a href="#" className="hover:text-white transition">Returns and Refunds</a>
        </div>
      </div>
    </div>
    <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs text-gray-500 px-4">
      Distrapness &copy; 2025 &middot; All Rights Reserved.
    </div>
  </footer>
);

export default Footer;