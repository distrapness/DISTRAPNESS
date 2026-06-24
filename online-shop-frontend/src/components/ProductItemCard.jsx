import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getImageUrl } from "../utils/imageHelper";

const ProductItemCard = React.memo(({ product, convertPrice, language }) => {
  const navigate = useNavigate();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Fallback image error handler
  const handleImageError = (e) => {
    if (e && e.target) {
      e.target.onerror = null;
      e.target.src = "https://placehold.co/600x800/e2e8f0/1e293b?text=" + encodeURIComponent(product.name);
    }
  };

  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);

  return (
    <div
      className="group cursor-pointer border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 md:p-5 bg-white dark:bg-gray-900/90 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative flex flex-col justify-between h-full hover-lux shadow-sm"
      onClick={() => navigate(`/shop/${product.id}`)}
    >
      <div>
        {/* Badge: Low Stock */}
        {product.stock > 0 && product.stock < 5 && (
          <div className="absolute top-4 left-4 z-10 bg-amber-500 text-white text-[9px] font-bold px-2.5 py-1 uppercase tracking-widest rounded-full shadow-sm animate-pulse">
            {language === 'EN' ? 'LOW STOCK' : 'STOK MENIPIS'}
          </div>
        )}

        {/* Badge: Out of Stock */}
        {product.stock <= 0 && (
          <div className="absolute top-4 left-4 z-10 bg-red-600 text-white text-[9px] font-bold px-2.5 py-1 uppercase tracking-widest rounded-full shadow-sm">
            OUT OF STOCK
          </div>
        )}

        {/* Image Container */}
        <div
          className="w-full aspect-square flex items-center justify-center overflow-hidden mb-4 relative rounded-xl bg-gray-50 dark:bg-gray-100 border border-gray-100/50 dark:border-gray-800/50 transition-all duration-300 group-hover:bg-gray-100/70 dark:group-hover:bg-gray-200/90"
          onMouseEnter={() => {
            if (images.length > 1) {
              setActiveImageIndex(1);
            }
          }}
          onMouseLeave={() => {
            if (images.length > 1) {
              setActiveImageIndex(0);
            }
          }}
        >
          <img
            src={getImageUrl(images[activeImageIndex], { width: 400 })}
            alt={product.name}
            loading="lazy"
            className={`object-contain w-[85%] h-[85%] transition-all duration-700 ease-out group-hover:scale-105 mix-blend-multiply ${product.stock <= 0 ? 'grayscale opacity-40' : ''}`}
            onError={handleImageError}
          />
        </div>

        {/* Text Details */}
        <div className="text-center w-full">
          <div className="text-xs md:text-sm font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-1.5 leading-snug line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
            {product.name}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 mt-3">
        {product.is_flash_sale && (!product.flash_sale_end || new Date(product.flash_sale_end) > new Date()) ? (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-red-600 dark:text-red-500 font-extrabold">{convertPrice(product.flash_sale_price)}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 line-through font-medium">{convertPrice(product.price)}</span>
            </div>
            <span className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-red-100 dark:border-red-900/30 uppercase tracking-wider scale-90">
              Sale -{Math.round((1 - product.flash_sale_price / product.price) * 100)}%
            </span>
          </div>
        ) : (
          <span className="text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200">
            {convertPrice(product.price)}
          </span>
        )}
      </div>
    </div>
  );
});

ProductItemCard.displayName = "ProductItemCard";
export default ProductItemCard;
