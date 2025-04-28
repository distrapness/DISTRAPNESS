import React, { useEffect, useRef } from "react";

export default function CroppedPreview({ imageUrl, crop, aspect }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!crop?.width || !crop?.height || !imageUrl) return;
    const image = new window.Image();
    image.src = imageUrl;
    image.onload = () => {
      const canvas = canvasRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );
    };
  }, [imageUrl, crop]);
  return (
    <canvas
      ref={canvasRef}
      style={{ width: 120, height: 120, borderRadius: 8, background: '#fff', border: '1px solid #eee', objectFit: 'contain' }}
    />
  );
}
