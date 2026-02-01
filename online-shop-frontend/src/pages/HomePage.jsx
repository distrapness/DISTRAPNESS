import React, { useEffect, useState } from "react";
import BannerCarousel from "../components/BannerCarousel.jsx";
import CategoryGrid from "../components/CategoryGrid.jsx";
import PhilosophySection from "../components/PhilosophySection.jsx";
import NewsletterSection from "../components/NewsletterSection.jsx";
import { Link, useNavigate } from "react-router-dom";
import { useCurrency } from "../components/CurrencyContext.jsx";
import Footer from "../components/Footer.jsx";

import config from "../config.js";
import { getImageUrl } from "../utils/imageHelper";

const API_URL = `${config.API_URL}/api/products`;

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currency } = useCurrency();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil produk");
        return res.json();
      })
      .then((data) => {
        setProducts(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const convertPrice = (price) => {
    if (currency.code === "IDR") return currency.symbol + " " + price.toLocaleString(currency.locale);
    return (
      currency.symbol + " " + (price * currency.rate).toLocaleString(currency.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  };

  // State untuk index gambar aktif pada setiap produk di homepage
  const [activeImageIndex, setActiveImageIndex] = useState({});

  // Handler hover gambar produk: ganti ke gambar kedua saat mouse masuk, kembali ke gambar pertama saat keluar
  const handleProductImageHover = (productId, images) => {
    setActiveImageIndex(prev => ({ ...prev, [productId]: 1 }));
  };
  const handleProductImageLeave = (productId, images) => {
    setActiveImageIndex(prev => ({ ...prev, [productId]: 0 }));
  };

  return (
    <>
      <BannerCarousel />

      <CategoryGrid />

      {/* New Arrivals Section */}
      <section className="py-12 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <h3 className="text-xl font-bold uppercase tracking-widest text-gray-900 dark:text-white">New Arrivals</h3>
            <Link to="/shop" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black dark:hover:text-white underline-offset-4 hover:underline transition-all">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12 md:gap-x-8 md:gap-y-16">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[280px] md:h-[400px] bg-gray-100 dark:bg-gray-800 animate-pulse" />
              ))
            ) : error ? (
              <div className="col-span-full text-center text-red-500">{error}</div>
            ) : !products || products.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">No products found.</div>
            ) : (
              // Show only first 4 products for New Arrivals
              products.slice(0, 4).map((product) => (
                <div
                  key={product.id || product._id}
                  className="flex flex-col items-center group cursor-pointer"
                  onClick={() => navigate(`/shop/${product.id}`)}
                >
                  <div
                    className="w-full aspect-[3/4] bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden mb-4 relative"
                    onMouseEnter={() => {
                      if (Array.isArray(product.images) && product.images.length > 1) {
                        handleProductImageHover(product.id, product.images);
                      }
                    }}
                    onMouseLeave={() => {
                      if (Array.isArray(product.images) && product.images.length > 1) {
                        handleProductImageLeave(product.id, product.images);
                      }
                    }}
                  >
                    <img
                      src={Array.isArray(product.images) && product.images.length > 0 ? getImageUrl(product.images[activeImageIndex[product.id] || 0]) : getImageUrl(product.image)}
                      alt={product.name}
                      className={`object-cover w-full h-full transition-all duration-700 ease-in-out ${activeImageIndex[product.id] === 1 ? 'scale-110' : 'scale-100'}`}
                      onError={e => { e.target.onerror = null; e.target.src = "https://placehold.co/600x800/e2e8f0/1e293b?text=" + product.name; }}
                    />
                    {/* Badge if needed, e.g. New or Sale */}
                  </div>
                  <div className="text-center w-full px-1">
                    <div className="text-sm font-bold text-gray-900 dark:text-white mb-1 uppercase tracking-wider">{product.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Oversized Black Shirt</div>
                    <div className="font-bold text-gray-900 dark:text-white text-sm">{convertPrice(product.price)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <PhilosophySection />

      <NewsletterSection />

      <Footer />
    </>
  );
};

export default HomePage;
