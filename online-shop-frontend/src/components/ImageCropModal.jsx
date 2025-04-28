import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";

function getCroppedImg(imageSrc, croppedAreaPixels) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg");
    };
    image.onerror = reject;
  });
}

const aspectOptions = [
  { label: "1:1 (Kotak)", value: 1 },
  { label: "3:4 (Portrait)", value: 3/4 },
  { label: "4:3 (Landscape)", value: 4/3 },
  { label: "2:3 (Portrait)", value: 2/3 },
  { label: "3:2 (Landscape)", value: 3/2 },
  { label: "Bebas (Sesuai Gambar)", value: null },
];

const ImageCropModal = ({ open, imageFile, onSave, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [aspect, setAspect] = useState(1); // default kotak
  const [imgDimensions, setImgDimensions] = useState({ width: 1, height: 1 });

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      const img = new window.Image();
      img.onload = () => {
        setImgDimensions({ width: img.width, height: img.height });
        if (!aspect || aspect === null) {
          setAspect(img.width / img.height);
        }
      };
      img.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  useEffect(() => {
    // Fit-to-image: set zoom minimum agar gambar selalu muat dalam crop area
    if (aspect && imgDimensions.width && imgDimensions.height) {
      const containerRatio = 1; // container aspect ratio (square modal)
      let fitZoom = 1;
      if (aspect >= 1) {
        fitZoom = imgDimensions.height / imgDimensions.width / aspect;
      } else {
        fitZoom = imgDimensions.width / imgDimensions.height * aspect;
      }
      setZoom(Math.max(fitZoom, 0.3));
    } else {
      setZoom(1);
    }
  }, [aspect, imgDimensions.width, imgDimensions.height]);

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleSave = async () => {
    const imageUrl = URL.createObjectURL(imageFile);
    const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels);
    onSave(croppedBlob);
  };

  if (!open || !imageFile) return null;

  const imageUrl = URL.createObjectURL(imageFile);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white p-6 rounded shadow-lg max-w-2xl w-full">
        <h2 className="font-bold mb-2">Crop Gambar Produk</h2>
        <div className="text-gray-600 text-sm mb-2">Geser, zoom, dan pilih rasio. Untuk memperbesar/kecil crop, atur slider zoom. Jika ingin crop bebas, pilih "Bebas (Sesuai Gambar)".</div>
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <label className="font-semibold">Aspect Ratio:</label>
          {aspectOptions.map(opt => (
            <button
              key={opt.label}
              onClick={() => setAspect(opt.value === null ? imgDimensions.width / imgDimensions.height : opt.value)}
              className={`px-2 py-1 rounded border text-sm ${aspect === (opt.value === null ? imgDimensions.width / imgDimensions.height : opt.value) ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="relative w-full h-[60vw] max-h-[70vh] min-h-[350px] bg-gray-100 rounded mb-4 flex items-center justify-center">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            crossOrigin="anonymous"
            style={{ containerStyle: { width: '100%', height: '100%' } }}
            minZoom={0.1}
            maxZoom={5}
            restrictPosition={false}
          />
        </div>
        <div className="flex gap-2 items-center mb-4">
          <label>Zoom:</label>
          <input type="range" min={0.1} max={5} step={0.01} value={zoom} onChange={e => setZoom(Number(e.target.value))} />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">Batal</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">Simpan</button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
