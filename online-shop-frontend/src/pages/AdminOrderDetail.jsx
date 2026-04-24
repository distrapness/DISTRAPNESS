import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import BackButton from "../components/BackButton.jsx";
import config from '../config.js';
import { getImageUrl } from "../utils/imageHelper";
import { useCurrency } from "../components/CurrencyContext.jsx";

const AdminOrderDetail = () => {
    const { id } = useParams();
    const { t } = useCurrency();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [trackingInput, setTrackingInput] = useState("");
    const printRef = useRef();

    const getStatusLabel = (s) => t(`admin.status.${s}`) || s;

    useEffect(() => {
        fetch(`${config.API_URL}/api/orders/${id}`, {
            headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(data => {
                setOrder(data);
                if (data.tracking_number) setTrackingInput(data.tracking_number);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    const handleUpdateStatus = async (newStatus) => {
        if (!window.confirm(`Ubah status menjadi ${getStatusLabel(newStatus)}?`)) return;
        setUpdating(true);
        try {
            const res = await fetch(`${config.API_URL}/api/orders/status/${id}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setOrder({ ...order, status: newStatus });
            }
        } catch (e) {
            alert("Gagal update status");
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveTracking = async () => {
        setUpdating(true);
        try {
            const res = await fetch(`${config.API_URL}/api/orders/status/${id}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: 'shipped', trackingNumber: trackingInput })
            });
            if (res.ok) {
                setOrder({ ...order, status: 'shipped', tracking_number: trackingInput });
                alert("Nomor Resi disimpan & Status diubah jadi Dikirim!");
            }
        } catch (e) {
            alert("Gagal simpan resi");
        } finally {
            setUpdating(false);
        }
    };

    const handlePrint = () => {
        const printContent = document.getElementById('print-area').innerHTML;
        const win = window.open('', '', 'height=700,width=800');
        win.document.write('<html><head><title>Print Invoice</title>');
        win.document.write('<style>body{font-family:sans-serif; padding: 20px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} .header{text-align:center;margin-bottom:20px;}</style>');
        win.document.write('</head><body>');
        win.document.write(printContent);
        win.document.write('</body></html>');
        win.document.close();
        win.print();
    };

    // Fix: Hooks must act indiscriminately of conditional returns
    const items = React.useMemo(() => {
        if (!order?.items) return [];
        try {
            const parsed = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) { return []; }
    }, [order?.items]);

    const shipping = React.useMemo(() => {
        if (!order?.shipping_address) return {};
        try {
            return typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
        } catch (e) { return {}; }
    }, [order?.shipping_address]);

    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showStatusDropdown && !event.target.closest('.status-dropdown-parent')) {
                setShowStatusDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showStatusDropdown]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
    if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 pt-24 pb-12 transition-colors duration-500">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div className="flex items-center gap-5">
                        <BackButton to="/admin/orders" />
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block italic">Order Details</span>
                            <h1 className="text-3xl font-[900] text-black dark:text-white uppercase tracking-tighter italic">Order #{order.id}</h1>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                         <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm
                             ${order.status === 'paid' ? 'bg-green-100 text-green-700' :
                             order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                             order.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                             {getStatusLabel(order.status)}
                         </span>
                        <button onClick={handlePrint} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 font-black text-[10px] uppercase tracking-widest py-3 px-6 rounded-xl hover:bg-black hover:text-white transition-all shadow-lg flex items-center gap-2">
                             PRINT INVOICE
                        </button>
                        <div className="relative status-dropdown-parent">
                            <button 
                                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                className="bg-black dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-[0.2em] py-3 px-6 rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                                UPDATE STATUS ▾
                            </button>
                            {showStatusDropdown && (
                                <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 py-2">
                                    {['pending', 'paid', 'shipped', 'completed', 'failed'].map(s => (
                                        <button 
                                            key={s} 
                                            onClick={() => { handleUpdateStatus(s); setShowStatusDropdown(false); }} 
                                            className="block w-full text-left px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 border-b border-gray-50 dark:border-gray-800 last:border-0"
                                        >
                                            Set as {getStatusLabel(s)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-8" id="print-area">
                        {/* Items Card */}
                        <div className="bg-white dark:bg-gray-900 rounded-[40px] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                            <div className="px-10 py-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Order Items</h3>
                            </div>
                            <div className="p-10">
                                <table className="w-full text-left">
                                    <thead className="text-[9px] uppercase font-black tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800">
                                        <tr>
                                            <th className="pb-4">Product</th>
                                            <th className="pb-4 text-right">Qty</th>
                                            <th className="pb-4 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                        {items.map((item, i) => (
                                            <tr key={i} className="group">
                                                <td className="py-6">
                                                    <div className="font-black text-xs text-black dark:text-white uppercase tracking-tight">{item.name}</div>
                                                    <div className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mt-1">Size: {item.selectedSize || '-'}</div>
                                                </td>
                                                <td className="py-6 text-right font-black text-xs">x{item.qty}</td>
                                                <td className="py-6 text-right font-black text-xs">Rp {(item.price * item.qty).toLocaleString('id-ID')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-black text-black dark:text-white uppercase tracking-widest">
                                            <td colSpan="2" className="pt-8 text-right text-[10px] text-gray-400">Total Selection</td>
                                            <td className="pt-8 text-right text-lg tracking-tighter">Rp {Number(order.total).toLocaleString('id-ID')}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Customer Details */}
                            <div className="bg-white dark:bg-gray-900 rounded-[30px] shadow-xl p-10 border border-gray-100 dark:border-gray-800 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 dark:bg-black/20 rounded-full -mr-12 -mt-12"></div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mb-6 border-b pb-3">Customer Information</h3>
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-xl italic shadow-lg">
                                        {String(order.userId || 'G').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-black text-xs uppercase tracking-tight text-black dark:text-white">{shipping.firstName ? `${shipping.firstName} ${shipping.lastName}` : String(order.userId || 'Guest')}</div>
                                        <div className="text-[10px] font-bold text-gray-500 lowercase mt-1">{order.userId && String(order.userId).includes('@') ? String(order.userId) : '-'}</div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Phone</span>
                                        <span className="text-[10px] font-black text-black dark:text-white">{shipping.phone || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="bg-white dark:bg-gray-900 rounded-[30px] shadow-xl p-10 border border-gray-100 dark:border-gray-800 text-right relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-24 h-24 bg-gray-50 dark:bg-black/20 rounded-full -ml-12 -mt-12"></div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mb-6 border-b pb-3">Delivery Destination</h3>
                                <div className="leading-relaxed flex flex-col items-end">
                                    {shipping.address ? (
                                        <div className="space-y-2">
                                            <p className="font-black text-xs uppercase tracking-tight text-black dark:text-white mb-2">{shipping.firstName} {shipping.lastName}</p>
                                            <p className="text-[11px] text-gray-500 font-medium italic">{shipping.address}</p>
                                            <p className="text-[10px] font-black uppercase text-black dark:text-white">{shipping.area || ''}, {shipping.district || ''}</p>
                                            <p className="text-[10px] font-black uppercase text-black dark:text-white">{shipping.city}, {shipping.province} {shipping.postalCode}</p>
                                            <p className="inline-block bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-lg text-[10px] font-black text-black dark:text-white mt-4 border border-gray-100 dark:border-gray-700 italic">📞 {shipping.phone}</p>
                                            
                                            {order.referral_code && (
                                                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 block mb-1">Referral Applied</span>
                                                    <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">CODE: {order.referral_code}</span>
                                                </div>
                                            )}

                                            {shipping.courierInfo && (
                                                <div className="mt-8 pt-6 border-t border-dashed border-gray-100 dark:border-gray-800 w-full">
                                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 block mb-2">Courier Selection</span>
                                                    <p className="font-black text-sm text-red-600 uppercase italic tracking-tighter">{shipping.courierInfo}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-gray-400 italic">No instructions.</p>
                                    )}

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Actions */}
                    <div className="space-y-8">

                        {/* Fulfillment Card */}
                        <div className="bg-white dark:bg-gray-900 rounded-[30px] shadow-2xl p-10 border border-gray-100 dark:border-gray-800">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8 pb-3 border-b border-gray-50 dark:border-gray-800">Admin Control</h3>

                            <div className="mb-8">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">AWB Number (Resi)</label>
                                <input
                                    type="text"
                                    value={trackingInput}
                                    onChange={(e) => setTrackingInput(e.target.value)}
                                    placeholder="Enter Resi ID..."
                                    className="w-full bg-gray-50 dark:bg-gray-800/50 border-none rounded-xl px-5 py-4 text-[11px] font-black tracking-widest dark:text-white focus:ring-2 focus:ring-black transition-all outline-none"
                                />
                            </div>

                            <button
                                onClick={handleSaveTracking}
                                disabled={updating}
                                className="w-full bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.2em] text-[10px] py-5 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {updating ? 'PROCESSING...' : 'MARK AS SHIPPED →'}
                            </button>
                        </div>

                        {/* Payment Proof */}
                        {order.paymentProof && (
                            <div className="bg-white dark:bg-gray-900 rounded-[30px] shadow-2xl p-10 border border-gray-100 dark:border-gray-800">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8 pb-3 border-b border-gray-50 dark:border-gray-800">Payment Verification</h3>
                                <div className="space-y-6">
                                    <a href={getImageUrl(order.paymentProof)} target="_blank" rel="noopener noreferrer" className="block relative group">
                                        <img
                                            src={getImageUrl(order.paymentProof)}
                                            alt="Bukti Transfer"
                                            className="w-full rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm group-hover:opacity-90 transition-all"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="bg-black/60 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">Enlarge Image</span>
                                        </div>
                                    </a>
                                    <div className="grid grid-cols-2 gap-3 pt-4">
                                        <button onClick={() => handleUpdateStatus('paid')} className="bg-green-100 dark:bg-green-900/20 text-green-600 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all">APPROVE</button>
                                        <button onClick={() => handleUpdateStatus('failed')} className="bg-red-100 dark:bg-red-900/20 text-red-600 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">REJECT</button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminOrderDetail;
