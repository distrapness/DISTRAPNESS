import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import config from "../config";

const BannerContext = createContext();
const API_URL = `${config.API_URL}/api/banners`;

export const BannerProvider = ({ children }) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch banners from backend
  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Gagal mengambil data banner");
      const data = await res.json();
      setBanners(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add banner to backend
  const addBanner = async (imageUrl) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl }),
      });
      if (!res.ok) throw new Error("Gagal menambah banner");
      await fetchBanners();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete banner from backend
  const deleteBanner = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus banner");
      await fetchBanners();
    } catch (err) {
      setError(err.message);
    }
  };

  // Edit banner (update image)
  const editBanner = async (id, imageUrl) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl }),
      });
      if (!res.ok) throw new Error("Gagal mengedit banner");
      await fetchBanners();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  return (
    <BannerContext.Provider value={{ banners, loading, error, addBanner, deleteBanner, editBanner }}>
      {children}
    </BannerContext.Provider>
  );
};

export const useBanners = () => useContext(BannerContext);
