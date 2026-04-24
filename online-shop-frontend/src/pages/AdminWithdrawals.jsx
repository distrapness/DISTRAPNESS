import React, { useState, useEffect } from 'react';
import config from '../config';
import { FaWallet, FaCheck, FaTimes, FaUser, FaClock, FaUniversity } from 'react-icons/fa';

const AdminWithdrawals = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${config.API_URL}/api/affiliate/admin/withdrawals`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setWithdrawals(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        if (!window.confirm(`Yakin ingin mengubah status menjadi ${status}?`)) return;

        try {
            const res = await fetch(`${config.API_URL}/api/affiliate/admin/withdrawals/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` 
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchWithdrawals();
            }
        } catch (e) {
            alert("Gagal mengupdate status");
        }
    };

    const filtered = withdrawals.filter(w => filter === 'all' ? true : w.status === filter);

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                        <FaWallet className="text-blue-600" /> Manajemen Penarikan Dana
                    </h1>
                    <p className="text-gray-500 text-xs mt-1 font-medium">Setujui atau tolak permintaan komisi afiliasi partner.</p>
                </div>
                
                <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    {['all', 'pending', 'approved', 'rejected'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filter === s ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-20">
                    <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-800 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-800">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Tidak ada permintaan penarikan fund.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map((w) => (
                        <div key={w.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-50 dark:border-gray-700 overflow-hidden group">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        w.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                                        w.status === 'approved' ? 'bg-green-50 text-green-600' :
                                        'bg-red-50 text-red-600'
                                    }`}>
                                        {w.status}
                                    </div>
                                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                                        Rp {Number(w.amount).toLocaleString('id-ID')}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700/50 rounded-2xl flex items-center justify-center text-gray-400">
                                            <FaUser />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Partner</p>
                                            <p className="text-sm font-bold truncate dark:text-gray-100">{w.user_email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700/50 rounded-2xl flex items-center justify-center text-gray-400">
                                            <FaUniversity />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rekening Tujuan</p>
                                            <p className="text-sm font-bold dark:text-gray-100 italic">{w.bank_account}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700/50 rounded-2xl flex items-center justify-center text-gray-400">
                                            <FaClock />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanggal Request</p>
                                            <p className="text-sm font-bold dark:text-gray-100">{new Date(w.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {w.status === 'pending' && (
                                <div className="p-4 bg-gray-50 dark:bg-black/20 flex gap-2">
                                    <button
                                        onClick={() => handleUpdateStatus(w.id, 'approved')}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] py-3 rounded-xl tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <FaCheck /> SETUJUI
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(w.id, 'rejected')}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] py-3 rounded-xl tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <FaTimes /> TOLAK
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminWithdrawals;
