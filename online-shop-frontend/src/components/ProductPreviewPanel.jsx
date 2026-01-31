import React from 'react';

// Placeholder SVG sebagai data URI untuk menggantikan placeholder.com
const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmMWYxZjEiLz48dGV4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1zaXplPSIxOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmaWxsPSIjNTU1NTU1Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
const thumbnailPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIj48cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNmMWYxZjEiLz48dGV4dCB4PSIyNSIgeT0iMjUiIGZvbnQtc2l6ZT0iOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmaWxsPSIjNTU1NTU1Ij5FcnJvcjwvdGV4dD48L3N2Zz4=';

export default function ProductPreviewPanel({ product, images, onRemoveImage }) {
  // State untuk gambar aktif
  const [activeImage, setActiveImage] = React.useState(0);
  
  // Pastikan images selalu array
  const imageList = Array.isArray(images) ? images : [];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-colors duration-[900ms] ease-in-out">
      <h3 className="text-lg font-semibold mb-2 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out">
        Preview Produk
      </h3>
      
      {/* Main Image Display */}
      <div className="relative mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 transition-colors duration-[900ms] ease-in-out" style={{ height: '300px' }}>
        {imageList.length > 0 ? (
          <img
            src={imageList[activeImage]}
            alt={`Product Preview ${activeImage + 1}`}
            className="w-full h-full object-contain"
            onError={(e) => {
              console.log('[PREVIEW] Error loading image, using placeholder');
              e.target.onerror = null; // Prevent infinite loop
              e.target.src = placeholderImage;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <img src={placeholderImage} alt="No Image" className="w-full h-full object-contain" />
          </div>
        )}
      </div>
      
      {/* Thumbnail Navigation */}
      {imageList.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-start">
          {imageList.map((img, idx) => (
            <div 
              key={idx} 
              className={`relative w-16 h-16 rounded overflow-hidden cursor-pointer border-2 ${activeImage === idx ? 'border-blue-500' : 'border-transparent'}`}
              onClick={() => setActiveImage(idx)}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.log('[PREVIEW] Error loading thumbnail, using placeholder');
                  e.target.onerror = null;
                  e.target.src = thumbnailPlaceholder;
                }}
              />
              
              {/* Remove button */}
              {onRemoveImage && (
                <button
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-bl w-5 h-5 flex items-center justify-center text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage(idx);
                    if (activeImage >= imageList.length - 1) {
                      setActiveImage(Math.max(0, imageList.length - 2));
                    }
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Product Info */}
      <div className="mt-4 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out">
        <h4 className="font-bold text-xl mb-1">{product?.name || 'Nama Produk'}</h4>
        <p className="text-lg text-blue-600 dark:text-blue-400 font-semibold mb-2 transition-colors duration-[900ms] ease-in-out">
          {product?.price ? `Rp ${Number(product.price).toLocaleString('id-ID')}` : 'Rp 0'}
        </p>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 transition-colors duration-[900ms] ease-in-out">
          {product?.description || 'Deskripsi produk akan ditampilkan di sini.'}
        </p>
        <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-[900ms] ease-in-out">
          Kategori: {product?.category?.name || 'Belum dipilih'}
        </div>
      </div>
    </div>
  );
}
