import React from 'react';
import { useWishlist } from './WishlistContext'; // Adjust path as needed
import { useCart } from './CartContext';
import { getImageUrl } from '../utils/imageHelper';
import { Link } from 'react-router-dom';

const WishlistDrawer = ({ open, onClose }) => {
    const { wishlist, removeFromWishlist } = useWishlist(); // Assuming context has these
    const { addToCart } = useCart();

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-[70] flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-[900] uppercase tracking-tighter text-black dark:text-white">
                        YOUR WISHLIST ({wishlist.length})
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {wishlist.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">Your wishlist is empty</p>
                                <p className="text-sm text-gray-500">Save items you love to buy later.</p>
                            </div>
                            <button onClick={onClose} className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold uppercase text-xs tracking-widest hover:opacity-80 transition-opacity">
                                Start Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {wishlist.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <Link to={`/shop/${item.id}`} onClick={onClose} className="w-24 h-24 bg-gray-100 shrink-0 overflow-hidden rounded-sm">
                                        <img
                                            src={getImageUrl(item?.image || (item?.images && item?.images?.[0]))}
                                            alt={item.name}
                                            className="w-full h-full object-contain p-1"
                                            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100?text=Product"; }}
                                        />
                                    </Link>
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex justify-between items-start">
                                            <Link to={`/shop/${item.id}`} onClick={onClose}>
                                                <h3 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wide line-clamp-2 hover:underline">{item.name}</h3>
                                            </Link>
                                            <button
                                                onClick={() => removeFromWishlist(item.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                aria-label="Remove from wishlist"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                        <div className="text-sm font-medium text-gray-500 mt-1">
                                            Rp{Number(item.price).toLocaleString('id-ID', { minimumFractionDigits: 0 })}
                                        </div>
                                        <button
                                            onClick={() => {
                                                addToCart(item, 1);
                                                removeFromWishlist(item.id); // Optional: remove after adding to cart? Or keep it? Usually keep, but let's remove for flow. Or keep. User didn't specify. I'll keep it for now but button text "Add to Cart"
                                                onClose(); // Optional
                                            }}
                                            className="mt-auto self-start text-xs font-bold uppercase tracking-widest text-black dark:text-white border-b border-black dark:border-white hover:opacity-70 transition-opacity"
                                        >
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default WishlistDrawer;
