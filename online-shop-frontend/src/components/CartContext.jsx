import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

function getInitialCart() {
  try {
    const stored = localStorage.getItem('cart');
    if (stored) return JSON.parse(stored);
    return [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  // Gunakan initial value dari localStorage!
  const [cart, setCart] = useState(getInitialCart());

  // Simpan cart ke localStorage setiap kali berubah
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const found = prev.find((item) => item.id === product.id);
      if (found) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + qty } : item
        );
      } else {
        return [...prev, { ...product, qty }];
      }
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQty = (id, qty) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty } : item))
    );
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
