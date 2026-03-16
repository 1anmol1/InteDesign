import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrash, FaTrashRestore, FaCheck, FaTimes, FaSync, FaExclamationTriangle, FaFilter } from 'react-icons/fa';
import ConfirmModal from '../../components/admin/ConfirmModal';

const TrashManager = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selections, setSelections] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isPurge: false
  });

  const fetchTrash = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('phantasia_admin_token');
      const res = await axios.get(`${API_BASE_URL}/api/admin/trash`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching trash:', err);
      setError('Failed to load trash items.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTrash();
  };

  const toggleSelection = (id) => {
    setSelections(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const filteredIds = filteredItems.map(i => i._id);
    if (selections.length === filteredIds.length) {
      setSelections([]);
    } else {
      setSelections(filteredIds);
    }
  };

  const handleBulkRestore = () => {
    if (selections.length === 0) return;
    
    setConfirmModal({
      show: true,
      title: 'Restore Items',
      message: `Are you sure you want to restore ${selections.length} selected items?`,
      isPurge: false,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('phantasia_admin_token');
          const toRestore = items.filter(i => selections.includes(i._id)).map(i => ({ id: i._id, type: i.type }));
          await axios.post(`${API_BASE_URL}/api/admin/trash/restore`, { items: toRestore }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSelections([]);
          fetchTrash();
        } catch (err) {
          setError('Failed to restore items.');
        }
      }
    });
  };

  const handleBulkPurge = () => {
    if (selections.length === 0) return;

    setConfirmModal({
      show: true,
      title: 'Permanently Purge',
      message: `WARNING: This will permanently delete ${selections.length} selected items. This action cannot be undone.`,
      isPurge: true,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('phantasia_admin_token');
          const toPurge = items.filter(i => selections.includes(i._id)).map(i => ({ id: i._id, type: i.type }));
          await axios.post(`${API_BASE_URL}/api/admin/trash/purge`, { items: toPurge }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSelections([]);
          fetchTrash();
        } catch (err) {
          setError('Failed to purge items.');
        }
      }
    });
  };

  const filteredItems = items.filter(item => typeFilter === 'all' || item.type === typeFilter);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-serif tracking-widest uppercase mb-2">Recycle Bin</h1>
          <p className="text-white/40 text-xs tracking-widest uppercase">Items are automatically purged after 30 days</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <FaSync size={14} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-white/3 border border-white/8 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
            <FaFilter className="text-[10px] text-white/30" />
            <select 
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setSelections([]);
              }}
              className="bg-transparent text-[10px] tracking-widest uppercase text-white/70 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#121212]">All Categories</option>
              <option value="lead" className="bg-[#121212]">Leads</option>
              <option value="project" className="bg-[#121212]">Portfolio</option>
              <option value="service" className="bg-[#121212]">Services</option>
              <option value="review" className="bg-[#121212]">Reviews</option>
              <option value="visionboard" className="bg-[#121212]">Vision Boards</option>
            </select>
          </div>

          {filteredItems.length > 0 && (
            <button 
              onClick={selectAll}
              className="text-[10px] tracking-widest uppercase text-white/40 hover:text-white transition-colors"
            >
              {selections.length === filteredItems.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        <AnimatePresence>
          {selections.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-3"
            >
              <span className="text-[10px] tracking-widest uppercase text-purple-400 font-bold">
                {selections.length} selected
              </span>
              <button 
                onClick={handleBulkRestore}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-xl text-[10px] tracking-widest uppercase font-bold transition-all border border-purple-500/30"
              >
                <FaTrashRestore /> Restore
              </button>
              <button 
                onClick={handleBulkPurge}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-[10px] tracking-widest uppercase font-bold transition-all border border-red-500/30"
              >
                <FaTrash /> Purge
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/3 border border-dashed border-white/10 rounded-3xl">
          <FaTrash className="text-white/10 text-5xl mb-4" />
          <p className="text-white/30 tracking-widest uppercase text-xs">Your recycle bin is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <motion.div
              layout
              key={item._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group relative p-5 bg-white/5 border rounded-2xl transition-all duration-300 ${
                selections.includes(item._id) ? 'border-purple-500/50 bg-white/10' : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div onClick={() => toggleSelection(item._id)} className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-white/10 text-white/40 text-[9px] rounded uppercase tracking-tighter font-bold">
                      {item.type}
                    </span>
                    <span className="text-white/20 text-[9px] uppercase tracking-tighter italic">
                      Deleted {new Date(item.deletedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold tracking-wide text-white group-hover:text-purple-300 transition-colors truncate">
                    {item.displayTitle}
                  </h3>
                  {item.email && <p className="text-[10px] text-white/30 truncate mt-1">{item.email}</p>}
                </div>

                <div 
                  onClick={() => toggleSelection(item._id)}
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${
                    selections.includes(item._id) 
                      ? 'bg-purple-500 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                      : 'border-white/20 group-hover:border-white/40 text-transparent'
                  }`}
                >
                  <FaCheck size={10} />
                </div>
              </div>

              {/* Individual actions on hover overlay or just keep it simple with bulk */}
            </motion.div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs tracking-widest uppercase">
          <FaExclamationTriangle /> {error}
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.show}
        onClose={() => setConfirmModal(prev => ({ ...prev, show: false }))}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal(prev => ({ ...prev, show: false }));
        }}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.isPurge ? "Purge Permanently" : "Restore"}
        isDelete={confirmModal.isPurge}
      />
    </div>
  );
};

export default TrashManager;
