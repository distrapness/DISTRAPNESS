import React, { useRef, useState, useCallback } from "react";
import Cropper from "react-easy-crop";

// Helper to get cropped image as blob
function getCroppedImg(imageSrc, croppedAreaPixels) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext('2d');
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
      }, 'image/jpeg');
    };
    image.onerror = reject;
  });
}

// Tambahkan fungsi upload ke backend dan simpan path statis
async function uploadBannerToBackend(blob) {
  const formData = new FormData();
  formData.append('image', blob, 'banner.jpg');
  const response = await fetch('http://localhost:5001/api/banners/upload', {
    method: 'POST',
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
      // Konversi croppedImage (blob url) ke blob
      const blob = await fetch(croppedImage).then(r => r.blob());
      // Upload ke backend
      const staticUrl = await uploadBannerToBackend(blob);
      onConfirm(staticUrl); // Kirim path statis ke admin
    }
    setImageSrc(null);
    setCroppedImage(null);
    setStep('upload');
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
            className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 font-bold"
          >
            Pilih Gambar Banner
          </button>
        </div>
      )}
      {step === 'crop' && imageSrc && (
        <div className="w-full flex flex-col items-center">
          <div className="relative w-full max-w-2xl h-64 bg-gray-100 rounded overflow-hidden">
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
          <div className="flex gap-4 mt-4 items-center">
            <label className="font-bold">Zoom:</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="w-40"
            />
            <button
              onClick={showCroppedImage}
              className="px-6 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 font-bold"
            >
              Preview
            </button>
            <button
              onClick={() => setStep('upload')}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Ganti Gambar
            </button>
          </div>
        </div>
      )}
      {step === 'preview' && croppedImage && (
        <div className="w-full flex flex-col items-center">
          <div className="w-full max-w-2xl">
            <img
              src={croppedImage}
              alt="Preview Banner"
              className="w-full h-auto rounded shadow object-cover object-center"
              style={{maxHeight: 300}}
            />
          </div>
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleEdit}
              className="px-6 py-2 bg-yellow-500 text-white rounded shadow hover:bg-yellow-600 font-bold"
            >
              Edit
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 font-bold"
            >
              Konfirmasi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerUploader;
