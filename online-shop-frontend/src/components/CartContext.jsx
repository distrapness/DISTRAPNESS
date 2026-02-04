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
      // Create a unique key based on ID and Size (default to 'M' if undefined for backward compat, or allow null)
      const targetSize = product.selectedSize || 'M';

      const foundIndex = prev.findIndex((item) =>
        item.id === product.id && (item.selectedSize || 'M') === targetSize
      );

      if (foundIndex !== -1) {
        // Clone array
        const newCart = [...prev];
        newCart[foundIndex] = {
          ...newCart[foundIndex],
          qty: newCart[foundIndex].qty + qty
        };
        return newCart;
      } else {
        // Enforce valid image
        const validImage = product.image || (product.images && product.images[0]);
        return [...prev, { ...product, image: validImage, selectedSize: targetSize, qty }];
      }
    });
  };

  const removeFromCart = (id, size) => {
    setCart((prev) => prev.filter((item) =>
      !(item.id === id && (item.selectedSize || 'M') === (size || 'M'))
    ));
  };

  const updateQty = (id, size, qty) => {
    setCart((prev) =>
      prev.map((item) =>
        (item.id === id && (item.selectedSize || 'M') === (size || 'M'))
          ? { ...item, qty }
          : item
      )
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
