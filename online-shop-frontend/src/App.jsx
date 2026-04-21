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
import WishlistDrawer from './components/WishlistDrawer.jsx';
import Toast from './components/Toast.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import WhatsAppButton from './components/WhatsAppButton';
import { useCurrency } from './components/CurrencyContext.jsx';
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Profile from "./pages/Profile.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import './App.css';
import HowToOrder from "./pages/HowToOrder.jsx";
import AdminOrderDashboard from "./pages/AdminOrderDashboard";
import AdminOrderDetail from "./pages/AdminOrderDetail";
import DiscountManager from "./pages/DiscountManager.jsx";
import CategoryManager from './pages/CategoryManager.jsx';
import AdminSettings from './pages/AdminSettings.jsx'; // Imported here
import AdminChat from "./pages/AdminChat";
import MobileBottomNav from './components/MobileBottomNav.jsx';
import CartPage from './pages/CartPage.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import TermsPage from './pages/TermsPage.jsx';
import MarketingPopup from './components/MarketingPopup.jsx';
import FAQPage from './pages/FAQPage.jsx';
import AdminReviews from './pages/AdminReviews.jsx';

function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
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

  // Check if current page is an Admin page
  const isAdminRoute = [
    '/admin',
    '/product-admin',
    '/brand-admin',
    '/banner-admin',
    '/admin-chat'
  ].some(path => location.pathname.startsWith(path));

  // Untuk HomePage dan ProductDetail agar bisa trigger toast dan buka cart
  const handleAddToCart = (product, cb) => {
    setToast({ show: true, message: `${product.name} ditambahkan ke keranjang!` });
    setCartOpen(true);
    if (cb) cb();
    setTimeout(() => setToast({ show: false, message: '' }), 1500);
  };

  return (
    <div className="min-h-screen transition-colors duration-700 bg-white dark:bg-gray-900">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-[900ms] ease-in-out">
        {/* Customer UI Components - Only show if NOT admin */}
        {!isAdminRoute && (
          <>
            <Header
              onCartClick={() => setCartOpen(true)}
              onWishlistClick={() => setWishlistOpen(true)}
            />
            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
            <WishlistDrawer open={wishlistOpen} onClose={() => setWishlistOpen(false)} />
            <Toast show={toast.show} message={toast.message} />
            {!cartOpen && <ChatWidget />}
            {!cartOpen && <WhatsAppButton />}
          </>
        )}

        {/* Adjust padding only for Customer Routes. AdminLayout handles its own padding/layout. */}
        <div className={!isAdminRoute ? "pt-[60px] md:pt-[88px] pb-20 md:pb-0" : ""}>
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
            <Route path="/how-to-order" element={<HowToOrder />} />
            {/* Admin Routes with Layout */}
            <Route path="/admin" element={
              <ProtectedRoute role="admin">
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/orders" element={
              <ProtectedRoute role="admin">
                <AdminLayout>
                  <AdminOrderDashboard />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/orders/:id" element={
              <ProtectedRoute role="admin">
                <AdminLayout>
                  <AdminOrderDetail />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/discounts" element={
              <ProtectedRoute role="admin">
                <AdminLayout>
                  <DiscountManager />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/product-admin" element={
              <ProtectedRoute role="admin">
                <AdminLayout>
                  <ProductAdmin />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/brand-admin" element={
              <ProtectedRoute role="admin">
                <AdminLayout>
                  <BrandAdmin />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/banner-admin" element={
              <ProtectedRoute role="admin">
                <AdminLayout>
                  <BannerAdmin />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin-chat" element={
              <ProtectedRoute role="admin">
                <AdminLayout>
                  <AdminChat />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/categories" element={
              <ProtectedRoute role="admin">
                <AdminLayout>
                  <CategoryManager />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute role="admin">
                <AdminLayout>
                  <AdminSettings />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/reviews" element={
              <ProtectedRoute role="admin">
                <AdminLayout>
                  <AdminReviews />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsPage />} />
            <Route path="/faq" element={<FAQPage />} />
          </Routes>
        </div>
        {!isAdminRoute && <MobileBottomNav onWishlistClick={() => setWishlistOpen(true)} />}
        {!isAdminRoute && <MarketingPopup />}
      </div>
    </div>
  );
}

export default App;
