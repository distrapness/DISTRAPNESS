import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "../components/CartContext";
import ProductImageGalleryModal from "../components/ProductImageGalleryModal.jsx";
import Footer from "../components/Footer.jsx";
import config from "../config";
import { getImageUrl } from "../utils/imageHelper";
import { useCurrency } from "../components/CurrencyContext.jsx";
import { useWishlist } from "../components/WishlistContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

const API_URL = `${config.API_URL}/api/products`;


const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
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
  const inWishlist = product ? isInWishlist(product.id) : false;

  // Accordion state
  const [openMaterial, setOpenMaterial] = useState(false);
  const [openShipping, setOpenShipping] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  // Reviews state
  const { isLoggedIn, userEmail } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/${id}?t=${Date.now()}`)
      .then((res) => res.json())
      .then(data => {
        setProduct(data);
        // Auto-select first available size
        if (data.sizes) {
          const firstAvailable = ['S', 'M', 'L', 'XL'].find(s => data.sizes[s] > 0);
          if (firstAvailable) setSelectedSize(firstAvailable);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    fetchReviews();
  }, [id]);

  const fetchReviews = () => {
    fetch(`${API_URL}/${id}/reviews`)
      .then(res => res.json())
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  const submitReview = (e) => {
    e.preventDefault();
    if (!isLoggedIn) return alert("Anda harus login untuk mengulas.");
    if (ratingInput < 1 || ratingInput > 5) return alert("Rating harus 1 hingga 5.");
    
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
        fetchReviews();
        alert("Terima kasih atas ulasannya!");
      }
    })
    .catch(console.error)
    .finally(() => setSubmittingReview(false));
  };


  if (loading || !product) return <div className="min-h-screen bg-white"></div>;

  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image];

  const handleBuyNow = () => {
    addToCart({ ...product, selectedSize }, qty);
    navigate('/cart');
  };

  const convertPrice = (price) => {
    if (currency.code === "IDR") return currency.symbol + " " + price.toLocaleString(currency.locale);
    return (
      currency.symbol + " " + (price * currency.rate).toLocaleString(currency.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen text-black dark:text-white transition-colors duration-300">

      {/* Main Content: Split Layout */}
      <div className="pt-[80px] md:pt-[90px] pb-24 max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start justify-center">

          {/* Left: Images (Main Image + Horizontal Thumbnails) */}
          <div className="w-full md:w-[55%] flex md:justify-end">
            <div className="flex flex-col gap-6 w-full">

              {/* Main Image */}
              <div className="w-full" onClick={() => { setGalleryIndex(selectedImageIndex); setGalleryOpen(true); }}>
                {/* Mobile Carousel (Horizontal Scroll Snap) - Visible only on mobile */}
                <div className="md:hidden -mx-4 px-4 flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative flex-shrink-0 w-[85vw] aspect-[3/4] snap-center bg-gray-50 dark:bg-gray-800 overflow-hidden rounded-lg shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent parent click
                        setGalleryIndex(idx);
                        setGalleryOpen(true);
                      }}
                    >
                      <img
                        src={getImageUrl(img)}
                        alt={`${product.name} ${idx}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x800/e2e8f0/1e293b?text=" + product.name; }}
                      />
                      <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm font-bold">
                        {idx + 1}/{images.length}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Main Image - Constrained Height, NO CROP */}
                <div className="hidden md:flex w-full h-[450px] lg:h-[500px] bg-[#f9f9f9] dark:bg-gray-800 cursor-zoom-in relative items-center justify-center overflow-hidden rounded-md border border-gray-100 dark:border-gray-700">
                  <img
                    src={getImageUrl(images[selectedImageIndex])}
                    alt={product.name}
                    className="h-full w-full object-contain p-4"
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
                      className="w-full h-full object-contain p-1 rounded-sm bg-gray-50 dark:bg-gray-800"
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x133/e2e8f0/1e293b?text=" + idx; }}
                    />
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Right: Details (Sticky on Desktop) */}
          <div className="w-full md:w-[45%] flex md:justify-start md:sticky md:top-32 self-start">
            <div className="w-full md:max-w-[450px] flex flex-col pt-4">

              {/* Header Section (Name & Price) */}
              <div className="mb-6 text-right">
                <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider mb-2 font-sans">{product.name}</h1>
                <div className="flex justify-end gap-2 items-center mb-2">
                  {reviews.length > 0 ? (
                    <>
                      <span className="text-yellow-400">{'★'.repeat(Math.round(reviews.reduce((a, b) => a + b.rating, 0) / reviews.length)) + '☆'.repeat(5 - Math.round(reviews.reduce((a, b) => a + b.rating, 0) / reviews.length))}</span>
                      <span className="text-sm text-gray-500">({reviews.length} ulasan)</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500 italic">Belum ada ulasan</span>
                  )}
                </div>
                <div className="text-lg md:text-xl font-medium text-gray-900 dark:text-gray-100">
                  {convertPrice(product.price)}
                </div>
              </div>

              <div className="w-full h-px bg-gray-300 dark:bg-gray-700 mb-6"></div>

              {/* Description Section */}
              <div className="mb-6">
                <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-right">Product Description</h3>
                <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-light text-right">
                  <p>{product.description}</p>
                  <p className="mt-4 text-xs text-gray-400">
                    {product.category} collection. Designed for modern lifestyle.
                    Double needle sleeve and bottom hem.
                  </p>
                </div>
              </div>

              <div className="w-full h-px bg-gray-300 dark:bg-gray-700 mb-8"></div>

              {/* Selectors Section */}
              <div className="flex flex-col items-end gap-6 mb-8">

                {/* Size Selector (Buttons) */}
                <div className="w-full max-w-[300px] flex flex-col items-end">
                  <div className="flex justify-between w-full mb-2">
                    <button onClick={() => setSizeGuideOpen(true)} className="text-xs text-gray-500 underline hover:text-black dark:hover:text-white">Size Guide</button>
                    <label className="text-sm font-bold uppercase tracking-wider">Size</label>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {['S', 'M', 'L', 'XL'].map((size) => {
                      const stock = product.sizes?.[size] || 0;
                      const isSelected = selectedSize === size;
                      return (
                        <button
                          key={size}
                          onClick={() => stock > 0 && setSelectedSize(size)}
                          disabled={stock <= 0}
                          className={`min-w-[40px] px-3 py-2 border text-sm font-bold transition-all relative
                             ${isSelected ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'bg-transparent text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-black dark:hover:border-white'}
                             ${stock <= 0 ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-800 diagonal-strike' : ''}
                           `}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                  {product.sizes?.[selectedSize] <= 0 && <div className="text-red-500 text-xs mt-1 font-bold">Sold Out</div>}
                  {product.sizes?.[selectedSize] > 0 && product.sizes?.[selectedSize] < 5 && <div className="text-orange-500 text-xs mt-1 font-bold">Only {product.sizes[selectedSize]} left!</div>}
                </div>

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

              {/* Add to Cart Button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => addToCart({ ...product, selectedSize }, qty)}
                  className="w-full max-w-[200px] bg-[#808080] hover:bg-[#666666] text-white py-4 font-bold uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Add to Cart
                </button>
              </div>

              {/* Wishlist & Share */}
              <div className="flex justify-end gap-6 text-xs font-bold uppercase tracking-widest text-gray-500">
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`${inWishlist ? 'text-red-500 hover:text-red-600' : 'hover:text-black dark:hover:text-white'} transition-colors flex items-center gap-1`}
                >
                  {inWishlist ? 'In Wishlist ❤️ (Remove)' : 'Add to Wishlist'}
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied to clipboard!");
                  }}
                  className="hover:text-black dark:hover:text-white transition-colors"
                >
                  Share
                </button>
              </div>

              {/* Reviews Section */}
              <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-700 w-full text-right">
                <h3 className="font-bold text-sm uppercase tracking-wider mb-6">Ulasan & Rating Produk</h3>
                
                {reviews.length > 0 ? (
                  <div className="flex flex-col gap-4 mb-8">
                    {reviews.map(rev => (
                      <div key={rev.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded text-right flex flex-col items-end">
                        <div className="flex gap-1 text-yellow-400 text-sm mb-1">
                          {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{rev.user_email.split('@')[0]} - {new Date(rev.created_at).toLocaleDateString('id-ID')}</p>
                        <p className="text-sm font-light text-gray-800 dark:text-gray-200">{rev.comment || "Tidak ada komentar"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic mb-8">Jadilah yang pertama mengulas produk ini.</p>
                )}

                {/* Review Form */}
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded text-right">
                  <h4 className="font-bold text-xs uppercase mb-4">Tinggalkan Ulasan</h4>
                  {isLoggedIn ? (
                    <form onSubmit={submitReview} className="flex flex-col items-end gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-bold">Rating:</label>
                        <select 
                          value={ratingInput} 
                          onChange={(e) => setRatingInput(Number(e.target.value))}
                          className="border p-2 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 rounded text-black dark:text-white"
                        >
                          <option value="5">5 - Sempurna</option>
                          <option value="4">4 - Sangat Bagus</option>
                          <option value="3">3 - Cukup</option>
                          <option value="2">2 - Kurang</option>
                          <option value="1">1 - Sangat Kurang</option>
                        </select>
                      </div>
                      <textarea
                        className="w-full text-right p-3 border dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 focus:outline-none dark:text-white resize-none"
                        placeholder="Apa pendapat Anda tentang produk ini?"
                        rows="3"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                      ></textarea>
                      <button 
                        type="submit" 
                        disabled={submittingReview}
                        className="bg-black text-white dark:bg-white dark:text-black font-bold uppercase text-xs tracking-widest px-6 py-2 transition hover:opacity-80 disabled:opacity-50"
                      >
                        {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
                      </button>
                    </form>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Silakan <Link to="/login" className="text-black dark:text-white underline font-bold">Login</Link> terlebih dahulu untuk memberikan ulasan.
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>



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

      {/* Size Guide Modal */}
      {sizeGuideOpen && <SizeGuideModal onClose={() => setSizeGuideOpen(false)} />}

      <Footer />
    </div>
  );
};

const SizeGuideModal = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
    <div className="bg-white dark:bg-gray-800 p-8 max-w-lg w-full relative z-10 shadow-2xl rounded-sm">
      <button onClick={onClose} className="absolute top-4 right-4 text-2xl font-bold">&times;</button>
      <h3 className="text-xl font-bold uppercase tracking-widest mb-6 border-b pb-4">Size Guide</h3>
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b dark:border-gray-700">
            <th className="py-2">Size</th>
            <th className="py-2">Chest (cm)</th>
            <th className="py-2">Length (cm)</th>
            <th className="py-2">Sleeve (cm)</th>
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-gray-700">
          <tr><td className="py-3 font-bold">S</td><td>92</td><td>68</td><td>20</td></tr>
          <tr><td className="py-3 font-bold">M</td><td>98</td><td>70</td><td>21</td></tr>
          <tr><td className="py-3 font-bold">L</td><td>104</td><td>72</td><td>22</td></tr>
          <tr><td className="py-3 font-bold">XL</td><td>110</td><td>74</td><td>23</td></tr>
        </tbody>
      </table>
      <div className="mt-6 text-xs text-gray-500">
        * Measurements are in centimeters. Fit may vary by style.
      </div>
    </div>
  </div>
);


const RelatedProducts = ({ currentProduct }) => {
  const [products, setProducts] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState({});

  useEffect(() => {
    if (!currentProduct) return;

    fetch(`${config.API_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        // Filter out current product
        let filtered = data.filter(p => p.id !== currentProduct.id);

        // Prioritize same category
        const sameCategory = filtered.filter(p => p.category === currentProduct.category);
        const otherCategory = filtered.filter(p => p.category !== currentProduct.category);

        // Shuffle both
        const shuffle = (arr) => arr.sort(() => 0.5 - Math.random());

        // Combine: Same category first, then others to fill 4 spots
        let combined = [...shuffle(sameCategory), ...shuffle(otherCategory)];

        setProducts(combined.slice(0, 4));
      });
  }, [currentProduct]);

  if (!products.length) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
      {products.map(prod => (
        <Link
          to={`/shop/${prod.id}`}
          key={prod.id}
          className="group cursor-pointer flex flex-col items-start"
        >
          <div 
            className="w-full aspect-[3/4] overflow-hidden mb-4 bg-gray-50 dark:bg-gray-800 rounded-sm relative"
            onMouseEnter={() => {
              if (Array.isArray(prod.images) && prod.images.length > 1) {
                setActiveImageIndex(prev => ({ ...prev, [prod.id]: 1 }));
              }
            }}
            onMouseLeave={() => {
              if (Array.isArray(prod.images) && prod.images.length > 1) {
                setActiveImageIndex(prev => ({ ...prev, [prod.id]: 0 }));
              }
            }}
          >
            {/* Badge */}
            {prod.stock > 0 && prod.stock < 5 && (
              <div className="absolute top-2 left-2 z-10 bg-black text-white text-[9px] font-bold px-2 py-1 uppercase tracking-wider">
                Limited
              </div>
            )}
            <img
              src={Array.isArray(prod.images) && prod.images.length > 0 ? getImageUrl(prod.images[activeImageIndex[prod.id] || 0]) : getImageUrl(prod.image)}
              alt={prod.name}
              className="object-contain w-full h-full p-2 transition-transform duration-700 ease-out group-hover:scale-105"
              onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x800/e2e8f0/1e293b?text=" + prod.name; }}
            />
          </div>

          <div className="w-full flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white mb-1 group-hover:text-gray-600 transition-colors line-clamp-1">
                {prod.name}
              </h3>
              <p className="text-xs text-gray-500 capitalize">{prod.category || 'Collection'}</p>
            </div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              Rp {prod.price.toLocaleString('id-ID')}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ProductDetail;
