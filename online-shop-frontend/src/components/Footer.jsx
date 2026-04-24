import React from "react";
import { Link } from "react-router-dom";
import { useCurrency } from "./CurrencyContext.jsx";

const socials = [
  { href: "https://facebook.com", icon: "fab fa-facebook-f", label: "Facebook" },
  { href: "https://www.instagram.com/distrapness?igsh=amExMnV0ZW9pYmc5&utm_source=qr", icon: "instagram", label: "Instagram" },
  { href: "https://www.tiktok.com/@distrapness?_t=ZS-8vw2GZGHO6c&_r=1", icon: "tiktok", label: "TikTok" },
  { href: "https://shopee.co.id/distrapness", icon: "shopee", label: "Shopee" },
  { href: "https://pinterest.com", icon: "fab fa-pinterest-p", label: "Pinterest" },
  { href: "https://youtube.com", icon: "fab fa-youtube", label: "YouTube" },
];

const Footer = () => {
  const { t } = useCurrency();
  return (
    <footer className="bg-white dark:bg-gray-950 text-black dark:text-white pt-16 pb-12 border-t border-gray-100 dark:border-gray-900">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-10 md:gap-8">

        {/* Column 1: About */}
        <div className="flex flex-col gap-4">
          <h4 className="font-bold uppercase tracking-[0.2em] text-xs mb-2">{t('footer.about')}</h4>
          <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link to="/about" className="hover:text-black dark:hover:text-white transition-colors">{t('footer.ourStory')}</Link>
          </div>
        </div>

        {/* Column 2: Customer Service */}
        <div className="flex flex-col gap-4">
          <h4 className="font-bold uppercase tracking-[0.2em] text-xs mb-2">{t('footer.customerService')}</h4>
          <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link to="/contact" className="hover:text-black dark:hover:text-white transition-colors">{t('footer.contactUs')}</Link>
            <Link to="/how-to-order" className="hover:text-black dark:hover:text-white transition-colors">{t('nav.howToOrder') || 'How to Order'}</Link>
            <Link to="/faq" className="hover:text-black dark:hover:text-white transition-colors">FAQ</Link>
            <Link to="/profile" className="hover:text-black dark:hover:text-white transition-colors">{t('footer.orderStatus')}</Link>
          </div>
        </div>

        {/* Column 3: Legal */}
        <div className="flex flex-col gap-4">
          <h4 className="font-bold uppercase tracking-[0.2em] text-xs mb-2">{t('footer.legal')}</h4>
          <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link to="/terms-conditions" className="hover:text-black dark:hover:text-white transition-colors">{t('footer.terms')}</Link>
            <Link to="/privacy-policy" className="hover:text-black dark:hover:text-white transition-colors">{t('footer.privacy')}</Link>
          </div>
        </div>

        {/* Column 4: Connect */}
        <div className="flex flex-col gap-4">
          <h4 className="font-bold uppercase tracking-[0.2em] text-xs mb-2">{t('footer.connect')}</h4>
          <div className="flex gap-4">
            {socials.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                aria-label={s.label}
              >
                {s.icon === "instagram" ? (
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                ) : s.icon === "tiktok" ? (
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v6.14c.03 2.94-1.13 5.73-3.26 7.78-3.09 2.98-7.94 1.95-9.3-2.19-.99-3.02.48-6.42 3.47-7.53 2.73-1.11 5.96-.21 7.48 2.37v-2.14c-1.77-1.1-3.83-1.63-5.89-1.39-4.8.76-7.85 5.51-6.79 10.19 1.07 4.7 5.64 7.69 10.15 6.7 3.32-.73 5.93-3.32 6.55-6.68.85-4.63.14-9.45.14-14.17V6.65c1.88-1.55 4.54-2.19 6.84-1.25V.02c-4.25-.01-8.5.01-12.75 0z" /></svg>
                ) : s.icon === "shopee" ? (
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 48 48"><g><path d="M24 10c-5.5 0-10 4.5-10 10v8c0 2.2 1.8 4 4 4h12c2.2 0 4-1.8 4-4v-8c0-5.5-4.5-10-10-10z" fill="currentColor" /><text x="24" y="29" textAnchor="middle" fontSize="13" fontFamily="Arial" fontWeight="bold" fill="#fff">S</text></g></svg>
                ) : (
                  <i className={`${s.icon} text-xl`}></i>
                )}
              </a>
            ))}
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 gap-4">
        <div className="text-center md:text-left">
          &copy; 2026 Distrapness. {t('footer.rights')}
        </div>
        <div className="flex gap-6">
        </div>
      </div>
    </footer>
  );
};

export default Footer;