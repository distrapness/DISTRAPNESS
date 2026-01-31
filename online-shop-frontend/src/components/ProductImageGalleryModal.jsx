import React, { useState } from "react";

const ProductImageGalleryModal = ({ images = [], open, onClose, initialIndex = 0 }) => {
  const [index, setIndex] = useState(initialIndex);

  if (!open || images.length === 0) return null;

  const handlePrev = () => {
    setIndex(i => (i === 0 ? images.length - 1 : i - 1));
  };
  const handleNext = () => {
    setIndex(i => (i === images.length - 1 ? 0 : i + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="relative bg-white rounded shadow-lg p-4 max-w-xl w-full flex flex-col items-center">
        <button
          className="absolute top-2 right-2 text-xl bg-white/90 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full shadow px-3 py-1 z-10 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-black"
          onClick={onClose}
          aria-label="Tutup"
        >
          &times;
        </button>
        <div className="flex items-center justify-center w-full h-96 bg-gray-100 rounded mb-2">
          <img src={images[index]} alt="Product" className="object-contain max-h-96 max-w-full" />
        </div>
        <div className="flex gap-4 items-center justify-center mt-2">
          <button onClick={handlePrev} className="px-3 py-1 bg-gray-300 rounded">&#8592; Sebelumnya</button>
          <span>{index + 1} / {images.length}</span>
          <button onClick={handleNext} className="px-3 py-1 bg-gray-300 rounded">Berikutnya &#8594;</button>
        </div>
        <div className="flex gap-2 mt-4">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt="Thumb"
              className={`w-12 h-12 object-cover rounded border cursor-pointer ${idx === index ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setIndex(idx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductImageGalleryModal;
