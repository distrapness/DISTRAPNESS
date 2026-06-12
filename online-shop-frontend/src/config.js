const config = {
  API_URL: window.location.hostname === "localhost" 
    ? "http://localhost:5001" 
    : window.location.origin,
  GOOGLE_CLIENT_ID: "67311538354-3kkrjm976iaptm7k40qgr5rrgefgu2i7.apps.googleusercontent.com"
};

export default config;
