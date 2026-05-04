import React, { useState, useEffect } from "react";
import { useCart } from "./CartContext";
import { useNavigate } from "react-router-dom";
import { getImageUrl } from "../utils/imageHelper";
import { useAuth } from "../contexts/AuthContext.jsx";

const CartDrawer = ({ open, onClose }) => {
  const { cart, removeFromCart, updateQty } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleCheckout = () => {
    onClose();
    setTimeout(() => {
      if (isLoggedIn) {
        navigate("/payment");
      } else {
        navigate("/login");
      }
    }, 300);
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[400px] bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-bold tracking-widest uppercase">Your Cart ({totalQty})</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Free Shipping Progress */}
          {cart.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
                <span>{total >= 500000 ? '🎉 You get Free Shipping!' : `Spend Rp${(500000 - total).toLocaleString('id-ID')} more for Free Shipping`}</span>
                <span className="text-gray-400">{Math.min(100, Math.round((total / 500000) * 100))}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-black dark:bg-white transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                  style={{ width: `${Math.min(100, (total / 500000) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-black dark:text-white mb-2">Your cart is empty</h3>
                <p className="text-xs text-gray-400 mb-8 max-w-[200px]">Looks like you haven't added anything to your cart yet.</p>
                <button 
                  onClick={onClose} 
                  className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-md overflow-hidden shrink-0 border border-gray-100 dark:border-gray-700">
                    <img
                      src={getImageUrl(item?.image || (item?.images && item?.images?.[0]))}
                      alt={item.name}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/200x200?text=No+Image"; }}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm tracking-wide">{item.name}</h3>
                      <span className="font-medium text-sm">Rp{Number(item.price).toLocaleString('id-ID', { minimumFractionDigits: 0 })}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">Size: {item.selectedSize || 'M'}</p>

                    <div className="flex justify-between items-center mt-auto">
                      {/* Qty Selector */}
                      <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-sm">
                        <button
                          onClick={() => updateQty(item.id, item.selectedSize, Math.max(item.qty - 1, 1))}
                          className="px-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                        >
                          &minus;
                        </button>
                        <span className="text-xs font-bold w-6 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, item.selectedSize, item.qty + 1)}
                          className="px-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove Link */}
                      <button
                        onClick={() => removeFromCart(item.id, item.selectedSize)}
                        className="text-xs text-gray-400 underline hover:text-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="text-lg font-bold">Rp{Number(total).toLocaleString('id-ID', { minimumFractionDigits: 0 })}</span>
              </div>
              <p className="text-[10px] text-gray-500 text-center mb-6">
                Shipping & taxes calculated at checkout
              </p>

              <button
                onClick={handleCheckout}
                className="w-full bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black font-black py-4 rounded-xl uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl active:scale-[0.98] transform"
              >
                Checkout &rarr;
              </button>

              <div className="mt-4 text-center">
                <button onClick={onClose} className="text-xs text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                  Or continue shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
