import React from 'react';
import { useCart } from '../components/CartContext';
import { Link } from 'react-router-dom';
import { getImageUrl } from "../utils/imageHelper";

const CartPage = () => {
    const { cart, removeFromCart, updateQty } = useCart();

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 300000 ? 0 : 25000;
    const total = subtotal + shipping;

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pt-24 pb-32">

            <div className="max-w-7xl mx-auto px-4">
                <h1 className="text-3xl font-[900] uppercase tracking-tighter mb-8 text-black dark:text-white">My Bag ({cart.reduce((a, c) => a + c.quantity, 0)} Items)</h1>

                {/* Free Shipping Bar */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-8 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between text-sm font-bold mb-2">
                        <span>{subtotal >= 300000 ? "You've qualified for Free Shipping" : `Spend Rp ${(300000 - subtotal).toLocaleString('id-ID')} more for Free Shipping`}</span>
                        <span className="text-[#FF0000]">{Math.min(100, (subtotal / 300000) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#FF0000] h-full transition-all duration-500" style={{ width: `${Math.min(100, (subtotal / 300000) * 100)}%` }}></div>
                    </div>
                </div>

                {cart.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-xl text-gray-500 mb-6">Your bag is empty.</p>
                        <Link to="/shop" className="bg-black text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-gray-800">Start Shopping</Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-12 items-start">

                        {/* Left: Cart Items */}
                        <div className="w-full lg:w-2/3 flex flex-col gap-4">
                            {cart.map(item => (
                                <div key={item.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex gap-6 items-center">
                                    <div className="w-24 h-32 bg-gray-100 flex-shrink-0">
                                        <img
                                            src={getImageUrl(item.image)}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg uppercase tracking-wide">{item.name}</h3>
                                            <span className="font-bold text-lg">Rp {item.price.toLocaleString('id-ID')}</span>
                                        </div>
                                        <p className="text-gray-500 text-sm mb-4">Size: {item.selectedSize || 'M'} <br /> Color: {item.selectedColor || 'Black'}</p>

                                        <div className="flex justify-between items-center">
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-xs text-gray-400 hover:text-red-500 underline"
                                            >
                                                Remove
                                            </button>

                                            <div className="flex items-center border border-gray-300 rounded">
                                                <button onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))} className="px-3 py-1 text-gray-500 hover:text-black">-</button>
                                                <span className="px-2 font-bold text-sm w-8 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQty(item.id, item.quantity + 1)} className="px-3 py-1 text-gray-500 hover:text-black">+</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Right: Order Summary */}
                        <div className="w-full lg:w-1/3 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 h-fit sticky top-32">
                            <h2 className="text-xl font-bold uppercase tracking-widest mb-6 border-b pb-4">Order Summary</h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal ({cart.reduce((a, c) => a + c.quantity, 0)} items)</span>
                                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span>{shipping === 0 ? <span className="text-green-600 font-bold">Free</span> : `Rp ${shipping.toLocaleString('id-ID')}`}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax Estimate</span>
                                    <span>Rp {(subtotal * 0.11).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-red-500 font-bold">
                                    <span>Savings</span>
                                    <span>-Rp 0</span>
                                </div>
                            </div>

                            <div className="flex justify-between text-2xl font-[900] mb-8 pt-4 border-t">
                                <span>Total</span>
                                <span>Rp {total.toLocaleString('id-ID')}</span>
                            </div>

                            <Link
                                to="/payment"
                                className="block w-full bg-[#FF0000] text-white text-center py-4 font-bold uppercase tracking-widest hover:bg-red-700 transition shadow-lg rounded"
                            >
                                Secure Checkout &rarr;
                            </Link>

                            <div className="mt-6 flex justify-center gap-2">
                                <span className="bg-gray-100 text-xs px-2 py-1 rounded">VISA</span>
                                <span className="bg-gray-100 text-xs px-2 py-1 rounded">MC</span>
                                <span className="bg-gray-100 text-xs px-2 py-1 rounded">PAYPAL</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* You May Also Like */}
                <div className="mt-20">
                    <h3 className="text-lg font-bold uppercase tracking-widest mb-6">You May Also Like</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {/* Placeholders for now, or could act as a small component */}
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white p-4 rounded shadow-sm">
                                <div className="aspect-square bg-gray-100 mb-2"></div>
                                <div className="font-bold text-sm">Product {i}</div>
                                <div className="text-xs text-gray-500">Rp 199.000</div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CartPage;
