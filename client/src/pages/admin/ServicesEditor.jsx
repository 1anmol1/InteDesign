import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaPlus, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import ConfirmModal from '../../components/admin/ConfirmModal';
import { API_BASE_URL } from '../../constants';

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('intedesign_admin_token')}` },
});

const ServicesEditor = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // id of service being saved
  const [creating, setCreating] = useState(false);
  const [newService, setNewService] = useState({
    title: '', price: '', description: '', features: [''], isPopular: false
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  const fetchServices = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/services`, authHeader());
      setServices(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const updateField = (id, field, value) => {
    setServices((prev) => prev.map((s) => (s._id === id ? { ...s, [field]: value } : s)));
  };

  const updateFeature = (id, index, value) => {
    setServices((prev) => prev.map((s) => {
      if (s._id !== id) return s;
      const features = [...s.features];
      features[index] = value;
      return { ...s, features };
    }));
  };

  const addFeature = (id) => {
    setServices((prev) => prev.map((s) => s._id === id ? { ...s, features: [...s.features, ''] } : s));
  };

  const removeFeature = (id, index) => {
    setServices((prev) => prev.map((s) => {
      if (s._id !== id) return s;
      return { ...s, features: s.features.filter((_, i) => i !== index) };
    }));
  };

  const saveService = async (service) => {
    setSaving(service._id);
    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/admin/services/${service._id}`,
        {
          title: service.title,
          price: service.price,
          description: service.description,
          features: service.features,
          isVisible: service.isVisible,
          isPopular: service.isPopular
        },
        authHeader()
      );
      setServices((prev) => prev.map((s) => (s._id === res.data._id ? res.data : s)));
    } catch (err) { console.error(err); }
    finally { setSaving(null); }
  };

  const createService = async () => {
    if (!newService.title.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/services`, newService, authHeader());
      setServices((prev) => [...prev, res.data]);
      setNewService({ title: '', price: '', description: '', features: [''], isPopular: false });
      setCreating(false);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/services/${serviceToDelete}`, authHeader());
      setServices((prev) => prev.filter((s) => s._id !== serviceToDelete));
      setShowDeleteModal(false);
      setServiceToDelete(null);
    } catch (err) { console.error(err); }
  };

  const toggleVisibility = (id) => {
    const service = services.find(s => s._id === id);
    if (!service) return;
    const updatedVisible = !service.isVisible;
    updateField(id, 'isVisible', updatedVisible);
    // Auto-save visibility change
    axios.put(`${API_BASE_URL}/api/admin/services/${id}`, { isVisible: updatedVisible }, authHeader())
      .catch(err => console.error('Failed to toggle visibility:', err));
  };

  if (loading) return <div className="p-8 text-white/30 text-sm">Loading services…</div>;

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-serif text-white">Services Editor</h1>
          <p className="text-xs text-white/30 mt-1">Edit service packages visible on the public Services page</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-5 py-2 text-[10px] text-white tracking-[0.2em] uppercase transition-all flex items-center gap-2"
        >
          <FaPlus className="text-[8px]" /> New Service
        </button>
      </div>

      {creating && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-10 bg-white/5 border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/50 to-cyan-500/50" />
          <h2 className="text-lg font-serif text-white mb-6">Create New Service Package</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] tracking-widest uppercase text-white/25 block mb-1">Title</label>
                <input
                  value={newService.title}
                  onChange={(e) => setNewService(p => ({ ...p, title: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                  placeholder="e.g. Master Suite Remodel"
                />
              </div>
              <div>
                <label className="text-[9px] tracking-widest uppercase text-white/25 block mb-1">Price</label>
                <input
                  value={newService.price}
                  onChange={(e) => setNewService(p => ({ ...p, price: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                  placeholder="From ₹X,XX,XXX"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="checkbox"
                id="isPopularNew"
                checked={newService.isPopular}
                onChange={(e) => setNewService(p => ({ ...p, isPopular: e.target.checked }))}
                className="w-4 h-4 rounded border-white/10 bg-black/40 accent-purple-500"
              />
              <label htmlFor="isPopularNew" className="text-xs text-white/50 cursor-pointer">Mark as Signature (Most Popular)</label>
            </div>
            <div>
              <label className="text-[9px] tracking-widest uppercase text-white/25 block mb-1">Description</label>
              <textarea
                value={newService.description}
                onChange={(e) => setNewService(p => ({ ...p, description: e.target.value }))}
                rows={2}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 resize-none"
              />
            </div>
            <div>
              <label className="text-[9px] tracking-widest uppercase text-white/25 block mb-2">Features</label>
              <div className="space-y-2">
                {newService.features.map((f, fi) => (
                  <div key={fi} className="flex gap-2">
                    <input
                      value={f}
                      onChange={(e) => {
                        const features = [...newService.features];
                        features[fi] = e.target.value;
                        setNewService(p => ({ ...p, features }));
                      }}
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
                    />
                    <button
                      onClick={() => {
                        const features = newService.features.filter((_, idx) => idx !== fi);
                        setNewService(p => ({ ...p, features }));
                      }}
                      className="text-white/20 hover:text-red-400"
                    >
                      <FaTrash size={10} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setNewService(p => ({ ...p, features: [...p.features, ''] }))}
                  className="text-[10px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1.5"
                >
                  <FaPlus size={8} /> Add Feature
                </button>
              </div>
            </div>
            <div className="pt-4 flex gap-3">
              <button
                onClick={createService}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs text-white tracking-widest uppercase font-bold transition-all"
              >
                Create Package
              </button>
              <button
                onClick={() => setCreating(false)}
                className="px-6 py-3 border border-white/10 rounded-xl text-xs text-white/40 tracking-widest uppercase hover:text-white/60 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {services.map((service, i) => (
          <motion.div
            key={service._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white/4 border ${service.isVisible ? 'border-white/8' : 'border-red-500/20'} rounded-2xl p-6 space-y-4 relative group`}
          >
            {/* Action Bar */}
            <div className="absolute top-4 right-4 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => toggleVisibility(service._id)}
                title={service.isVisible ? "Make Invisible" : "Make Visible"}
                className={`transition-colors ${service.isVisible ? 'text-cyan-400/60 hover:text-cyan-400' : 'text-red-400/60 hover:text-red-400'}`}
              >
                {service.isVisible ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
              </button>
              <button
                onClick={() => { setServiceToDelete(service._id); setShowDeleteModal(true); }}
                className="text-white/20 hover:text-red-600 transition-colors"
              >
                <FaTrash size={12} />
              </button>
            </div>

            {/* Title */}
            <div className="pr-12">
              <label className="text-[9px] tracking-widest uppercase text-white/25 block mb-1">Title</label>
              <input
                value={service.title}
                onChange={(e) => updateField(service._id, 'title', e.target.value)}
                className="w-full bg-black/20 border border-white/8 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>

            {/* Price */}
            <div>
              <label className="text-[9px] tracking-widests uppercase text-white/25 block mb-1">Price</label>
              <input
                value={service.price}
                onChange={(e) => updateField(service._id, 'price', e.target.value)}
                className="w-full bg-black/20 border border-white/8 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                placeholder="From $X,XXX"
              />
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                id={`isPopular-${service._id}`}
                checked={service.isPopular}
                onChange={(e) => updateField(service._id, 'isPopular', e.target.checked)}
                className="w-3.5 h-3.5 rounded border-white/10 bg-black/40 accent-purple-500"
              />
              <label htmlFor={`isPopular-${service._id}`} className="text-[10px] text-white/30 uppercase tracking-widest cursor-pointer">Signature Package</label>
            </div>

            {/* Description */}
            <div>
              <label className="text-[9px] tracking-widests uppercase text-white/25 block mb-1">Description</label>
              <textarea
                value={service.description}
                onChange={(e) => updateField(service._id, 'description', e.target.value)}
                rows={3}
                className="w-full bg-black/20 border border-white/8 rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none focus:border-white/20 transition-colors"
              />
            </div>

            {/* Features */}
            <div>
              <label className="text-[9px] tracking-widests uppercase text-white/25 block mb-2">Features</label>
              <div className="space-y-2">
                {service.features.map((f, fi) => (
                  <div key={fi} className="flex items-center gap-2">
                    <input
                      value={f}
                      onChange={(e) => updateFeature(service._id, fi, e.target.value)}
                      className="flex-1 bg-black/20 border border-white/8 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/20 transition-colors"
                    />
                    <button onClick={() => removeFeature(service._id, fi)} className="text-white/20 hover:text-red-400/70 transition-colors">
                      <FaTrash className="text-[10px]" />
                    </button>
                  </div>
                ))}
                <button onClick={() => addFeature(service._id)} className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/60 transition-colors mt-1">
                  <FaPlus className="text-[8px]" /> Add feature
                </button>
              </div>
            </div>

            <button
              onClick={() => saveService(service)}
              disabled={saving === service._id}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs text-white/70 tracking-widests uppercase transition-all disabled:opacity-50"
            >
              {saving === service._id ? 'Saving…' : 'Save Changes'}
            </button>
          </motion.div>
        ))}
      </div>
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setServiceToDelete(null); }}
        onConfirm={confirmDelete}
        title="Move to Recycle Bin?"
        message="This service package will be moved to the recycle bin and kept for 30 days before permanent deletion."
        confirmText="Recycle Bin"
      />
    </div>
  );
};

export default ServicesEditor;
