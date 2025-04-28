import React from "react";

/**
 * Banner component for displaying a responsive banner image.
 * - The banner will automatically scale to fit the width of its container.
 * - The height will adjust proportionally based on the image's aspect ratio.
 * - Accepts an optional alt text and custom className.
 *
 * Usage:
 * <Banner src="/assets/banner.jpg" alt="Promo" />
 */
const Banner = ({ src, alt = "Banner", className = "" }) => {
  const [error, setError] = React.useState(false);
  const [fallback, setFallback] = React.useState(false);
  // Pastikan path gambar selalu full URL jika /uploads/
  const realSrc = src && src.startsWith('/uploads/') ? `http://localhost:5001${src}` : src;
  const handleError = (e) => {
    if (!error) {
      setError(true);
      if (e && e.target) {
        e.target.onerror = null;
        e.target.src = "/assets/placeholder-banner.jpg";
      }
    } else if (!fallback) {
      setFallback(true);
      if (e && e.target) {
        e.target.onerror = null;
        e.target.src = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";
      }
    }
  };
  return (
    <div className={`w-full flex justify-center items-center overflow-hidden rounded-lg shadow-md my-4 ${className}`} style={{minHeight: 120, maxHeight: 400}}>
      <img
        src={fallback ? "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80" : error ? "/assets/placeholder-banner.jpg" : realSrc}
        alt={alt}
        className="w-full h-auto object-cover object-center"
        style={{maxHeight: 400, width: '100%', height: 'auto'}}
        onError={handleError}
      />
    </div>
  );
};

export default Banner;
