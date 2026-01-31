import React, { useEffect, useState } from "react";
import BackButton from "../components/BackButton.jsx";
import ProductImageGalleryModal from "../components/ProductImageGalleryModal.jsx";
import ProductPreviewPanel from "../components/ProductPreviewPanel.jsx";
import { Link } from "react-router-dom";
import config from '../config';

const API_URL = `${config.API_URL}/api/products`;
const UPLOAD_URL = `${config.API_URL}/api/upload`;

const ProductAdmin = () => {
  // Product State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", images: [], description: "", stock: "" });
  const [images, setImages] = useState([]); // File asli
  const [editedImages, setEditedImages] = useState([]); // Hasil edit (resize & rotate)
  const [rotates, setRotates] = useState([]); // Derajat rotasi per gambar
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [editId, setEditId] = useState(null);

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

  useEffect(() => {
    fetchProducts();
  }, []);

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
        }, 'image/jpeg', 0.92);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setUploadStatus('');
    setUploadError('');

    try {
      // Upload semua gambar baru (jika ada)
      const imageUrls = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const formData = new FormData();
        formData.append("image", editedImages[i] || img);
        try {
          const uploadRes = await fetch(UPLOAD_URL, {
            method: "POST",
            body: formData,
          });
          if (!uploadRes.ok) {
            setUploadError("Gagal upload gambar ke server");
            continue;
          }
          const data = await uploadRes.json();
          imageUrls.push(data.url);
        } catch (err) {
          setUploadError("Gagal upload gambar: " + err.message);
        }
      }
      // Gabungkan gambar lama dan baru saat edit
      let finalImages = imageUrls;
      if (editId) {
        // Jika edit, gabungkan gambar lama (form.images) dan gambar baru (imageUrls)
        const oldImages = Array.isArray(form.images) ? form.images : [];
        finalImages = Array.from(new Set([...oldImages, ...imageUrls]));
      }
      const productData = {
        ...form,
        stock: Number(form.stock) || 0,
        price: Number(form.price) || 0,
        images: finalImages.length > 0 ? finalImages : form.images
      };
      // Jika editId ada, lakukan update produk (PUT), jika tidak, tambah produk (POST)
      let res;
      if (editId) {
        res = await fetch(`${API_URL}/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });
      } else {
        res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });
      }
      if (!res.ok) {
        const errText = await res.text();
        setError((editId ? "Gagal mengedit produk: " : "Gagal menyimpan produk: ") + errText);
        setSubmitting(false);
        console.error('API error:', errText);
        return;
      }
      setForm({ name: "", price: "", images: [], description: "", stock: "" });
      setImages([]);
      setEditedImages([]);
      setRotates([]);
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
      stock: product.stock ?? product.stok ?? product.qty ?? product.quantity ?? 0,
    });
    setImages([]); // gambar baru (belum diupload)
    setEditedImages([]);
    setRotates([]);
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
    setForm({ name: "", price: "", images: [], description: "", stock: "" });
    setImages([]);
    setEditedImages([]);
    setRotates([]);
    setEditId(null);
    setSuccess("");
    setError(null);
  };

  const handleImageClick = (images, idx) => {
    setGalleryImages(images);
    setGalleryIndex(idx);
    setGalleryOpen(true);
  };

  // Fungsi hapus gambar lama dari form.images (sebelum submit)
  const handleRemoveOldImage = (idx) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  // Fungsi hapus gambar baru dari images (sebelum submit)
  const handleRemoveNewImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setEditedImages((prev) => prev.filter((_, i) => i !== idx));
    setRotates((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 md:pt-24 transition-colors duration-[900ms] ease-in-out">
      <div className="max-w-6xl mx-auto px-4 py-8 relative">
        <BackButton />
        <h1 className="text-3xl font-bold mb-6 text-blue-700 dark:text-blue-200 transition-colors duration-[900ms] ease-in-out ml-10">Admin Produk</h1>
        {/* Product Form Section */}
        <section className="mb-10 bg-white dark:bg-gray-800 rounded-xl shadow p-6 transition-colors duration-[900ms] ease-in-out">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out">Tambah / Edit Produk</h2>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <form id="product-form" onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 rounded-xl shadow p-6 transition-colors duration-[900ms] ease-in-out">
                <div>
                  <label className="block mb-1 font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out">Nama Produk</label>
                  <input name="name" value={form.name} onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })} className="w-full border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out" required />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out">Harga</label>
                  <input name="price" type="number" value={form.price} onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })} className="w-full border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out" required />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out">Stok</label>
                  <input name="stock" type="number" value={form.stock === undefined || form.stock === null || form.stock === '' ? 0 : form.stock} onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value === '' ? 0 : Number(e.target.value) })} className="w-full border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out" />
                </div>
                {/* Upload Gambar Produk dengan fitur edit sederhana (resize & rotate) */}
                <div className="mb-4">
                  <label className="block font-semibold mb-1">Foto Produk</label>
                  <div className="flex flex-wrap gap-3 mb-2">
                    {/* Gambar lama (dari form.images) */}
                    {Array.isArray(form.images) && form.images.map((img, idx) => (
                      <div key={img + idx} className="relative group">
                        <img src={img} alt={`Foto lama ${idx + 1}`} className="w-24 h-24 object-cover rounded border" />
                        {/* Tombol hapus gambar lama */}
                        <button type="button" onClick={() => handleRemoveOldImage(idx)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-80 hover:opacity-100">&times;</button>
                      </div>
                    ))}
                    {/* Gambar baru (preview sebelum upload) */}
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={typeof img === "string" ? img : URL.createObjectURL(img)} alt={`Foto baru ${idx + 1}`} className="w-24 h-24 object-cover rounded border" />
                        {/* Tombol hapus gambar baru */}
                        <button type="button" onClick={() => handleRemoveNewImage(idx)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-80 hover:opacity-100">&times;</button>
                      </div>
                    ))}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={async e => {
                      const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
                      // Resize otomatis saat upload
                      const processed = await Promise.all(files.map(f => processImage(f, 0)));
                      setImages(files); // simpan file asli untuk preview/rotate
                      setEditedImages(processed); // simpan hasil resize
                      setRotates(files.map(() => 0)); // reset rotate
                    }}
                    className="block border rounded px-2 py-1 w-full"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out">Deskripsi</label>
                  <textarea name="description" value={form.description} onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })} className="w-full border px-3 py-2 rounded dark:bg-gray-700 dark:text-gray-100 transition-colors duration-[900ms] ease-in-out" rows={3} required />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
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
              product={{
                name: form.name,
                price: form.price,
                description: form.description,
              }}
              images={editedImages.map(img => URL.createObjectURL(img))}
              onRemoveImage={(index) => {
                setImages(images => images.filter((_, i) => i !== index));
                setEditedImages(editedImages => editedImages.filter((_, i) => i !== index));
                setRotates(rotates => rotates.filter((_, i) => i !== index));
              }}
            />
          </div>
        </section>

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
                    <th className="sticky top-0 z-10 px-4 py-2 border-b font-semibold text-left bg-gray-100 dark:bg-gray-700">Harga</th>
                    <th className="sticky top-0 z-10 px-4 py-2 border-b font-semibold text-left bg-gray-100 dark:bg-gray-700">Stok</th>
                    <th className="sticky top-0 z-10 px-4 py-2 border-b font-semibold text-left bg-gray-100 dark:bg-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="transition-colors duration-[900ms] ease-in-out">
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap transition-colors duration-[900ms] ease-in-out">
                        <img
                          src={Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : "https://via.placeholder.com/150"}
                          alt={product.name}
                          className="h-20 mt-2 object-contain bg-gray-100 dark:bg-gray-700 rounded border transition-colors duration-[900ms] ease-in-out"
                          style={{ maxWidth: '100%', height: 'auto' }}
                          onClick={() => handleImageClick(Array.isArray(product.images) ? product.images : [], 0)}
                          onError={(e) => {
                            console.log("Image error, using placeholder");
                            e.target.src = "https://via.placeholder.com/150";
                          }}
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap transition-colors duration-[900ms] ease-in-out">{product.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap transition-colors duration-[900ms] ease-in-out">Rp {product.price?.toLocaleString("id-ID")}</td>
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap transition-colors duration-[900ms] ease-in-out">
                        {product.stock !== undefined && product.stock !== null ? product.stock
                          : product.stok !== undefined && product.stok !== null ? product.stok
                            : product.qty !== undefined && product.qty !== null ? product.qty
                              : product.quantity !== undefined && product.quantity !== null ? product.quantity
                                : 0}
                      </td>
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
