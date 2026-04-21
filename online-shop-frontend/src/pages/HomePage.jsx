import React, { useEffect, useState } from "react";
import BannerCarousel from "../components/BannerCarousel.jsx";
import CategoryGrid from "../components/CategoryGrid.jsx";
import PhilosophySection from "../components/PhilosophySection.jsx";
import NewsletterSection from "../components/NewsletterSection.jsx";
import { Link, useNavigate } from "react-router-dom";
import { useCurrency } from "../components/CurrencyContext.jsx";
import { useCart } from "../components/CartContext";
import Footer from "../components/Footer.jsx";

import config from "../config.js";
import { getImageUrl } from "../utils/imageHelper";

const API_URL = `${config.API_URL}/api/products`;

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currency, t } = useCurrency();
  const navigate = useNavigate();
  const { addToCart } = useCart();

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
      <div className="pt-4 pb-12 bg-white dark:bg-gray-900 transition-colors duration-500 min-h-screen">
        <div className="max-w-7xl mx-auto px-4">

          <div className="mb-8 md:mb-12">
            <CategoryGrid />
          </div>

          <div className="container mx-auto px-4 mb-6 md:mb-8 flex justify-between items-end">
            <h3 className="text-xl md:text-3xl font-[900] uppercase tracking-wider text-gray-900 dark:text-white">{t('home.newArrivals')}</h3>
            <Link to="/shop" className="text-xs md:text-sm font-bold uppercase underline hover:text-gray-500">{t('home.viewAll')}</Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[300px] border border-gray-100 dark:border-gray-800 rounded-lg p-6 bg-white dark:bg-gray-900 animate-pulse" />
              ))
            ) : error ? (
              <div className="col-span-full text-center text-red-500">{error}</div>
            ) : !products || products.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">No products found.</div>
            ) : (
              // Show all products
              products.map((product) => (
                <div
                  key={product.id || product._id}
                  className="group cursor-pointer border border-gray-200 dark:border-gray-800 rounded-lg p-3 md:p-6 bg-white dark:bg-gray-900 hover:shadow-md transition-all relative flex flex-col items-center hover-lux"
                  onClick={() => navigate(`/shop/${product.id}`)}
                >
                  {/* Badge: Low Stock */}
                  {product.stock > 0 && product.stock < 5 && (
                    <div className="absolute top-4 left-4 z-10 bg-gray-500 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-sm">
                      {t('shop.lowStock')}
                    </div>
                  )}

                  <div
                    className="w-full aspect-square flex items-center justify-center overflow-hidden mb-6 relative rounded bg-gray-50 dark:bg-gray-800"
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
                      className={`object-contain w-full h-full p-2 transition-transform duration-500 ease-in-out ${activeImageIndex[product.id] === 1 ? 'scale-105' : 'scale-100'}`}
                      onError={e => { e.target.onerror = null; e.target.src = "https://placehold.co/600x800/e2e8f0/1e293b?text=" + product.name; }}
                    />
                  </div>
                  <div className="text-center w-full mt-auto">
                    <div className="text-sm md:text-base text-gray-900 dark:text-gray-100 mb-2 leading-tight font-medium uppercase tracking-wider line-clamp-2">{product.name}</div>
                    <div className="text-sm md:text-base text-gray-500 dark:text-gray-400 mb-3 md:mb-4">{convertPrice(product.price)}</div>
                    {/* Beli Langsung / Buy Now Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        let firstSize = 'M';
                        if (product.sizes) {
                          firstSize = ['S', 'M', 'L', 'XL'].find(s => product.sizes[s] > 0) || 'M';
                        }
                        addToCart({ ...product, selectedSize: firstSize }, 1);
                        navigate('/cart');
                      }}
                      className="w-full bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black font-bold uppercase text-[10px] md:text-xs tracking-widest py-2 md:py-3 transition-colors opacity-90 hover:opacity-100"
                    >
                      Beli Langsung
                    </button>
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
