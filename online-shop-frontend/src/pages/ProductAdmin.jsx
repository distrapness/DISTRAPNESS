import React, { useEffect, useState } from "react";
import BackButton from "../components/BackButton.jsx";
import ImageCropModalRIC from "../components/ImageCropModalRIC.jsx";
import ProductImageGalleryModal from "../components/ProductImageGalleryModal.jsx";
import ProductPreviewPanel from "../components/ProductPreviewPanel.jsx";

const API_URL = "http://localhost:5001/api/products";
const UPLOAD_URL = "http://localhost:5001/api/upload";
const BRAND_API_URL = "http://localhost:5001/api/brand";

const ProductAdmin = () => {
  // Product State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", images: [], description: "", sku: "", stock: "", category: "", weight: "", dimensions: "" });
  const [images, setImages] = useState([]); // File asli
  const [croppedImages, setCroppedImages] = useState([]); // Blob hasil crop
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropTargetIndex, setCropTargetIndex] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [editId, setEditId] = useState(null);

  // Brand State
  const [brand, setBrand] = useState({ brandName: "Online Shop", logo: "" });
  const [brandLoading, setBrandLoading] = useState(true);
  const [brandSuccess, setBrandSuccess] = useState("");
  const [brandError, setBrandError] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  // Delete State
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");

  // State untuk modal gallery
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Fetch Products
  const fetchProducts = () => {
    setLoading(true);
    fetch(API_URL)
      .then((res) => res.json())
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  // Fetch Brand
  const fetchBrand = () => {
    setBrandLoading(true);
    fetch(BRAND_API_URL)
      .then((res) => res.json())
      .then(setBrand)
      .catch(() => setBrand({ brandName: "Online Shop", logo: "" }))
      .finally(() => setBrandLoading(false));
  };

  useEffect(() => {
    fetchProducts();
    fetchBrand();
  }, []);

  // Sinkronisasi: Buka cropper otomatis setelah images terupdate
  useEffect(() => {
    const nextIdx = images.findIndex((img, idx) => !croppedImages[idx]);
    if (images.length > 0 && nextIdx !== -1 && !cropModalOpen) {
      setCropTargetIndex(nextIdx);
      setCropModalOpen(true);
    }
  }, [images, croppedImages]);

  // Product Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Handle upload multi-image
  const handleImageChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setImages([...images, ...newFiles]);
  };

  // Handle crop hasil simpan
  const handleCropSave = (blob) => {
    if (!blob || !(blob instanceof Blob)) {
      alert('Gagal crop gambar! Silakan ulangi.');
      console.error('[CROPPER] Blob hasil crop tidak valid:', blob);
      return;
    }
    const newCropped = [...croppedImages];
    newCropped[cropTargetIndex] = blob;
    setCroppedImages(newCropped);
    // Cek apakah masih ada gambar lain yang belum dicrop
    const nextIdx = images.findIndex((img, idx) => !newCropped[idx]);
    if (nextIdx !== -1) {
      setCropTargetIndex(nextIdx);
      setCropModalOpen(true);
    } else {
      setCropModalOpen(false);
    }
  };

  // Handle hapus gambar
  const handleRemoveImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
    setCroppedImages(croppedImages.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess("");
    setError(null);
    try {
      // Validasi: Pastikan semua gambar sudah dicrop
      if (images.length > 0 && croppedImages.length !== images.length) {
        setError("Semua gambar harus dicrop sebelum submit!");
        setSubmitting(false);
        return;
      }
      if (croppedImages.some(img => !img || !(img instanceof Blob))) {
        setError("Ada gambar hasil crop yang tidak valid. Silakan crop ulang!");
        setSubmitting(false);
        return;
      }
      // Upload semua gambar hasil crop
      const imageUrls = [];
      for (let i = 0; i < croppedImages.length; i++) {
        const img = croppedImages[i];
        const formData = new FormData();
        formData.append("image", img);
        try {
          const uploadRes = await fetch(UPLOAD_URL, {
            method: "POST",
            body: formData,
          });
          if (!uploadRes.ok) {
            const errText = await uploadRes.text();
            setError(`Gagal upload gambar ke-${i + 1}: ${errText}`);
            setSubmitting(false);
            return;
          }
          const data = await uploadRes.json();
          if (!data.url) {
            setError(`Upload gambar ke-${i + 1} tidak mengembalikan URL!`);
            setSubmitting(false);
            return;
          }
          imageUrls.push(data.url);
        } catch (err) {
          setError(`Error upload gambar ke-${i + 1}: ${err.message}`);
          setSubmitting(false);
          return;
        }
      }
      // Jika editId ada, lakukan update produk (PUT), jika tidak, tambah produk (POST)
      let res;
      if (editId) {
        res = await fetch(`${API_URL}/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, images: imageUrls.length > 0 ? imageUrls : form.images }),
        });
      } else {
        res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, images: imageUrls }),
        });
      }
      if (!res.ok) {
        const errText = await res.text();
        setError((editId ? "Gagal mengedit produk: " : "Gagal menyimpan produk: ") + errText);
        setSubmitting(false);
        return;
      }
      setForm({ name: "", price: "", images: [], description: "", sku: "", stock: "", category: "", weight: "", dimensions: "" });
      setImages([]);
      setCroppedImages([]);
      setEditId(null);
      setSuccess(editId ? "Produk berhasil diedit" : "Produk berhasil ditambahkan");
      fetchProducts();
    } catch (err) {
      setError("Error submit produk: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      price: product.price,
      images: product.images,
      description: product.description,
      sku: product.sku,
      stock: product.stock,
      category: product.category,
      weight: product.weight,
      dimensions: product.dimensions,
    });
    setImages([]);
    setCroppedImages([]);
    setEditId(product.id);
    setSuccess("");
    setError(null);
    // Scroll ke form edit
    setTimeout(() => {
      const formEl = document.getElementById("product-form");
      if (formEl) {
        formEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus produk ini?")) return;
    setDeleteLoading(true);
    setDeleteError("");
    setDeleteSuccess("");
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal menghapus produk");
      }
      setDeleteSuccess("Produk berhasil dihapus");
      fetchProducts();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setForm({ name: "", price: "", images: [], description: "", sku: "", stock: "", category: "", weight: "", dimensions: "" });
    setImages([]);
    setCroppedImages([]);
    setEditId(null);
    setSuccess("");
    setError(null);
  };

  // Brand Handlers
  const handleBrandChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "logo" && files && files[0]) {
      setLogoFile(files[0]);
      setLogoPreview(URL.createObjectURL(files[0]));
    } else {
      setBrand({ ...brand, [name]: value });
    }
  };

  const handleBrandSubmit = async (e) => {
    e.preventDefault();
    setBrandSuccess("");
    setBrandError("");
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
      const res = await fetch(BRAND_API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...brand, logo: logoUrl }),
      });
      if (!res.ok) throw new Error("Gagal update brand");
      setBrandSuccess("Brand berhasil diupdate!");
      setLogoFile(null);
      setLogoPreview("");
      fetchBrand();
    } catch (err) {
      setBrandError(err.message);
    }
  };

  const handleImageClick = (images, idx) => {
    setGalleryImages(images);
    setGalleryIndex(idx);
    setGalleryOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 md:pt-24 transition-colors duration-[900ms] ease-in-out">
      <div className="max-w-6xl mx-auto px-4 py-8 relative">
        <BackButton />
        <h1 className="text-3xl font-bold mb-6 text-blue-700 dark:text-blue-200 transition-colors duration-[900ms] ease-in-out ml-10">Admin Produk & Brand</h1>
        {/* Brand Section */}
        <section className="mb-10 bg-white dark:bg-gray-800 rounded-xl shadow p-6 transition-colors duration-[900ms] ease-in-out">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out">Edit Brand & Logo</h2>
          {brandLoading ? (
            <div>Memuat data brand...</div>
          ) : (
            <form onSubmit={handleBrandSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out">Nama Brand</label>
                <input name="brandName" value={brand.brandName} onChange={handleBrandChange} className="w-full border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out" required />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out">Logo Brand</label>
                <input name="logo" type="file" accept="image/*" onChange={handleBrandChange} className="w-full border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out" />
                {(logoPreview || brand.logo) && (
                  <img src={logoPreview || brand.logo} alt="Logo Preview" className="h-20 mt-2 object-contain bg-gray-100 dark:bg-gray-700 rounded border transition-colors duration-[900ms] ease-in-out" />
                )}
              </div>
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 transition dark:bg-blue-800 dark:hover:bg-blue-900 transition-colors duration-[900ms] ease-in-out">Simpan</button>
              {brandSuccess && <div className="text-green-700 font-semibold mt-2">{brandSuccess}</div>}
              {brandError && <div className="text-red-600 font-semibold mt-2">{brandError}</div>}
            </form>
          )}
        </section>

        {/* Product Form Section */}
        <section className="mb-10 bg-white dark:bg-gray-800 rounded-xl shadow p-6 transition-colors duration-[900ms] ease-in-out">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out">Tambah / Edit Produk</h2>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <form id="product-form" onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 rounded-xl shadow p-6 transition-colors duration-[900ms] ease-in-out">
                <div>
                  <label className="block mb-1 font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out">Nama Produk</label>
                  <input name="name" value={form.name} onChange={handleChange} className="w-full border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out" required />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out">SKU (Kode Produk)</label>
                  <input name="sku" value={form.sku} onChange={handleChange} className="w-full border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out" />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out">Kategori</label>
                  <input name="category" value={form.category} onChange={handleChange} className="w-full border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out" />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out">Harga</label>
                  <input name="price" type="number" value={form.price} onChange={handleChange} className="w-full border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out" required />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out">Stok</label>
                  <input name="stock" type="number" value={form.stock} onChange={handleChange} className="w-full border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out" />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out">Berat (gram)</label>
                  <input name="weight" type="number" value={form.weight} onChange={handleChange} className="w-full border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out" />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out">Dimensi (cm)</label>
                  <input name="dimensions" value={form.dimensions} onChange={handleChange} placeholder="Panjang x Lebar x Tinggi" className="w-full border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out" />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out">Upload Gambar Produk</label>
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out" />
                  <div className="flex gap-2 mt-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="flex flex-col items-center border p-2 rounded">
                        <img src={URL.createObjectURL(img)} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }} />
                        <div className="flex gap-2 mt-2">
                          <button
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                            onClick={() => { setCropTargetIndex(idx); setCropModalOpen(true); }}
                          >Crop</button>
                          <button
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                            onClick={() => handleRemoveImage(idx)}
                          >Hapus</button>
                        </div>
                        {croppedImages[idx] && (
                          <img src={URL.createObjectURL(croppedImages[idx])} alt="cropped" style={{ width: 80, height: 80, objectFit: 'cover', border: '2px solid green', marginTop: 4, borderRadius: 4 }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out">Deskripsi</label>
                  <textarea name="description" value={form.description} onChange={handleChange} className="w-full border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out" rows={3} required />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting || (croppedImages.length === 0 || croppedImages.length !== images.length)}
                    className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 transition dark:bg-blue-800 dark:hover:bg-blue-900 transition-colors duration-[900ms] ease-in-out"
                  >
                    {editId ? "Simpan Perubahan" : "Tambah Produk"}
                  </button>
                  {editId && (
                    <button type="button" onClick={handleCancelEdit} className="bg-gray-300 text-gray-800 px-6 py-2 rounded font-bold hover:bg-gray-400 transition dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 transition-colors duration-[900ms] ease-in-out">Batal Edit</button>
                  )}
                </div>
                {success && <div className="text-green-700 font-semibold mt-2">{success}</div>}
                {error && <div className="text-red-600 font-semibold mt-2">{error}</div>}
              </form>
            </div>
            {/* Panel preview selalu muncul, update otomatis dengan form */}
            <ProductPreviewPanel
              form={form}
              images={croppedImages.length > 0 ? croppedImages.map(img => URL.createObjectURL(img)) : (Array.isArray(form.images) ? form.images : [])}
              onRemoveImage={handleRemoveImage}
            />
            {/* Panel preview kanan dihilangkan sesuai permintaan user */}
            {/* <div className="fixed right-8 top-28 w-64 bg-white dark:bg-gray-800 border rounded shadow-lg p-4 z-50">
              <div className="flex flex-col gap-2">
                {croppedImages.map((img, idx) => (
                  <img key={idx} src={URL.createObjectURL(img)} alt={`preview-${idx}`} className="w-full h-32 object-contain rounded border bg-gray-100 dark:bg-gray-700 shadow transition-all duration-300 cursor-pointer hover:scale-105" />
                ))}
              </div>
            </div> */}
          </div>
        </section>

        {/* Modal Cropper */}
        {cropModalOpen && images.length > 0 && (
          <ImageCropModalRIC
            open={cropModalOpen}
            imageFile={images[cropTargetIndex]}
            onSave={handleCropSave}
            onCancel={() => setCropModalOpen(false)}
          />
        )}

        {/* Product List Section */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 transition-colors duration-[900ms] ease-in-out">
          <h2 className="text-xl font-bold mb-6 text-blue-700 dark:text-blue-200">Daftar Produk</h2>
          {deleteLoading && <div className="text-yellow-600 mb-2">Menghapus produk...</div>}
          {deleteError && <div className="text-red-600 mb-2">{deleteError}</div>}
          {deleteSuccess && <div className="text-green-600 mb-2">{deleteSuccess}</div>}
          {loading ? (
            <div>Memuat produk...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="sticky top-0 z-10 px-4 py-2 border-b font-semibold text-left bg-gray-100 dark:bg-gray-700">Gambar</th>
                    <th className="sticky top-0 z-10 px-4 py-2 border-b font-semibold text-left bg-gray-100 dark:bg-gray-700">Nama</th>
                    <th className="sticky top-0 z-10 px-4 py-2 border-b font-semibold text-left bg-gray-100 dark:bg-gray-700">SKU</th>
                    <th className="sticky top-0 z-10 px-4 py-2 border-b font-semibold text-left bg-gray-100 dark:bg-gray-700">Kategori</th>
                    <th className="sticky top-0 z-10 px-4 py-2 border-b font-semibold text-left bg-gray-100 dark:bg-gray-700">Stok</th>
                    <th className="sticky top-0 z-10 px-4 py-2 border-b font-semibold text-left bg-gray-100 dark:bg-gray-700">Harga</th>
                    <th className="sticky top-0 z-10 px-4 py-2 border-b font-semibold text-left bg-gray-100 dark:bg-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="transition-colors duration-[900ms] ease-in-out">
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap transition-colors duration-[900ms] ease-in-out">
                        <img
                          src={Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : "/assets/placeholder.jpg"}
                          alt={product.name}
                          className="w-40 h-40 max-w-full object-contain rounded border bg-gray-100 dark:bg-gray-700 shadow transition-all duration-300 cursor-pointer hover:scale-105"
                          style={{ maxWidth: '100%', height: 'auto' }}
                          onClick={() => handleImageClick(Array.isArray(product.images) ? product.images : [], 0)}
                          onError={e => e.target.style.display = 'none'}
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap transition-colors duration-[900ms] ease-in-out">{product.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap transition-colors duration-[900ms] ease-in-out">{product.sku || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap transition-colors duration-[900ms] ease-in-out">{product.category || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap transition-colors duration-[900ms] ease-in-out">{product.stock || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap transition-colors duration-[900ms] ease-in-out">Rp {product.price?.toLocaleString("id-ID")}</td>
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap transition-colors duration-[900ms] ease-in-out">
                        <button onClick={() => handleEdit(product)} className="px-3 py-1 bg-yellow-400 text-white rounded font-semibold hover:bg-yellow-500 transition dark:bg-yellow-500 dark:hover:bg-yellow-600 transition-colors duration-[900ms] ease-in-out">Edit</button>
                        <button onClick={() => handleDelete(product.id)} className="px-3 py-1 bg-red-600 text-white rounded font-semibold hover:bg-red-700 transition dark:bg-red-700 dark:hover:bg-red-800 transition-colors duration-[900ms] ease-in-out">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Modal Gallery Foto Produk */}
        {galleryOpen && (
          <ProductImageGalleryModal
            images={galleryImages}
            open={galleryOpen}
            initialIndex={galleryIndex}
            onClose={() => setGalleryOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ProductAdmin;
