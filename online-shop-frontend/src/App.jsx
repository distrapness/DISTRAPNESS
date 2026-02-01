import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import ShopPage from './pages/ShopPage.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import OrderStatus from './pages/OrderStatus.jsx';
import OrderTracking from './pages/OrderTracking.jsx';
import PaymentDashboard from './pages/PaymentDashboard.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import PaymentConfirm from "./pages/PaymentConfirm";
import BrandAdmin from './pages/BrandAdmin.jsx';
import StorePage from './pages/StorePage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ProductAdmin from './pages/ProductAdmin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import BannerAdmin from './pages/BannerAdmin.jsx';
import Header from './components/Header.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import { CartProvider } from './components/CartContext.jsx';
import Toast from './components/Toast.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import { CurrencyProvider, useCurrency } from './components/CurrencyContext.jsx';
import { BannerProvider } from "./contexts/BannerContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Profile from "./pages/Profile.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import './App.css';
import { AuthProvider } from "./contexts/AuthContext.jsx";
import HowToOrder from "./pages/HowToOrder.jsx";
import AdminOrderDashboard from "./pages/AdminOrderDashboard";
import AdminChat from "./pages/AdminChat";
import MobileBottomNav from './components/MobileBottomNav.jsx';
import CartPage from './pages/CartPage.jsx';

function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const { dark } = useCurrency();
  const location = useLocation();

  // Sinkronkan class 'dark' di <html> dengan state dark
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  // Untuk HomePage dan ProductDetail agar bisa trigger toast dan buka cart
  const handleAddToCart = (product, cb) => {
    setToast({ show: true, message: `${product.name} ditambahkan ke keranjang!` });
    setCartOpen(true);
    if (cb) cb();
    setTimeout(() => setToast({ show: false, message: '' }), 1500);
  };

  return (
    <CurrencyProvider>
      <BannerProvider>
        <CartProvider>
          <AuthProvider>
            <div className="min-h-screen transition-colors duration-700 bg-white dark:bg-gray-900">
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-[900ms] ease-in-out">
                {/* Header disembunyikan jika di Cart Page agar clean? Atau tetap ada? Referensi: Cart Page usually clean header. */}
                {/* Tapi untuk sekarang biarkan Header ada, cuma cart drawer di trigger manual */}
                <Header onCartClick={() => setCartOpen(true)} />
                <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
                <Toast show={toast.show} message={toast.message} />
                <ChatWidget />
                <div className="pb-20 md:pb-0"> {/* Add padding bottom for mobile nav */}
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/" element={<HomePage onAddToCart={handleAddToCart} />} />
                    <Route path="/shop" element={<ShopPage onAddToCart={handleAddToCart} />} />
                    <Route path="/shop/:id" element={<ProductDetail onAddToCart={handleAddToCart} />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/order-status" element={<OrderStatus />} />
                    <Route path="/order-tracking" element={<OrderTracking />} />
                    <Route path="/payment" element={<PaymentDashboard />} />
                    <Route path="/payment/confirm" element={<PaymentConfirm />} />
                    <Route path="/payment-success" element={<PaymentSuccess />} />
                    <Route path="/brand-admin" element={<BrandAdmin />} />
                    <Route path="/product-admin" element={<ProductAdmin />} />
                    <Route path="/store" element={<StorePage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/orders" element={<AdminOrderDashboard />} />
                    <Route path="/admin-chat" element={<AdminChat />} />
                    <Route path="/banner-admin" element={<BannerAdmin />} />
                    <Route path="/how-to-order" element={<HowToOrder />} />
                  </Routes>
                </div>
                <MobileBottomNav />
              </div>
            </div>
          </AuthProvider>
        </CartProvider>
      </BannerProvider>
    </CurrencyProvider>
  );
}

export default App;
