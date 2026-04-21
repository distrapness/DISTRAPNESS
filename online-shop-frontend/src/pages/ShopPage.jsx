import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"; // Import useSearchParams
import { useCurrency } from "../components/CurrencyContext.jsx";
import { useCart } from "../components/CartContext";
import Footer from "../components/Footer.jsx";
import config from "../config.js";
import { getImageUrl } from "../utils/imageHelper";

const API_URL = `${config.API_URL}/api/products`;

const getCategories = (products) => {
  if (!products || !Array.isArray(products)) return [];
  const unique = new Set(products.map(p => p.category).filter(Boolean));
  return Array.from(unique);
};

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams(); // Get params
  const [search, setSearch] = useState(searchParams.get("search") || ""); // Init from param
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "Semua");
  const [sortBy, setSortBy] = useState("newest");
  const { currency, t } = useCurrency();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    // Update search if URL changes (optional, but good for back button)
    const query = searchParams.get("search");
    if (query !== null) setSearch(query);

    const cat = searchParams.get("category");
    if (cat !== null) setSelectedCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then((res) => {
        // ...
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

  let filtered = products.filter(
    (p) =>
      (selectedCategory === "Semua" || p.category === selectedCategory) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase()))
  );

  // Sorting Logic
  filtered = filtered.sort((a, b) => {
    switch (sortBy) {
      case "price_asc": return a.price - b.price;
      case "price_desc": return b.price - a.price;
      case "name_asc": return a.name.localeCompare(b.name);
      case "newest": default: return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
  });

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
          <div className="grid grid-cols-2 md:flex md:flex-row gap-3 md:gap-4 mb-8 md:mb-10 items-center justify-between">
            {/* Category Filter */}
            <div className="w-full md:w-auto">
              <select
                className="w-full px-4 py-3 md:py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-black text-xs md:text-sm font-bold uppercase tracking-wider appearance-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ backgroundImage: 'none' }} // Custom arrow if needed, but default is fine for now
              >
                <option value="Semua">All Categories</option>
                {categories.filter(c => c !== "Semua").map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="w-full md:w-auto">
              <select
                className="w-full px-4 py-3 md:py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-black text-xs md:text-sm font-bold uppercase tracking-wider appearance-none"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A-Z</option>
              </select>
            </div>

            {/* Search Bar */}
            <div className="col-span-2 md:col-span-1 w-full md:w-80">
              <div className="relative">
                <input
                  className="w-full pl-10 pr-4 py-3 md:py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-black text-xs md:text-sm"
                  placeholder={t('shop.search').toUpperCase()}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
          </div>
          {/* Gallery grid ala jamesboogie.com: 4 kolom, jarak rapat, gambar besar, info di bawah */}
          {/* Gallery grid ala jamesboogie.com: 4 kolom, jarak rapat, gambar besar, info di bawah */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 gap-y-8 md:gap-6">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[300px] border border-gray-100 dark:border-gray-800 rounded-lg p-6 bg-white dark:bg-gray-900 animate-pulse" />
              ))
            ) : error ? (
              <div className="col-span-full text-red-500">{error}</div>
            ) : !paginatedProducts || paginatedProducts.length === 0 ? (
              <div className="col-span-full text-gray-500">No products found.</div>
            ) : (
              paginatedProducts.map((product) => (
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

                  {/* Image Container */}
                  <div
                    className="w-full aspect-square flex items-center justify-center overflow-hidden mb-4 md:mb-6 relative rounded bg-gray-50 dark:bg-gray-800"
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
                      className={`object-contain w-full h-full transition-transform duration-500 ease-in-out p-2 ${activeImageIndex[product.id] === 1 ? 'scale-105' : 'scale-100'}`}
                      onError={handleImageError}
                    />
                  </div>

                  {/* Text Details */}
                  <div className="text-center w-full mt-auto">
                    <div className="text-xs md:text-base text-gray-900 dark:text-gray-100 mb-1 md:mb-2 leading-tight font-medium uppercase tracking-wide line-clamp-2">
                      {product.name}
                    </div>
                    <div className="text-xs md:text-base text-gray-500 dark:text-gray-400 mb-3 md:mb-4">
                      {convertPrice(product.price)}
                    </div>
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
