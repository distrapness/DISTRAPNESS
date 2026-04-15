import React, { useState } from "react";
import BannerUploader from "../components/BannerUploader";
import Banner from "../components/Banner";
import EditBannerModal from "../components/EditBannerModal";
import BackButton from "../components/BackButton"; 

import { useBanners } from "../contexts/BannerContext";

const BannerAdmin = () => {
  const { banners, addBanner, deleteBanner, editBanner, loading, error } = useBanners();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  // Tambah banner baru dari hasil crop/konfirmasi
  const handleAddBanner = async (imageUrl) => {
    setSaving(true);
    await addBanner(imageUrl);
    setSaving(false);
    setAdding(false);
  };

  const handleDelete = async (id) => {
    await deleteBanner(id);
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
  };

  // Callback setelah edit banner berhasil
  const handleEditSave = async (imageUrl) => {
    if (editingBanner) {
      setSaving(true);
      await editBanner(editingBanner.id, imageUrl);
      setEditingBanner(null);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <div className="flex justify-between items-center mb-8">
        <BackButton />
        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Banner Management</h1>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {!adding && (
        <div className="mb-10 text-center">
          <button
            className="px-8 py-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 font-black uppercase tracking-widest transition-all transform hover:scale-105"
            onClick={() => setAdding(true)}
          >
            + Add New Banner
          </button>
        </div>
      )}
      {adding && (
        <div className="mb-12 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 dark:text-white">Create New Banner</h2>
          <BannerUploader onConfirm={handleAddBanner} />
          <div className="flex justify-center mt-6">
            <button
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full font-bold hover:bg-gray-300 transition-all"
              onClick={() => setAdding(false)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
          {saving && <div className="text-indigo-600 dark:text-indigo-400 mt-4 text-center font-bold animate-pulse">Uploading to Database...</div>}
        </div>
      )}
      <div className="space-y-6">
        {loading && <div className="text-gray-500">Memuat banner...</div>}
        {banners.length === 0 && !loading && <div className="text-gray-500">Belum ada banner.</div>}
        {banners.map((banner, idx) => (
          <div key={banner.id} className="relative group rounded-3xl overflow-hidden shadow-xl border-4 border-white dark:border-gray-800 transform transition hover:scale-[1.01]">
            <Banner src={banner.image} alt={`Banner ${idx + 1}`} className="!my-0 !rounded-none" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button
                onClick={() => handleEdit(banner)}
                className="px-6 py-2 bg-white text-gray-900 rounded-full shadow-lg font-black uppercase text-xs tracking-widest hover:bg-gray-100 transition"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(banner.id)}
                className="px-6 py-2 bg-red-600 text-white rounded-full shadow-lg font-black uppercase text-xs tracking-widest hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded">
              Order: {idx + 1}
            </div>
          </div>
        ))}
      </div>
      {editingBanner && (
        <EditBannerModal
          open={!!editingBanner}
          onClose={() => setEditingBanner(null)}
          banner={editingBanner}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
};

export default BannerAdmin;
