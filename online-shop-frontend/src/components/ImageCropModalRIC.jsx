import React, { useState, useRef, useEffect } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import CroppedPreview from "./CroppedPreview";

function getCroppedImg(image, crop, fileName) {
  const canvas = document.createElement("canvas");
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

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        blob.name = fileName;
        resolve(blob);
      },
      "image/jpeg",
      1
    );
  });
}

const aspectOptions = [
  { label: "Bebas", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
];

export default function ImageCropModalRIC({ open, imageFile, initialCrop, onSave, onCancel }) {
  // Gunakan satuan px untuk crop secara konsisten
  const getDefaultCrop = (img, aspectRatio) => {
    if (!img) return { unit: 'px', x: 0, y: 0, width: 100, height: 100, aspect: aspectRatio };
    // Buat crop default 80% dari sisi terpendek gambar, posisi di tengah
    let width, height;
    if (img.width >= img.height) {
      height = Math.round(img.height * 0.8);
      width = Math.round(height * aspectRatio);
      if (width > img.width) width = img.width;
    } else {
      width = Math.round(img.width * 0.8);
      height = Math.round(width / aspectRatio);
      if (height > img.height) height = img.height;
    }
    const x = Math.round((img.width - width) / 2);
    const y = Math.round((img.height - height) / 2);
    return {
      unit: 'px',
      x,
      y,
      width: Math.max(width, 40),
      height: Math.max(height, 40),
      aspect: aspectRatio
    };
  };

  const [crop, setCrop] = useState(initialCrop || getDefaultCrop(null, 1));
  const [completedCrop, setCompletedCrop] = useState(null);
  const [aspect, setAspect] = useState(1);
  const [cropError, setCropError] = useState("");
  const imgRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    if (imageFile && imageFile instanceof File) {
      try {
        const url = URL.createObjectURL(imageFile);
        setImageUrl(url);
        console.log('[CROPPER] URL dibuat:', url);
        return () => URL.revokeObjectURL(url);
      } catch (err) {
        console.error('[CROPPER] Error createObjectURL:', err);
        setImageUrl(null);
      }
    } else {
      setImageUrl(null);
    }
  }, [imageFile]);

  const onImageLoaded = (img) => {
    imgRef.current = img;
    // Pastikan crop default proporsional dan berada di tengah gambar
    const crop = getDefaultCrop(img, aspect || 1);
    setCrop(crop);
    setCompletedCrop(null);
    return false;
  };

  const handleSave = async () => {
    setCropError("");
    console.log('[CROPPER] handleSave', completedCrop);
    if (!completedCrop || !completedCrop.width || !completedCrop.height) {
      setCropError('Area crop belum dipilih!');
      return;
    }
    if (imgRef.current && completedCrop?.width && completedCrop?.height) {
      try {
        const blob = await getCroppedImg(imgRef.current, completedCrop, imageFile.name);
        if (!blob) {
          setCropError('Gagal membuat gambar hasil crop. Silakan ulangi.');
          return;
        }
        if (onSave) {
          onSave(blob);
        } else {
          setCropError('onSave tidak terdefinisi!');
        }
      } catch (err) {
        setCropError('Terjadi error saat crop: ' + err.message);
        console.error('[CROPPER] Error cropping:', err);
      }
    }
  };

  const handleReset = () => {
    setCrop(getDefaultCrop(imgRef.current, aspect || 1));
    setCompletedCrop(null);
  };

  if (!open || !imageFile || !imageUrl || !crop) return null;
  console.log('[CROPPER] Akan render ReactCrop dengan src:', imageUrl, 'dan crop:', crop);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white p-6 rounded shadow-lg max-w-3xl w-full flex flex-col md:flex-row gap-6">
        <div className="flex-1 min-w-[300px]">
          <h2 className="font-bold mb-2">Crop Gambar Produk</h2>
          <div className="text-gray-600 text-sm mb-2">Geser, resize area crop dengan drag sudut, dan pilih rasio. Klik Simpan jika sudah sesuai.</div>
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <label className="font-semibold">Aspect Ratio:</label>
            {aspectOptions.map(opt => (
              <button
                key={opt.label}
                onClick={() => setAspect(opt.value)}
                className={`px-2 py-1 rounded border text-sm ${aspect === opt.value ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="relative w-full h-[60vw] max-h-[60vh] min-h-[300px] bg-gray-100 rounded mb-4 flex items-center justify-center" style={{ minWidth: 300, minHeight: 300 }}>
            {imageUrl ? (
              <div style={{width: '100%', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f3f3', borderRadius: 8}}>
                {/* Tambahkan img langsung untuk debug */}
                <img 
                  src={imageUrl} 
                  alt="Debug" 
                  style={{position: 'absolute', maxWidth: '80%', maxHeight: '80%', opacity: 0.3, zIndex: 1}} 
                />
                <ReactCrop
                  src={imageUrl}
                  crop={crop}
                  onChange={c => {
                    const safeCrop = {
                      ...c,
                      width: Math.max(c.width, 40),
                      height: Math.max(c.height, 40)
                    };
                    setCrop(safeCrop);
                    console.log('[CROPPER] crop changed:', safeCrop);
                  }}
                  onComplete={c => {
                    if (c && c.width && c.height && c.width >= 40 && c.height >= 40) {
                      setCompletedCrop(c);
                      console.log('[CROPPER] onComplete crop:', c);
                    } else {
                      setCompletedCrop(null);
                    }
                  }}
                  aspect={aspect}
                  minWidth={20}
                  minHeight={20}
                  keepSelection={true}
                  onImageLoaded={onImageLoaded}
                  imageStyle={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    display: 'block',
                    objectFit: 'contain',
                    margin: 'auto',
                    background: '#fff',
                    borderRadius: 8,
                    border: '1px solid red' // Border untuk debug
                  }}
                  className="max-w-full max-h-full"
                  style={{ width: '100%', height: '100%', zIndex: 10 }}
                />
              </div>
            ) : (
              <div className="text-gray-400">Gambar gagal dimuat</div>
            )}
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={handleReset} className="px-4 py-2 bg-gray-200 rounded">Atur ulang</button>
          </div>
        </div>
        {/* Preview panel */}
        <div className="flex flex-col items-center justify-center min-w-[140px]">
          <div className="font-semibold mb-2">Preview</div>
          {imageUrl && completedCrop && completedCrop.width && completedCrop.height ? (
            <CroppedPreview imageUrl={imageUrl} crop={completedCrop} aspect={aspect} />
          ) : (
            <div className="w-[120px] h-[120px] bg-gray-100 border rounded flex items-center justify-center text-gray-400">Preview</div>
          )}
        </div>
        {/* End Preview */}
        <div className="absolute right-6 top-6">
          <button onClick={onCancel} className="text-gray-500 hover:text-black text-xl">&times;</button>
        </div>
      </div>
      <div className="absolute bottom-10 left-0 w-full flex flex-col items-center gap-2">
        {cropError && (
          <div className="text-red-600 bg-red-100 rounded px-3 py-1 mb-1 text-sm">{cropError}</div>
        )}
        <div className="flex justify-center gap-4 w-full">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">Tutup</button>
          <button
            onClick={handleSave}
            disabled={!completedCrop || !completedCrop.width || !completedCrop.height}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
