import React, { useState, useRef } from "react";

const API_URL = "http://localhost:5001/api/banners";
const UPLOAD_API_URL = "http://localhost:5001/api/banners/upload";

const EditBannerForm = ({ banner, onBannerUpdated, onClose }) => {
  const [title, setTitle] = useState(banner?.title || "");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(banner?.image ? (banner.image.startsWith("/uploads/") ? `http://localhost:5001${banner.image}` : banner.image) : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setImageFile(f);
    setPreview(f ? URL.createObjectURL(f) : preview);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let imageUrl = banner.image;
      if (imageFile) {
        // Upload gambar baru ke backend
        const formData = new FormData();
        formData.append("image", imageFile);
        const res = await fetch(UPLOAD_API_URL, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Gagal upload gambar");
        const data = await res.json();
        imageUrl = data.url;
      }
      // Update banner di backend
      const bannerPayload = title ? { image: imageUrl, title } : { image: imageUrl };
      const res2 = await fetch(`${API_URL}/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bannerPayload),
      });
      if (!res2.ok) throw new Error("Gagal mengedit banner");
      if (onBannerUpdated) await onBannerUpdated();
      if (onClose) onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md mx-auto mb-8">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Edit Banner</h2>
      <div className="mb-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="mb-2"
          onChange={handleFileChange}
        />
        {preview && (
          <img src={preview} alt="Preview" className="w-full h-40 object-contain rounded mb-2 bg-gray-100" />
        )}
      </div>
      <div className="mb-4">
        <input
          type="text"
          name="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Judul banner (boleh dikosongkan)"
        />
      </div>
      <form onSubmit={handleSubmit}>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <button
          type="submit"
          className="bg-black text-white px-6 py-2 rounded font-bold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
          disabled={loading}
        >
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>
    </div>
  );
};

export default EditBannerForm;
