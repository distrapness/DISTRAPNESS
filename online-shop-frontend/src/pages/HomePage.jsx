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

const FlashSaleCountdown = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(endDate).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          hours: Math.floor((distance / (1000 * 60 * 60))),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div className="flex gap-2 text-white font-bold">
      <div className="bg-red-600 px-2 py-1 rounded">{String(timeLeft.hours).padStart(2, '0')}</div>
      <div className="text-red-600 self-center">:</div>
      <div className="bg-red-600 px-2 py-1 rounded">{String(timeLeft.minutes).padStart(2, '0')}</div>
      <div className="text-red-600 self-center">:</div>
      <div className="bg-red-600 px-2 py-1 rounded">{String(timeLeft.seconds).padStart(2, '0')}</div>
    </div>
  );
};

const ProductFlashTimer = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        clearInterval(timer);
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  return <span>BERAKHIR DLM: {timeLeft}</span>;
};

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currency, t } = useCurrency();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const flashSaleProducts = (products || []).filter(p => p.is_flash_sale && new Date(p.flash_sale_end) > new Date());

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}?t=${Date.now()}`)
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
    if (currency.code === "IDR") return currency.symbol + " " + Number(price).toLocaleString(currency.locale, { minimumFractionDigits: 0 });
    return (
      currency.symbol + " " + (Number(price) * currency.rate).toLocaleString(currency.locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
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

          {flashSaleProducts.length > 0 && (
            <div className="mb-12 bg-red-50 dark:bg-red-900/10 rounded-2xl p-6 border border-red-100 dark:border-red-800">
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-3xl animate-pulse">⚡</span>
                  <div>
                    <h2 className="text-2xl font-[900] uppercase tracking-tighter text-red-600 dark:text-red-400 italic">Flash Sale</h2>
                    <p className="text-xs text-red-500 font-bold uppercase tracking-widest">Penawaran Berakhir Dalam:</p>
                  </div>
                </div>
                <FlashSaleCountdown endDate={flashSaleProducts[0].flash_sale_end} />
              </div>
              
              <div className="flex overflow-x-auto gap-6 pb-4 no-scrollbar">
                {flashSaleProducts.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => navigate(`/shop/${p.id}`)}
                    className="flex-none w-48 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                  >
                    <div className="aspect-square mb-4 relative overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-700">
                      <img src={getImageUrl(p.images?.[0] || p.image)} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" alt={p.name} />
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">-{Math.round((1 - p.flash_sale_price / p.price) * 100)}%</div>
                      <div className="absolute bottom-0 left-0 right-0 bg-red-600/90 backdrop-blur-sm text-white text-[10px] py-1 text-center font-bold">
                        <ProductFlashTimer endDate={p.flash_sale_end} />
                      </div>
                    </div>
                    <h4 className="text-sm font-bold truncate dark:text-white mb-1 uppercase tracking-tight">{p.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 font-bold">Rp{Number(p.flash_sale_price).toLocaleString('id-ID')}</span>
                      <span className="text-[10px] text-gray-400 line-through">Rp{Number(p.price).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-red-600 h-full rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <span className="text-[8px] font-bold text-red-500 mt-1 block uppercase">Terjual 75%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="container mx-auto px-4 mb-6 md:mb-8 flex justify-between items-end">
            <h3 className="text-xl md:text-3xl font-[900] uppercase tracking-wider text-gray-900 dark:text-white">{t('home.newArrivals')}</h3>
            <Link to="/shop" className="text-xs md:text-sm font-bold uppercase underline hover:text-gray-500">{t('home.viewAll')}</Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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

                  {/* Badge: Out of Stock */}
                  {product.stock <= 0 && (
                    <div className="absolute top-4 left-4 z-10 bg-red-600 text-white text-[10px] font-[900] px-2 py-1 uppercase tracking-wider rounded-sm shadow-sm ring-1 ring-white/20">
                      STOK HABIS
                    </div>
                  )}

                  <div
                    className="w-full aspect-square flex items-center justify-center overflow-hidden mb-3 md:mb-6 relative rounded bg-gray-50 dark:bg-gray-800"
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
                      className={`object-contain w-full h-full p-4 transition-transform duration-500 ease-in-out ${activeImageIndex[product.id] === 1 ? 'scale-105' : 'scale-100'} ${product.stock <= 0 ? 'grayscale opacity-60' : ''}`}
                      onError={e => { e.target.onerror = null; e.target.src = "https://placehold.co/600x800/e2e8f0/1e293b?text=" + product.name; }}
                    />
                  </div>
                  <div className="text-center w-full mt-auto">
                    <div className="text-sm md:text-base text-gray-900 dark:text-gray-100 mb-2 leading-tight font-medium uppercase tracking-wider line-clamp-2">{product.name}</div>
                    <div className="text-sm md:text-base text-gray-500 dark:text-gray-400">{convertPrice(product.price)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <PhilosophySection />
        <NewsletterSection />
      </div>


      <Footer />
    </>
  );
};

export default HomePage;
