import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCart } from "../components/CartContext";
import BackButton from "../components/BackButton.jsx";
import ProductImageGalleryModal from "../components/ProductImageGalleryModal.jsx";
import Footer from "../components/Footer.jsx";

const API_URL = "http://localhost:5001/api/products";

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
    fetch(`${API_URL}/${id}`)
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
                    src={Array.isArray(product.images) && product.images.length > 0 ? product.images[galleryIndex] : (product.image || "/assets/placeholder.jpg")}
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
                      src={img}
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
              <div className="text-base text-gray-500 dark:text-gray-300 mb-2 tracking-wider">{product.category || product.brand || '-'}</div>
              <div className="text-xl md:text-2xl font-bold text-black dark:text-blue-300 mb-4">Rp {product.price.toLocaleString('id-ID')}</div>
              <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-3">
                <div className="text-xs font-bold text-gray-700 dark:text-gray-100 tracking-widest mb-2">PRODUCT DESCRIPTION</div>
                <div className="text-sm text-gray-700 dark:text-gray-200">{product.description}</div>
              </div>
              <table className="w-full text-xs mb-6">
                <tbody>
                  <tr><td className="py-1 pr-3 font-semibold text-gray-500 dark:text-gray-300">SKU</td><td className="py-1 text-gray-800 dark:text-gray-100">{product.sku || '-'}</td></tr>
                  <tr><td className="py-1 pr-3 font-semibold text-gray-500 dark:text-gray-300">Stok</td><td className="py-1 text-gray-800 dark:text-gray-100">{product.stock || '-'}</td></tr>
                  <tr><td className="py-1 pr-3 font-semibold text-gray-500 dark:text-gray-300">Berat</td><td className="py-1 text-gray-800 dark:text-gray-100">{product.weight ? product.weight + ' gr' : '-'}</td></tr>
                  <tr><td className="py-1 pr-3 font-semibold text-gray-500 dark:text-gray-300">Dimensi</td><td className="py-1 text-gray-800 dark:text-gray-100">{product.dimensions || '-'}</td></tr>
                </tbody>
              </table>
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
                  onChange={e => setQty(Math.max(1, parseInt(e.target.value)||1))}
                  className="w-14 text-center border rounded font-bold text-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  style={{MozAppearance:'textfield'}}
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
              <div className="flex gap-6 mb-2">
                <button className="text-xs text-gray-500 hover:text-black dark:hover:text-white font-semibold tracking-widest uppercase">ADD TO WISHLIST</button>
                <button className="text-xs text-gray-500 hover:text-black dark:hover:text-white font-semibold tracking-widest uppercase">SHARE</button>
              </div>
              <div className="flex gap-6 mt-2">
                <span className="text-xs text-gray-400">In stock</span>
              </div>
            </div>
          </div>
        </div>
        {/* Rekomendasi Produk */}
        <div className="max-w-6xl mx-auto mt-24 pb-20">
          <h2 className="text-lg md:text-2xl font-bold mb-8 text-gray-900 dark:text-gray-100 tracking-wide uppercase">Related Products</h2>
          <RelatedProducts
            excludeId={product.id}
            currentCategory={product.category}
            className="grid grid-cols-2 md:grid-cols-4 gap-12"
          />
        </div>
      </div>
      <Footer />
    </>
  );
};

function RelatedProducts({ excludeId, currentCategory, className }) {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    fetch("http://localhost:5001/api/products")
      .then(res => res.json())
      .then(data => {
        setProducts(data.filter(p => p.id !== excludeId && p.category === currentCategory));
        setLoading(false);
      });
  }, [excludeId, currentCategory]);
  if (loading) return <div className="py-8 text-center text-gray-400">Memuat rekomendasi...</div>;
  if (!products.length) return <div className="py-8 text-center text-gray-400">Tidak ada produk lain.</div>;
  return (
    <div className={className}>
      {products.slice(0, 4).map(prod => (
        <Link
          to={`/shop/${prod.id}`}
          key={prod.id}
          className="block bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg border border-gray-200 dark:border-gray-700 p-4 transition-all duration-300 hover:-translate-y-1"
        >
          <img
            src={Array.isArray(prod.images) && prod.images.length > 0 ? prod.images[0] : (prod.image || "/assets/placeholder.jpg")}
            alt={prod.name}
            className="w-full h-32 object-contain mb-2 rounded bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-800"
          />
          <div className="font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">{prod.name}</div>
          <div className="text-blue-700 dark:text-blue-300 font-bold text-sm">Rp {prod.price.toLocaleString('id-ID')}</div>
        </Link>
      ))}
    </div>
  );
}

export default ProductDetail;
