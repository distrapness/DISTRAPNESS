import React, { useRef, useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import config from "../config";

// Helper to get cropped image as blob
function getCroppedImg(imageSrc, croppedAreaPixels) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      
      let targetWidth = croppedAreaPixels.width;
      let targetHeight = croppedAreaPixels.height;
      const maxBannerWidth = 1200;
      if (targetWidth > maxBannerWidth) {
        targetHeight = Math.round((targetHeight * maxBannerWidth) / targetWidth);
        targetWidth = maxBannerWidth;
      }
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        targetWidth,
        targetHeight
      );
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.80);
    };
    image.onerror = reject;
  });
}

// Tambahkan fungsi upload ke backend dan simpan path statis
async function uploadBannerToBackend(blob) {
  const formData = new FormData();
  formData.append('image', blob, 'banner.jpg');
  const response = await fetch(`${config.API_URL}/api/banners/upload`, {
    method: 'POST',
    headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` },
    body: formData
  });
  if (!response.ok) throw new Error('Gagal upload gambar');
  const data = await response.json();
  return data.url; // path statis, misal /uploads/banner-xxx.jpg
}

const BannerUploader = ({ onConfirm }) => {
  const inputRef = useRef();
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [step, setStep] = useState('upload'); // upload | crop | preview

  const [uploading, setUploading] = useState(false);

  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result);
        setStep('crop');
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showCroppedImage = useCallback(async () => {
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const croppedUrl = URL.createObjectURL(croppedBlob);
      setCroppedImage(croppedUrl);
      setStep('preview');
    } catch (e) {
      alert('Gagal crop gambar');
    }
  }, [imageSrc, croppedAreaPixels]);

  const handleConfirm = async () => {
    if (onConfirm && croppedImage) {
      setUploading(true);
      try {
        // Konversi croppedImage (blob url) ke blob
        const blob = await fetch(croppedImage).then(r => r.blob());
        // Upload ke backend
        const staticUrl = await uploadBannerToBackend(blob);
        onConfirm(staticUrl, imageSrc); // Kirim path statis dan gambar asli ke admin
        setImageSrc(null);
        setCroppedImage(null);
        setStep('upload');
      } catch (err) {
        alert("Gagal menyimpan banner: " + err.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleEdit = () => {
    setStep('crop');
  };

  return (
    <div className="w-full flex flex-col items-center my-6">
      {step === 'upload' && (
        <div className="flex flex-col items-center gap-4">
          <input
            type="file"
            accept="image/*"
            ref={inputRef}
            onChange={onFileChange}
            className="hidden"
          />
          <button
            onClick={() => inputRef.current.click()}
            className="px-8 py-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 font-black uppercase tracking-widest transition-all transform hover:scale-105"
          >
            Pilih Gambar Banner
          </button>
        </div>
      )}
      {step === 'crop' && imageSrc && (
        <div className="w-full flex flex-col items-center">
          <div className="relative w-full max-w-2xl h-64 bg-gray-100 dark:bg-gray-900 rounded-3xl overflow-hidden shadow-inner mb-6">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={16 / 5}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="flex flex-wrap justify-center gap-6 items-center">
            <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full">
              <label className="font-bold text-sm text-gray-600 dark:text-gray-300">Zoom:</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                className="w-32 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={showCroppedImage}
                className="px-6 py-2 bg-indigo-600 text-white rounded-full shadow-lg font-bold hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest"
              >
                Preview Banner
              </button>
              <button
                onClick={() => setStep('upload')}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full font-bold hover:bg-gray-300 transition-all uppercase text-xs tracking-widest"
              >
                Ganti Gambar
              </button>
            </div>
          </div>
        </div>
      )}
      {step === 'preview' && croppedImage && (
        <div className="w-full flex flex-col items-center animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800 mb-6">
            <img
              src={croppedImage}
              alt="Preview Banner"
              className="w-full h-auto object-cover object-center"
              style={{ maxHeight: 300 }}
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleEdit}
              className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full font-black uppercase tracking-widest transition-all hover:bg-gray-300 text-sm"
              disabled={uploading}
            >
              Edit Crop
            </button>
            <button
              onClick={handleConfirm}
              className="px-10 py-3 bg-green-600 text-white rounded-full shadow-lg font-black uppercase tracking-widest transition-all hover:bg-green-700 transform hover:scale-105 active:scale-95 disabled:opacity-50 text-sm"
              disabled={uploading}
            >
              {uploading ? 'Menyimpan...' : 'Simpan Banner'}
            </button>
          </div>
        </div>
      )}
    </div>

  );
};

export default BannerUploader;
