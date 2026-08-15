import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaTrash, FaImage, FaExternalLinkAlt, FaEdit, FaCheck, FaTimes, FaSync, FaTrashRestore, FaReply } from 'react-icons/fa';
import ConfirmModal from '../../components/admin/ConfirmModal';

const getProxyUrl = (url) => {
  if (!url || url.startsWith('/images') || url.startsWith('/uploads')) return url;
  try {
    const encoded = btoa(url);
    return `${API_BASE_URL}/api/images/proxy?url=${encoded}`;
  } catch (e) {
    return `${API_BASE_URL}/api/images/proxy?url=${encodeURIComponent(url)}`;
  }
};

const VisionBoardManager = () => {
  const [searchParams]         = useSearchParams();
  const [code, setCode]         = useState(searchParams.get('code') || '');
  const [boards, setBoards]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [selected, setSelected] = useState(null); // opened board detail
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [newName, setNewName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const token = localStorage.getItem('intedesign_admin_token');

  const fetchBoards = useCallback(async (searchCode = '') => {
    const headers = { Authorization: `Bearer ${token}` };
    setLoading(true);
    setError('');
    try {
      const url = searchCode
          ? `${API_BASE_URL}/api/admin/visionboards?code=${encodeURIComponent(searchCode)}`
          : `${API_BASE_URL}/api/admin/visionboards`;
      
      const res = await axios.get(url, { headers });
      setBoards(res.data);
      if (res.data.length === 0) {
        setError('No boards found.');
      } else if (searchCode && res.data.length === 1) {
        setSelected(res.data[0]);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch boards.');
      setBoards([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchBoards(code);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [code, fetchBoards]);

  // Handle URL code param separately on mount
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && !code) {
      setCode(urlCode);
    }
  }, [searchParams, code]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBoards(code);
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    fetchBoards(code.trim());
  };

  const confirmDelete = async () => {
    if (!boardToDelete) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      // Move to trash
      await axios.delete(`${API_BASE_URL}/api/admin/visionboards/${boardToDelete}`, { headers });
      setBoards(prev => prev.filter(b => b._id !== boardToDelete));
      if (selected?._id === boardToDelete) setSelected(null);
      setShowDeleteModal(false);
      setBoardToDelete(null);
    } catch {
      alert('Delete failed.');
    }
  };

  const handleRename = async (board) => {
    if (!newName.trim()) return;
    setIsRenaming(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.patch(`${API_BASE_URL}/api/admin/visionboards/rename/${board._id}`, { name: newName.trim() }, { headers });
      
      const updatedBoard = res.data;
      setBoards(prev => prev.map(b => b._id === updatedBoard._id ? updatedBoard : b));
      if (selected?._id === updatedBoard._id) setSelected(updatedBoard);
      setRenamingId(null);
    } catch (err) {
      alert('Rename failed.');
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-serif tracking-widest uppercase mb-2">Canvas Boards</h1>
          <p className="text-white/40 text-xs tracking-widest uppercase">Admin Management Console</p>
        </div>
        
        <div className="flex gap-3">
          <form onSubmit={handleSearch} className="relative group">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-400 transition-colors" />
            <input 
              type="text"
              placeholder="Search by code or name..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:bg-white/8 transition-all w-64"
            />
            {code && (
              <button 
                type="button" 
                onClick={() => setCode('')} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white"
              >
                Clear
              </button>
            )}
          </form>

          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all ${isRefreshing ? 'animate-spin' : ''}`}
            title="Refresh list"
          >
            <FaSync size={14} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-red-400/70 text-sm mb-6">{error}</p>}

      {/* Boards list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: board list */}
        <div className="lg:col-span-1 space-y-3">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))
          ) : boards.map(board => (
            <motion.div
              key={board._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                selected?._id === board._id
                  ? 'border-white/30 bg-white/8'
                  : 'border-white/10 bg-white/3 hover:bg-white/6'
              }`}
            >
              <div className="flex-1 cursor-pointer" onClick={() => setSelected(board)}>
                <div className="flex items-center gap-2">
                  <p className="text-white font-mono text-sm font-bold tracking-wider">{board.code}</p>
                  {board.name && (
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] rounded uppercase font-bold truncate max-w-[100px]">
                      {board.name}
                    </span>
                  )}
                </div>
                <p className="text-white/30 text-[10px] mt-0.5 uppercase tracking-tight">
                  <span>{board.images.length} images · {new Date(board.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setBoardToDelete(board._id); setShowDeleteModal(true); }}
                className="p-2 transition-colors rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10"
                title="Move to recycle bin"
              >
                <FaTrash className="text-xs" />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Right: image preview */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="border border-white/10 rounded-2xl p-6 bg-white/3"
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-3">
                      {renamingId === selected._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Set custom name..."
                            className="bg-white/5 border border-purple-500/50 rounded-lg px-3 py-1 text-white text-lg focus:outline-none"
                            onKeyDown={e => e.key === 'Enter' && handleRename(selected)}
                          />
                          <button 
                            onClick={() => handleRename(selected)}
                            disabled={isRenaming}
                            className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                          >
                            <FaCheck className="text-xs" />
                          </button>
                          <button 
                            onClick={() => setRenamingId(null)}
                            className="p-2 bg-white/5 text-white/40 rounded-lg hover:bg-white/10"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/title">
                          <h2 className="text-white text-2xl font-serif">
                            {selected.name ? `${selected.name} (${selected.code})` : selected.code}
                          </h2>
                          <button 
                            onClick={() => { setRenamingId(selected._id); setNewName(selected.name || ''); }}
                            className="opacity-0 group-hover/title:opacity-100 p-2 text-white/20 hover:text-purple-400 transition-all"
                            title="Rename board"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-white/30 text-xs mt-1">
                      {selected.images.length} images · saved {new Date(selected.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setBoardToDelete(selected._id); setShowDeleteModal(true); }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-red-500 hover:text-white transition-all"
                    >
                      <FaTrash /> Recycle Bin
                    </button>
                  </div>
                </div>

                <div className="columns-2 md:columns-3 gap-3">
                  {selected.images.map((img, i) => (
                    <div key={i} className="mb-3 relative rounded-xl overflow-hidden group break-inside-avoid">
                      <img
                        src={getProxyUrl(img.thumb || img.url)}
                        alt={img.description || 'Board image'}
                        className="w-full h-auto"
                      />
                      
                      {/* Sequence Number */}
                      <div className="absolute top-3 left-3 w-7 h-7 bg-black/60 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center text-[10px] font-bold text-white shadow-lg pointer-events-none">
                        {i + 1}
                      </div>

                      <a
                        href={img.url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        onClick={e => e.stopPropagation()}
                      >
                        <FaExternalLinkAlt className="text-white text-lg" />
                      </a>
                      <div className="absolute bottom-2 left-2">
                        <a 
                          href={img.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold no-underline hover:opacity-80 transition-opacity ${
                            img.source === 'portfolio' ? 'bg-purple-500/80 text-white' : 'bg-white/10 text-white/60'
                          }`}
                          onClick={e => e.stopPropagation()}
                        >
                          {img.source || 'explorer'}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                className="h-80 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-white/30"
              >
                <FaImage className="text-4xl mb-3" />
                <p className="text-sm">Select a board to preview its images</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setBoardToDelete(null); }}
        onConfirm={confirmDelete}
        title="Move to Recycle Bin?"
        message="This vision board will be moved to the recycle bin and kept for 30 days before permanent deletion."
      />
    </div>
  );
};

export default VisionBoardManager;
