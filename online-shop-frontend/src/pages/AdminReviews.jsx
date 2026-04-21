import React, { useState, useEffect } from 'react';
import config from '../config';
import { useCurrency } from '../components/CurrencyContext.jsx';
import BackButton from '../components/BackButton';
import { FaTrash, FaStar, FaUser, FaBox } from 'react-icons/fa';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useCurrency();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Fetch all products first to get their reviews, or if we had a global endpoint:
      // For now, let's assume we have a global endpoint /api/products/reviews/all 
      // Wait, let's check productRoutes.js if there's a global one.
      // If not, I'll add one to the backend.
      const res = await fetch(`${config.API_URL}/api/products/reviews/all`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus ulasan ini?")) return;
    try {
      const res = await fetch(`${config.API_URL}/api/products/reviews/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        fetchReviews();
      }
    } catch (err) {
      alert("Gagal menghapus ulasan");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <BackButton to="/admin" />
            <div>
              <h1 className="text-2xl font-[900] uppercase tracking-tighter dark:text-white">{t('admin.reviews') || 'Reviews'}</h1>
              <p className="text-xs text-gray-500 uppercase tracking-widest">{reviews.length} Total Ulasan</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map(rev => (
              <div key={rev.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                       <FaUser className="text-gray-400 text-xs" />
                       <span className="text-sm font-bold truncate max-w-[150px]">{rev.user_email}</span>
                    </div>
                    <div className="flex text-yellow-400 text-[10px]">
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3 py-1 px-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    <FaBox /> 
                    <span className="truncate">{rev.product_name || `Product ID: ${rev.product_id}`}</span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 italic line-clamp-4">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 uppercase">{new Date(rev.created_at).toLocaleDateString()}</span>
                  <button 
                    onClick={() => handleDelete(rev.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
            ))}
            
            {reviews.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400">
                Belum ada ulasan untuk dikelola.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
