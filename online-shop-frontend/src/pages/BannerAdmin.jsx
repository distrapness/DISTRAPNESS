import React, { useState } from "react";
import BannerUploader from "../components/BannerUploader";
import Banner from "../components/Banner";
import EditBannerModal from "../components/EditBannerModal";
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

  // Fungsi untuk fetch ulang setelah edit
  const refreshBanners = () => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload(); // solusi cepat agar homepage/parent sinkron
    }
    // Jika ingin lebih elegan, bisa panggil fetchBanners dari context
  };

  // Callback setelah edit banner berhasil
  const handleEditSave = async (imageUrl) => {
    if (editingBanner) {
      await editBanner(editingBanner.id, imageUrl);
      setEditingBanner(null);
      refreshBanners();
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Admin Banner</h1>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {!adding && (
        <button
          className="mb-6 px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 font-bold"
          onClick={() => setAdding(true)}
        >
          Tambah Banner
        </button>
      )}
      {adding && (
        <div className="mb-8">
          <BannerUploader onConfirm={handleAddBanner} />
          <button
            className="mt-4 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            onClick={() => setAdding(false)}
            disabled={saving}
          >
            Batal
          </button>
          {saving && <div className="text-blue-600 mt-2">Menyimpan...</div>}
        </div>
      )}
      <div className="space-y-6">
        {loading && <div className="text-gray-500">Memuat banner...</div>}
        {banners.length === 0 && !loading && <div className="text-gray-500">Belum ada banner.</div>}
        {banners.map(banner => (
          <div key={banner.id} className="relative group border rounded-lg shadow p-2 bg-white">
            <Banner src={banner.image} alt={`Banner ${banner.id}`} />
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => handleEdit(banner)}
                className="px-3 py-1 bg-yellow-500 text-white rounded shadow hover:bg-yellow-600 font-bold"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(banner.id)}
                className="px-3 py-1 bg-red-600 text-white rounded shadow hover:bg-red-700 font-bold"
              >
                Hapus
              </button>
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
