import React, { useEffect, useState } from "react";
import BannerCarousel from "../components/BannerCarousel.jsx";
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
      {/* Hilangkan padding/margin atas sebelum BannerCarousel agar banner benar-benar rapat dengan header */}
      <BannerCarousel />
      <div className="w-full min-h-screen bg-white dark:bg-gray-900 transition-colors duration-700 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12 md:gap-x-8 md:gap-y-16 mt-12">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[280px] md:h-[340px] bg-[#fff] dark:bg-gray-800 animate-pulse rounded-none" />
              ))
            ) : error ? (
              <div className="col-span-full text-red-500">{error}</div>
            ) : !products || products.length === 0 ? (
              <div className="col-span-full text-gray-500">No products found.</div>
            ) : (
              products.map((product) => (
                <div
                  key={product.id || product._id}
                  className="flex flex-col items-center group cursor-pointer"
                  onClick={() => navigate(`/shop/${product.id}`)}
                >
                  <div
                    className="w-full aspect-[3/4] bg-transparent dark:bg-transparent flex items-center justify-center overflow-hidden mb-4"
                    style={{ position: 'relative' }}
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
                      className={`object-contain w-full h-full transition-all duration-500 ease-in-out bg-transparent ${activeImageIndex[product.id] === 1 ? 'opacity-100 scale-105' : 'opacity-100 scale-100'}`}
                      style={{ position: 'absolute', top: 0, left: 0, transition: 'opacity 0.5s, transform 0.5s', zIndex: 1, cursor: Array.isArray(product.images) && product.images.length > 1 ? 'pointer' : 'default' }}
                      onError={e => { e.target.onerror = null; e.target.src = "/assets/placeholder-banner.jpg"; }}
                    />
                  </div>
                  <div className="text-center w-full px-1">
                    <div className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100 mb-1 leading-tight truncate">{product.name}</div>
                    <div className="font-bold text-black dark:text-blue-300 text-sm md:text-base leading-tight">{convertPrice(product.price)}</div>
                    {product.stock === 0 && <span className="inline-block px-2 py-1 bg-black text-white text-[10px] rounded mt-2">OUT OF STOCK</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default HomePage;
