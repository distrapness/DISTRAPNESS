const config = {
  API_URL: window.location.hostname === "localhost" 
    ? "http://localhost:5001" 
    : "https://online-shop-beige-one.vercel.app"
};

export default config;
