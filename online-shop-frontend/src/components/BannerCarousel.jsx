import React, { useEffect, useState } from "react";
import { useCurrency } from "../components/CurrencyContext.jsx";

import config from "../config.js";
import { getImageUrl } from "../utils/imageHelper";

const API_URL = `${config.API_URL}/api/banners`;

const BannerCarousel = () => {
  const { t } = useCurrency();
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hover, setHover] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Auto-change every 3 seconds
  useEffect(() => {
    if (banners.length < 2) return;
    const interval = setInterval(() => {
      next();
    }, 3000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Swipe Handlers (Touch & Mouse)
  const onStart = (clientX) => {
    setTouchEnd(null);
    setTouchStart(clientX);
  };

  const onMove = (clientX) => setTouchEnd(clientX);

  const onEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) next();
    if (isRightSwipe) prev();

    // Reset
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Mouse specific wrappers
  const onMouseDown = (e) => {
    e.preventDefault(); // Prevent text selection
    onStart(e.clientX);
  };
  const onMouseMove = (e) => {
    if (touchStart) onMove(e.clientX);
  };
  const onMouseUp = () => onEnd();
  const onMouseLeave = () => {
    if (touchStart) onEnd();
  };

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
            image: getImageUrl(banner.image)
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
      className="relative w-full h-[500px] md:h-auto md:aspect-[21/9] overflow-hidden flex items-center justify-center bg-gray-900 group cursor-grab active:cursor-grabbing"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); onMouseLeave(); }}

      // Touch Events
      onTouchStart={(e) => onStart(e.targetTouches[0].clientX)}
      onTouchMove={(e) => onMove(e.targetTouches[0].clientX)}
      onTouchEnd={onEnd}

      // Mouse Events
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <img
        src={banner.image}
        alt={banner.title || `Banner ${current + 1}`}
        className="object-cover w-full h-full absolute inset-0 opacity-80 pointer-events-none select-none"
      />

      {/* Overlay Gradient for better text readability */}
      <div className="absolute inset-0 bg-black/30 md:bg-black/20 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-start justify-end w-full h-full text-left px-4 md:px-12 pb-12 md:pb-24 max-w-[1600px] mx-auto pointer-events-none">
        {banner.title && (
          <h2 className="text-4xl md:text-6xl font-[900] text-white uppercase tracking-tighter leading-none mb-2 font-sans drop-shadow-md">
            {banner.title}
          </h2>
        )}
        {banner.subtitle && (
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pointer-events-auto">
            <p className="text-lg md:text-xl text-gray-200 tracking-widest font-light uppercase">
              {banner.subtitle}
            </p>
            {banner.link && (
              <a
                href={banner.link}
                className="inline-block bg-white text-black font-bold text-xs md:text-sm px-6 py-3 uppercase tracking-widest hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
              >
                {t('home.shopNow')}
              </a>
            )}
          </div>
        )}
      </div>

      {/* Tombol navigasi */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className={`absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full w-12 h-12 flex items-center justify-center transition-all ${hover ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}
            aria-label="Sebelumnya"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={next}
            className={`absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full w-12 h-12 flex items-center justify-center transition-all ${hover ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}
            aria-label="Selanjutnya"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${idx === current ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerCarousel;
