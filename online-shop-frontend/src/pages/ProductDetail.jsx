import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCart } from "../components/CartContext";
import BackButton from "../components/BackButton.jsx";
import ProductImageGalleryModal from "../components/ProductImageGalleryModal.jsx";
import Footer from "../components/Footer.jsx";

import config from "../config";
import { getImageUrl } from "../utils/imageHelper";

const API_URL = `${config.API_URL}/api/products`;

const FloatingAddToCart = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-6 right-6 z-40 bg-black text-white px-6 py-3 rounded-full shadow-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black transition text-lg font-bold"
    tabIndex={0}
    aria-label="Tambah ke Keranjang"
  >
    + Keranjang
  </button>
);

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const [showFab, setShowFab] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setLoading(true);
    // Tambahkan timestamp agar fetch selalu ambil data terbaru
    fetch(`${API_URL}/${id}?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Produk tidak ditemukan");
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    // Tampilkan FAB jika scroll melewati 350px (hanya di mobile)
    const handleScroll = () => {
      setShowFab(window.scrollY > 350 && window.innerWidth < 768);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleImageClick = (idx = 0) => {
    setGalleryIndex(idx);
    setGalleryOpen(true);
  };

  if (loading) return <div className="text-center py-10">Memuat...</div>;
  if (error) return <div className="text-center text-red-500 py-10">{error}</div>;
  if (!product) return null;

  return (
    <>
      <div className="min-h-screen bg-[#fff] dark:bg-gray-900 pt-20 md:pt-24 px-0 md:px-4 transition-colors duration-[900ms] ease-in-out">
        <div className="max-w-6xl mx-auto py-12">
          <div className="flex flex-col md:flex-row gap-12 md:gap-24 items-start">
            {/* Gambar utama dan thumbnail */}
            <div className="flex flex-col md:flex-row gap-6 w-full md:w-7/12">
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-[#fff] dark:bg-gray-900 border-none w-full aspect-square max-w-[500px] mx-auto mb-4 cursor-pointer overflow-hidden" onClick={() => handleImageClick(galleryIndex)}>
                  <img
                    src={Array.isArray(product.images) && product.images.length > 0 ? getImageUrl(product.images[galleryIndex]) : getImageUrl(product.image)}
                    alt={product.name}
                    className="object-contain w-full h-full max-h-[420px] transition-transform duration-300 hover:scale-105 bg-transparent"
                  />
                </div>
              </div>
              {/* Thumbnail kanan */}
              {Array.isArray(product.images) && product.images.length > 1 && (
                <div className="flex md:flex-col gap-2 md:gap-3 md:justify-start md:items-center mt-2 md:mt-0">
                  {product.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={getImageUrl(img)}
                      alt="thumb"
                      className={`w-16 h-16 object-cover rounded border cursor-pointer transition-all duration-200 ${galleryIndex === idx ? 'ring-2 ring-black scale-105' : 'opacity-80 hover:opacity-100'}`}
                      onClick={() => setGalleryIndex(idx)}
                    />
                  ))}
                </div>
              )}
              {/* Modal Gallery */}
              {galleryOpen && Array.isArray(product.images) && product.images.length > 0 && (
                <ProductImageGalleryModal
                  images={product.images}
                  open={galleryOpen}
                  initialIndex={galleryIndex}
                  onClose={() => setGalleryOpen(false)}
                />
              )}
            </div>
            {/* Detail produk */}
            <div className="flex-1 w-full md:w-5/12">
              <h1 className="text-2xl md:text-3xl font-extrabold mb-1 text-gray-900 dark:text-gray-100 uppercase tracking-wide">{product.name}</h1>
              <div className="text-base text-gray-500 dark:text-gray-300 mb-2 tracking-wider">{product.brand || '-'}</div>
              <div className="text-xl md:text-2xl font-bold text-black dark:text-blue-300 mb-4">Rp {product.price.toLocaleString('id-ID')}</div>
              <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-3">
                <div className="text-xs font-bold text-gray-700 dark:text-gray-100 tracking-widest mb-2">PRODUCT DESCRIPTION</div>
                <div className="text-sm text-gray-700 dark:text-gray-200">{product.description}</div>
              </div>
              <div className="flex flex-row gap-2 items-center mb-6">
                <button
                  type="button"
                  className="px-3 py-1 rounded border font-bold text-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  aria-label="Kurangi jumlah"
                >-</button>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 text-center border rounded font-bold text-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  style={{ MozAppearance: 'textfield' }}
                />
                <button
                  type="button"
                  className="px-3 py-1 rounded border font-bold text-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => setQty(q => q + 1)}
                  aria-label="Tambah jumlah"
                >+</button>
                <button
                  onClick={() => addToCart(product, qty)}
                  className="ml-4 flex-1 bg-black text-white px-6 py-2 rounded font-bold hover:bg-gray-800 transition-colors duration-200 text-base md:text-lg"
                  tabIndex={0}
                >ADD TO CART</button>
              </div>
              <div className="flex gap-6 mt-2">
                {product.stock > 0 ? (
                  <span className="text-xs text-green-600 dark:text-green-400">In stock</span>
                ) : (
                  <span className="text-xs text-red-500 dark:text-red-400">Out of stock</span>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Rekomendasi Produk */}
        <div className="max-w-6xl mx-auto mt-24 pb-20">
          <h2 className="text-lg md:text-2xl font-bold mb-8 text-gray-900 dark:text-gray-100 tracking-wide uppercase">Related Products</h2>
          <RelatedProducts
            excludeId={product.id}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 w-full max-w-6xl mx-auto"
          />
        </div>
      </div>
      <Footer />
    </>
  );
};

function RelatedProducts({ excludeId, className }) {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [activeImageIndex, setActiveImageIndex] = React.useState({});

  React.useEffect(() => {
    fetch(`${config.API_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        setProducts(data.filter(p => p.id !== excludeId).slice(0, 4));
        setLoading(false);
      });
  }, [excludeId]);

  if (loading) return <div className="py-8 text-center text-gray-400">Memuat rekomendasi...</div>;
  if (!products.length) return <div className="py-8 text-center text-gray-400">Tidak ada produk lain.</div>;

  return (
    <div className={className}>
      {products.map(prod => (
        <Link
          to={`/shop/${prod.id}`}
          key={prod.id}
          className="flex flex-col items-center group cursor-pointer"
          style={{ textDecoration: "none" }}
        >
          <div
            className="w-full aspect-[3/4] bg-transparent dark:bg-transparent flex items-center justify-center overflow-hidden"
            style={{ minHeight: '256px', maxHeight: '256px', position: 'relative' }}
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
            <img
              src={Array.isArray(prod.images) && prod.images.length > 0 ? getImageUrl(prod.images[activeImageIndex[prod.id] || 0]) : getImageUrl(prod.image)}
              alt={prod.name}
              className={`object-contain w-full h-full max-h-64 transition-all duration-500 ease-in-out bg-transparent ${activeImageIndex[prod.id] === 1 ? 'opacity-100 scale-105' : 'opacity-100 scale-100'}`}
              style={{ position: 'absolute', top: 0, left: 0, transition: 'opacity 0.5s, transform 0.5s', zIndex: 1, cursor: Array.isArray(prod.images) && prod.images.length > 1 ? 'pointer' : 'default' }}
            />
          </div>
          <div className="mt-4 text-center w-full">
            <div className="font-medium text-base md:text-lg text-gray-900 mb-1 dark:text-gray-100 truncate" style={{ marginTop: 0, marginBottom: 0, lineHeight: 1, padding: 0 }}>{prod.name}</div>
            <div className="font-bold text-black text-base md:text-lg dark:text-blue-300" style={{ marginTop: 0, marginBottom: 0, lineHeight: 1, padding: 0 }}>Rp {prod.price.toLocaleString('id-ID')}</div>
            {prod.stock === 0 && <span className="inline-block px-2 py-1 bg-black text-white text-xs rounded mt-1">OUT OF STOCK</span>}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default ProductDetail;
