import React, { useState } from "react";

const ProductPreviewPanel = ({ form, images, onRemoveImage }) => {
  const [index, setIndex] = useState(0);
  const imgList = Array.isArray(images) && images.length > 0 ? images : ["/assets/placeholder.jpg"];

  const handlePrev = () => setIndex(i => (i === 0 ? imgList.length - 1 : i - 1));
  const handleNext = () => setIndex(i => (i === imgList.length - 1 ? 0 : i + 1));

  return (
    <aside className="w-full md:w-96 bg-white dark:bg-gray-800 rounded-xl shadow p-6 ml-0 md:ml-8 mt-8 md:mt-0 flex flex-col items-center transition-colors duration-[900ms] ease-in-out">
      <h3 className="text-lg font-bold mb-4 text-blue-700 dark:text-blue-200">Preview Produk</h3>
      <div className="relative w-full h-64 flex items-center justify-center bg-gray-100 rounded mb-4">
        <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-300 rounded-full px-2 py-1">&#8592;</button>
        <img src={imgList[index]} alt="Preview" className="object-contain max-h-60 max-w-full mx-auto" />
        <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-300 rounded-full px-2 py-1">&#8594;</button>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white bg-opacity-70 px-2 py-1 rounded text-xs">{index + 1} / {imgList.length}</div>
      </div>
      <div className="flex gap-2 mt-2 mb-4">
        {Array.isArray(images) && images.length > 0 && images.map((img, idx) => (
          <div key={idx} className="relative group">
            <img
              src={img}
              alt="Thumb"
              className={`w-12 h-12 object-cover rounded border cursor-pointer ${idx === index ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setIndex(idx)}
            />
            {onRemoveImage && (
              <button
                type="button"
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-80 group-hover:opacity-100"
                onClick={() => onRemoveImage(idx)}
                title="Hapus foto"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="w-full text-center">
        <div className="font-bold text-lg mb-1">{form.name || "Nama Produk"}</div>
        <div className="text-green-600 font-semibold mb-1">{form.price ? `Rp ${parseInt(form.price).toLocaleString("id-ID")}` : "Harga"}</div>
        <div className="text-gray-500 text-sm mb-2">{form.description || "Deskripsi produk akan tampil di sini."}</div>
      </div>
    </aside>
  );
};

export default ProductPreviewPanel;
