import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaTrash, FaEnvelope, FaPhone, FaLayerGroup } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../constants';
import ConfirmModal from '../../components/admin/ConfirmModal';

const STATUS_COLORS = {
  new: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  contacted: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  closed: 'bg-white/10 text-white/30 border-white/10',
};

const FILTERS = ['all', 'new', 'contacted', 'closed'];

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('intedesign_admin_token')}` },
});

const LeadManager = () => {
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);

  const fetchLeads = useCallback(async () => {
    try {
      const url = filter === 'all'
        ? `${API_BASE_URL}/api/admin/leads`
        : `${API_BASE_URL}/api/admin/leads?status=${filter}`;
      const res = await axios.get(url, authHeader());
      setLeads(res.data);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API_BASE_URL}/api/admin/leads/${id}`, { status }, authHeader());
      setLeads((prev) => prev.map((l) => (l._id === id ? { ...l, status } : l)));
    } catch (err) { console.error(err); }
  };

  const confirmDelete = async () => {
    if (!leadToDelete) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/leads/${leadToDelete}`, authHeader());
      setLeads((prev) => prev.filter((l) => l._id !== leadToDelete));
      setShowDeleteModal(false);
      setLeadToDelete(null);
    } catch (err) { console.error(err); }
  };

  const counts = { all: leads.length };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-white">Lead Manager</h1>
        <p className="text-xs text-white/30 mt-1">All incoming consultation requests</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[10px] tracking-widest uppercase px-4 py-1.5 rounded-full border transition-all ${
              filter === f ? 'bg-white text-black border-white' : 'border-white/15 text-white/35 hover:border-white/30 hover:text-white/60'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-20 text-white/20 text-sm">No leads found.</div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead, i) => (
            <motion.div
              key={lead._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white/4 border border-white/8 rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4"
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-sm font-medium text-white">{lead.name}</p>
                  <span className={`text-[9px] tracking-widest uppercase border px-2 py-0.5 rounded-full ${STATUS_COLORS[lead.status]}`}>
                    {lead.status}
                  </span>
                  {lead.roomType && (
                    <span className="text-[9px] text-white/25 tracking-wide">{lead.roomType}</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-[10px] text-white/40 mb-2">
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-white/70 transition-colors">
                    <FaEnvelope className="text-[8px]" />{lead.email}
                  </a>
                  {lead.phone && (
                    <span className="flex items-center gap-1">
                      <FaPhone className="text-[8px]" />{lead.phone}
                    </span>
                  )}
                  <span>{new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                {lead.visionBoardCode && (
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-[9px] text-purple-400 font-bold tracking-widest uppercase bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                      Vision Board: {lead.visionBoardCode}
                    </span>
                    <Link 
                      to={`/admin/visionboards?code=${lead.visionBoardCode}`}
                      className="text-[9px] text-white/40 hover:text-white underline tracking-widest uppercase flex items-center gap-1"
                    >
                      <FaLayerGroup className="text-[8px]" /> View Board
                    </Link>
                  </div>
                )}
                <p className="text-xs text-white/40 line-clamp-2">{lead.message}</p>
                {lead.savedImages?.length > 0 && (
                  <p className="text-[9px] text-purple-400/60 mt-1">📌 {lead.savedImages.length} AI vision images attached</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <select
                  value={lead.status}
                  onChange={(e) => updateStatus(lead._id, e.target.value)}
                  className="bg-black/30 border border-white/10 text-white/60 text-[10px] rounded-lg px-3 py-1.5 focus:outline-none"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  onClick={() => { setLeadToDelete(lead._id); setShowDeleteModal(true); }}
                  className="p-2 text-white/20 hover:text-red-400/70 transition-colors"
                  title="Move to recycle bin"
                >
                  <FaTrash className="text-xs" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setLeadToDelete(null); }}
        onConfirm={confirmDelete}
        title="Move to Recycle Bin?"
        message="This lead will be moved to the recycle bin and kept for 30 days before permanent deletion."
        confirmText="Recycle Bin"
      />
    </div>
  );
};

export default LeadManager;
