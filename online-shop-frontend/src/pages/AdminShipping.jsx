import React, { useState, useEffect } from 'react';
import config from '../config';

const AdminShipping = () => {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newRate, setNewRate] = useState({ destination_name: '', price: '' });
    const [saving, setSaving] = useState(false);

    const fetchRates = async () => {
        try {
            const res = await fetch(`${config.API_URL}/api/shipping-manual`);
            const data = await res.json();
            setRates(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRates(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${config.API_URL}/api/shipping-manual`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newRate)
            });
            if (res.ok) {
                setNewRate({ destination_name: '', price: '' });
                fetchRates();
            }
        } catch (err) {
            alert('Gagal menambah tarif');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus tarif ini?')) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`${config.API_URL}/api/shipping-manual/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchRates();
        } catch (err) {
            alert('Gagal menghapus');
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-black uppercase tracking-tight mb-8 dark:text-white">Manual Shipping Rates</h1>

            {/* Add Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 mb-10">
                <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Area / Destination</label>
                        <input
                            required
                            placeholder="e.g. Jabodetabek"
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={newRate.destination_name}
                            onChange={e => setNewRate({...newRate, destination_name: e.target.value})}
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Price (IDR)</label>
                        <input
                            required
                            type="number"
                            placeholder="15000"
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={newRate.price}
                            onChange={e => setNewRate({...newRate, price: e.target.value})}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="self-end bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[10px] px-8 py-4 rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                    >
                        {saving ? 'Adding...' : 'Add Rate'}
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Area</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Price</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {loading ? (
                            <tr><td colSpan="3" className="p-10 text-center text-gray-400 italic">Loading rates...</td></tr>
                        ) : rates.length === 0 ? (
                            <tr><td colSpan="3" className="p-10 text-center text-gray-400 italic text-xs uppercase font-bold">No manual rates added yet.</td></tr>
                        ) : rates.map(rate => (
                            <tr key={rate.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-6 py-4 font-black text-xs uppercase dark:text-white">{rate.destination_name}</td>
                                <td className="px-6 py-4 font-black text-xs dark:text-white">Rp {parseFloat(rate.price).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(rate.id)}
                                        className="text-red-500 hover:text-red-700 font-black uppercase text-[10px] tracking-widest"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest leading-relaxed">
                   💡 Note: Manual rates will be displayed to customers as additional shipping options during checkout.
                </p>
            </div>
        </div>
    );
};

export default AdminShipping;
