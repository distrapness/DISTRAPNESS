import React from 'react';
import config from './config';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { CurrencyProvider } from './components/CurrencyContext';
import { BannerProvider } from './contexts/BannerContext';
import { CartProvider } from './components/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { WishlistProvider } from './components/WishlistContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';

import { useState, useEffect } from 'react';

const RootComponent = () => {
  const [clientId, setClientId] = useState(config.GOOGLE_CLIENT_ID);

  useEffect(() => {
    fetch(`${config.API_URL}/api/config/public`)
      .then(r => r.json())
      .then(d => {
        if (d.google_client_id && d.google_client_id !== config.GOOGLE_CLIENT_ID) {
          setClientId(d.google_client_id);
        }
      })
      .catch(() => {
        // Fallback already set
      });
  }, []);

  return (
    <GoogleOAuthProvider clientId={clientId}>
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
    </GoogleOAuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('SW registered:', reg);
    }).catch(err => {
      console.log('SW failed:', err);
    });
  });
}