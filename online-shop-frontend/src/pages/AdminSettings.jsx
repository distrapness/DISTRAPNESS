import React, { useEffect, useState } from 'react';
import config from '../config.js';
import { useCurrency } from '../components/CurrencyContext.jsx';

const AdminSettings = () => {
    const [settings, setSettings] = useState({
        site_title: '',
        site_description: '',
        contact_email: '',
        contact_phone: '',
        contact_address: '',
        social_instagram: '',
        social_facebook: '',
        social_twitter: '',
        logo_url: '',
        biteship_api_key: '',
        shipping_origin: '',
        midtrans_server_key: '',
        midtrans_client_key: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const { t } = useCurrency();

    useEffect(() => {
        fetch(`${config.API_URL}/api/settings`)
            .then(res => res.json())
            .then(data => {
                // Merge data with defaults
                setSettings(prev => ({ ...prev, ...data }));
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${config.API_URL}/api/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                setMessage(t('admin.settings.saved'));
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Failed to update settings.');
            }
        } catch (err) {
            setMessage('Error connecting to server.');
        } finally {
            setSaving(false);
        }
    };

    // Logo Upload Handler (Simple link for now, or use existing upload API)
    // Since we have an upload API, we can use it.
    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`${config.API_URL}/api/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.url) {
                setSettings(prev => ({ ...prev, logo_url: data.url }));
            }
        } catch (err) {
            alert("Upload failed");
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Settings...</div>;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 max-w-4xl mx-auto mt-10">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">{t('admin.settings.title')}</h1>

            {message && (
                <div className={`p-4 mb-6 rounded ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">

                {/* General Section */}
                <div>
                    <h2 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-200 border-b pb-2">General Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold mb-2 dark:text-white">Site Title</label>
                            <input
                                name="site_title"
                                value={settings.site_title}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 dark:text-white">Logo</label>
                            <div className="flex items-center gap-4">
                                {settings.logo_url && (
                                    <img src={settings.logo_url} alt="Logo" className="h-12 w-auto object-contain bg-gray-50 border rounded p-1" />
                                )}
                                <input type="file" onChange={handleLogoUpload} className="text-sm dark:text-gray-300" accept="image/*" />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold mb-2 dark:text-white">Meta Description (SEO)</label>
                            <textarea
                                name="site_description"
                                value={settings.site_description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <div>
                    <h2 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-200 border-b pb-2">Contact Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold mb-2 dark:text-white">Contact Email</label>
                            <input
                                name="contact_email"
                                type="email"
                                value={settings.contact_email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 dark:text-white">Contact Phone/WhatsApp</label>
                            <input
                                name="contact_phone"
                                value={settings.contact_phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="+62..."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold mb-2 dark:text-white">Store Address</label>
                            <textarea
                                name="contact_address"
                                value={settings.contact_address}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Social Media Section */}
                <div>
                    <h2 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-200 border-b pb-2">Social Media Links</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-bold mb-2 dark:text-white">Instagram URL</label>
                            <input
                                name="social_instagram"
                                value={settings.social_instagram}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://instagram.com/..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 dark:text-white">Facebook URL</label>
                            <input
                                name="social_facebook"
                                value={settings.social_facebook}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://facebook.com/..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 dark:text-white">Twitter/X URL</label>
                            <input
                                name="social_twitter"
                                value={settings.social_twitter}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://twitter.com/..."
                            />
                        </div>
                    </div>
                </div>

                {/* API & Third Party Configuration */}
                <div>
                    <h2 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-200 border-b pb-2">API & Integration Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold mb-2 dark:text-white">Biteship API Key</label>
                            <input
                                name="biteship_api_key"
                                type="password"
                                value={settings.biteship_api_key}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="biteship_..."
                            />
                            <p className="text-xs text-gray-400 mt-1">Used to calculate shipping costs via Biteship.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 dark:text-white">Shipping Origin (Area ID)</label>
                            <input
                                name="shipping_origin"
                                value={settings.shipping_origin}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="IDNP... (e.g. IDNP6IDNC147IDND829)"
                            />
                            <p className="text-xs text-gray-400 mt-1">Check Biteship docs for your Area ID.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 dark:text-white">Midtrans Server Key (Production)</label>
                            <input
                                name="midtrans_server_key"
                                type="password"
                                value={settings.midtrans_server_key}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="SB-Mid-server-..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 dark:text-white">Midtrans Client Key (Production)</label>
                            <input
                                name="midtrans_client_key"
                                value={settings.midtrans_client_key}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="SB-Mid-client-..."
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-6 border-t dark:border-gray-700">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform transition active:scale-95 disabled:opacity-50"
                    >
                        {saving ? t('admin.settings.saving') : t('admin.settings.save')}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default AdminSettings;
