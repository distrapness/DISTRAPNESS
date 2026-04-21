import React, { useState, useCallback, useRef, useEffect } from "react";
import Modal from "./Modal.jsx";
import Cropper from "react-easy-crop";
import config from "../config";

function getCroppedImg(imageSrc, croppedAreaPixels) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous"; // PENTING: Mencegah Tainted Canvas Error
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
  const response = await fetch(`${config.API_URL}/api/banners/upload`, {
    method: 'POST',
    headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` },
    body: formData
  });
  if (!response.ok) throw new Error('Gagal upload gambar');
  const data = await response.json();
  return data.url; // path statis (Base64 atau URI)
}

const EditBannerModal = ({ open, onClose, banner, onSave }) => {
  const fileInputRef = useRef();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);

  // State for the source image being cropped
  const [sourceImage, setSourceImage] = useState(null);

  // Initialize sourceImage when modal opens or banner changes
  useEffect(() => {
    if (open && banner) {
      // Prioritize original_image for editing, fallback to current image
      let initialImage = banner.original_image || banner.image;
      if (initialImage && initialImage.startsWith('/uploads/')) {
        initialImage = `${config.API_URL}${initialImage}`;
      }
      
      setSourceImage(initialImage);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setPreview(null);
      setCroppedAreaPixels(null);
    }
  }, [open, banner]);

  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setSourceImage(reader.result);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setPreview(null);
        setCroppedAreaPixels(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handlePreview = useCallback(async () => {
    if (!sourceImage || !croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(sourceImage, croppedAreaPixels);
    setPreview(URL.createObjectURL(croppedBlob));
  }, [sourceImage, croppedAreaPixels]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let imageUrl = banner.image;
      if (croppedAreaPixels && sourceImage) {
        const croppedBlob = await getCroppedImg(sourceImage, croppedAreaPixels);
        imageUrl = await uploadBannerToBackend(croppedBlob);
      }
      await onSave(imageUrl, sourceImage);
      onClose();
    } catch (e) {
      alert("Gagal menyimpan banner: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Edit Banner</h2>
        <div className="relative w-full h-60 bg-gray-100 rounded overflow-hidden mb-4">
          {sourceImage ? (
            <Cropper
              image={sourceImage}
              crossOrigin="anonymous"
              crop={crop}
              zoom={zoom}
              aspect={16 / 5}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Gambar tidak ditemukan
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={onFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 font-bold text-sm"
          >
            Ganti Gambar
          </button>
          {sourceImage && (
            <button
              onClick={handlePreview}
              className="px-4 py-2 bg-yellow-500 text-white rounded shadow hover:bg-yellow-600 font-bold text-sm"
            >
              Preview
            </button>
          )}
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
        </div>
        {preview && (
          <div className="mb-4">
            <img src={preview} alt="Preview" className="w-full rounded shadow" />
          </div>
        )}
        <div className="flex gap-4 justify-end">
          <button
            className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            onClick={onClose}
            disabled={saving}
          >
            Batal
          </button>
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 font-bold"
            onClick={handleSave}
            disabled={saving || !sourceImage}
          >
            Simpan
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EditBannerModal;
