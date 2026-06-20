import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// Layout & Static Components
import Header from './components/Header.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import WishlistDrawer from './components/WishlistDrawer.jsx';
import Toast from './components/Toast.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import MobileBottomNav from './components/MobileBottomNav.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import MarketingPopup from './components/MarketingPopup.jsx';
import { useCurrency } from './components/CurrencyContext.jsx';
import './App.css';

// Lazy Loaded Pages
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const ShopPage = lazy(() => import('./pages/ShopPage.jsx'));
const ProductDetail = lazy(() => import('./pages/ProductDetail.jsx'));
const OrderStatus = lazy(() => import('./pages/OrderStatus.jsx'));
const OrderTracking = lazy(() => import('./pages/OrderTracking.jsx'));
const PaymentDashboard = lazy(() => import('./pages/PaymentDashboard.jsx'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess.jsx'));
const PaymentConfirm = lazy(() => import('./pages/PaymentConfirm'));
const BrandAdmin = lazy(() => import('./pages/BrandAdmin.jsx'));
const StorePage = lazy(() => import('./pages/StorePage.jsx'));
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const ProductAdmin = lazy(() => import('./pages/ProductAdmin.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const BannerAdmin = lazy(() => import('./pages/BannerAdmin.jsx'));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const HowToOrder = lazy(() => import("./pages/HowToOrder.jsx"));
const AdminOrderDashboard = lazy(() => import("./pages/AdminOrderDashboard"));
const AdminOrderDetail = lazy(() => import("./pages/AdminOrderDetail.jsx"));
const AdminWithdrawals = lazy(() => import("./pages/AdminWithdrawals.jsx"));
const AdminShipping = lazy(() => import("./pages/AdminShipping.jsx"));
const DiscountManager = lazy(() => import("./pages/DiscountManager.jsx"));
const CategoryManager = lazy(() => import('./pages/CategoryManager.jsx'));
const AdminSettings = lazy(() => import('./pages/AdminSettings.jsx'));
const AdminChat = lazy(() => import("./pages/AdminChat"));
const CartPage = lazy(() => import('./pages/CartPage.jsx'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy.jsx'));
const TermsPage = lazy(() => import('./pages/TermsPage.jsx'));
const FAQPage = lazy(() => import('./pages/FAQPage.jsx'));
const AdminReviews = lazy(() => import('./pages/AdminReviews.jsx'));

// Page Loader Component
const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
    <div className="w-8 h-8 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Loading...</span>
  </div>
);


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
  }, [dark, location]);

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
      <ScrollToTop />
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
          </>
        )}

        {/* Adjust padding only for Customer Routes. AdminLayout handles its own padding/layout. */}
        <div className={!isAdminRoute ? "pt-[60px] md:pt-[88px] pb-20 md:pb-0" : ""}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
              <Route path="/admin/shipping" element={
                <ProtectedRoute role="admin">
                  <AdminLayout>
                    <AdminShipping />
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
              <Route path="/admin/reviews" element={
                <ProtectedRoute role="admin">
                  <AdminLayout>
                    <AdminReviews />
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
              <Route path="/admin/withdrawals" element={
                <ProtectedRoute role="admin">
                  <AdminLayout>
                    <AdminWithdrawals />
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
          </Suspense>
        </div>
        {!isAdminRoute && <MobileBottomNav onWishlistClick={() => setWishlistOpen(true)} />}
        {!isAdminRoute && <MarketingPopup />}
      </div>
    </div>
  );
}

export default App;
