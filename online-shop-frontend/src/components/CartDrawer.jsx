import React from "react";
import { useCart } from "./CartContext";
import { useNavigate } from "react-router-dom";

const CartDrawer = ({ open, onClose }) => {
  const { cart, removeFromCart, updateQty, clearCart } = useCart();
  const navigate = useNavigate();
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleCheckout = () => {
    onClose();
    setTimeout(() => {
      navigate("/payment");
    }, 350); // biar animasi sidebar nutup dulu
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-50 transform transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
    >
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-bold">Keranjang</h2>
        <button onClick={onClose} className="text-xl px-2 py-1 rounded hover:bg-gray-100" aria-label="Tutup Keranjang">&times;</button>
      </div>
      <div className="p-4 flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <p className="text-gray-500 text-center">Keranjang kosong</p>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="flex items-center mb-4 border-b pb-2">
              <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded mr-3" />
              <div className="flex-1">
                <div className="font-semibold">{item.name}</div>
                <div className="text-sm text-gray-500">Rp {item.price.toLocaleString('id-ID')}</div>
                <div className="flex items-center mt-1">
                  <button onClick={() => updateQty(item.id, Math.max(item.qty - 1, 1))} className="px-2 rounded bg-gray-100 hover:bg-gray-200">-</button>
                  <span className="mx-2">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.qty + 1)} className="px-2 rounded bg-gray-100 hover:bg-gray-200">+</button>
                </div>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="ml-2 text-red-500 hover:underline">Hapus</button>
            </div>
          ))
        )}
      </div>
      <div className="p-4 border-t flex flex-col gap-2">
        {/* Total Harga */}
        <div className="flex justify-between items-center font-semibold text-lg mb-2">
          <span>Total</span>
          <span className="text-blue-600">Rp {total.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearCart} className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition flex-1">Kosongkan</button>
          <button
            onClick={handleCheckout}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded shadow hover:from-blue-600 hover:to-indigo-700 transition flex items-center justify-center gap-2 text-base font-bold"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2zm-5 4v2m-4-6h8" /></svg>
            Checkout
          </button>
          {/* Tombol silang di kanan checkout */}
          <button
            onClick={onClose}
            className="ml-2 text-gray-400 hover:text-red-500 text-2xl px-2 py-1 rounded-full border border-gray-200 hover:bg-gray-100 transition"
            aria-label="Tutup Sidebar Keranjang"
            title="Tutup Keranjang"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
