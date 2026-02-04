import React, { useState, useEffect } from "react";
import { getImageUrl } from "../utils/imageHelper";

const ProductImageGalleryModal = ({ images = [], open, onClose, initialIndex = 0 }) => {
  const [index, setIndex] = useState(initialIndex);

  // Sync internal state if initialIndex changes when opening
  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex, open]);

  if (!open || images.length === 0) return null;

  const handlePrev = (e) => {
    e.stopPropagation();
    setIndex(i => (i === 0 ? images.length - 1 : i - 1));
  };
  const handleNext = (e) => {
    e.stopPropagation();
    setIndex(i => (i === images.length - 1 ? 0 : i + 1));
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm transition-opacity duration-300"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-2"
        onClick={onClose}
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      {/* Main Image Container */}
      <div className="relative w-full h-full max-w-7xl max-h-[85vh] flex items-center justify-center p-4">

        {/* Prev Button */}
        <button
          onClick={handlePrev}
          className="hidden md:flex absolute left-4 bg-black/50 hover:bg-black/80 text-white rounded-full p-3 transition-colors z-20"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>

        <img
          src={getImageUrl(images[index])}
          alt={`Gallery ${index}`}
          className="max-w-full max-h-full object-contain select-none"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="hidden md:flex absolute right-4 bg-black/50 hover:bg-black/80 text-white rounded-full p-3 transition-colors z-20"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Thumbnails */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 overflow-x-auto px-4 py-2" onClick={(e) => e.stopPropagation()}>
        {images.map((img, idx) => (
          <button
            key={idx}
            className={`relative w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${idx === index ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
            onClick={() => setIndex(idx)}
          >
            <img
              src={getImageUrl(img)}
              alt={`Thumb ${idx}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductImageGalleryModal;
