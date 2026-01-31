import React, { useState, useEffect } from "react";
import BackButton from "../components/BackButton.jsx";
import config from '../config.js';

const API_URL = `${config.API_URL}/api/brand`;
const UPLOAD_URL = `${config.API_URL}/api/upload`;

const BrandAdmin = () => {
  const [brand, setBrand] = useState({ brandName: "", logo: "" });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then(setBrand)
      .catch(() => setBrand({ brandName: "", logo: "" }))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "logo" && files && files[0]) {
      setLogoFile(files[0]);
      setLogoPreview(URL.createObjectURL(files[0]));
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
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Gagal upload logo");
        const data = await uploadRes.json();
        logoUrl = data.url;
      }
      const res = await fetch(API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...brand, logo: logoUrl }),
      });
      if (!res.ok) throw new Error("Gagal update brand");
      setSuccess("Brand berhasil diupdate!");
      setLogoFile(null);
      setLogoPreview("");
      fetch(API_URL)
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
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold ml-4">Edit Brand & Logo</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
          <div>
            <label className="block mb-1 font-semibold">Nama Brand</label>
            <input name="brandName" value={brand.brandName} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Logo Brand</label>
            <input name="logo" type="file" accept="image/*" onChange={handleChange} className="w-full border px-3 py-2 rounded" />
            {(logoPreview || brand.logo) && (
              <img src={logoPreview || brand.logo} alt="Logo Preview" className="h-20 mt-2 object-contain bg-gray-100 rounded border" />
            )}
          </div>
          <button type="submit" className="bg-black text-white px-6 py-2 rounded font-bold hover:bg-gray-800 transition">Simpan</button>
          {success && <div className="text-green-700 font-semibold mt-2">{success}</div>}
          {error && <div className="text-red-600 font-semibold mt-2">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default BrandAdmin;
