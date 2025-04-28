import React from "react";

const ProductCard = ({ product, onAddToCart }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-4 hover:shadow-2xl transition duration-300 flex flex-col justify-between h-full">
      <img
        src={product.image}
        alt={product.name}
        className="h-40 w-full object-contain rounded mb-4 bg-transparent"
        style={{ background: 'transparent', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.04))', mixBlendMode: 'multiply' }}
      />
      <div className="mt-2 text-center">
        <div className="font-medium text-base md:text-lg text-gray-900 mb-1">{product.name}</div>
        <div className="font-bold text-black text-base md:text-lg">Rp {product.price.toLocaleString('id-ID')}</div>
      </div>
      <p className="text-gray-500 text-sm mb-4 flex-1">{product.description}</p>
      <button onClick={onAddToCart} className="mt-auto bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition">Tambah ke Keranjang</button>
    </div>
  );
};

export default ProductCard;
