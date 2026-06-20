import React, { useState, useEffect } from "react";
import BackButton from "../components/BackButton.jsx";
import config from '../config.js';

const API_URL = `${config.API_URL}/api/brand`;
const UPLOAD_URL = `${config.API_URL}/api/upload`;

function processLogo(file, maxSize = 300) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = function () {
      let w = img.width;
      let h = img.height;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (w > maxSize || h > maxSize) {
        if (w > h) {
          h = Math.round((h * maxSize) / w);
          w = maxSize;
        } else {
          w = Math.round((w * maxSize) / h);
          h = maxSize;
        }
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        if (!blob) return reject('Gagal proses gambar');
        const compressedFile = new File([blob], file.name || "logo.jpg", { type: 'image/jpeg' });
        resolve(compressedFile);
      }, 'image/jpeg', 0.80);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

const BrandAdmin = () => {
  const [brand, setBrand] = useState({ brandName: "", logo: "", phone: "" });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL, {
      headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
    })
      .then((res) => res.json())
      .then(setBrand)
      .catch(() => setBrand({ brandName: "", logo: "", phone: "" }))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = async (e) => {
    const { name, value, files } = e.target;
    if (name === "logo" && files && files[0]) {
      try {
        const compressed = await processLogo(files[0]);
        setLogoFile(compressed);
        setLogoPreview(URL.createObjectURL(compressed));
      } catch (err) {
        setLogoFile(files[0]);
        setLogoPreview(URL.createObjectURL(files[0]));
      }
    } else {
      setBrand({ ...brand, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    let logoUrl = brand.logo;
    try {
      if (logoFile) {
        const formData = new FormData();
        formData.append("image", logoFile);
        const uploadRes = await fetch(UPLOAD_URL, {
          method: "POST",
          headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` },
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Gagal upload logo");
        const data = await uploadRes.json();
        logoUrl = data.url;
      }
      const res = await fetch(API_URL, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...brand, logo: logoUrl }),
      });
      if (!res.ok) throw new Error("Gagal update brand");
      setSuccess("Brand berhasil diupdate!");
      setLogoFile(null);
      setLogoPreview("");
      fetch(API_URL, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      })
        .then((res) => res.json())
        .then(setBrand);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Memuat data brand...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 md:pt-24 px-4 transition-colors duration-[900ms] ease-in-out">
      <BackButton />
      <div className="max-w-xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tighter italic dark:text-white">Edit Identitas Brand</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
          <div>
            <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-gray-500">Nama Brand Toko</label>
            <input 
              name="brandName" 
              value={brand.brandName} 
              onChange={handleChange} 
              className="w-full bg-gray-50 dark:bg-gray-700/50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-black outline-none dark:text-white transition-all font-bold" 
              required 
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">WhatsApp / Phone Number</label>
            <input
              className="w-full bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none dark:text-white transition-all font-bold"
              type="text"
              name="phone"
              placeholder="e.g. 6285888159265"
              value={brand.phone}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-2 text-[10px] font-black uppercase tracking-widest text-gray-500">Logo Utama (Warna Gelap/Standard)</label>
            <input 
              name="logo" 
              type="file" 
              accept="image/*" 
              onChange={handleChange} 
              className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 px-4 py-8 rounded-2xl text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white dark:file:bg-white dark:file:text-black cursor-pointer" 
            />
            {(logoPreview || brand.logo) && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex justify-center">
                <img src={logoPreview || brand.logo} alt="Logo Preview" className="h-20 object-contain" />
              </div>
            )}
          </div>
          <button 
            type="submit" 
            className="w-full bg-black dark:bg-white text-white dark:text-black px-6 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
          >
            Simpan Perubahan
          </button>
          {success && <div className="text-green-600 text-center font-bold text-xs mt-2 animate-bounce">{success}</div>}
          {error && <div className="text-red-500 text-center font-bold text-xs mt-2">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default BrandAdmin;
