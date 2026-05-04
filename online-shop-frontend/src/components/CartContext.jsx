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
    // Determine active price: Use flash sale price if active and not expired
    let activePrice = Number(product.price);
    const now = new Date();
    // Simplified check: If is_flash_sale is true, use the flash sale price
    // We only check date if flash_sale_end is explicitly provided.
    const isFlashActive = product.is_flash_sale && (!product.flash_sale_end || new Date(product.flash_sale_end) > now);
    
    if (isFlashActive && product.flash_sale_price) {
      activePrice = Number(product.flash_sale_price);
    }

    setCart((prev) => {
      const targetSize = product.selectedSize || 'M';

      const foundIndex = prev.findIndex((item) =>
        item.id === product.id && (item.selectedSize || 'M') === targetSize
      );

      if (foundIndex !== -1) {
        const newCart = [...prev];
        // Potentially update price in cart if it changed (e.g. flash sale started/ended)
        newCart[foundIndex] = {
          ...newCart[foundIndex],
          price: activePrice, 
          qty: newCart[foundIndex].qty + qty
        };
        return newCart;
      } else {
        const validImage = product.image || (product.images && product.images[0]);
        return [...prev, { ...product, price: activePrice, image: validImage, selectedSize: targetSize, qty }];
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
