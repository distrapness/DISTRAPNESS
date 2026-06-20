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
                className="text-gray-400 hover:text-black dark:hover:text-white transition-all flex items-center justify-center"
                aria-label={s.label}
              >
                {s.icon === "instagram" ? (
                  <img
                    src="/assets/instagram.png"
                    alt="Instagram"
                    className="w-5 h-5 object-contain opacity-70 hover:opacity-100 hover:scale-110 transition-all duration-200 cursor-pointer"
                  />
                ) : s.icon === "tiktok" ? (
                  <img
                    src="/assets/tiktok.png"
                    alt="TikTok"
                    className="w-5 h-5 object-contain opacity-70 hover:opacity-100 hover:scale-110 transition-all duration-200 cursor-pointer"
                  />
                ) : s.icon === "shopee" ? (
                  <img
                    src="/assets/shopee.png"
                    alt="Shopee"
                    className="w-5 h-5 object-contain opacity-70 hover:opacity-100 hover:scale-110 transition-all duration-200 cursor-pointer"
                  />
                ) : (
                  <i className={`${s.icon} text-xl hover:scale-110 transition-transform duration-200`}></i>
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