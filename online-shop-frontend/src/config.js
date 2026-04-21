const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const envUrl = process.env.REACT_APP_API_URL;

const config = {
  API_URL: (isLocal && envUrl) ? envUrl : (isLocal ? "http://localhost:5001" : "https://online-shop-beige-one.vercel.app")
};

export default config;
