import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { FaPlus, FaTrash, FaEdit, FaTimes, FaCloudUploadAlt } from 'react-icons/fa';
import { API_BASE_URL } from '../../constants';
import ConfirmModal from '../../components/admin/ConfirmModal';

const CATEGORIES = ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Commercial', 'Other'];

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('intedesign_admin_token')}` },
});

const emptyForm = { title: '', description: '', category: 'Living Room', location: '', year: '', featured: false };

const PortfolioCMS = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, else project object
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/projects`, authHeader());
      setProjects(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFiles([]); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ title: p.title, description: p.description, category: p.category, location: p.location, year: p.year, featured: p.featured }); setFiles([]); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append('images', f));

      if (editing) {
        const res = await axios.put(
          `${API_BASE_URL}/api/admin/projects/${editing._id}`,
          fd,
          { headers: { Authorization: `Bearer ${localStorage.getItem('intedesign_admin_token')}`, 'Content-Type': 'multipart/form-data' } }
        );
        setProjects((prev) => prev.map((p) => (p._id === editing._id ? res.data : p)));
      } else {
        const res = await axios.post(
          `${API_BASE_URL}/api/admin/projects`,
          fd,
          { headers: { Authorization: `Bearer ${localStorage.getItem('intedesign_admin_token')}`, 'Content-Type': 'multipart/form-data' } }
        );
        setProjects((prev) => [res.data, ...prev]);
      }
      setShowModal(false);
    } catch (err) { console.error('Save project error:', err); }
    finally { setSubmitting(false); }
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/projects/${projectToDelete}`, authHeader());
      setProjects((prev) => prev.filter((p) => p._id !== projectToDelete));
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif text-white">Portfolio CMS</h1>
          <p className="text-xs text-white/30 mt-1">{projects.length} projects</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-xs tracking-widest uppercase rounded-full hover:bg-white/90 transition-all"
        >
          <FaPlus className="text-xs" /> Add Project
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {projects.map((p, i) => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group relative bg-white/5 border border-white/8 rounded-xl overflow-hidden cursor-pointer"
              onClick={() => p.images?.[0] && setLightbox(p)}
            >
              {p.images?.[0] ? (
                <img
                  src={p.images[0].startsWith('/images') ? p.images[0] : `${API_BASE_URL}${p.images[0]}`}
                  alt={p.title}
                  className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full aspect-square bg-white/5 flex items-center justify-center text-white/20 text-xs">No image</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                <p className="text-[9px] text-white/50 uppercase tracking-wide">{p.category}</p>
                <p className="text-xs text-white font-medium">{p.title}</p>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="w-7 h-7 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors">
                  <FaEdit className="text-[10px]" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setProjectToDelete(p._id); setShowDeleteModal(true); }} className="w-7 h-7 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center text-white/70 hover:text-red-400 transition-colors" title="Move to recycle bin">
                  <FaTrash className="text-[10px]" />
                </button>
              </div>
              {p.featured && (
                <div className="absolute top-2 left-2 text-[8px] tracking-widest uppercase bg-white/10 border border-white/20 px-2 py-0.5 rounded-full text-white/60">Featured</div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/8">
                <h2 className="font-serif text-white">{editing ? 'Edit Project' : 'Add New Project'}</h2>
                <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white transition-colors"><FaTimes /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] tracking-widest uppercase text-white/30 block mb-1.5">Title *</label>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 transition-colors" placeholder="Project name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] tracking-widest uppercase text-white/30 block mb-1.5">Category</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 focus:outline-none">
                      {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] tracking-widest uppercase text-white/30 block mb-1.5">Year</label>
                    <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none" placeholder="2025" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] tracking-widest uppercase text-white/30 block mb-1.5">Location</label>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none" placeholder="City, State" />
                </div>
                <div>
                  <label className="text-[10px] tracking-widest uppercase text-white/30 block mb-1.5">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none resize-none" placeholder="Brief project description..." />
                </div>
                <div>
                  <label className="text-[10px] tracking-widests uppercase text-white/30 block mb-1.5">Images</label>
                  <label className="flex flex-col items-center justify-center border border-dashed border-white/15 rounded-xl p-6 cursor-pointer hover:border-white/30 transition-colors">
                    <FaCloudUploadAlt className="text-2xl text-white/20 mb-2" />
                    <span className="text-xs text-white/30">{files.length > 0 ? `${files.length} file(s) selected` : 'Click to upload images (WebP optimized automatically)'}</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setFiles(Array.from(e.target.files))} />
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="featured" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-4 h-4 accent-white" />
                  <label htmlFor="featured" className="text-xs text-white/50">Mark as Featured (shows on homepage)</label>
                </div>
                <button type="submit" disabled={submitting} className="w-full py-3 bg-white text-black text-xs tracking-widest uppercase rounded-xl hover:bg-white/90 transition-all disabled:opacity-50">
                  {submitting ? 'Saving…' : editing ? 'Update Project' : 'Create Project'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
            <button className="absolute top-6 right-6 text-white/50 hover:text-white"><FaTimes className="text-xl" /></button>
            <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <img src={lightbox.images[0].startsWith('/images') ? lightbox.images[0] : `${API_BASE_URL}${lightbox.images[0]}`} alt={lightbox.title} className="w-full rounded-xl mb-4" />
              <h3 className="text-lg font-serif text-white">{lightbox.title}</h3>
              <p className="text-xs text-white/40 mb-1">{lightbox.category} · {lightbox.location} · {lightbox.year}</p>
              <p className="text-sm text-white/60">{lightbox.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setProjectToDelete(null); }}
        onConfirm={confirmDelete}
        title="Move to Recycle Bin?"
        message="This project will be moved to the recycle bin and kept for 30 days before permanent deletion."
        confirmText="Recycle Bin"
      />
    </div>
  );
};

export default PortfolioCMS;
