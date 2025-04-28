import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:5001/api/banners";

const BannerCarousel = () => {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hover, setHover] = useState(false);
  const HEADER_HEIGHT = 88; // px, agar tidak tertutup header

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil banner");
        return res.json();
      })
      .then((data) => {
        setBanners(
          data.map(banner => ({
            ...banner,
            image: banner.image && banner.image.startsWith('/uploads/')
              ? `http://localhost:5001${banner.image}`
              : banner.image
          }))
        );
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const next = () => setCurrent((prev) => (prev + 1) % banners.length);
  const prev = () => setCurrent((prev) => (prev - 1 + banners.length) % banners.length);

  if (loading) return <div className="w-full h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-b-3xl mb-12">Memuat banner...</div>;
  if (error) return <div className="w-full h-64 flex items-center justify-center bg-red-100 text-red-600 rounded-b-3xl mb-12">{error}</div>;
  if (!banners.length) return <div className="w-full h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-b-3xl mb-12">Belum ada banner.</div>;

  const banner = banners[current];

  return (
    <div
      className="relative w-screen max-w-none left-1/2 right-1/2 -translate-x-1/2 h-64 md:h-[420px] overflow-hidden flex items-center justify-center"
      style={{marginTop:0, marginBottom:0, borderRadius:0, top:0, paddingTop:HEADER_HEIGHT, background:'transparent'}}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <img
        src={banner.image}
        alt={banner.title || `Banner ${current + 1}`}
        className="object-cover w-full h-full absolute inset-0"
        style={{zIndex:1, borderRadius:0, marginTop:0, top:0, paddingTop:0}}
      />
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full text-center px-4">
        {banner.title && <h2 className="text-2xl md:text-4xl font-bold text-white drop-shadow mb-2 uppercase tracking-widest leading-tight md:leading-snug max-w-2xl mx-auto">{banner.title}</h2>}
        {banner.subtitle && <p className="text-base md:text-xl text-white mb-4 drop-shadow max-w-xl mx-auto">{banner.subtitle}</p>}
        {banner.link && (
          <a href={banner.link} target="_blank" rel="noopener noreferrer" className="inline-block bg-white/80 text-blue-700 font-bold px-6 py-2 rounded-full shadow hover:bg-blue-50 transition-colors mt-2">Lihat Promo</a>
        )}
      </div>
      {/* Tombol navigasi hanya muncul saat hover */}
      {hover && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-black font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-lg z-20"
            aria-label="Sebelumnya"
          >
            &#8592;
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-black font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-lg z-20"
            aria-label="Selanjutnya"
          >
            &#8594;
          </button>
        </>
      )}
    </div>
  );
};

export default BannerCarousel;
