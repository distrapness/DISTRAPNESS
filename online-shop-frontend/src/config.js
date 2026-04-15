const config = {
  // Gunakan backend Vercel untuk KEDUANYA (Local & Production) agar data selalu sinkron
  API_URL: "https://online-shop-beige-one.vercel.app",

  // Jika ingin balik ke local server, uncomment baris bawah:
  // API_URL: process.env.NODE_ENV === 'production' ? "https://online-shop-beige-one.vercel.app" : "http://localhost:5001"
};

export { config };
export default config;
