import React, { useState, useEffect } from 'react';
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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import config from './config.js';
import './index.css';

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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister().then(() => {
        console.log('Service Worker unregistered successfully.');
      });
    }
  }).catch(err => {
    console.warn('Error during service worker unregistration:', err);
  });
}
