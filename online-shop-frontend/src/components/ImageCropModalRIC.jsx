import React, { useState, useRef, useEffect } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

// Opsi aspect ratio
const aspectOptions = [
  { label: "Bebas", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
];

// Fungsi untuk mendapatkan blob dari hasil crop
function getCroppedImg(image, crop, fileName, outputSize) {
  return new Promise((resolve, reject) => {
    try {
      if (!crop || !crop.width || !crop.height) {
        reject(new Error('Invalid crop area'));
        return;
      }

      // Output size jika ada
      let outW = crop.width;
      let outH = crop.height;
      if (outputSize && outputSize.width && outputSize.height) {
        outW = outputSize.width;
        outH = outputSize.height;
      }

      const canvas = document.createElement("canvas");
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      console.log('[CROPPER] Crop dimensions:', crop);
      console.log('[CROPPER] Image dimensions:', image.width, 'x', image.height, 'natural:', image.naturalWidth, 'x', image.naturalHeight);
      console.log('[CROPPER] Scale factors:', scaleX, scaleY);
      
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      
      // Fill with white background first
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        outW,
        outH
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          blob.name = fileName;
          console.log('[CROPPER] Blob created successfully:', blob.size, 'bytes');
          resolve(blob);
        },
        "image/jpeg",
        0.95
      );
    } catch (err) {
      console.error('[CROPPER] Error in getCroppedImg:', err);
      reject(err);
    }
  });
}

export default function ImageCropModalRIC({ open, imageFile, onSave, onCancel, aspect: aspectProp = 1, outputSize }) {
  const [crop, setCrop] = useState({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
  const [aspect, setAspect] = useState(aspectProp);
  const [error, setError] = useState('');
  const [completedCrop, setCompletedCrop] = useState(null);
  const [src, setSrc] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef(null);
  const objectUrlRef = useRef(null);

  // Reset state setiap kali modal dibuka/file berubah
  useEffect(() => {
    console.log('[CROP_MODAL] open:', open, 'imageFile:', imageFile);
    if (!open || !imageFile) return;
    setCrop({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
    setCompletedCrop(null);
    setError('');
    setSrc('');
    setIsLoading(true);
    // Validasi file gambar
    if (!(imageFile instanceof File) || !imageFile.type.startsWith('image/')) {
      setError('File tidak valid. Pilih file gambar.');
      setIsLoading(false);
      return;
    }
    // Buat object URL dan simpan di ref
    const url = URL.createObjectURL(imageFile);
    objectUrlRef.current = url;
    setSrc(url);
    setIsLoading(false);
    // Cleanup hanya saat unmount/berubah
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [open, imageFile]);

  useEffect(() => {
    setAspect(aspectProp);
  }, [aspectProp]);

  // Handler untuk gambar dimuat
  const onImageLoaded = (image) => {
    imgRef.current = image;
    return false;
  };

  // Handler untuk aspect ratio berubah
  const handleAspectChange = (newAspect) => {
    setAspect(newAspect);
  };

  // Handler untuk simpan hasil crop
  const handleSave = async () => {
    if (!imgRef.current || !completedCrop?.width || !completedCrop?.height) {
      setError('Belum ada area crop yang dipilih');
      return;
    }
    try {
      const blob = await getCroppedImg(imgRef.current, completedCrop, imageFile.name, outputSize);
      onSave(blob);
    } catch (err) {
      setError(`Error: ${err.message}`);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Crop Gambar Produk</h2>
            <button 
              onClick={onCancel} 
              className="text-gray-500 hover:text-black text-2xl transition"
            >
              &times;
            </button>
          </div>
          {/* Instructions */}
          <div className="text-gray-600 text-sm mb-4">
            Geser, resize area crop dengan drag sudut, dan pilih rasio. Klik Simpan jika sudah sesuai.
          </div>
          {/* Error Message */}
          {error && (
            <div className="text-red-600 bg-red-100 rounded px-3 py-1 my-2 text-sm">{error}</div>
          )}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Panel - Crop Area */}
            <div className="flex-1 min-w-[300px]">
              {/* Aspect Ratio Buttons */}
              <div className="mb-4 flex flex-wrap gap-2 items-center">
                <label className="font-semibold">Aspect Ratio:</label>
                {aspectOptions.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => handleAspectChange(opt.value)}
                    className={`px-2 py-1 rounded border text-sm ${aspect === opt.value ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {/* Crop Area */}
              <div className="relative w-full h-[60vw] max-h-[50vh] min-h-[300px] bg-gray-100 rounded mb-4 flex items-center justify-center overflow-hidden">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <div>Memuat gambar...</div>
                    </div>
                  </div>
                ) : src ? (
                  <>
                    <ReactCrop
                      src={src}
                      crop={crop}
                      onChange={newCrop => setCrop(newCrop)}
                      onComplete={c => setCompletedCrop(c)}
                      onImageLoaded={onImageLoaded}
                      aspect={aspect}
                      minWidth={40}
                      minHeight={40}
                      keepSelection
                      ruleOfThirds
                    />
                    {/* Hidden img for error handling */}
                    <img src={src} style={{ display: 'none' }} onError={() => setError('Gagal memuat gambar, file corrupt atau format tidak didukung.')} />
                    {error && <div className="text-red-500">{error}</div>}
                  </>
                ) : (
                  <div className="text-gray-500">Tidak ada gambar</div>
                )}
              </div>
            </div>
            {/* Right Panel - Preview */}
            <div className="flex flex-col items-center justify-start min-w-[140px] md:w-1/4">
              <div className="font-semibold mb-2">Preview</div>
              <div className="w-[120px] h-[120px] bg-gray-100 border rounded flex items-center justify-center">
                {completedCrop?.width && completedCrop?.height && imgRef.current ? (
                  <div className="w-full h-full overflow-hidden">
                    <canvas
                      ref={(canvas) => {
                        if (!canvas || !completedCrop?.width || !completedCrop?.height || !imgRef.current) return;
                        const ctx = canvas.getContext('2d');
                        const image = imgRef.current;
                        const scaleX = image.naturalWidth / image.width;
                        const scaleY = image.naturalHeight / image.height;
                        canvas.width = completedCrop.width;
                        canvas.height = completedCrop.height;
                        ctx.fillStyle = "white";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(
                          image,
                          completedCrop.x * scaleX,
                          completedCrop.y * scaleY,
                          completedCrop.width * scaleX,
                          completedCrop.height * scaleY,
                          0,
                          0,
                          completedCrop.width,
                          completedCrop.height
                        );
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <div className="text-gray-400">Preview</div>
                )}
              </div>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <button 
              onClick={onCancel} 
              className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded transition"
            >
              Tutup
            </button>
            <button
              onClick={handleSave}
              disabled={!completedCrop || !completedCrop.width || !completedCrop.height || isLoading}
              className={`px-4 py-2 rounded transition ${!completedCrop || !completedCrop.width || !completedCrop.height || isLoading 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
