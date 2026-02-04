import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";

function getCroppedImg(imageSrc, croppedAreaPixels) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;
    image.onload = () => {
      try {
        // Validasi crop area
        if (!croppedAreaPixels || !croppedAreaPixels.width || !croppedAreaPixels.height) {
          reject(new Error("Invalid crop area"));
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;
        const ctx = canvas.getContext("2d");

        // Gambar ke canvas
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

        // Convert ke blob dengan kualitas 90%
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas to Blob failed"));
              return;
            }
            console.log("[CROP] Blob created successfully:", blob.size, "bytes");
            resolve(blob);
          },
          "image/jpeg",
          0.9
        );
      } catch (err) {
        console.error("[CROP] Error in getCroppedImg:", err);
        reject(err);
      }
    };
    image.onerror = (err) => {
      console.error("[CROP] Image loading error:", err);
      reject(err);
    };
  });
}

const aspectOptions = [
  { label: "1:1 (Kotak)", value: 1 },
  { label: "3:4 (Portrait)", value: 3 / 4 },
  { label: "4:3 (Landscape)", value: 4 / 3 },
  { label: "2:3 (Portrait)", value: 2 / 3 },
  { label: "3:2 (Landscape)", value: 3 / 2 },
  { label: "Bebas (Sesuai Gambar)", value: null },
];

const ImageCropModal = ({ open, imageFile, onSave, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [aspect, setAspect] = useState(1); // default kotak
  const [imgDimensions, setImgDimensions] = useState({ width: 1, height: 1 });
  const [cropError, setCropError] = useState("");
  const [imageUrl, setImageUrl] = useState(null);

  // Load image dan set dimensions
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);

      const img = new window.Image();
      img.onload = () => {
        console.log("[CROP] Image loaded:", img.width, "x", img.height);
        setImgDimensions({ width: img.width, height: img.height });

        // Set default aspect ratio berdasarkan gambar jika pilihan "Bebas"
        if (!aspect || aspect === null) {
          setAspect(img.width / img.height);
        }
      };
      img.src = url;

      return () => {
        URL.revokeObjectURL(url);
        setImageUrl(null);
      };
    }
  }, [imageFile, aspect]);

  // Adjust zoom untuk fit-to-image
  useEffect(() => {
    if (aspect && imgDimensions.width && imgDimensions.height) {
      // Hitung zoom yang optimal agar gambar selalu muat dalam crop area
      const imageRatio = imgDimensions.width / imgDimensions.height;
      let fitZoom = 1;

      if (aspect >= imageRatio) {
        // Landscape crop area, fit to height
        fitZoom = 1 / (aspect / imageRatio);
      } else {
        // Portrait crop area, fit to width
        fitZoom = 1 / (imageRatio / aspect);
      }

      // Batas minimum zoom agar tidak terlalu kecil
      setZoom(Math.max(fitZoom, 0.5));
      console.log("[CROP] Set zoom to:", Math.max(fitZoom, 0.5));
    } else {
      setZoom(1);
    }
  }, [aspect, imgDimensions]);

  // Handle crop complete
  const onCropComplete = useCallback((_, areaPixels) => {
    if (areaPixels && areaPixels.width > 20 && areaPixels.height > 20) {
      setCroppedAreaPixels(areaPixels);
      setCropError("");
      console.log("[CROP] Crop area updated:", areaPixels);
    } else {
      setCroppedAreaPixels(null);
      setCropError("Area crop terlalu kecil");
    }
  }, []);

  // Handle save
  const handleSave = async () => {
    setCropError("");

    if (!croppedAreaPixels || !croppedAreaPixels.width || !croppedAreaPixels.height) {
      setCropError("Area crop belum dipilih atau terlalu kecil");
      return;
    }

    try {
      console.log("[CROP] Saving crop with area:", croppedAreaPixels);
      const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels);

      if (!croppedBlob) {
        setCropError("Gagal membuat hasil crop");
        return;
      }

      console.log("[CROP] Crop saved successfully, blob size:", croppedBlob.size);
      onSave(croppedBlob);
    } catch (err) {
      console.error("[CROP] Error saving crop:", err);
      setCropError("Error: " + (err.message || "Gagal menyimpan hasil crop"));
    }
  };

  // Reset crop jika aspect ratio berubah
  const handleAspectChange = (newAspect) => {
    setAspect(newAspect);
    setCrop({ x: 0, y: 0 }); // Reset crop position
    setCroppedAreaPixels(null);
  };

  if (!open || !imageFile || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white p-6 rounded shadow-lg max-w-2xl w-full">
        <h2 className="font-bold mb-2">Crop Gambar Produk</h2>
        <div className="text-gray-600 text-sm mb-2">Geser, zoom, dan pilih rasio. Untuk memperbesar/kecil crop, atur slider zoom. Jika ingin crop bebas, pilih "Bebas (Sesuai Gambar)".</div>

        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <label className="font-semibold">Rasio Aspek:</label>
          {aspectOptions.map(opt => (
            <button
              key={opt.label}
              onClick={() => handleAspectChange(opt.value === null ? imgDimensions.width / imgDimensions.height : opt.value)}
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
            style={{
              containerStyle: {
                width: '100%',
                height: '100%',
                backgroundColor: '#f0f0f0',
                borderRadius: '8px',
              },
              cropAreaStyle: {
                border: '2px solid #fff',
                boxShadow: '0 0 0 9999em rgba(0, 0, 0, 0.7)',
              },
            }}
            minZoom={0.5}
            maxZoom={5}
            showGrid={true}
          />
        </div>

        <div className="flex gap-2 items-center mb-4">
          <label>Zoom:</label>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm">{zoom.toFixed(2)}x</span>
        </div>

        {cropError && (
          <div className="text-red-600 bg-red-100 rounded px-3 py-1 mb-3 text-sm">{cropError}</div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">Batal</button>
          <button
            onClick={handleSave}
            disabled={!croppedAreaPixels}
            className={`px-4 py-2 rounded ${!croppedAreaPixels ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white'}`}
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
