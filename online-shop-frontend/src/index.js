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
import { GoogleOAuthProvider } from '@react-oauth/google';
import config from './config.js';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={config.GOOGLE_CLIENT_ID}>
      <ErrorBoundary>
        <BrowserRouter>
          <CurrencyProvider>
            <BannerProvider>
              <AuthProvider>
                <CartProvider>
                  <WishlistProvider>
                    <App />
                  </WishlistProvider>
                </CartProvider>
              </AuthProvider>
            </BannerProvider>
          </CurrencyProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
