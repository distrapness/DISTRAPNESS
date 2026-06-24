import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "../components/CartContext";
import ProductImageGalleryModal from "../components/ProductImageGalleryModal.jsx";
import Footer from "../components/Footer.jsx";
import config from "../config";
import { getImageUrl } from "../utils/imageHelper";
import { useCurrency } from "../components/CurrencyContext.jsx";
import { useWishlist } from "../components/WishlistContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import ProductItemCard from "../components/ProductItemCard.jsx";
import { useQuery } from '@tanstack/react-query';

const API_URL = `${config.API_URL}/api/products`;

const fetchProduct = async (id) => {
  const res = await fetch(`${API_URL}/${id}`);
  if (!res.ok) throw new Error("Gagal mengambil detail produk");
  return res.json();
};

const fetchProducts = async () => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Gagal mengambil produk");
  return res.json();
};


const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { t, currency } = useCurrency();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M'); // Default logic

  // Image selection state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Wishlist state
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Accordion state
  const [openMaterial, setOpenMaterial] = useState(false);
  const [openShipping, setOpenShipping] = useState(false);

  // Reviews state
  const { isLoggedIn, userEmail } = useAuth();
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [sizeRecOpen, setSizeRecOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const { data: product, isLoading: productLoading, error: productError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id),
  });

  const inWishlist = product ? isInWishlist(product.id) : false;

  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/${id}/reviews`);
      if (!res.ok) throw new Error("Gagal mengambil ulasan");
      return res.json();
    }
  });

  useEffect(() => {
    if (product) {
      if (product.name) {
        document.title = `${product.name} - DISTRAPNESS`;
        // Optional: Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute("content", product.description?.substring(0, 150) || "Beli produk ini di DISTRAPNESS");
        }
      }
      // Auto-select first available size
      if (product.sizes) {
        const firstAvailable = ['S', 'M', 'L', 'XL'].find(s => product.sizes[s] > 0);
        if (firstAvailable) setSelectedSize(firstAvailable);
      }
    }
  }, [product]);

  useEffect(() => {
    // Fetch user profile for referral code if logged in
    if (isLoggedIn) {
      fetch(`${config.API_URL}/api/profile`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.json())
      .then(data => setUserProfile(data))
      .catch(() => {});
    }
  }, [isLoggedIn]);

  const submitReview = (e) => {
    e.preventDefault();
    if (!isLoggedIn) return alert(t('reviews.errorLogin'));
    if (ratingInput < 1 || ratingInput > 5) return alert(t('reviews.errorRating'));
    
    setSubmittingReview(true);
    fetch(`${API_URL}/${id}/reviews`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ rating: ratingInput, comment: commentInput })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) alert(data.error);
      else {
        setCommentInput("");
        setRatingInput(5);
        refetchReviews();
        alert(t('reviews.success'));
      }
    })
    .catch(console.error)
    .finally(() => setSubmittingReview(false));
  };


  if (productError) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-6 text-red-500 font-bold">
        Error: {productError.message || "Gagal memuat produk"}
      </div>
    );
  }

  if (productLoading || !product) {
    return (
      <div className="min-h-screen bg-white dark:bg-black p-6 md:p-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="animate-pulse aspect-[4/5] bg-gray-100 dark:bg-gray-900 rounded-3xl"></div>
          <div className="space-y-6">
            <div className="animate-pulse h-10 bg-gray-100 dark:bg-gray-900 rounded w-3/4"></div>
            <div className="animate-pulse h-6 bg-gray-100 dark:bg-gray-900 rounded w-1/4"></div>
            <div className="animate-pulse h-24 bg-gray-100 dark:bg-gray-900 rounded w-full"></div>
            <div className="animate-pulse h-12 bg-gray-100 dark:bg-gray-900 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image];

  const handleBuyNow = () => {
    addToCart({ ...product, selectedSize }, qty);
    navigate('/cart');
  };

  const convertPrice = (price) => {
    if (currency.code === "IDR") return currency.symbol + " " + Number(price).toLocaleString(currency.locale, { minimumFractionDigits: 0 });
    return (
      currency.symbol + " " + (Number(price) * currency.rate).toLocaleString(currency.locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen text-black dark:text-white transition-colors duration-300">

      {/* Main Content: Split Layout */}
      <div className="pt-4 md:pt-8 pb-24 max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row gap-8 md:gap-12 items-start justify-center">

          {/* Left: Images (Main Image + Horizontal Thumbnails) */}
          <div className="w-full lg:w-[55%] flex lg:justify-end">
            <div className="flex flex-col gap-6 w-full">

              {/* Main Image */}
              <div className="w-full" onClick={() => { setGalleryIndex(selectedImageIndex); setGalleryOpen(true); }}>
                {/* Mobile Carousel (Horizontal Scroll Snap) - Visible only on mobile */}
                <div className="md:hidden -mx-4 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative flex-shrink-0 w-full px-4 snap-center bg-gray-50 dark:bg-gray-100 overflow-hidden"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent parent click
                        setGalleryIndex(idx);
                        setGalleryOpen(true);
                      }}
                    >
                      <div className="aspect-[3/4] w-full relative rounded-xl overflow-hidden shadow-sm">
                        <img
                          src={getImageUrl(img)}
                          alt={`${product.name} ${idx}`}
                          className="w-full h-full object-contain mix-blend-multiply"
                          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x800/e2e8f0/1e293b?text=" + product.name; }}
                        />
                        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm font-black">
                          {idx + 1}/{images.length}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Main Image - Constrained Aspect Ratio */}
                <div className="hidden md:flex w-full aspect-[3/4] bg-[#f9f9f9] dark:bg-gray-100 cursor-zoom-in relative items-center justify-center overflow-hidden rounded-md border border-gray-100 dark:border-gray-700">
                  <img
                    src={getImageUrl(images[selectedImageIndex])}
                    alt={product.name}
                    className="h-full w-full object-contain p-4 mix-blend-multiply"
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/800x1000/e2e8f0/1e293b?text=" + product.name; }}
                  />
                </div>
              </div>

              {/* Thumbnails (Desktop Only - Moved to Bottom) */}
              <div className="hidden md:flex flex-row gap-4 w-full justify-center overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`w-20 aspect-[3/4] shrink-0 cursor-pointer border transition-all rounded-sm ${selectedImageIndex === idx ? 'border-black dark:border-white opacity-100 ring-1 ring-offset-1 ring-black dark:ring-white' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    onClick={() => setSelectedImageIndex(idx)}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`Thumbnail ${idx}`}
                      className="w-full h-full object-contain p-1 rounded-sm bg-gray-50 dark:bg-gray-100 mix-blend-multiply"
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x133/e2e8f0/1e293b?text=" + idx; }}
                    />
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Right: Details (Sticky on Desktop) */}
          <div className="w-full lg:w-[45%] flex lg:justify-start lg:sticky lg:top-32 self-start">
            <div className="w-full lg:max-w-[450px] flex flex-col pt-4">

              {/* Header Section (Name & Price) */}
              <div className="mb-6 text-right">
                <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider mb-2 font-sans">{product.name}</h1>
                {reviews.length > 0 && (
                  <div className="flex justify-end gap-2 items-center mb-2">
                    <span className="text-yellow-400">{'★'.repeat(Math.round(reviews.reduce((a, b) => a + b.rating, 0) / reviews.length)) + '☆'.repeat(5 - Math.round(reviews.reduce((a, b) => a + b.rating, 0) / reviews.length))}</span>
                    <span className="text-sm text-gray-500">({reviews.length} {t('productDetail.ulasan')})</span>
                  </div>
                )}

                {product.is_flash_sale && new Date(product.flash_sale_end) > new Date() ? (
                  <div className="space-y-1">
                    <div className="flex justify-end items-center gap-3">
                      <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse uppercase tracking-wider">Flash Sale</span>
                      <span className="text-sm text-gray-400 line-through">{convertPrice(product.price)}</span>
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-red-600">
                      {convertPrice(product.flash_sale_price)}
                    </div>
                    <div className="flex justify-end gap-1 items-center mt-2">
                       <span className="text-[10px] text-red-500 font-bold uppercase mr-2">Sale Ends:</span>
                       <ProductFlashCountdown endDate={product.flash_sale_end} />
                    </div>
                  </div>
                ) : (
                  <div className="text-lg md:text-xl font-medium text-gray-900 dark:text-gray-100">
                    {convertPrice(product.price)}
                  </div>
                )}
              </div>

              <div className="w-full h-px bg-gray-300 dark:bg-gray-700 mb-6"></div>

              {/* Description Section */}
              <div className="mb-6">
                <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-right">Product Description</h3>
                <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-light text-right">
                  <p>{product.description}</p>
                </div>
              </div>

              <div className="w-full h-px bg-gray-300 dark:bg-gray-700 mb-8"></div>

              {/* Selectors Section */}
              <div className="flex flex-col items-end gap-6 mb-8">

                {/* Size Selector (Buttons) */}
                {/* Size Selector: only show if product has at least one size with stock > 0 OR has size data with values defined */}
                {(() => {
                  const sizesObj = product.sizes;
                  // Produk dianggap punya size jika ada minimal satu size yang terdefinisi
                  const hasSizeData = sizesObj && typeof sizesObj === 'object' && Object.keys(sizesObj).length > 0;
                  // Cek apakah ada minimal satu size yang nilai stoknya terdefinisi (bukan cuma 0 semua)
                  const hasAnySizeDefined = hasSizeData && Object.values(sizesObj).some(v => v !== null && v !== undefined);
                  // Cek apakah ada stok di size manapun
                  const hasAnyStock = hasSizeData && Object.values(sizesObj).some(v => Number(v) > 0);

                  if (hasSizeData && hasAnySizeDefined) {
                    // Produk dengan size
                    return (
                      <div className="w-full max-w-[300px] flex flex-col items-end">
                        <div className="flex justify-between w-full mb-2">
                          <div className="flex gap-3">
                            <button 
                              onClick={() => setSizeRecOpen(true)}
                              className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors flex items-center gap-1"
                            >
                              <span className="text-xs">🤖</span> AI Cek Ukuran
                            </button>
                          </div>
                          <label className="text-sm font-bold uppercase tracking-wider">Size</label>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          {['S', 'M', 'L', 'XL']
                            .filter(size => sizesObj[size] !== undefined && sizesObj[size] !== null)
                            .map((size) => {
                              const isSelected = selectedSize === size;
                              const hasStock = Number(sizesObj[size] || 0) > 0;
                              return (
                                <button
                                  key={size}
                                  onClick={() => hasStock && setSelectedSize(size)}
                                  className={`min-w-[40px] px-3 py-2 border text-sm font-bold transition-all relative
                                    ${isSelected ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'bg-transparent text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-black dark:hover:border-white'}
                                    ${!hasStock ? 'opacity-40 cursor-not-allowed' : ''}
                                  `}
                                >
                                  {size}
                                  {!hasStock && <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-px bg-red-500/50 -rotate-45"></div></div>}
                                </button>
                              );
                          })}
                        </div>
                        {sizesObj[selectedSize] <= 0 && <div className="text-red-500 text-xs mt-1 font-[900] uppercase tracking-tighter shadow-sm py-1 bg-red-50 dark:bg-red-900/20 px-2 rounded-sm ring-1 ring-red-500/50">OUT OF STOCK IN THIS SIZE</div>}
                        {sizesObj[selectedSize] > 0 && sizesObj[selectedSize] < 5 && <div className="text-orange-500 text-xs mt-1 font-bold">{t('productDetail.onlyLeft')}{sizesObj[selectedSize]}{t('productDetail.leftItems')}</div>}
                      </div>
                    );
                  } else {
                    // Produk tanpa size (tas, aksesoris, dll)
                    return (
                      <div className="w-full max-w-[300px] flex flex-col items-end">
                        <div className="text-sm font-bold uppercase tracking-wider mb-2">Availability</div>
                        {product.stock > 0 ? (
                          <div className="text-green-600 text-xs font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-sm ring-1 ring-green-500/50">IN STOCK ({product.stock} units)</div>
                        ) : (
                          <div className="text-red-600 text-xs font-[900] bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-sm ring-1 ring-red-500/50">OUT OF STOCK</div>
                        )}
                      </div>
                    );
                  }
                })()}

                {/* Quantity Selector */}
                <div className="w-full max-w-[200px] flex flex-col items-end">
                  <label className="text-sm font-bold uppercase tracking-wider mb-2">Quantity</label>
                  <div className="flex border border-black dark:border-white w-full h-[45px]">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="w-12 flex items-center justify-center border-r border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      <svg width="10" height="2" viewBox="0 0 10 2" fill="none"><rect width="10" height="2" fill="currentColor" /></svg>
                    </button>
                    <div className="flex-1 flex items-center justify-center text-sm font-bold">
                      {qty}
                    </div>
                    <button
                      onClick={() => setQty(qty + 1)}
                      className="w-12 flex items-center justify-center border-l border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M4 6H0V4H4V0H6V4H10V6H6V10H4V6Z" fill="currentColor" /></svg>
                    </button>
                  </div>
                </div>


              </div>

              {/* Action Buttons */}
              {(() => {
                const sizesObj = product.sizes;
                const hasSizeData = sizesObj && typeof sizesObj === 'object' && Object.keys(sizesObj).length > 0;
                const hasAnySizeDefined = hasSizeData && Object.values(sizesObj).some(v => v !== null && v !== undefined);
                const isProductWithSizes = hasSizeData && hasAnySizeDefined;

                // Untuk produk bersizes: cek stok size terpilih. Jika tidak ada sizes: cek product.stock
                const isOutOfStock = isProductWithSizes
                  ? (Number(sizesObj[selectedSize] || 0) <= 0)
                  : (product.stock <= 0);

                return (
                  <div className="flex justify-end gap-2 mb-4 w-full">
                    <button
                      onClick={() => addToCart({ ...product, selectedSize: isProductWithSizes ? selectedSize : null }, qty)}
                      disabled={isOutOfStock}
                      className={`flex-1 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2 
                        ${isOutOfStock ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black text-white shadow-xl hover:scale-[1.02] active:scale-[0.98]'}`}
                    >
                      {isOutOfStock ? 'OUT OF STOCK' : t('productDetail.addToCart')}
                    </button>
                    <button
                      onClick={handleBuyNow}
                      disabled={isOutOfStock}
                      className={`flex-1 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2
                        ${isOutOfStock ? 'bg-gray-50 dark:bg-gray-800/50 text-gray-300 cursor-not-allowed' : 'bg-black dark:bg-white text-white dark:text-black shadow-2xl hover:scale-[1.02] active:scale-[0.98]'}`}
                    >
                      {isOutOfStock ? 'RESTOCK SOON' : t('productDetail.buy')}
                    </button>
                  </div>
                );
              })()}

              {/* Wishlist & Share */}
              <div className="flex justify-end gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`${inWishlist ? 'text-red-500 hover:text-red-600' : 'hover:text-black dark:hover:text-white'} transition-colors flex items-center gap-1`}
                >
                  {inWishlist ? '❤️ Tersimpan' : '🤍 Wishlist'}
                </button>
                <button
                  onClick={async () => {
                    const shareUrl = window.location.href;
                    const shareData = {
                      title: product.name,
                      text: `Cek produk keren ini di Distrapness: ${product.name}`,
                      url: shareUrl,
                    };
                    if (navigator.share) {
                      try { await navigator.share(shareData); } catch (e) {}
                    } else {
                      navigator.clipboard.writeText(shareUrl);
                      setShareToast(true);
                      setTimeout(() => setShareToast(false), 2000);
                    }
                  }}
                  className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-1 relative font-black"
                >
                  📤 Share
                  {shareToast && (
                    <span className="absolute -top-8 right-0 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">Link disalin! ✓</span>
                  )}
                </button>
              </div>


            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-100 dark:border-gray-800 w-full animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
              <div>
                <h3 className="font-[900] text-xl uppercase tracking-tighter mb-1">{t('reviews.title')}</h3>
                <div className="flex items-center gap-3">
                  <div className="flex text-yellow-400 text-sm">
                    {'★'.repeat(Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)))}{'☆'.repeat(5 - Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)))}
                  </div>
                  <span className="text-sm text-gray-500 font-medium">({reviews.length} {t('reviews.count') || 'Reviews'})</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {reviews.map(rev => (
                <div key={rev.id} className="bg-white dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-sm uppercase">
                        {rev.user_email.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {rev.user_email.split('@')[0]}
                          <span className="text-[8px] bg-green-100 text-green-700 px-1 py-0.5 rounded font-black tracking-tighter">VERIFIED BUYER</span>
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date(rev.created_at).toLocaleDateString(currency.locale)}</div>
                      </div>
                    </div>
                    <div className="flex text-yellow-400 text-xs">
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 font-light italic">
                    "{rev.comment || "..."}"
                  </p>
                  {rev.admin_reply && (
                    <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-fadeIn">
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        <span>💬 Balasan Admin</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-light leading-relaxed">
                        {rev.admin_reply}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}



        {/* Style With (Related Products) */}
        <div className="mt-16 border-t border-gray-100 dark:border-gray-800 pt-16">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-[900] uppercase tracking-tighter">{t('productDetail.styleWith')}</h2>
            <Link to="/shop" className="text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-black dark:hover:text-white transition-colors">{t('productDetail.viewCollection')} →</Link>
          </div>
          <RelatedProducts currentProduct={product} />
        </div>

      </div>

      {/* Modal Gallery */}
      {galleryOpen && (
        <ProductImageGalleryModal
          images={images}
          open={galleryOpen}
          initialIndex={galleryIndex}
          onClose={() => setGalleryOpen(false)}
        />
      )}



      {/* AI Size Recommender Modal */}
      {sizeRecOpen && (
        <SizeRecommenderModal 
          product={product} 
          onClose={() => setSizeRecOpen(false)} 
          onApply={(size) => {
            setSelectedSize(size);
            setSizeRecOpen(false);
          }}
        />
      )}

      <Footer />
    </div>
  );
};

const SizeRecommenderModal = ({ product, onClose, onApply }) => {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [recommendation, setRecommendation] = useState(null);

  const calculateSize = () => {
    if (!weight || !height) return;
    const w = parseFloat(weight);
    const h = parseFloat(height);
    
    let result = "M"; // Default
    
    // Simple heuristic for T-shirts/Shirts
    if (h < 160) {
      if (w < 55) result = "S";
      else if (w < 70) result = "M";
      else result = "L";
    } else if (h < 175) {
      if (w < 65) result = "M";
      else if (w < 80) result = "L";
      else result = "XL";
    } else {
      if (w < 75) result = "L";
      else result = "XL";
    }
    
    // If it's a "TAS" or "ACCESSORIES", no rec
    if (product.category?.toUpperCase() === 'TAS' || product.category?.toUpperCase() === 'AKSESORIS') {
      setRecommendation("Berukuran universal (One Size)");
      return;
    }

    setRecommendation(result);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 max-w-sm w-full relative z-10 shadow-2xl rounded-2xl transform animate-in fade-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black dark:hover:text-white">&times;</button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">AI</div>
          <h3 className="text-lg font-bold uppercase tracking-tight">Cek Ukuran Pas</h3>
        </div>

        <p className="text-xs text-gray-500 mb-6 font-light">Masukkan data Anda untuk mendapatkan rekomendasi ukuran terbaik berdasarkan model produk ini.</p>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2">Tinggi Badan (cm)</label>
            <input 
              type="number" 
              placeholder="Contoh: 170" 
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-2">Berat Badan (kg)</label>
            <input 
              type="number" 
              placeholder="Contoh: 65" 
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-mono"
            />
          </div>
        </div>

        {recommendation ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800 text-center mb-6 animate-in slide-in-from-bottom-2 duration-500">
            <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Rekomendasi Kami</div>
            <div className="text-4xl font-black text-blue-600 dark:text-blue-400 mb-4">{recommendation}</div>
            {recommendation.length <= 2 && (
              <button 
                onClick={() => onApply(recommendation)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-xs uppercase tracking-widest transition-all"
              >
                Pilih Ukuran {recommendation}
              </button>
            )}
          </div>
        ) : (
          <button 
            onClick={calculateSize}
            className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg"
          >
            Dapatkan Rekomendasi
          </button>
        )}
      </div>
    </div>
  );
};




const RelatedProducts = ({ currentProduct }) => {
  const { currency, language } = useCurrency();

  const { data } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const allProducts = data?.products || [];

  const convertPrice = useCallback((price) => {
    if (!price) return "";
    if (currency.code === "IDR") return currency.symbol + " " + Number(price).toLocaleString(currency.locale, { minimumFractionDigits: 0 });
    return (
      currency.symbol + " " + (Number(price) * currency.rate).toLocaleString(currency.locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    );
  }, [currency]);

  const products = useMemo(() => {
    if (!currentProduct || !allProducts.length) return [];
    
    // Filter out current product
    let filtered = allProducts.filter(p => p.id !== currentProduct.id);

    // Prioritize same category
    const sameCategory = filtered.filter(p => p.category === currentProduct.category);
    const otherCategory = filtered.filter(p => p.category !== currentProduct.category);

    // Shuffle both
    const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());

    // Combine: Same category first, then others to fill 4 spots
    let combined = [...shuffle(sameCategory), ...shuffle(otherCategory)];

    return combined.slice(0, 4);
  }, [currentProduct, allProducts]);

  if (!products.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
      {products.map(prod => (
        <ProductItemCard
          key={prod.id}
          product={prod}
          convertPrice={convertPrice}
          language={language}
        />
      ))}
    </div>
  );
};

const ProductFlashCountdown = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState({ h: '00', m: '00', s: '00' });
  useEffect(() => {
    const i = setInterval(() => {
      const d = new Date(endDate).getTime() - new Date().getTime();
      if (d <= 0) { clearInterval(i); return; }
      setTimeLeft({
        h: String(Math.floor(d / 3600000)).padStart(2, '0'),
        m: String(Math.floor((d % 3600000) / 60000)).padStart(2, '0'),
        s: String(Math.floor((d % 60000) / 1000)).padStart(2, '0')
      });
    }, 1000);
    return () => clearInterval(i);
  }, [endDate]);
  return <div className="flex gap-1 text-[10px] font-bold text-red-600"><span className="bg-red-50 px-1 rounded">{timeLeft.h}</span>: <span className="bg-red-50 px-1 rounded">{timeLeft.m}</span>: <span className="bg-red-50 px-1 rounded">{timeLeft.s}</span></div>
};

export default ProductDetail;
