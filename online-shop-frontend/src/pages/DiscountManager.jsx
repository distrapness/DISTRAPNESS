import React, { useState, useEffect } from 'react';
import BackButton from '../components/BackButton';
import config from '../config';

const DiscountManager = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);

    // Form State
    const [form, setForm] = useState({
        code: '',
        type: 'percent', // percent | fixed
        value: 0,
        min_purchase: 0,
        usage_limit: 0,
        start_date: '',
        expiry_date: '',
        is_active: true
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${config.API_URL}/api/coupons`);
            if (res.ok) {
                const data = await res.json();
                setCoupons(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingCoupon
            ? `${config.API_URL}/api/coupons/${editingCoupon.id}`
            : `${config.API_URL}/api/coupons`;

        const method = editingCoupon ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (res.ok) {
                alert(editingCoupon ? "Kupon diupdate!" : "Kupon dibuat!");
                setModalOpen(false);
                fetchCoupons();
            } else {
                alert(data.error || "Gagal menyimpan kupon");
            }
        } catch (error) {
            alert("Error koneksi");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin hapus kupon ini?")) return;
        try {
            await fetch(`${config.API_URL}/api/coupons/${id}`, { method: 'DELETE' });
            fetchCoupons();
        } catch (error) {
            alert("Gagal menghapus");
        }
    };

    const openModal = (coupon = null) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setForm({
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                min_purchase: coupon.min_purchase,
                usage_limit: coupon.usage_limit,
                start_date: coupon.start_date ? coupon.start_date.split('T')[0] : '',
                expiry_date: coupon.expiry_date ? coupon.expiry_date.split('T')[0] : '',
                is_active: coupon.is_active === 1 || coupon.is_active === true
            });
        } else {
            setEditingCoupon(null);
            setForm({
                code: '', type: 'percent', value: 0, min_purchase: 0, usage_limit: 0,
                start_date: '', expiry_date: '', is_active: true
            });
        }
        setModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-24">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <BackButton to="/admin" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kelola Kupon Diskon</h1>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow font-bold"
                    >
                        + Buat Kupon Baru
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200">
                            <tr>
                                <th className="p-4">Kode</th>
                                <th className="p-4">Diskon</th>
                                <th className="p-4">Min. Belanja</th>
                                <th className="p-4">Limit</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            {coupons.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="p-4 font-bold">{c.code}</td>
                                    <td className="p-4">
                                        {c.type === 'percent' ? `${c.value}%` : `Rp ${Number(c.value).toLocaleString('id-ID')}`}
                                    </td>
                                    <td className="p-4">Rp {Number(c.min_purchase).toLocaleString('id-ID')}</td>
                                    <td className="p-4">
                                        {c.usage_limit > 0 ? `${c.usage_count} / ${c.usage_limit}` : `${c.usage_count} (Unlimited)`}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {c.is_active ? 'Aktif' : 'Non-Aktif'}
                                        </span>
                                    </td>
                                    <td className="p-4 flex gap-2">
                                        <button onClick={() => openModal(c)} className="text-blue-600 hover:underline">Edit</button>
                                        <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline">Hapus</button>
                                    </td>
                                </tr>
                            ))}
                            {coupons.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">Belum ada kupon diskon.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modal Form */}
                {modalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6 relative">
                            <h2 className="text-xl font-bold mb-4 dark:text-white">
                                {editingCoupon ? 'Edit Kupon' : 'Buat Kupon Baru'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1 dark:text-gray-300">Kode Kupon (Contoh: RAMADHAN, DISKON10)</label>
                                    <input
                                        className="w-full border p-2 rounded uppercase dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
                                        value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-1 dark:text-gray-300">Tipe Diskon</label>
                                        <select
                                            className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
                                            value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                                        >
                                            <option value="percent">Persentase (%)</option>
                                            <option value="fixed">Nominal (Rp)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1 dark:text-gray-300">Nilai Diskon</label>
                                        <input
                                            type="number" className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
                                            value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                                            required min="0"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-1 dark:text-gray-300">Min. Belanja (Rp)</label>
                                        <input
                                            type="number" className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
                                            value={form.min_purchase} onChange={e => setForm({ ...form, min_purchase: e.target.value })}
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1 dark:text-gray-300">Limit Pemakaian</label>
                                        <input
                                            type="number" className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
                                            value={form.usage_limit} onChange={e => setForm({ ...form, usage_limit: e.target.value })}
                                            min="0" placeholder="0 = Unlimited"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-1 dark:text-gray-300">Mulai Berlaku</label>
                                        <input
                                            type="date" className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
                                            value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1 dark:text-gray-300">Berakhir Pada</label>
                                        <input
                                            type="date" className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
                                            value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox" id="isActive"
                                        checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                        className="w-5 h-5"
                                    />
                                    <label htmlFor="isActive" className="font-bold dark:text-gray-300">Status Aktif</label>
                                </div>

                                <div className="flex gap-3 justify-end mt-4">
                                    <button
                                        type="button" onClick={() => setModalOpen(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold"
                                    >
                                        Simpan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiscountManager;
