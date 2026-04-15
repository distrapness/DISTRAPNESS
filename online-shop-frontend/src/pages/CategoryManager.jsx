import React, { useEffect, useState } from "react";
import config from '../config.js';

const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: "", image: "" });
    const [editId, setEditId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${config.API_URL}/api/categories`);
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const url = editId
            ? `${config.API_URL}/api/categories/${editId}`
            : `${config.API_URL}/api/categories`;
        const method = editId ? "PUT" : "POST";
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setForm({ name: "", image: "" });
                setEditId(null);
                fetchCategories();
            } else {
                alert("Failed to save category");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (cat) => {
        setForm({ name: cat.name, image: cat.image || "" });
        setEditId(cat.id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this category?")) return;
        const token = localStorage.getItem('token');
        await fetch(`${config.API_URL}/api/categories/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        fetchCategories();
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-24">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Category Management</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">{editId ? 'Edit Category' : 'Add Category'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1 dark:text-white">Name</label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                                    required
                                />
                            </div>
                            <button
                                disabled={submitting}
                                className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                                {submitting ? "Saving..." : (editId ? "Update" : "Create")}
                            </button>
                            {editId && (
                                <button
                                    type="button"
                                    onClick={() => { setEditId(null); setForm({ name: "", image: "" }); }}
                                    className="w-full bg-gray-200 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-300 transition"
                                >
                                    Cancel
                                </button>
                            )}
                        </form>
                    </div>

                    {/* List */}
                    <div className="md:col-span-2 space-y-4">
                        {loading ? <div>Loading...</div> : categories.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div>
                                    <h3 className="font-bold text-lg dark:text-white">{cat.name}</h3>
                                    <p className="text-xs text-gray-500">Slug: {cat.slug}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(cat)} className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200">Edit</button>
                                    <button onClick={() => handleDelete(cat.id)} className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200">Delete</button>
                                </div>
                            </div>
                        ))}
                        {categories.length === 0 && !loading && <div className="text-gray-500">No categories found.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryManager;
