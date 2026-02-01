import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrency, useDarkMode } from "../components/CurrencyContext.jsx";
import Footer from "../components/Footer.jsx";

import config from '../config.js';
import { getImageUrl } from "../utils/imageHelper";

const API_URL = `${config.API_URL}/api/products`;

const getCategories = (products) => {
  const cats = new Set();
  products.forEach((p) => {
    if (p.category) cats.add(p.category);
  });
  return Array.from(cats);
};

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
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

  const categories = ["Semua", ...getCategories(products)];

  const filtered = products.filter(
    (p) =>
      (selectedCategory === "Semua" || p.category === selectedCategory) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase()))
  );

  const convertPrice = (price) => {
    if (currency.code === "IDR") return currency.symbol + " " + price.toLocaleString(currency.locale);
    return (
      currency.symbol + " " + (price * currency.rate).toLocaleString(currency.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  };

  // State untuk index gambar aktif pada setiap produk
  const [activeImageIndex, setActiveImageIndex] = useState({});

  // Handler khusus error gambar produk
  const handleImageError = (e) => {
    if (e && e.target) {
      e.target.onerror = null;
      e.target.src = "/assets/placeholder-banner.jpg";
    }
    // Jangan log atau throw error berbasis event!
  };

  // Tambahkan state dan fungsi untuk pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12); // default 12 produk per halaman

  // Hitung jumlah halaman
  const totalPages = Math.ceil(filtered.length / pageSize);

  // Produk yang ditampilkan di halaman saat ini
  const paginatedProducts = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="w-full min-h-screen bg-white dark:bg-gray-900 transition-colors duration-700 pt-4 pb-16">
        <div className="max-w-7xl mx-auto px-4 mt-2 md:mt-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-10 justify-between">
            <div className="flex flex-row gap-2 items-center w-full md:w-auto">
              <select
                className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-black text-sm font-semibold"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <input
              className="w-full md:w-72 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Search Products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* Gallery grid ala jamesboogie.com: 4 kolom, jarak rapat, gambar besar, info di bawah */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12 md:gap-x-8 md:gap-y-16">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[280px] md:h-[340px] bg-[#fff] dark:bg-gray-800 animate-pulse rounded-none" />
              ))
            ) : error ? (
              <div className="col-span-full text-red-500">{error}</div>
            ) : !paginatedProducts || paginatedProducts.length === 0 ? (
              <div className="col-span-full text-gray-500">No products found.</div>
            ) : (
              paginatedProducts.map((product) => (
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
                        setActiveImageIndex(prev => ({ ...prev, [product.id]: 1 }));
                      }
                    }}
                    onMouseLeave={() => {
                      if (Array.isArray(product.images) && product.images.length > 1) {
                        setActiveImageIndex(prev => ({ ...prev, [product.id]: 0 }));
                      }
                    }}
                  >
                    <img
                      src={Array.isArray(product.images) && product.images.length > 0 ? getImageUrl(product.images[activeImageIndex[product.id] || 0]) : getImageUrl(product.image)}
                      alt={product.name}
                      className={`object-contain w-full h-full transition-all duration-500 ease-in-out bg-transparent ${activeImageIndex[product.id] === 1 ? 'opacity-100 scale-105' : 'opacity-100 scale-100'}`}
                      style={{ position: 'absolute', top: 0, left: 0, transition: 'opacity 0.5s, transform 0.5s', zIndex: 1, cursor: Array.isArray(product.images) && product.images.length > 1 ? 'pointer' : 'default' }}
                      onError={handleImageError}
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
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-10 gap-2">
              <button
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-white font-bold disabled:opacity-50"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`px-3 py-1 rounded ${page === i + 1 ? 'bg-black text-white' : 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white'} font-bold`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-white font-bold disabled:opacity-50"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
              <select
                className="ml-6 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              >
                {[8, 12, 16, 20, 24].map(size => (
                  <option key={size} value={size}>{size} / page</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ShopPage;
