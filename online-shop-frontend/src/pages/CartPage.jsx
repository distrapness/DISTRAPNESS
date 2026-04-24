import React from 'react';
import { useCart } from '../components/CartContext';
import { Link } from 'react-router-dom';
import { getImageUrl } from "../utils/imageHelper";
import config from '../config.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCurrency } from '../components/CurrencyContext.jsx';

const CartPage = () => {
    const { cart, removeFromCart, updateQty } = useCart();
    const { isLoggedIn } = useAuth();
    const { t } = useCurrency();

    // Validation State
    const [realProducts, setRealProducts] = React.useState({});
    const [validating, setValidating] = React.useState(true);

    React.useEffect(() => {
        const validateStock = async () => {
            setValidating(true);
            try {
                const res = await fetch(`${config.API_URL}/api/products`);
                if (res.ok) {
                    const products = await res.json();
                    const productMap = {};
                    products.forEach(p => {
                        productMap[p.id] = p;
                    });
                    setRealProducts(productMap);
                }
            } catch (err) {
                console.error("Failed to validate cart:", err);
            } finally {
                setValidating(false);
            }
        };
        validateStock();
    }, []);

    const checkItem = (item) => {
        if (!validating && Object.keys(realProducts).length > 0) {
            const real = realProducts[item.id];
            if (!real) return { invalid: true, reason: 'Deleted' };
            let stock = real.stock;
            if (real.sizes && item.selectedSize && real.sizes[item.selectedSize] !== undefined) {
                stock = real.sizes[item.selectedSize];
            }
            if (stock < item.qty) return { invalid: true, reason: t('shop.outOfStock') };
        }
        return { invalid: false };
    };

    const hasInvalidItems = cart.some(item => checkItem(item).invalid);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const shipping = subtotal > 300000 ? 0 : 25000;
    const total = subtotal + shipping;

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pt-4 pb-32">
            <div className="max-w-7xl mx-auto px-4">
                <h1 className="text-3xl font-[900] uppercase tracking-tighter mb-8 text-black dark:text-white">
                    {t('cart.title')} ({cart.reduce((a, c) => a + c.qty, 0)} {t('cart.items')})
                </h1>

                {/* Free Shipping Bar */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-8 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between text-sm font-bold mb-2">
                        <span>{subtotal >= 300000 ? t('cart.freeShipping') : `${t('cart.spendMore')}Rp${Number(300000 - subtotal).toLocaleString('id-ID', { minimumFractionDigits: 0 })}${t('cart.forFreeShipping')}`}</span>
                        <span className="text-[#FF0000]">{Math.min(100, (subtotal / 300000) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
                        <div className="bg-black dark:bg-white h-full transition-all duration-500" style={{ width: `${Math.min(100, (subtotal / 300000) * 100)}%` }}></div>
                    </div>
                </div>

                {cart.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-xl text-gray-500 mb-6">{t('cart.empty')}</p>
                        <Link to="/shop" className="bg-black text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-gray-800">{t('cart.startShopping')}</Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-12 items-start">

                        {/* Left: Cart Items */}
                        <div className="w-full lg:w-2/3 flex flex-col gap-4">
                            {cart.map(item => {
                                const status = checkItem(item);
                                return (
                                    <div key={item.id + item.selectedSize} className={`bg-white dark:bg-gray-800 p-3 md:p-6 rounded-lg shadow-sm border ${status.invalid ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-700'} flex gap-3 md:gap-6 items-center relative transition-colors`}>

                                        {status.invalid && (
                                            <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                                                {status.reason}
                                            </div>
                                        )}

                                        <div className={`w-16 h-16 md:w-24 md:h-24 bg-gray-50 dark:bg-gray-700 flex-shrink-0 rounded-md overflow-hidden border border-gray-100 dark:border-gray-600 ${status.invalid ? 'opacity-50' : ''}`}>
                                            <img
                                                src={getImageUrl(item.image)}
                                                alt={item.name}
                                                className="w-full h-full object-contain p-1"
                                            />
                                        </div>
                                        <div className={`flex-1 min-w-0 ${status.invalid ? 'opacity-50' : ''}`}>
                                            <div className="flex justify-between items-start mb-1 gap-2">
                                                <h3 className="font-bold text-sm md:text-base uppercase tracking-wide leading-tight line-clamp-2">{item.name}</h3>
                                                <span className="font-bold text-sm md:text-base shrink-0">Rp{Number(item.price).toLocaleString('id-ID', { minimumFractionDigits: 0 })}</span>
                                            </div>
                                            <p className="text-gray-500 text-xs mb-2 md:mb-4">{t('cart.size')}: {item.selectedSize || 'M'}</p>

                                            <div className="flex justify-between items-center">
                                                <button
                                                    onClick={() => removeFromCart(item.id, item.selectedSize)}
                                                    className="text-xs text-gray-400 hover:text-red-500 underline"
                                                >
                                                    {t('cart.remove')}
                                                </button>

                                                <div className="flex items-center border border-gray-300 rounded">
                                                    <button onClick={() => !status.invalid && updateQty(item.id, item.selectedSize, Math.max(1, item.qty - 1))} disabled={status.invalid} className="px-2 py-1 text-gray-500 hover:text-black disabled:cursor-not-allowed text-sm">-</button>
                                                    <span className="px-2 font-bold text-sm w-8 text-center">{item.qty}</span>
                                                    <button onClick={() => !status.invalid && updateQty(item.id, item.selectedSize, item.qty + 1)} disabled={status.invalid} className="px-2 py-1 text-gray-500 hover:text-black disabled:cursor-not-allowed text-sm">+</button>
                                                </div>
                                            </div>
                                            {status.invalid && (
                                                <p className="text-red-600 text-xs font-bold mt-2">{t('cart.maxStock')}</p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Right: Order Summary */}
                        <div className="w-full lg:w-1/3 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 h-fit sticky top-32">
                            <h2 className="text-xl font-bold uppercase tracking-widest mb-6 border-b pb-4">{t('cart.orderSummary')}</h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>{t('cart.subtotal')} ({cart.reduce((a, c) => a + c.qty, 0)} {t('cart.items')})</span>
                                    <span>Rp{Number(subtotal).toLocaleString('id-ID', { minimumFractionDigits: 0 })}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>{t('cart.shipping')}</span>
                                    <span>{shipping === 0 ? <span className="text-green-600 font-bold">{t('cart.free')}</span> : `Rp${Number(shipping).toLocaleString('id-ID', { minimumFractionDigits: 0 })}`}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>{t('cart.taxEstimate')}</span>
                                    <span>Rp{Number(subtotal * 0.11).toLocaleString('id-ID', { minimumFractionDigits: 0 })}</span>
                                </div>
                                <div className="flex justify-between text-red-500 font-bold">
                                    <span>{t('cart.savings')}</span>
                                    <span>-Rp0</span>
                                </div>
                            </div>

                            <div className="flex justify-between text-2xl font-[900] mb-8 pt-4 border-t">
                                <span>{t('cart.total')}</span>
                                <span>Rp{Number(total).toLocaleString('id-ID', { minimumFractionDigits: 0 })}</span>
                            </div>

                            {hasInvalidItems ? (
                                <button
                                    disabled
                                    className="block w-full bg-gray-300 text-gray-500 cursor-not-allowed text-center py-4 font-bold uppercase tracking-widest rounded transition"
                                >
                                    {t('cart.removeUnavailable')}
                                </button>
                            ) : (
                                <Link
                                    to={isLoggedIn ? "/payment" : "/login"}
                                    className="block w-full bg-black dark:bg-white text-white dark:text-black text-center py-5 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-gray-800 dark:hover:bg-gray-200 transition shadow-xl rounded-xl"
                                >
                                    {isLoggedIn ? t('cart.checkout') : t('cart.loginToCheckout')}
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                {/* You May Also Like */}
                <div className="mt-20">
                    <h3 className="text-lg font-[900] uppercase tracking-widest mb-10 text-center">{t('cart.youMayLike') || "You May Also Like"}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {Object.values(realProducts).slice(0, 4).map(p => (
                            <Link key={p.id} to={`/product/${p.id}`} className="group bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                                <div className="aspect-[3/4] bg-gray-50 dark:bg-gray-700 mb-4 overflow-hidden rounded-lg">
                                    <img 
                                        src={getImageUrl(p.images?.[0] || p.image)} 
                                        alt={p.name} 
                                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <div className="font-bold text-sm uppercase tracking-tight truncate dark:text-white">{p.name}</div>
                                <div className="text-xs text-gray-500 mt-1">Rp{Number(p.price).toLocaleString('id-ID', { minimumFractionDigits: 0 })}</div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
