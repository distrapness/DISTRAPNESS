import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "../components/CartContext";
import ProductImageGalleryModal from "../components/ProductImageGalleryModal.jsx";
import Footer from "../components/Footer.jsx";
import config from "../config";
import { getImageUrl } from "../utils/imageHelper";
import { useCurrency } from "../components/CurrencyContext.jsx";

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

  // Accordion state
  const [openMaterial, setOpenMaterial] = useState(false);
  const [openShipping, setOpenShipping] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/${id}?t=${Date.now()}`)
      .then((res) => res.json())
      .then(setProduct)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !product) return <div className="min-h-screen bg-white"></div>;

  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image];

  const handleBuyNow = () => {
    addToCart(product, qty);
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
      <div className="pt-[100px] md:pt-[120px] pb-24 max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-16 items-start">

          {/* Left: Images (Vertical Thumbnails + Main Image) */}
          <div className="w-full md:w-[60%] flex gap-4">

            {/* Thumbnails (Desktop Only) */}
            <div className="hidden md:flex flex-col gap-4 w-[80px]">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`aspect-[3/4] cursor-pointer border transition-all ${selectedImageIndex === idx ? 'border-black dark:border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  onClick={() => setSelectedImageIndex(idx)}
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`Thumbnail ${idx}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x133/e2e8f0/1e293b?text=" + idx; }}
                  />
                </div>
              ))}
            </div>

            {/* Main Image */}
            <div className="flex-1" onClick={() => { setGalleryIndex(selectedImageIndex); setGalleryOpen(true); }}>
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

              {/* Desktop Main Image */}
              <div className="hidden md:block w-full aspect-[3/4] bg-gray-50 dark:bg-gray-800 cursor-zoom-in relative">
                <img
                  src={getImageUrl(images[selectedImageIndex])}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/800x1000/e2e8f0/1e293b?text=" + product.name; }}
                />
              </div>
            </div>

          </div>

          {/* Right: Details (Sticky on Desktop) */}
          <div className="w-full md:w-[40%] md:sticky md:top-32 self-start flex flex-col gap-6">

            {/* Header */}
            <div>
              {product.description && product.description.includes('Best Seller') && (
                <div className="bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold px-2 py-1 inline-block uppercase tracking-widest mb-4">{t('productDetail.bestSeller')}</div>
              )}
              <div className="flex gap-2 mb-2">
                <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded-sm">Ada Stok</span>
                <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded-sm">Bags</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-[500] tracking-tight mb-2 font-sans">{product.name}</h1>
              <div className="text-xl font-medium mb-6">
                {convertPrice(product.price)}
              </div>
            </div>

            {/* Action Buttons (Stacked) */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => addToCart(product, qty)}
                className="w-full bg-black dark:bg-white text-white dark:text-black py-4 font-bold uppercase tracking-widest text-xs hover:opacity-80 transition-opacity"
              >
                {t('productDetail.addToCart')}
              </button>
              <button
                onClick={handleBuyNow}
                className="w-full border border-black dark:border-white text-black dark:text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              >
                {t('productDetail.buyNow')}
              </button>
            </div>

            {/* Description */}
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-light mt-4">
              <p>{product.description}</p>
              <br />
              <p>Material: Raw Denim 13,5 Oz</p>
            </div>

            {/* Selectors */}
            <div className="mt-4">
              {/* Specs */}
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2 mb-6">
                <p><span className="font-bold">{t('productDetail.size')}:</span></p>
                <p>Length: 22 cm</p>
                <p>Width: 13 cm</p>
                <p>Height: 15 cm</p>
                <p>Strap Length: 30 cm</p>
              </div>

              <div className="mb-6">
                <p className="text-xs text-gray-500 mb-2">Note:</p>
                <p className="text-xs text-gray-500">- Warna Denim Mini Hand Bag ini mungkin akan luntur harap digunakan dengan hati-hati</p>
              </div>
            </div>

            {/* Mobile Sticky Add to Bag Bar - KEEP EXISTING LOGIC BUT UPDATE TEXT */}
            <div className="md:hidden fixed bottom-[60px] left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 z-40 pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <div className="flex gap-4 items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{t('productDetail.total')}</span>
                  <span className="text-lg font-[900] text-[#FF0000]">{convertPrice(product.price)}</span>
                </div>
                <button
                  onClick={() => addToCart(product, qty)}
                  className="flex-1 bg-black text-white py-3 rounded font-bold uppercase tracking-widest text-sm shadow-md active:scale-95 transition-transform"
                >
                  {t('productDetail.addToCart')}
                </button>
              </div>
            </div>

            {/* Accordions (Cleaned up) */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-4">
              <h4 className="font-bold text-sm mb-4">{t('productDetail.shippingReturns')}</h4>
              <div className="text-xs text-gray-500">
                <p className="flex justify-between items-center">
                  <span>Dikirim ke:</span>
                  <span className="font-bold">Pilih Area ⌄</span>
                </p>
                <p className="mt-2 text-right">Berat: 400g</p>
              </div>
            </div>

          </div>
        </div>

        {/* Style With (Related Products) */}
        <div className="mt-24 border-t border-gray-100 dark:border-gray-800 pt-16">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-[900] uppercase tracking-tighter">{t('productDetail.styleWith')}</h2>
            <Link to="/shop" className="text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-black dark:hover:text-white transition-colors">{t('productDetail.viewCollection')} →</Link>
          </div>
          <RelatedProducts excludeId={product.id} />
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

      <Footer />
    </div>
  );
};

{/* Style With (Related Products) */ }
<div className="mt-32">
  <div className="flex justify-between items-end mb-8">
    <h2 className="text-2xl font-[900] uppercase tracking-tighter">Style With</h2>
    <Link to="/shop" className="text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-black dark:hover:text-white transition-colors">View Collection →</Link>
  </div>
  <RelatedProducts excludeId={product.id} />
</div>

      </div >

  {/* Modal Gallery */ }
{
  galleryOpen && (
    <ProductImageGalleryModal
      images={images}
      open={galleryOpen}
      initialIndex={galleryIndex}
      onClose={() => setGalleryOpen(false)}
    />
  )
}

<Footer />
    </div >
  );
};

function RelatedProducts({ excludeId }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(`${config.API_URL}/api/products`)
      .then(res => res.json())
      .then(data => setProducts(data.filter(p => p.id !== excludeId).slice(0, 4)));
  }, [excludeId]);

  if (!products.length) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {products.map(prod => (
        <Link
          to={`/shop/${prod.id}`}
          key={prod.id}
          className="group cursor-pointer border border-gray-200 dark:border-gray-800 rounded-lg p-4 md:p-6 bg-white dark:bg-gray-900 hover:shadow-md transition-all relative flex flex-col items-center"
        >
          {/* Badge low stock if applicable (logic optional but good for consistency) */}
          {prod.stock > 0 && prod.stock < 5 && (
            <div className="absolute top-4 left-4 z-10 bg-gray-500 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-sm">
              Low Stock
            </div>
          )}

          <div
            className="w-full aspect-square flex items-center justify-center overflow-hidden mb-6 relative"
          >
            <img
              src={getImageUrl(prod.image || (prod.images && prod.images[0]))}
              alt={prod.name}
              className="object-contain w-full h-full transition-transform duration-500 ease-in-out group-hover:scale-105"
              onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x800/e2e8f0/1e293b?text=" + prod.name; }}
            />
          </div>

          <div className="text-center w-full mt-auto">
            <div className="text-sm md:text-base text-gray-900 dark:text-gray-100 mb-2 leading-tight font-medium uppercase tracking-wider">
              {prod.name}
            </div>
            <div className="text-sm md:text-base text-gray-500 dark:text-gray-400">
              Rp {prod.price.toLocaleString('id-ID')}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default ProductDetail;
