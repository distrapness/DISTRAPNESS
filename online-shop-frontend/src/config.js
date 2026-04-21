const config = {
  API_URL: process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? "http://localhost:5001" 
    : "https://online-shop-beige-one.vercel.app")
};

export default config;
