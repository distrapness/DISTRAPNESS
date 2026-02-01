import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCart } from "../components/CartContext";
import ProductImageGalleryModal from "../components/ProductImageGalleryModal.jsx";
import Footer from "../components/Footer.jsx";
import config from "../config";
import { getImageUrl } from "../utils/imageHelper";

const API_URL = `${config.API_URL}/api/products`;

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M'); // Default logic

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

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen text-black dark:text-white transition-colors duration-300">

      {/* Main Content: Split Layout */}
      <div className="pt-[120px] pb-24 max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-24 items-start">

          {/* Left: Images (Carousel on Mobile, Grid on Desktop) */}
          <div className="w-full md:w-3/5">
            {/* Desktop Grid */}
            <div className="hidden md:grid grid-cols-2 gap-4">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`w-full bg-gray-50 dark:bg-gray-800 cursor-pointer overflow-hidden ${idx === 0 ? 'col-span-2 aspect-[4/5]' : 'aspect-square'}`}
                  onClick={() => { setGalleryIndex(idx); setGalleryOpen(true); }}
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`${product.name} ${idx}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/800x1000/e2e8f0/1e293b?text=" + product.name; }}
                  />
                </div>
              ))}
            </div>

            {/* Mobile Carousel (Horizontal Scroll Snap) */}
            <div className="md:hidden -mx-4 px-4 flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative flex-shrink-0 w-[85vw] aspect-[3/4] snap-center bg-gray-50 dark:bg-gray-800 overflow-hidden rounded-lg shadow-sm"
                  onClick={() => { setGalleryIndex(idx); setGalleryOpen(true); }}
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
          </div>

          {/* Right: Details (Sticky on Desktop) */}
          <div className="w-full md:w-2/5 md:sticky md:top-32 self-start flex flex-col gap-8">

            {/* Header */}
            <div>
              <div className="bg-[#FF0000] text-white text-[10px] font-bold px-2 py-1 inline-block uppercase tracking-widest mb-4">Best Seller</div>
              <h1 className="text-4xl font-[900] uppercase tracking-tighter mb-2">{product.name}</h1>
              <div className="text-lg text-gray-500 font-light mb-4">Oversized Premium Cotton Shirt</div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold">Rp {product.price.toLocaleString('id-ID')}</span>
                <span className="text-gray-400 line-through text-sm">Rp {(product.price * 1.2).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
              {product.description || "Engineered for the modern urban landscape. This item features a boxy, oversized fit crafted from 100% heavyweight cotton. Reinforced seams and our signature Distrapness woven tag on the hem."}
              <br /><br />
              Breathable, durable, and effortlessly cool.
            </p>

            {/* Selectors */}
            <div>
              <div className="mb-4">
                <span className="text-sm font-bold uppercase tracking-widest block mb-2">Color: <span className="text-gray-500 font-normal ml-1">Carbon Black</span></span>
                <div className="flex gap-3">
                  <button className="w-8 h-8 rounded-full bg-black border-2 border-white ring-1 ring-black"></button>
                  <button className="w-8 h-8 rounded-full bg-white border border-gray-300"></button>
                  <button className="w-8 h-8 rounded-full bg-slate-700"></button>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold uppercase tracking-widest">Size</span>
                  <button className="text-xs underline text-gray-500 hover:text-black dark:hover:text-white">Size Guide</button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['S', 'M', 'L', 'XL'].map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`border py-3 text-sm font-bold transition-all ${selectedSize === size ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black' : 'border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Add to Cart Desktop */}
            <button
              onClick={() => addToCart(product, qty)}
              className="hidden md:block w-full bg-black dark:bg-white text-white dark:text-black py-4 font-bold uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Add to Bag — Rp {product.price.toLocaleString('id-ID')}
            </button>

            {/* Mobile Sticky Add to Bag Bar */}
            <div className="md:hidden fixed bottom-[60px] left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 z-40 pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <div className="flex gap-4 items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total</span>
                  <span className="text-lg font-[900] text-[#FF0000]">Rp {product.price.toLocaleString('id-ID')}</span>
                </div>
                <button
                  onClick={() => addToCart(product, qty)}
                  className="flex-1 bg-[#FF0000] text-white py-3 rounded font-bold uppercase tracking-widest text-sm shadow-md active:scale-95 transition-transform"
                >
                  Add to Bag
                </button>
              </div>
            </div>

            {/* Accordions */}
            <div className="border-t border-gray-200 dark:border-gray-700 mt-4">

              {/* Material & Care */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setOpenMaterial(!openMaterial)}
                  className="w-full py-4 flex justify-between items-center font-bold text-sm uppercase tracking-wide"
                >
                  Material & Care
                  <span>{openMaterial ? '−' : '+'}</span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openMaterial ? 'max-h-40 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
                    <li>100% Heavyweight Cotton (280gsm)</li>
                    <li>Machine wash cold with like colors</li>
                    <li>Do not tumble dry</li>
                    <li>Iron low heat inside out</li>
                  </ul>
                </div>
              </div>

              {/* Shipping & Returns */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setOpenShipping(!openShipping)}
                  className="w-full py-4 flex justify-between items-center font-bold text-sm uppercase tracking-wide"
                >
                  Shipping & Returns
                  <span>{openShipping ? '−' : '+'}</span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openShipping ? 'max-h-40 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-xs text-gray-500">
                    Free shipping on orders over Rp 500.000. Returns accepted within 14 days of delivery.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Style With (Related Products) */}
        <div className="mt-32">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-[900] uppercase tracking-tighter">Style With</h2>
            <Link to="/shop" className="text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-black dark:hover:text-white transition-colors">View Collection →</Link>
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
        <Link to={`/shop/${prod.id}`} key={prod.id} className="group">
          <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 overflow-hidden mb-4 rounded-sm">
            <img
              src={getImageUrl(prod.image || (prod.images && prod.images[0]))}
              alt={prod.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
              onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x800/e2e8f0/1e293b?text=" + prod.name; }}
            />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide">{prod.name}</h3>
              <p className="text-xs text-gray-500 mt-1">Technical Shorts</p>
            </div>
            <span className="text-sm font-bold">Rp {prod.price.toLocaleString('id-ID')}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default ProductDetail;
