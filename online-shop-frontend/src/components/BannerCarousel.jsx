import React, { useEffect, useState } from "react";

import config from "../config.js";
import { getImageUrl } from "../utils/imageHelper";

const API_URL = `${config.API_URL}/api/banners`;

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
      className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-gray-900"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <img
        src={banner.image}
        alt={banner.title || `Banner ${current + 1}`}
        className="object-cover w-full h-full absolute inset-0 opacity-80"
      />

      {/* Overlay Gradient for better text readability */}
      <div className="absolute inset-0 bg-black/30 md:bg-black/20" />

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full text-center px-4 max-w-5xl mx-auto mt-16 md:mt-0">
        {banner.title && (
          <h2 className="text-4xl md:text-7xl font-[900] text-white uppercase tracking-tighter leading-none mb-4 md:mb-6 font-sans">
            {banner.title}
          </h2>
        )}
        {banner.subtitle && (
          <p className="text-lg md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
            {banner.subtitle}
          </p>
        )}
        {banner.link && (
          <a
            href={banner.link}
            className="inline-block bg-white text-black font-bold text-sm md:text-base px-8 py-4 uppercase tracking-widest hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
          >
            Shop Collection
          </a>
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
