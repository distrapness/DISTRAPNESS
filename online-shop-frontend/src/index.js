import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { CurrencyProvider } from './components/CurrencyContext.jsx';
import { BannerProvider } from './contexts/BannerContext.js';
import { CartProvider } from './components/CartContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { WishlistProvider } from './components/WishlistContext.jsx';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <CurrencyProvider>
          <BannerProvider>
            <CartProvider>
              <AuthProvider>
                <WishlistProvider>
                  <App />
                </WishlistProvider>
              </AuthProvider>
            </CartProvider>
          </BannerProvider>
        </CurrencyProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
