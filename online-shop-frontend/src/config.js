const config = {
  API_URL: process.env.NODE_ENV === 'production'
    ? (process.env.REACT_APP_API_URL || "https://online-shop-beige-one.vercel.app")
    : "http://localhost:5001", // Local dev default
};

export default config;
