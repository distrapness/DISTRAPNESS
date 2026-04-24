const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const envUrl = process.env.REACT_APP_API_URL;

const config = {
  API_URL: process.env.REACT_APP_API_URL || (isLocal ? "http://localhost:5001" : "https://online-shop-beige-one.vercel.app"),
  GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || "67311538354-3kkrjm976iaptm7k40qgr5rrgefgu2i7.apps.googleusercontent.com"
};

export default config;
