import React, { useEffect, useState } from "react";
import ProductImageGalleryModal from "../components/ProductImageGalleryModal.jsx";
import ImageCropperModal from "../components/ImageCropperModal.jsx";
import config from '../config';
import { getImageUrl } from "../utils/imageHelper";
import { useCurrency } from "../components/CurrencyContext.jsx";

const API_URL = `${config.API_URL}/api/products`;
const UPLOAD_URL = `${config.API_URL}/api/upload`;
const CATEGORIES_URL = `${config.API_URL}/api/categories`;

const ProductAdmin = () => {
  // Product State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useCurrency();

  // Form State
  const [form, setForm] = useState({
    name: "",
    price: "",
    images: [],
    description: "",
    stock: "",
    weight: 1000,
    hasSizes: true,
    sizes: { S: 0, M: 0, L: 0, XL: 0 },
    category: "",
    is_flash_sale: false,
    flash_sale_price: "",
    flash_sale_end: ""
  });

  // Bulk Mode
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [bulkStockForm, setBulkStockForm] = useState({ stock: 0 });

  // Categories
  const [categories, setCategories] = useState([]);

  // Image Handling
  const [images, setImages] = useState([]); // New file objects
  const [editedImages, setEditedImages] = useState([]); // Edited blobs

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);

  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStock, setFilterStock] = useState("All");
  
  // Custom Category State
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Cropper State
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperFile, setCropperFile] = useState(null);
  const [cropperIndex, setCropperIndex] = useState(null);

  // Gallery State
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Fetch Products & Categories
  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`${API_URL}?t=${Date.now()}`),
        fetch(`${CATEGORIES_URL}?t=${Date.now()}`)
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();

      setProducts(Array.isArray(prodData) ? prodData : []);
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (err) {
      setError("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBulkUpdate = async () => {
    if (selectedProductIds.length === 0) return;
    const stockStr = prompt("Masukkan jumlah stok baru untuk semua produk terpilih:");
    if (stockStr === null) return;
    const newStock = parseInt(stockStr);
    if (isNaN(newStock)) return alert("Stok harus angka!");

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const updates = selectedProductIds.map(id => {
          const p = products.find(prod => prod.id === id);
          // If product has sizes, we distribute evenly or just set global
          const sizes = p.sizes ? Object.keys(p.sizes).reduce((acc, sz) => {
              acc[sz] = Math.ceil(newStock / Object.keys(p.sizes).length);
              return acc;
          }, {}) : null;
          return { id, stock: newStock, sizes };
      });

      const res = await fetch(`${API_URL}/bulk-stock`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ updates })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setIsBulkMode(false);
        setSelectedProductIds([]);
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Gagal update massal");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Logic
  const filteredProducts = products.filter(product => {
    const matchSearch = product.name.toLowerCase().includes(filterSearch.toLowerCase());
    const matchCategory = filterCategory === "All" || product.category === filterCategory;

    let matchStock = true;
    const stock = product.stock || 0;
    if (filterStock === "In Stock") matchStock = stock > 0;
    if (filterStock === "Out of Stock") matchStock = stock <= 0;
    if (filterStock === "Low Stock") matchStock = stock > 0 && stock < 10;

    return matchSearch && matchCategory && matchStock;
  });

  // Tambahkan helper untuk resize dan rotate image
  function processImage(file, rotateDeg = 0, maxSize = 800) {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = function () {
        let w = img.width;
        let h = img.height;
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        // Resize
        if (w > maxSize || h > maxSize) {
          if (w > h) {
            h = Math.round((h * maxSize) / w);
            w = maxSize;
          } else {
            w = Math.round((w * maxSize) / h);
            h = maxSize;
          }
        }
        // Swap width/height if rotate 90/270
        if (rotateDeg % 180 !== 0) {
          canvas.width = h;
          canvas.height = w;
        } else {
          canvas.width = w;
          canvas.height = h;
        }
        // Rotate
        ctx.save();
        if (rotateDeg === 90) {
          ctx.translate(canvas.width, 0);
          ctx.rotate(Math.PI / 2);
        } else if (rotateDeg === 180) {
          ctx.translate(canvas.width, canvas.height);
          ctx.rotate(Math.PI);
        } else if (rotateDeg === 270) {
          ctx.translate(0, canvas.height);
          ctx.rotate(-Math.PI / 2);
        }
        ctx.drawImage(img, 0, 0, w, h);
        ctx.restore();
        canvas.toBlob(blob => {
          if (!blob) return reject('Gagal proses gambar');
          blob.name = file.name;
          resolve(blob);
        }, 'image/jpeg', 0.80);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // Cropper Handlers
  const handleCropClick = (file, idx, e) => {
    e.preventDefault();
    e.stopPropagation();
    setCropperFile(file);
    setCropperIndex(idx);
    setCropperOpen(true);
  };

  const handleCropSave = (blob) => {
    const newFile = new File([blob], cropperFile.name || "edited.jpg", { type: 'image/jpeg' });

    if (cropperIndex && typeof cropperIndex === 'object' && cropperIndex.type === 'existing') {
      const oldIndex = cropperIndex.index;
      // Add to new images list
      setImages(prev => [...prev, newFile]);
      setEditedImages(prev => [...prev, blob]);
      // Remove from existing list
      setForm(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== oldIndex)
      }));
    } else {
      const newImages = [...images];
      newImages[cropperIndex] = newFile;
      setImages(newImages);

      const newEditedImages = [...editedImages];
      newEditedImages[cropperIndex] = blob;
      setEditedImages(newEditedImages);
    }

    setCropperOpen(false);
    setCropperFile(null);
    setCropperIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // 1. Upload new images
      const imageUrls = [];
      for (let i = 0; i < images.length; i++) {
        const fileToUpload = editedImages[i] || images[i];
        if (!fileToUpload) continue;
        
        const fd = new FormData();
        fd.append("image", fileToUpload);
        try {
          const upRes = await fetch(UPLOAD_URL, { method: "POST", body: fd });
          if (upRes.ok) {
            const upData = await upRes.json();
            imageUrls.push(upData.url);
          }
        } catch (e) { console.error("Upload error", e); }
      }

      // 2. Merge existing images with new ones
      const finalImages = [...(form.images || []), ...imageUrls];

      // 3. New Category handling
      let activeCategory = form.category;
      if (isNewCategory && newCategoryName) {
        try {
          const cRes = await fetch(CATEGORIES_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name: newCategoryName })
          });
          if (cRes.ok) activeCategory = newCategoryName;
        } catch (e) { console.error("Category save error", e); }
      }

      // 4. Stock & Payload
      const sizes = form.hasSizes ? (form.sizes || { S: 0, M: 0, L: 0, XL: 0 }) : { S: 0, M: 0, L: 0, XL: 0 };
      const totalStock = form.hasSizes 
        ? Object.values(sizes).reduce((a, b) => Number(a) + Number(b), 0)
        : Number(form.stock) || 0;

      const productData = {
        ...form,
        sizes: form.hasSizes ? sizes : null,
        stock: totalStock,
        price: Number(form.price) || 0,
        weight: Number(form.weight) || 1000,
        images: finalImages,
        category: isNewCategory ? newCategoryName : form.category
      };

      if (!productData.name) throw new Error("Nama wajib diisi.");
      if (productData.price <= 0) throw new Error("Harga harus lebih dari 0.");

      // 5. Submit
      const method = editId ? "PUT" : "POST";
      const url = editId ? `${API_URL}/${editId}` : API_URL;

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(productData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menyimpan.");
      }

      // 6. Finalize
      alert(editId ? "Produk diperbarui!" : "Produk ditambahkan!");
      resetForm(); // Assuming resetForm exists or defining it inline
      fetchData(); // As seen in view_file
    } catch (err) {
      setError(err.message);
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", price: "", images: [], description: "", stock: "", weight: 1000, hasSizes: true, sizes: { S: 0, M: 0, L: 0, XL: 0 }, category: "" });
    setImages([]);
    setEditedImages([]);
    setEditId(null);
    setIsFormOpen(false);
    setIsNewCategory(false);
    setNewCategoryName("");
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      price: product.price,
      images: product.images,
      description: product.description,
      stock: product.stock ?? 0,
      weight: product.weight || 1000,
      hasSizes: product.sizes && Object.values(product.sizes).some(v => v > 0),
      sizes: product.sizes || { S: 0, M: 0, L: 0, XL: 0 },
      category: product.category || "",
      is_flash_sale: product.is_flash_sale || false,
      flash_sale_price: product.flash_sale_price || "",
      flash_sale_end: product.flash_sale_end || ""
    });
    setImages([]);
    setEditedImages([]);
    setEditId(product.id);
    setError(null);
    setIsNewCategory(false);
    setNewCategoryName("");
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin hapus?")) return;
    try {
      await fetch(`${API_URL}/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      fetchData();
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    setForm({ name: "", price: "", images: [], description: "", stock: "", hasSizes: true, category: "", sizes: { S: 0, M: 0, L: 0, XL: 0 } });
    setImages([]);
    setEditedImages([]);
    setEditId(null);
    setError(null);
    setIsFormOpen(false);
    setIsNewCategory(false);
    setNewCategoryName("");
  };

  const handleImageClick = (images, idx) => {
    setGalleryImages(images);
    setGalleryIndex(idx);
    setGalleryOpen(true);
  };

  const handleRemoveOldImage = (idx) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const handleRemoveNewImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setEditedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 md:pt-24 transition-colors duration-[900ms] ease-in-out p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manajemen Produk</h1>
            <p className="text-gray-500 dark:text-gray-400">Inventory & Catalog + Category</p>
          </div>

          <div className="flex flex-wrap gap-3 items-center w-full md:w-auto bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Cari produk..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-medium border-none bg-gray-50 dark:bg-gray-700/50 rounded-xl dark:text-white focus:ring-2 focus:ring-black outline-none transition-all"
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 text-xs font-bold uppercase tracking-wider border-none bg-gray-50 dark:bg-gray-700/50 rounded-xl dark:text-white cursor-pointer outline-none"
            >
              <option value="All">SEMUA KATEGORI</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className="px-3 py-2 text-xs font-bold uppercase tracking-wider border-none bg-gray-50 dark:bg-gray-700/50 rounded-xl dark:text-white cursor-pointer outline-none"
            >
              <option value="All">STATUS STOK</option>
              <option value="In Stock">✅ TERSEDIA</option>
              <option value="Low Stock">⚠️ MENIPIS</option>
              <option value="Out of Stock">❌ HABIS</option>
            </select>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => { setIsBulkMode(!isBulkMode); setSelectedProductIds([]); }}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isBulkMode ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}
            >
              {isBulkMode ? 'BATAL MASSAL' : 'EDIT MASSAL'}
            </button>

            {isBulkMode && selectedProductIds.length > 0 && (
              <button
                onClick={handleBulkUpdate}
                className="bg-green-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-200 animate-pulse"
              >
                Simpan {selectedProductIds.length} Produk
              </button>
            )}

            <button
              onClick={() => { handleCancelEdit(); setIsFormOpen(true); }}
              className="bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/10 hover:scale-95 active:scale-90 transition-all flex items-center gap-2"
            >
              <span>+</span> Tambah Produk
            </button>
          </div>
        </div>

        {/* Product List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Memuat produk...</div>
          ) : (
            <div className="overflow-x-auto">
              {error && <div className="p-4 bg-red-100 text-red-600">{error}</div>}
              <table className="min-w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    {isBulkMode && (
                      <th className="px-6 py-4 w-10">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds(filteredProducts.map(p => p.id));
                            } else {
                              setSelectedProductIds([]);
                            }
                          }}
                          checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                        />
                      </th>
                    )}
                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Nama</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Kategori</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Harga</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Stok</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredProducts.map((product) => {
                    const stock = product.stock || 0;
                    const hasSizes = product.sizes && Object.values(product.sizes).some(v => v > 0);
                    let stockBadge;

                    if (hasSizes) {
                      stockBadge = (
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(product.sizes).map(([sz, qty]) => (
                              <span key={sz} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${qty > 0 ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-100 text-gray-400 opacity-50'}`}>
                                {sz}:{qty}
                              </span>
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Total: {stock}</span>
                        </div>
                      );
                    } else {
                      stockBadge = stock > 10
                        ? <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-bold">{stock} in stock</span>
                        : stock > 0
                          ? <span className="text-orange-600 bg-orange-100 px-2 py-1 rounded text-xs font-bold">{stock} low stock</span>
                          : <span className="text-red-600 bg-red-100 px-2 py-1 rounded text-xs font-bold uppercase">Stok Habis</span>;
                    }

                    return (
                      <tr key={product.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${selectedProductIds.includes(product.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                        {isBulkMode && (
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedProductIds.includes(product.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProductIds([...selectedProductIds, product.id]);
                                } else {
                                  setSelectedProductIds(selectedProductIds.filter(id => id !== product.id));
                                }
                              }}
                            />
                          </td>
                        )}
                        <td className="px-6 py-4 flex items-center gap-4">
                          <div className="relative">
                            <img
                              src={Array.isArray(product.images) && product.images.length > 0 ? getImageUrl(product.images[0]) : "https://via.placeholder.com/150"}
                              alt={product.name}
                              className="h-12 w-12 object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer"
                              onClick={() => handleImageClick(Array.isArray(product.images) ? product.images : [], 0)}
                            />
                            {product.is_flash_sale && (
                              <div className="absolute -top-2 -left-2 bg-red-600 text-white text-[8px] font-bold px-1 rounded shadow-sm animate-pulse">FLASH</div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                            <div className="text-xs text-gray-500">SKU: {product.id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-bold">{product.category || 'Uncategorized'}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">Rp {product.price?.toLocaleString("id-ID")}</td>
                        <td className="px-6 py-4">
                          {stockBadge}
                        </td>
                        <td className="px-6 py-4 text-right space-x-4">
                          <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-800 text-sm font-bold transition-colors">Edit</button>
                          <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-700 text-sm font-bold transition-colors">Hapus</button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">Produk tidak ditemukan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* NEW SIDE DRAWER (Split View: Form + Preview) */}
        <div className={`fixed inset-y-0 right-0 z-50 w-full md:w-[95vw] max-w-7xl bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${isFormOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-full flex flex-col">
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {editId ? "Edit Produk" : "Tambah Produk"}
              </h2>
              <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600 transition">
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            {/* Split Layout Content */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-gray-50 dark:bg-gray-900">

              {/* LEFT COLUMN: FORM */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-white dark:bg-gray-800">
                <form id="drawer-form" onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">

                  {/* Image Upload Area */}
                  <div className="bg-gray-50 dark:bg-gray-700/20 p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                    <label className="block text-sm font-bold mb-4 dark:text-white flex justify-between">
                      <span>Foto Produk</span>
                      <span className="text-xs font-normal text-gray-500 italic">Minimal 1 foto wajib diunggah</span>
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                      {Array.isArray(form.images) && form.images.map((imgUrl, idx) => (
                        <div key={`old-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm group">
                          <img src={getImageUrl(imgUrl)} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="old" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.preventDefault();
                                try {
                                  const response = await fetch(getImageUrl(imgUrl));
                                  const blob = await response.blob();
                                  const file = new File([blob], "edited-existing.jpg", { type: "image/jpeg" });
                                  setCropperFile(file);
                                  setCropperIndex({ type: 'existing', index: idx });
                                  setCropperOpen(true);
                                } catch (err) {
                                  alert("Gagal load gambar.");
                                }
                              }}
                              className="p-2 bg-white rounded-full text-blue-600 hover:scale-110 shadow"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <div onClick={() => handleRemoveOldImage(idx)} className="p-2 bg-white rounded-full text-red-600 cursor-pointer shadow hover:scale-110 font-bold">🗑️</div>
                          </div>
                        </div>
                      ))}
                      {images.map((img, idx) => (
                        <div key={`new-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border-2 border-green-500 bg-white shadow-sm group">
                          <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" alt="new" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            <button type="button" onClick={(e) => handleCropClick(img, idx, e)} className="p-2 bg-white rounded-full text-blue-600 hover:scale-110 shadow" title="Crop">✏️</button>
                            <button type="button" onClick={() => handleRemoveNewImage(idx)} className="p-2 bg-white rounded-full text-red-600 hover:scale-110 shadow" title="Remove">🗑️</button>
                          </div>
                        </div>
                      ))}
                      <label className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-blue-500 dark:hover:bg-gray-700 transition group bg-white dark:bg-gray-700/50">
                        <input type="file" multiple accept="image/*" onChange={async e => {
                          const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
                          if (files.length === 0) return;
                          const processed = await Promise.all(files.map(f => processImage(f, 0)));
                          setImages([...images, ...files]);
                          setEditedImages([...editedImages, ...processed]);
                        }} className="hidden" />
                        <span className="text-3xl text-gray-400 group-hover:text-blue-500 mb-1">+</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-blue-500 text-center">Tambah Foto</span>
                      </label>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-bold mb-2 dark:text-white">Nama Produk</label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
                        className="w-full px-5 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-shadow shadow-sm outline-none font-medium"
                        placeholder="e.g. Kaos Distro Premium Github style"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-bold mb-2 dark:text-white">Harga (Rp)</label>
                        <input
                          name="price"
                          type="number"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
                          className="w-full px-5 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-shadow shadow-sm outline-none font-mono"
                          placeholder="0"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2 dark:text-white">Berat (Gram)</label>
                        <input
                          name="weight"
                          type="number"
                          value={form.weight}
                          onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
                          className="w-full px-5 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-shadow shadow-sm outline-none font-mono"
                          placeholder="1000"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2 dark:text-white">Kategori</label>
                        <select
                          name="category"
                          value={isNewCategory ? "New" : form.category}
                          onChange={(e) => {
                            if (e.target.value === "New") {
                              setIsNewCategory(true);
                            } else {
                              setIsNewCategory(false);
                              setForm({ ...form, category: e.target.value });
                            }
                          }}
                          className="w-full px-5 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="">Select Category</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                          <option value="New">Create New Category...</option>
                        </select>
                        {isNewCategory && (
                          <input
                            type="text"
                            value={newCategoryName}
                            placeholder="Masukkan nama kategori baru"
                            className="mt-2 w-full px-5 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                            onChange={(e) => setNewCategoryName(e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Flash Sale Settings */}
                  <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-xl border border-red-100 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">⚡</span>
                      <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Pengaturan Flash Sale</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex items-center gap-2 mt-8">
                        <input
                          type="checkbox"
                          checked={form.is_flash_sale}
                          onChange={(e) => setForm({ ...form, is_flash_sale: e.target.checked })}
                          id="is_flash_sale"
                          className="w-5 h-5 accent-red-600"
                        />
                        <label htmlFor="is_flash_sale" className="font-bold text-sm dark:text-white cursor-pointer">Enable Flash Sale</label>
                      </div>
                      
                      {form.is_flash_sale && (
                        <>
                          <div>
                            <label className="block text-sm font-bold mb-2 dark:text-white text-red-600">Harga Flash Sale (Rp)</label>
                            <input
                              type="number"
                              value={form.flash_sale_price}
                              onChange={(e) => setForm({ ...form, flash_sale_price: e.target.value })}
                              className="w-full px-5 py-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-red-900 dark:text-white font-mono"
                              placeholder="Special Price"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold mb-2 dark:text-white text-red-600">Waktu Berakhir</label>
                            <input
                              type="datetime-local"
                              value={form.flash_sale_end ? new Date(form.flash_sale_end).toISOString().slice(0, 16) : ""}
                              onChange={(e) => setForm({ ...form, flash_sale_end: e.target.value })}
                              className="w-full px-5 py-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-red-900 dark:text-white"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Variants */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <label className="text-sm font-bold dark:text-white">Opsi Produk (Ukuran/Warna)</label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={form.hasSizes} 
                          onChange={(e) => setForm({ ...form, hasSizes: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Has Sizes (S, M, L, XL)</span>
                      </label>
                    </div>

                    {form.hasSizes ? (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                        {['S', 'M', 'L', 'XL'].map(size => (
                          <div key={size} className="relative">
                            <label className="block text-[10px] font-bold mb-1 text-center text-gray-500 uppercase tracking-wide">{size}</label>
                            <input
                              type="number"
                              min="0"
                              value={form.sizes?.[size] || 0}
                              onChange={(e) => setForm({
                                ...form,
                                sizes: { ...form.sizes, [size]: Number(e.target.value) }
                              })}
                              className="w-full px-2 py-3 border border-gray-200 rounded-lg text-center font-bold focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 shadow-sm"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="w-full md:w-1/3">
                        <label className="block text-sm font-bold mb-2 dark:text-white">Total Stock</label>
                        <input
                          type="number"
                          min="0"
                          value={form.stock || 0}
                          onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                          className="w-full px-5 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-shadow shadow-sm outline-none font-bold"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-bold mb-2 dark:text-white">Description</label>
                    <textarea
                      name="description"
                      rows={8}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
                      className="w-full px-5 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-shadow shadow-sm outline-none resize-none leading-relaxed"
                      placeholder="Explain your product details..."
                      required
                    />
                  </div>
                </form>
              </div>

              {/* RIGHT COLUMN: PREVIEW */}
              <div className="hidden lg:flex w-[420px] bg-gray-100 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex-col items-center pt-8 overflow-hidden relative">
                <div className="text-center mb-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Mobile Preview</h3>
                </div>

                {/* Phone Mockup */}
                <div className="w-[320px] bg-white dark:bg-gray-800 rounded-[35px] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.4)] border-[10px] border-gray-900 overflow-hidden relative h-[650px] flex flex-col mx-auto transform hover:scale-[1.02] transition-transform duration-500">

                  {/* Notch */}
                  <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 z-20 flex justify-center">
                    <div className="w-24 h-5 bg-black rounded-b-xl"></div>
                  </div>

                  {/* Navbar Mock */}
                  <div className="h-14 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center px-4 pt-4 z-10 shrink-0">
                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex-1 text-center font-bold text-sm">Preview</div>
                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-800">
                    {/* Image Preview Carousel Mock */}
                    <div className="aspect-square bg-gray-200 w-full relative">
                      {((images.length > 0) || (form.images && form.images.length > 0)) ? (
                        <img
                          src={images.length > 0 ? URL.createObjectURL(images[0]) : getImageUrl(form.images[0])}
                          className="w-full h-full object-cover"
                          alt="preview"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                          <span className="text-4xl mb-2">📷</span>
                          <span className="text-xs">No Image</span>
                        </div>
                      )}
                      <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                        1 / {(images.length + (form.images ? form.images.length : 0)) || 1}
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Title & Price */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-[18px] font-bold text-[#FF0000]">
                            Rp {(Number(form.price) || 0).toLocaleString('id-ID', { minimumFractionDigits: 0 })}
                          </div>
                          <div className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded">-50%</div>
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white mt-1 leading-snug line-clamp-2">
                          {form.name || "Nama Produk Anda"}
                        </h3>
                        <div className="text-xs text-gray-500 mt-1">{form.category || "Uncategorized"}</div>
                      </div>

                      {/* Sold Count Mock */}
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 border-b border-gray-100 dark:border-gray-700 pb-3">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">⭐️</span> 4.9
                        </div>
                        <div className="w-px h-3 bg-gray-300"></div>
                        <div>100+ Terjual</div>
                      </div>

                      {/* Description */}
                      <div>
                        <h4 className="font-bold text-sm mb-2 dark:text-gray-200">Rincian Produk</h4>
                        <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                          {form.description || "Deskripsi lengkap produk akan muncul di area ini. Pastikan deskripsi menarik untuk pembeli!"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Bar Mock */}
                  <div className="h-14 bg-white dark:bg-gray-800 border-t border-gray-100 flex items-center px-4 gap-2 z-10 shrink-0">
                    <div className="w-10 h-10 bg-green-500/10 rounded flex items-center justify-center">💬</div>
                    <div className="flex-1 h-10 bg-[#FF0000] text-white flex items-center justify-center text-xs font-bold rounded shadow-lg opacity-90">
                      Beli Sekarang
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-3 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
              {editId && (
                <button type="button" onClick={() => handleDelete(editId)} className="text-red-500 hover:text-red-700 text-sm font-bold mr-auto px-2">{t('admin.products.delete')} Product</button>
              )}
              <button onClick={handleCancelEdit} className="px-6 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-bold border border-gray-200 transition">{t('admin.products.cancel')}</button>
              <button onClick={handleSubmit} disabled={submitting} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200/50 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 transition flex items-center gap-2">
                {submitting ? (
                  <>
                    <span className="animate-spin text-lg">↻</span> {t('admin.products.saving')}
                  </>
                ) : (
                  <>
                    <span>✓</span> {t('admin.products.saveProduct')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Overlay for Drawer */}
        {isFormOpen && (
          <div onClick={handleCancelEdit} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"></div>
        )}

        {/* Gallery Modal */}
        {galleryOpen && (
          <ProductImageGalleryModal
            images={galleryImages}
            open={galleryOpen}
            initialIndex={galleryIndex}
            onClose={() => setGalleryOpen(false)}
          />
        )}

        {/* Image Cropper Modal */}
        <ImageCropperModal
          isOpen={cropperOpen}
          imageFile={cropperFile}
          onClose={() => setCropperOpen(false)}
          onSave={handleCropSave}
        />

      </div>
    </div>
  );
};

export default ProductAdmin;
