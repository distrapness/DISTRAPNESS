import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState([]);
    const [showWishlistToast, setShowWishlistToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Load wishlist from localStorage on mount
    useEffect(() => {
        const savedWishlist = localStorage.getItem('wishlist');
        if (savedWishlist) {
            try {
                setWishlist(JSON.parse(savedWishlist));
            } catch (e) {
                console.error("Failed to parse wishlist", e);
            }
        }
    }, []);

    // Save to localStorage whenever wishlist changes
    useEffect(() => {
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    const toggleWishlist = (product) => {
        if (!product) return;

        setWishlist((prev) => {
            const exists = prev.find((item) => String(item.id) === String(product.id));
            if (exists) {
                showToast(`${product.name} removed from wishlist!`);
                return prev.filter((item) => String(item.id) !== String(product.id));
            }
            showToast(`${product.name} added to wishlist!`);
            return [...prev, product];
        });
    };

    const removeFromWishlist = (productId) => {
        setWishlist((prev) => prev.filter((item) => String(item.id) !== String(productId)));
    };

    const isInWishlist = (productId) => {
        return wishlist.some((item) => String(item.id) === String(productId));
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setShowWishlistToast(true);
        setTimeout(() => setShowWishlistToast(false), 2000);
    };

    return (
        <WishlistContext.Provider value={{ wishlist, toggleWishlist, removeFromWishlist, isInWishlist }}>
            {children}
            {/* Simple Toast specific to Wishlist actions (or we could use the global one) */}
            {showWishlistToast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full shadow-lg z-50 text-sm font-bold animate-fade-in-up">
                    {toastMessage}
                </div>
            )}
        </WishlistContext.Provider>
    );
};
