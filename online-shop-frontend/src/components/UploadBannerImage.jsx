import React, { useRef, useState } from "react";
import config from "../config";

const API_URL = `${config.API_URL}/api/banners/upload`;

const UploadBannerImage = ({ onUploaded }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const inputRef = useRef();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
    setError(null);
    setSuccess(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
    setError(null);
    setSuccess(null);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError("Pilih file gambar terlebih dahulu");
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Gagal upload gambar");
      const data = await res.json();
      setSuccess("Upload berhasil!");
      setFile(null);
      setPreview(null);
      if (onUploaded) onUploaded(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="mb-6">
      <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-200">Upload Gambar Banner (drag & drop atau klik)</label>
      <div
        className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 cursor-pointer hover:border-blue-400 transition mb-2"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current && inputRef.current.click()}
        style={{ minHeight: 120 }}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-32 mb-2 rounded" />
        ) : (
          <span className="text-gray-500 dark:text-gray-300">Pilih atau seret gambar ke sini</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <button
        type="submit"
        className="bg-black text-white px-5 py-2 rounded font-bold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
        disabled={loading}
      >
        {loading ? "Mengupload..." : "Upload Gambar"}
      </button>
    </form>
  );
};

export default UploadBannerImage;
