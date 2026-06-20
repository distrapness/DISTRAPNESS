import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { userEmail } = useAuth();
  
  const [currentEmail, setCurrentEmail] = useState(userEmail);
  const [cart, setCart] = useState(() => {
    const key = userEmail ? `cart_${userEmail.toLowerCase().trim()}` : 'cart_guest';
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Load correct cart from localStorage when userEmail changes
  useEffect(() => {
    if (userEmail !== currentEmail) {
      const key = userEmail ? `cart_${userEmail.toLowerCase().trim()}` : 'cart_guest';
      let newCart = [];
      try {
        const stored = localStorage.getItem(key);
        newCart = stored ? JSON.parse(stored) : [];
      } catch {}
      setCart(newCart);
      setCurrentEmail(userEmail);
    }
  }, [userEmail, currentEmail]);

  // Save cart to localStorage under the correct key
  useEffect(() => {
    const key = currentEmail ? `cart_${currentEmail.toLowerCase().trim()}` : 'cart_guest';
    localStorage.setItem(key, JSON.stringify(cart));
  }, [cart, currentEmail]);

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
        String(item.id) === String(product.id) && (item.selectedSize || 'M') === targetSize
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
      !(String(item.id) === String(id) && (item.selectedSize || 'M') === (size || 'M'))
    ));
  };

  const updateQty = (id, size, qty) => {
    setCart((prev) =>
      prev.map((item) =>
        (String(item.id) === String(id) && (item.selectedSize || 'M') === (size || 'M'))
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
