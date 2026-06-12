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
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [stockFilter, setStockFilter] = useState("all"); // all | in_stock | out_of_stock
  const { currency, t, language } = useCurrency();
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
    fetch(`${API_URL}?t=${Date.now()}`)
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
        p.description?.toLowerCase().includes(search.toLowerCase())) &&
      (p.price >= priceRange[0] && p.price <= priceRange[1]) &&
      (stockFilter === "all" || (stockFilter === "in_stock" ? p.stock > 0 : p.stock <= 0))
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

  const maxProductPrice = products.length > 0 ? Math.max(...products.map(p => p.price)) : 5000000;
  const activeFiltersCount = (priceRange[0] > 0 || priceRange[1] < maxProductPrice ? 1 : 0) + (stockFilter !== 'all' ? 1 : 0) + (selectedCategory !== 'Semua' ? 1 : 0);


  const convertPrice = (price) => {
    if (currency.code === "IDR") return currency.symbol + " " + Number(price).toLocaleString(currency.locale, { minimumFractionDigits: 0 });
    return (
      currency.symbol + " " + (Number(price) * currency.rate).toLocaleString(currency.locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
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
          {/* Filter Bar */}
          <div className="mb-8 space-y-3">
            {/* Row 1: Search + Sort */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Search */}
              <div className="relative group">
                <input
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 text-sm transition-all shadow-sm"
                  placeholder={language === 'EN' ? "Search Products..." : "Cari produk..."}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              {/* Sort */}
              <select
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 shadow-sm appearance-none cursor-pointer"
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              >
                <option value="newest">{language === 'EN' ? "🕐 Newest" : "🕐 Terbaru"}</option>
                <option value="price_asc">{language === 'EN' ? "💰 Price: Low → High" : "💰 Harga: Rendah → Tinggi"}</option>
                <option value="price_desc">{language === 'EN' ? "💎 Price: High → Low" : "💎 Harga: Tinggi → Rendah"}</option>
                <option value="name_asc">{language === 'EN' ? "🔤 Name A-Z" : "🔤 Nama A-Z"}</option>
              </select>
            </div>

            {/* Row 2: Category + Stock + Price */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
              {/* Category */}
              <select
                className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 focus:outline-none shadow-sm appearance-none cursor-pointer"
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat === "Semua" ? (language === 'EN' ? "All Categories" : "Semua Kategori") : cat}</option>
                ))}
              </select>

              {/* Stock Filter */}
              <select
                className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 focus:outline-none shadow-sm appearance-none cursor-pointer"
                value={stockFilter}
                onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
              >
                <option value="all">{language === 'EN' ? "All Stock" : "Semua Stok"}</option>
                <option value="in_stock">{language === 'EN' ? "✅ In Stock" : "✅ Ada Stok"}</option>
                <option value="out_of_stock">{language === 'EN' ? "❌ Out of Stock" : "❌ Habis"}</option>
              </select>

              {/* Price Range */}
              <div className="col-span-2 flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5">
                <span className="text-xs text-gray-500 whitespace-nowrap">{language === 'EN' ? 'Price:' : 'Harga:'}</span>
                <input
                  type="range"
                  min={0}
                  max={maxProductPrice || 5000000}
                  step={50000}
                  value={priceRange[1]}
                  onChange={(e) => { setPriceRange([priceRange[0], Number(e.target.value)]); setPage(1); }}
                  className="flex-1 accent-black dark:accent-white"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap min-w-[80px] text-right">
                  {language === 'EN' ? 'up to ' : 's/d '}{convertPrice(priceRange[1])}
                </span>
              </div>
            </div>

            {/* Active Filter Summary */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {language === 'EN' ? 'Showing' : 'Menampilkan'} <span className="font-bold text-black dark:text-white">{filtered.length}</span> {language === 'EN' ? 'products' : 'produk'}
                {activeFiltersCount > 0 && <span className="ml-2 bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 rounded-full text-[10px] font-bold">{activeFiltersCount} {language === 'EN' ? 'active filters' : 'filter aktif'}</span>}
              </p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => { setSelectedCategory('Semua'); setStockFilter('all'); setPriceRange([0, maxProductPrice]); setSearch(''); setPage(1); }}
                  className="text-xs text-red-500 hover:text-red-700 font-bold underline"
                >
                  {language === 'EN' ? 'Reset Filters' : 'Reset Filter'}
                </button>
              )}
            </div>
          </div>


          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-8 md:gap-6">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[300px] border border-gray-100 dark:border-gray-800 rounded-lg p-6 bg-white dark:bg-gray-900 animate-pulse" />
              ))
            ) : error ? (
              <div className="col-span-full text-red-500">{error}</div>
            ) : !paginatedProducts || paginatedProducts.length === 0 ? (
              <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 mb-6 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-black dark:text-white mb-2 italic">{language === 'EN' ? 'Product Not Found' : 'Produk Tidak Ditemukan'}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest max-w-[200px]">{language === 'EN' ? 'Try changing your filters or search keywords.' : 'Coba ubah filter atau kata kunci pencarian Anda.'}</p>
                <button 
                  onClick={() => { setSelectedCategory('Semua'); setStockFilter('all'); setPriceRange([0, maxProductPrice]); setSearch(''); setPage(1); }}
                  className="mt-8 px-8 py-3 bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  {language === 'EN' ? 'RESET FILTERS' : 'RESET FILTER'}
                </button>
              </div>
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

                  {/* Badge: Out of Stock */}
                  {product.stock <= 0 && (
                    <div className="absolute top-4 left-4 z-10 bg-red-600 text-white text-[10px] font-[900] px-2 py-1 uppercase tracking-wider rounded-sm shadow-md ring-1 ring-white/20">
                      {language === 'EN' ? 'SOLD OUT' : 'HABIS'}
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
                      loading="lazy"
                      className={`object-contain w-full h-full transition-transform duration-500 ease-in-out p-4 ${activeImageIndex[product.id] === 1 ? 'scale-105' : 'scale-100'} ${product.stock <= 0 ? 'grayscale opacity-50' : ''}`}
                      onError={handleImageError}
                    />
                  </div>

                    {/* Text Details */}
                    <div className="text-center w-full mt-auto">
                      <div className="text-xs md:text-base text-gray-900 dark:text-gray-100 mb-1 md:mb-2 leading-tight font-medium uppercase tracking-wide line-clamp-2">
                        {product.name}
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        {product.is_flash_sale && (!product.flash_sale_end || new Date(product.flash_sale_end) > new Date()) ? (
                          <>
                            <div className="flex items-center gap-1.5 md:gap-2">
                              <span className="text-xs md:text-base text-red-600 font-bold">{convertPrice(product.flash_sale_price)}</span>
                              <span className="text-[9px] md:text-[10px] text-gray-400 line-through">{convertPrice(product.price)}</span>
                            </div>
                            <div className="bg-red-100 dark:bg-red-900/30 text-red-600 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                              Flash Sale -{Math.round((1 - product.flash_sale_price / product.price) * 100)}%
                            </div>
                          </>
                        ) : (
                          <div className="text-xs md:text-base text-gray-500 dark:text-gray-400 mb-0">
                            {convertPrice(product.price)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12 gap-3 items-center">
              <button
                className="px-6 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black dark:hover:text-white transition-all disabled:opacity-30"
                disabled={page === 1}
                onClick={() => { setPage(page - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                &larr; {language === 'EN' ? 'Prev' : 'Sebelumnya'}
              </button>
              <div className="flex gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${page === i + 1 ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg scale-110' : 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 hover:bg-gray-100'}`}
                    onClick={() => { setPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                className="px-6 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black dark:hover:text-white transition-all disabled:opacity-30"
                disabled={page === totalPages}
                onClick={() => { setPage(page + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                {language === 'EN' ? 'Next' : 'Berikutnya'} &rarr;
              </button>
              <select
                className="ml-6 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              >
                {[8, 12, 16, 20, 24].map(size => (
                  <option key={size} value={size}>{size} {language === 'EN' ? '/ page' : '/ halaman'}</option>
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
