import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../constants';
import { FaPlus, FaTrash, FaEdit, FaEye, FaEyeSlash, FaGripVertical } from 'react-icons/fa';
import ConfirmModal from '../../components/admin/ConfirmModal';

const BASE = `${API_BASE_URL}/api/admin/reviews`;
const token = () => localStorage.getItem('intedesign_admin_token');

const ReviewsManager = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  
  const [form, setForm] = useState({ quote: '', name: '', location: '', rating: 5, isVisible: true, order: 0 });

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await axios.get(BASE, { headers: { Authorization: `Bearer ${token()}` } });
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${BASE}/${editingId}`, form, { headers: { Authorization: `Bearer ${token()}` } });
      } else {
        await axios.post(BASE, { ...form, order: reviews.length }, { headers: { Authorization: `Bearer ${token()}` } });
      }
      setShowModal(false);
      fetchReviews();
    } catch (err) {
      alert('Failed to save review');
    }
  };

  const confirmDelete = async () => {
    if (!reviewToDelete) return;
    try {
      await axios.delete(`${BASE}/${reviewToDelete}`, { headers: { Authorization: `Bearer ${token()}` } });
      setShowDeleteModal(false);
      setReviewToDelete(null);
      fetchReviews();
    } catch (err) {
      alert('Failed to delete review');
    }
  };

  const toggleVisibility = async (review) => {
    try {
      await axios.put(`${BASE}/${review._id}`, { isVisible: !review.isVisible }, { headers: { Authorization: `Bearer ${token()}` } });
      fetchReviews();
    } catch (err) {
      alert('Failed to toggle visibility');
    }
  };

  const openModal = (review = null) => {
    if (review) {
      setForm(review);
      setEditingId(review._id);
    } else {
      setForm({ quote: '', name: '', location: '', rating: 5, isVisible: true, order: reviews.length });
      setEditingId(null);
    }
    setShowModal(true);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-1">Admin</p>
          <h1 className="text-2xl font-serif text-white font-light">Client Reviews</h1>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full text-[11px] tracking-widest uppercase hover:scale-105 transition-transform shadow-lg shadow-white/5"
        >
          <FaPlus /> Add Review
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading && <div className="text-white/40 text-sm animate-pulse">Loading reviews...</div>}
        {!loading && reviews.length === 0 && <div className="text-white/40 text-sm italic">No reviews found.</div>}
        
        <AnimatePresence>
          {reviews.map((t, i) => (
            <motion.div
              key={t._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-5 p-5 rounded-2xl border transition-colors ${
                t.isVisible ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-black/40 border-white/5 opacity-60'
              }`}
            >
              <div className="cursor-grab text-white/20 hover:text-white/50 px-2 active:cursor-grabbing">
                <FaGripVertical />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-serif text-white text-lg line-clamp-2 leading-relaxed mb-2">"{t.quote}"</p>
                <div className="flex items-center gap-4 text-[10px] tracking-widest uppercase text-white/40">
                  <span className="text-purple-300">{t.name}</span>
                  <span>—</span>
                  <span className="text-cyan-300">{t.location}</span>
                  <span>—</span>
                  <span className="flex items-center gap-1 text-amber-500/80">★ {t.rating}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleVisibility(t)}
                  className={`p-2.5 rounded-full transition-colors ${t.isVisible ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                  title={t.isVisible ? 'Visible on site' : 'Hidden from site'}
                >
                  {t.isVisible ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
                </button>
                <button
                  onClick={() => openModal(t)}
                  className="p-2.5 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <FaEdit size={16} />
                </button>
                <button
                  onClick={() => { setReviewToDelete(t._id); setShowDeleteModal(true); }}
                  className="p-2.5 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <FaTrash size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#0f0f13] border border-white/10 rounded-3xl p-8 shadow-2xl shadow-purple-900/20"
            >
              <h2 className="text-2xl font-serif text-white mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {editingId ? 'Edit Review' : 'New Review'}
              </h2>

              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-[10px] tracking-widest text-white/40 uppercase mb-2">Quote</label>
                  <textarea
                    required
                    value={form.quote}
                    onChange={(e) => setForm({ ...form, quote: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-400/50 focus:outline-none transition-colors h-28 resize-none"
                    placeholder="This studio transformed my space..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] tracking-widest text-white/40 uppercase mb-2">Client Name</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-400/50 focus:outline-none"
                      placeholder="Ananya Desai"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-widest text-white/40 uppercase mb-2">Location</label>
                    <input
                      required
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-400/50 focus:outline-none"
                      placeholder="Mumbai, IN"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <label className="text-[10px] tracking-widest text-white/40 uppercase">Rating</label>
                    <select
                      value={form.rating}
                      onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                    >
                      {[5,4,3,2,1].map(num => <option key={num} value={num} className="bg-[#0f0f13]">{num} Stars</option>)}
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <label className="text-[10px] tracking-widest text-white/40 uppercase">Visible</label>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, isVisible: !form.isVisible })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${form.isVisible ? 'bg-green-500' : 'bg-white/20'}`}
                    >
                      <motion.div
                        className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                        animate={{ x: form.isVisible ? 24 : 0 }}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl text-xs tracking-widest uppercase text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl text-xs tracking-widest uppercase bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:opacity-90 transition-opacity font-semibold"
                  >
                    {editingId ? 'Save Edits' : 'Publish Review'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setReviewToDelete(null); }}
        onConfirm={confirmDelete}
        title="Move to Recycle Bin?"
        message="This review will be moved to the recycle bin and kept for 30 days before permanent deletion."
        confirmText="Recycle Bin"
      />
    </div>
  );
};

export default ReviewsManager;
