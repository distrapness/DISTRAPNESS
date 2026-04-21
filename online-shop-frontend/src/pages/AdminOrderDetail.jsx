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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-24">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <BackButton to="/admin/orders" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order #{order.id}</h1>
                            <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wide
                ${order.status === 'paid' ? 'bg-green-100 text-green-700' :
                                    order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                                {getStatusLabel(order.status)}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handlePrint} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2 px-4 rounded hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors">
                            🖨️ {t('admin.print_invoice')}
                        </button>
                        <div className="relative status-dropdown-parent">
                            <button 
                                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 flex items-center gap-2"
                            >
                                Update Status ▾
                            </button>
                            {showStatusDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded shadow-xl border border-gray-100 dark:border-gray-700 z-50 py-1">
                                    {['pending', 'paid', 'shipped', 'completed', 'failed'].map(s => (
                                        <button 
                                            key={s} 
                                            onClick={() => { handleUpdateStatus(s); setShowStatusDropdown(false); }} 
                                            className="block w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
                                        >
                                            Set as {getStatusLabel(s)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Left Column: Details */}
                    <div className="md:col-span-2 space-y-6" id="print-area">
                        {/* Invoice Header (Hidden usually, visible in Print) */}
                        <div className="hidden print-only mb-6 text-center">
                            <h1 className="text-2xl font-bold">DISTRAPNESS INV</h1>
                            <p>Order #{order.id}</p>
                        </div>

                        {/* Items Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                <h3 className="font-bold text-gray-800 dark:text-gray-200">Order Items</h3>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3">Product</th>
                                        <th className="px-6 py-3 text-right">Qty</th>
                                        <th className="px-6 py-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-sm">
                                    {items.map((item, i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4">
                                                <div className="font-bold">{item.name}</div>
                                                <div className="text-gray-500 text-xs">Size: {item.selectedSize || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">x{item.qty}</td>
                                            <td className="px-6 py-4 text-right">Rp {(item.price * item.qty).toLocaleString('id-ID')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 dark:bg-gray-800 font-bold">
                                    <tr>
                                        <td colSpan="2" className="px-6 py-4 text-right">Total Amount</td>
                                        <td className="px-6 py-4 text-right">Rp {Number(order.total).toLocaleString('id-ID')}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Customer Details */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                                <h3 className="font-bold text-gray-400 text-xs uppercase mb-3">Customer</h3>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {String(order.userId || 'G').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold">{shipping.firstName ? `${shipping.firstName} ${shipping.lastName}` : String(order.userId || 'Guest')}</div>
                                        <div className="text-sm text-gray-500">{order.userId && String(order.userId).includes('@') ? String(order.userId) : '-'}</div>
                                    </div>
                                </div>
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between"><span>Phone:</span> <span className="font-medium">{shipping.phone || '-'}</span></div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                                <h3 className="font-bold text-gray-400 text-xs uppercase mb-4 text-right border-b border-gray-50 pb-2">Destinasi Pengiriman</h3>
                                <div className="text-sm text-right leading-relaxed flex flex-col items-end">
                                    {shipping.address ? (
                                        <div className="space-y-1">
                                            <p className="font-[900] text-gray-900 dark:text-white text-lg mb-1">{shipping.firstName} {shipping.lastName}</p>
                                            <p className="text-gray-600 dark:text-gray-300">{shipping.address}</p>
                                            <p className="font-medium">{shipping.area || ''}, {shipping.district || ''}</p>
                                            <p className="font-medium">{shipping.city}, {shipping.province}</p>
                                            <p className="text-gray-500">{shipping.postalCode}</p>
                                            <p className="text-blue-600 dark:text-blue-400 font-bold mt-2">📞 {shipping.phone}</p>
                                            {shipping.courierInfo && (
                                                <div className="mt-4 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                                                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-[10px] font-bold uppercase text-gray-500">Layanan Kurir</span>
                                                    <p className="font-bold text-red-600 mt-1">{shipping.courierInfo}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 italic">No shipping address recorded</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Actions */}
                    <div className="space-y-6">

                        {/* Fulfillment Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-4">Fulfillment</h3>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Tracking Number (Resi)</label>
                                <input
                                    type="text"
                                    value={trackingInput}
                                    onChange={(e) => setTrackingInput(e.target.value)}
                                    placeholder="Enter Resi ID..."
                                    className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>

                            <button
                                onClick={handleSaveTracking}
                                disabled={updating}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow transition text-sm"
                            >
                                Mark as Shipped & Send
                            </button>
                        </div>

                        {/* Payment Proof */}
                        {order.paymentProof && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                                <h3 className="font-bold text-gray-800 dark:text-white mb-4">Payment Proof</h3>
                                <a href={getImageUrl(order.paymentProof)} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src={getImageUrl(order.paymentProof)}
                                        alt="Bukti Transfer"
                                        className="w-full rounded border border-gray-200 cursor-zoom-in hover:opacity-90 transition"
                                    />
                                </a>
                                <div className="flex gap-2 mt-4">
                                    <button onClick={() => handleUpdateStatus('paid')} className="flex-1 bg-green-500 text-white py-1 rounded text-sm font-bold">Approve</button>
                                    <button onClick={() => handleUpdateStatus('failed')} className="flex-1 bg-red-500 text-white py-1 rounded text-sm font-bold">Reject</button>
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
