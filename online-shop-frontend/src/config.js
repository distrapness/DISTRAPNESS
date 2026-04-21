const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const envUrl = process.env.REACT_APP_API_URL;

const config = {
  API_URL: (isLocal && envUrl) ? envUrl : (isLocal ? "http://localhost:5001" : "https://online-shop-beige-one.vercel.app"),
  GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || "736173493721-ps67l5ps99sqb347f872r5m929s39pks.apps.googleusercontent.com" // Placeholder for demonstration
};

export default config;
