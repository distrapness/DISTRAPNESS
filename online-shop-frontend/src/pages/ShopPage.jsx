import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"; // Import useSearchParams
import { useCurrency } from "../components/CurrencyContext.jsx";
import { useCart } from "../components/CartContext";
import Footer from "../components/Footer.jsx";
import config from "../config.js";
import { getImageUrl } from "../utils/imageHelper";
import ProductItemCard from "../components/ProductItemCard.jsx";
import { useQuery } from '@tanstack/react-query';

const API_URL = `${config.API_URL}/api/products`;

const fetchProducts = async ({ queryKey }) => {
  const [_key, { search, category, sortBy, page, pageSize }] = queryKey;
  const offset = (page - 1) * pageSize;
  const params = new URLSearchParams();
  params.append("limit", pageSize);
  params.append("offset", offset);
  if (search) params.append("search", search.trim());
  if (category && category !== "Semua") params.append("category", category.trim());
  if (sortBy) params.append("sortBy", sortBy);
  
  const res = await fetch(`${API_URL}?${params.toString()}`);
  if (!res.ok) throw new Error("Gagal mengambil produk");
  return res.json();
};

const fetchCategories = async () => {
  const res = await fetch(`${config.API_URL}/api/categories`);
  if (!res.ok) throw new Error("Gagal mengambil kategori");
  return res.json();
};

const ShopPage = () => {
  const [searchParams] = useSearchParams(); // Get params
  const [search, setSearch] = useState(searchParams.get("search") || ""); // Init from param
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "Semua");
  const [sortBy, setSortBy] = useState("newest");
  const { currency, t, language } = useCurrency();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12); // default 12 produk per halaman

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['products', { search, category: selectedCategory, sortBy, page, pageSize }],
    queryFn: fetchProducts,
    placeholderData: (prev) => prev,
  });

  const { data: categoryList = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  useEffect(() => {
    // Update search if URL changes (optional, but good for back button)
    const query = searchParams.get("search");
    if (query !== null) setSearch(query);

    const cat = searchParams.get("category");
    if (cat !== null) setSelectedCategory(cat);
  }, [searchParams]);

  const categories = useMemo(() => {
    return ["Semua", ...categoryList.map(c => c.name)];
  }, [categoryList]);

  const products = data?.products || [];
  const totalItems = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.pages || 1;

  const convertPrice = useCallback((price) => {
    if (currency.code === "IDR") return currency.symbol + " " + Number(price).toLocaleString(currency.locale, { minimumFractionDigits: 0 });
    return (
      currency.symbol + " " + (Number(price) * currency.rate).toLocaleString(currency.locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    );
  }, [currency]);

  return (
    <>
      <div className="w-full min-h-screen bg-white dark:bg-gray-900 transition-colors duration-700 pt-4 pb-16">
        <div className="max-w-7xl mx-auto px-4 mt-2 md:mt-4">
          {/* Filter Bar */}
          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-5 md:grid-cols-6 gap-4">
              {/* Search */}
              <div className="relative group sm:col-span-3 md:col-span-4">
                <input
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 text-sm transition-all shadow-sm"
                  placeholder={language === 'EN' ? "Search Products..." : "Cari produk..."}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              {/* Category */}
              <select
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none shadow-sm appearance-none cursor-pointer sm:col-span-1"
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat === "Semua" ? (language === 'EN' ? "All Categories" : "Semua Kategori") : cat}</option>
                ))}
              </select>
              {/* Sort By */}
              <select
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none shadow-sm appearance-none cursor-pointer sm:col-span-1"
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              >
                <option value="newest">{language === 'EN' ? "Newest" : "Terbaru"}</option>
                <option value="price_asc">{language === 'EN' ? "Price: Low to High" : "Harga: Rendah ke Tinggi"}</option>
                <option value="price_desc">{language === 'EN' ? "Price: High to Low" : "Harga: Tinggi ke Rendah"}</option>
                <option value="name_asc">{language === 'EN' ? "Alphabetical" : "Abjad"}</option>
              </select>
            </div>

            {/* Active Filter Summary */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-500">
                {language === 'EN' ? 'Showing' : 'Menampilkan'} <span className="font-bold text-black dark:text-white">{totalItems}</span> {language === 'EN' ? 'products' : 'produk'}
                {selectedCategory !== 'Semua' && <span className="ml-2 bg-black dark:bg-white text-white dark:text-black px-2.5 py-0.5 rounded-full text-[10px] font-bold">{language === 'EN' ? '1 filter active' : '1 filter aktif'}</span>}
              </p>
              {selectedCategory !== 'Semua' && (
                <button
                  onClick={() => { setSelectedCategory('Semua'); setPage(1); }}
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
              <div className="col-span-full text-red-500">{error?.message || error}</div>
            ) : !products || products.length === 0 ? (
              <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 mb-6 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-black dark:text-white mb-2 italic">{language === 'EN' ? 'Product Not Found' : 'Produk Tidak Ditemukan'}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest max-w-[200px]">{language === 'EN' ? 'Try changing your filters or search keywords.' : 'Coba ubah filter atau kata kunci pencarian Anda.'}</p>
                <button 
                  onClick={() => { setSelectedCategory('Semua'); setSearch(''); setPage(1); }}
                  className="mt-8 px-8 py-3 bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  {language === 'EN' ? 'RESET FILTERS' : 'RESET FILTER'}
                </button>
              </div>
            ) : (
              products.map((product) => (
                <ProductItemCard
                  key={product.id || product._id}
                  product={product}
                  convertPrice={convertPrice}
                  language={language}
                />
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
