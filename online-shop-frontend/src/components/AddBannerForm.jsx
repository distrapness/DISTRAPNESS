import React, { useState, useRef } from "react";

const API_URL = "http://localhost:5001/api/banners";
const UPLOAD_API_URL = "http://localhost:5001/api/banners/upload";
const initialState = { title: "" };

const AddBannerForm = ({ onBannerAdded }) => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const inputRef = useRef();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setImageFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!imageFile) throw new Error("Pilih gambar terlebih dahulu");
      // Upload gambar ke backend
      const formData = new FormData();
      formData.append("image", imageFile);
      const res = await fetch(UPLOAD_API_URL, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Gagal upload gambar");
      const data = await res.json();
      // Submit data banner ke backend
      const bannerPayload = form.title ? { image: data.url, title: form.title } : { image: data.url };
      const res2 = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bannerPayload),
      });
      if (!res2.ok) throw new Error("Gagal menambah banner");
      setSuccess("Banner berhasil ditambahkan!");
      setForm(initialState);
      setImageFile(null);
      setPreview(null);
      if (onBannerAdded) onBannerAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md mx-auto mb-8">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Tambah Banner Baru</h2>
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
          value={form.title}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Judul banner (boleh dikosongkan)"
        />
      </div>
      <form onSubmit={handleSubmit}>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}
        <button
          type="submit"
          className="bg-black text-white px-6 py-2 rounded font-bold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
          disabled={loading || !imageFile}
        >
          {loading ? "Menyimpan..." : "Tambah Banner"}
        </button>
      </form>
    </div>
  );
};

export default AddBannerForm;
