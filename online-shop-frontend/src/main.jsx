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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';

import { useState, useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Cache valid for 5 minutes
      refetchOnWindowFocus: false, // Prevent distracting background refetches
      retry: 1, // Fail fast locally
    },
  },
});

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
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={clientId}>
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
    </QueryClientProvider>
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