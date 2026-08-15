import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { FaTrash, FaArrowLeft, FaHeart, FaCheckCircle, FaRegCircle, FaTimes, FaChevronLeft, FaChevronRight, FaCheck } from 'react-icons/fa';
import { FiDownload } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Masonry from 'react-masonry-css';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { AuthContext } from '../components/AuthContext';
import PageTransition from '../components/PageTransition';

const getProxyUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/images') || url.startsWith('/uploads')) return url;
  try {
    const encoded = btoa(url);
    return `${API_BASE_URL}/api/images/proxy?url=${encoded}`;
  } catch (e) {
    return `${API_BASE_URL}/api/images/proxy?url=${encodeURIComponent(url)}`;
  }
};

const MyBoard = () => {
  const { user, loading } = React.useContext(AuthContext);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('intedesign_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSelectionDeleteModal, setShowSelectionDeleteModal] = useState(false);
  const [showItemDeleteModal, setShowItemDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'portfolio' | 'explorer'
  
  // History State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyBoards, setHistoryBoards] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [renameData, setRenameData] = useState({ code: null, name: '' });
const [showHistoryDeleteModal, setShowHistoryDeleteModal] = useState(false);
  const [historyBoardToDelete, setHistoryBoardToDelete] = useState(null);
  const [selectedHistoryCodes, setSelectedHistoryCodes] = useState([]);
  const [showHistorySelectionDeleteModal, setShowHistorySelectionDeleteModal] = useState(false);
  
  // Board Save State
  const [isUnsaved, setIsUnsaved] = useState(favorites.length > 0);
  const [currentBoardCode, setCurrentBoardCode] = useState(null);
  const [currentBoardName, setCurrentBoardName] = useState('');
  
  // Load Board Confirm Modal
  const [showLoadConfirmModal, setShowLoadConfirmModal] = useState(false);
  const [boardToLoad, setBoardToLoad] = useState(null);
  const skipUnsavedRef = useRef(false);

  const boardRef = useRef(null);
  const bottomRef = useRef(null);
  // ADJUST STICKY EXIT TIMING HERE:
  // This 'isFooterInView' hook detects when the 1px 'bottomRef' (at the very bottom of the page) is reached.
  // Change margin or threshold if you want the bar to disappear earlier or later.
  const isFooterInView = useInView(bottomRef, { margin: "0px" });

  const isSelectMode = selectedIds.length > 0;

  // Filtered favorites by active tab
  const tabFavorites = favorites.filter(f => {
    if (activeTab === 'all') return true;
    if (activeTab === 'portfolio') return f.source === 'portfolio';
    if (activeTab === 'explorer') return (f.source || 'explorer') === 'explorer';
    if (activeTab === 'uploaded') return f.source === 'uploaded';
    return true;
  });

  useEffect(() => {
    localStorage.setItem('intedesign_favorites', JSON.stringify(favorites));
    if (!skipUnsavedRef.current) {
      setIsUnsaved(true);
    }
    skipUnsavedRef.current = false;
  }, [favorites]);

  // Prevent body scrolling when any modal or lightbox is open
  useEffect(() => {
    if (showHistoryModal || showDeleteModal || showSelectionDeleteModal || showItemDeleteModal || showLoadConfirmModal || showHistoryDeleteModal || showHistorySelectionDeleteModal || lightboxIndex !== null) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [showHistoryModal, showDeleteModal, showSelectionDeleteModal, showItemDeleteModal, showLoadConfirmModal, showHistoryDeleteModal, showHistorySelectionDeleteModal, lightboxIndex]);

  // ── Lightbox (uses tabFavorites for navigation) ────────────────
  const lightboxImage = lightboxIndex !== null ? tabFavorites[lightboxIndex] : null;

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goPrev = useCallback(() => {
    setLightboxIndex(prev => (prev > 0 ? prev - 1 : tabFavorites.length - 1));
  }, [tabFavorites.length]);

  const goNext = useCallback(() => {
    setLightboxIndex(prev => (prev < tabFavorites.length - 1 ? prev + 1 : 0));
  }, [tabFavorites.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, goPrev, goNext, closeLightbox]);

  // ── Select mode ───────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const cancelSelectMode = () => {
    setSelectedIds([]);
  };

  const clearSelection = () => setSelectedIds([]);
  const toggleSelectAll = () => {
    if (selectedIds.length === tabFavorites.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tabFavorites.map(f => f.id));
    }
  };

  const confirmDeleteSelected = () => {
    setFavorites(prev => prev.filter(f => !selectedIds.includes(f.id)));
    setSelectedIds([]);
    setShowSelectionDeleteModal(false);
  };

  const confirmItemDelete = () => {
    if (!itemToDelete) return;
    const id = itemToDelete.id;
    // If deleting the currently viewed lightbox image, advance to next (or prev if last)
    if (lightboxImage && lightboxImage.id === id) {
      if (tabFavorites.length <= 1) {
        closeLightbox();
      } else {
        const newIndex = lightboxIndex < tabFavorites.length - 1 ? lightboxIndex : lightboxIndex - 1;
        setLightboxIndex(newIndex);
      }
    }
    setFavorites(prev => prev.filter(f => f.id !== id));
    setSelectedIds(prev => prev.filter(sid => sid !== id));
    setItemToDelete(null);
    setShowItemDeleteModal(false);
  };

  const removeFavorite = (id) => {
    const item = favorites.find(f => f.id === id);
    if (item) {
      setItemToDelete(item);
      setShowItemDeleteModal(true);
    }
  };

  const confirmDeleteAll = () => {
    setFavorites([]);
    localStorage.setItem('intedesign_favorites', JSON.stringify([]));
    setLightboxIndex(null);
    setShowDeleteModal(false);
  };

  const openHistory = async () => {
    setShowHistoryModal(true);
    setIsLoadingHistory(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/visionboard/history`);
      setHistoryBoards(res.data.history);
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleLoadClick = (board) => {
    if (isUnsaved && favorites.length > 0) {
      setBoardToLoad(board);
      setShowLoadConfirmModal(true);
    } else {
      executeLoadBoard(board);
    }
  };

  const executeLoadBoard = (board) => {
    skipUnsavedRef.current = true;
    setFavorites(board.images);
    setCurrentBoardCode(board.code);
    setCurrentBoardName(board.name || '');
    setIsUnsaved(false);
    setShowHistoryModal(false);
    setShowLoadConfirmModal(false);
    setBoardToLoad(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveBoard = async (asDownloaded = false) => {
    if (favorites.length === 0) return null;
    
    try {
      const payload = {
        images: favorites,
        isDownloaded: asDownloaded,
      };
      if (currentBoardCode) payload.code = currentBoardCode;
      if (currentBoardName) payload.name = currentBoardName;

      const res = await axios.post(`${API_BASE_URL}/api/visionboard/save`, payload);
      
      const newCode = res.data.code;
      setCurrentBoardCode(newCode);
      setIsUnsaved(false);
      localStorage.setItem('intedesign_last_board_code', newCode);
      return newCode;
    } catch (err) {
      console.error('Failed to save vision board to DB:', err);
      alert('Unable to save vision board. Please try again.');
      return null;
    }
  };

  const handleSaveOnly = async () => {
    setIsDownloading(true);
    await saveBoard(false);
    setIsDownloading(false);
  };

  const handleRename = async (code, newName) => {
    try {
      await axios.put(`${API_BASE_URL}/api/visionboard/${code}/rename`, { name: newName });
      setHistoryBoards(prev => prev.map(b => b.code === code ? { ...b, name: newName } : b));
      if (currentBoardCode === code) setCurrentBoardName(newName);
      setRenameData({ code: null, name: '' });
    } catch (err) {
      console.error('Failed to rename board:', err);
    }
  };


  const toggleHistorySelect = (code) => {
    setSelectedHistoryCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const toggleHistorySelectAll = () => {
    if (selectedHistoryCodes.length === historyBoards.length) {
      setSelectedHistoryCodes([]);
    } else {
      setSelectedHistoryCodes(historyBoards.map(b => b.code));
    }
  };

  const clearHistorySelection = () => setSelectedHistoryCodes([]);

  const confirmDeleteSelectedHistory = async () => {
    try {
      await Promise.all(selectedHistoryCodes.map(code => 
        axios.delete(`${API_BASE_URL}/api/visionboard/${code}`)
      ));
      setHistoryBoards(prev => prev.filter(b => !selectedHistoryCodes.includes(b.code)));
      if (selectedHistoryCodes.includes(currentBoardCode)) {
        setCurrentBoardCode(null);
        setCurrentBoardName('');
      }
      setSelectedHistoryCodes([]);
      setShowHistorySelectionDeleteModal(false);
    } catch (err) {
      console.error('Failed to delete selected boards:', err);
    }
  };

  const handleDeleteHistoryBoard = (code) => {
    setHistoryBoardToDelete(code);
    setShowHistoryDeleteModal(true);
  };

  const confirmDeleteHistoryBoard = async () => {
    if (!historyBoardToDelete) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/visionboard/${historyBoardToDelete}`);
      setHistoryBoards(prev => prev.filter(b => b.code !== historyBoardToDelete));
      if (currentBoardCode === historyBoardToDelete) {
        setCurrentBoardCode(null);
        setCurrentBoardName('');
      }
      setShowHistoryDeleteModal(false);
      setHistoryBoardToDelete(null);
    } catch (err) {
      console.error('Failed to delete board:', err);
    }
  };

  const handleDownload = async (imagesToDownload = favorites) => {
    if (imagesToDownload.length === 0) return;
    setIsDownloading(true);

    try {
      // 1. Save board to DB → get unique code
      let boardCode = await saveBoard(true);
      if (!boardCode) {
        setIsDownloading(false);
        return;
      }

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // 2. First Page: Title page with the board code
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageW, pageH, 'F');

      // Heavy black border around the whole page
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(10);
      pdf.rect(0, 0, pageW, pageH, 'S');

      // Studio name
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INTEDESIGN STUDIO', pageW / 2, pageH / 2 - 60, { align: 'center', charSpace: 4 });

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MY DESIGN VISION BOARD', pageW / 2, pageH / 2 - 42, { align: 'center', charSpace: 2 });

      // Divider
      pdf.setLineWidth(2);
      pdf.line(pageW / 2 - 80, pageH / 2 - 28, pageW / 2 + 80, pageH / 2 - 28);

      if (boardCode) {
        pdf.setFontSize(9);
        pdf.text('BOARD REFERENCE CODE', pageW / 2, pageH / 2 - 10, { align: 'center', charSpace: 2 });

        // Code box (yellow bg, black border, shadow)
        const boxW = 140, boxH = 34;
        const boxX = pageW / 2 - boxW / 2;
        const boxY = pageH / 2 - 2;
        
        // Shadow
        pdf.setFillColor(0, 0, 0);
        pdf.rect(boxX + 4, boxY + 4, boxW, boxH, 'F');
        // Box
        pdf.setFillColor(255, 206, 0); // yellow-400
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(3);
        pdf.rect(boxX, boxY, boxW, boxH, 'FD'); // Fill and stroke

        pdf.setFontSize(18);
        pdf.setFont('courier', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(boardCode, pageW / 2, pageH / 2 + 20, { align: 'center', charSpace: 2 });

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Share this code with InteDesign Studio', pageW / 2, pageH / 2 + 45, { align: 'center' });
      }

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('intedesign.studio', pageW / 2, pageH - 30, { align: 'center', charSpace: 2 });

      // Helper: load any URL via canvas (CORS-safe)
      const toDataUrl = (src) => new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          canvas.getContext('2d').drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        };
        img.onerror = () => resolve(null);
        img.src = src.includes('?') ? src + '&cb=' + Date.now() : src + '?cb=' + Date.now();
      });

      // 3. Images pages (one per page)
      for (const img of imagesToDownload) {
        const src = img.url || img.thumb;
        const dataUrl = await toDataUrl(src);
        if (!dataUrl) continue;

        pdf.addPage();
        const tempImg = new Image();
        await new Promise(r => { tempImg.onload = r; tempImg.src = dataUrl; });
        
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageW, pageH, 'F');
        
        // Page border
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(10);
        pdf.rect(0, 0, pageW, pageH, 'S');

        const margin = 30;
        const maxDrawW = pageW - margin * 2;
        const maxDrawH = pageH - margin * 2 - 40; // leave room at bottom

        const ratio = Math.min(maxDrawW / tempImg.naturalWidth, maxDrawH / tempImg.naturalHeight);
        const drawW = tempImg.naturalWidth * ratio;
        const drawH = tempImg.naturalHeight * ratio;
        
        const imgX = (pageW - drawW) / 2;
        const imgY = (pageH - drawH - 20) / 2;

        // Shadow
        pdf.setFillColor(0, 0, 0);
        pdf.rect(imgX + 6, imgY + 6, drawW, drawH, 'F');
        
        // Image
        pdf.addImage(dataUrl, 'JPEG', imgX, imgY, drawW, drawH);
        
        // Border
        pdf.setLineWidth(3);
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(imgX, imgY, drawW, drawH, 'S');

        // Source Label (pink or yellow box)
        const isPortfolio = img.source === 'portfolio';
        pdf.setFillColor(isPortfolio ? 244 : 255, isPortfolio ? 114 : 206, isPortfolio ? 182 : 0); // bg-pink-400 : bg-yellow-400
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(imgX, imgY + drawH + 15, 80, 18, 'FD');
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(isPortfolio ? 'PORTFOLIO' : 'AI EXPLORER', imgX + 40, imgY + drawH + 26, { align: 'center' });
      }

      pdf.save(`InteDesign Vision Board ${boardCode}.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  /* Responsive columns for Vision Board */
  const breakpointColumnsObj = { default: 3, 1100: 3, 700: 2, 500: 2 };

  if (loading) {
    return <div className="min-h-screen pt-24 pb-20 px-3 flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen pt-24 md:pt-32 pb-20 px-3 md:px-16 flex items-center justify-center relative bg-white">
          <div className="text-center bg-white border-4 border-black shadow-[8px_8px_0px_#000000] p-12 max-w-lg w-full">
            <h1 className="text-3xl font-black uppercase mb-4 text-black">Sign in Required</h1>
            <p className="text-black font-medium mb-8">Please log in to view and save items to your personal Vision Board.</p>
            <Link to="/login" className="bg-yellow-400 text-black border-4 border-black p-4 font-black uppercase tracking-wide inline-block w-full shadow-[4px_4px_0px_#000000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
              Log In Now
            </Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen pt-24 md:pt-32 pb-20 px-3 md:px-16 relative bg-white">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-3 transition-all duration-300">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex-1">
              <h1 className="text-4xl md:text-6xl font-black text-black uppercase tracking-tighter">My Vision Board</h1>
              <p className="text-sm font-bold text-gray-500 mt-2">A curated collection of your design inspirations.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
              <button
                onClick={openHistory}
                className="px-6 py-3 text-[11px] font-black tracking-widest uppercase transition-all duration-300 bg-white border-4 border-black text-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
              >
                View History
              </button>
            </motion.div>
          </div>


          {/* Empty State */}
          {favorites.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-32 bg-gray-100 border-4 border-black shadow-[8px_8px_0px_#000000] mt-8"
            >
              <FaHeart className="text-black text-6xl mx-auto mb-6 drop-shadow-[4px_4px_0px_#FFCE00]" />
              <h2 className="text-2xl text-black font-black uppercase mb-4 tracking-tighter">Your board is empty</h2>
              <p className="text-sm font-bold text-gray-700 mb-8 max-w-xs mx-auto">
                Explore styles and heart your favorites to build your personalized design vision.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6 px-4">
                <Link
                  to="/explorer"
                  className="neopop-btn bg-pink-400 text-black px-10 py-4 text-xs shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1 hover:bg-pink-300"
                >
                  Start Exploring AI →
                </Link>
                <Link to="/portfolio" className="neopop-btn bg-white text-black px-10 py-4 text-xs shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1 hover:bg-gray-100">
                  Browse Portfolio
                </Link>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Category Tabs */}
              {(() => {
                const portfolioCount = favorites.filter(f => f.source === 'portfolio').length;
                const explorerCount = favorites.filter(f => (f.source || 'explorer') === 'explorer').length;
                const uploadedCount = favorites.filter(f => f.source === 'uploaded').length;
                
                return (
                  <div className="sticky top-0 z-[600] -mx-6 md:-mx-16 px-6 md:px-16 pt-24 pb-8 pointer-events-none">
                    {/* Blurred bridge/background that covers the gap to the navbar */}
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-md -z-10 h-full w-full" 
                         style={{ maskImage: 'linear-gradient(to bottom, black, black 70%, transparent)' }} />
                    
                    <motion.div
                      animate={{
                        opacity: 1,
                        pointerEvents: 'auto',
                        y: 0
                      }}
                      transition={{ duration: 0.3 }}
                      className="pointer-events-auto flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border-4 border-black p-2 shadow-[8px_8px_0px_#000000]"
                    >
                      <div className="flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar px-2 w-full md:w-auto pb-2 md:pb-0 border-b-2 md:border-b-0 border-gray-200 md:border-transparent">
                      {[
                        { key: 'all', label: `All (${favorites.length})` },
                        { key: 'portfolio', label: `Portfolio (${portfolioCount})` },
                        { key: 'explorer', label: `AI Explorer (${explorerCount})` },
                        ...(uploadedCount > 0 ? [{ key: 'uploaded', label: `Uploaded (${uploadedCount})` }] : []),
                      ].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => { 
                            setActiveTab(tab.key); 
                            setLightboxIndex(null);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`px-4 md:px-5 py-2 md:py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-300 border-2 whitespace-nowrap ${activeTab === tab.key
                            ? 'bg-yellow-400 border-black text-black shadow-[2px_2px_0px_#000000]'
                            : 'bg-white border-transparent text-gray-600 hover:text-black hover:border-black'
                            }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 px-2 w-full md:w-auto">
                      {favorites.length > 0 && (
                        <>
                          <button
                            onClick={handleSaveOnly}
                            disabled={isDownloading || !isUnsaved}
                            className={`flex items-center gap-2 px-6 py-2 md:py-3 text-[10px] md:text-xs font-black tracking-widest uppercase transition-all duration-300 whitespace-nowrap cursor-pointer neopop-btn ${!isUnsaved ? 'bg-gray-200 text-gray-500 shadow-none' : 'bg-yellow-400 text-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1'}`}
                          >
                            <FaHeart fontSize={12} className={isDownloading ? 'animate-pulse' : ''} />
                            <span className="hidden sm:inline">
                              {isDownloading ? 'Saving...' : (isUnsaved ? 'Save Canvas' : 'Saved')}
                            </span>
                            <span className="sm:hidden">
                              {isDownloading ? '...' : (isUnsaved ? 'Save' : 'Saved')}
                            </span>
                          </button>
                          
                          <button
                            onClick={() => handleDownload(isSelectMode ? favorites.filter(f => selectedIds.includes(f.id)) : favorites)}
                            disabled={isDownloading}
                            className="flex items-center gap-2 px-6 py-2 md:py-3 text-[10px] md:text-xs font-black tracking-widest uppercase transition-all duration-300 whitespace-nowrap disabled:opacity-30 cursor-pointer neopop-btn bg-pink-400 text-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
                          >
                            <FiDownload fontSize={12} className={isDownloading ? 'animate-bounce' : ''} />
                            <span className="hidden sm:inline">
                              {isDownloading ? 'Downloading...' : (isSelectMode && selectedIds.length > 0 ? `Download (${selectedIds.length})` : 'Download Canvas')}
                            </span>
                            <span className="sm:hidden">
                              {isDownloading ? '...' : (isSelectMode && selectedIds.length > 0 ? `Download (${selectedIds.length})` : 'Download')}
                            </span>
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                </div>
                );
              })()}
              {/* Board Grid */}
              <div
                ref={boardRef}
                className="relative p-4 md:p-12 bg-gray-100 border-4 border-black overflow-hidden mt-8 shadow-[8px_8px_0px_#000000]"
              >

                {tabFavorites.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-gray-500 font-bold text-sm">No items in this category yet.</p>
                  </div>
                ) : (
                  <Masonry
                    breakpointCols={breakpointColumnsObj}
                    className="my-masonry-grid"
                    columnClassName="my-masonry-grid_column"
                  >
                    {tabFavorites.map((img, idx) => {
                      const isSelected = selectedIds.includes(img.id);
                      return (
                        <motion.div
                          key={img.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`relative mb-6 group bg-white border-4 p-1 transition-all duration-300 cursor-pointer neopop-card ${isSelected ? 'border-pink-500 shadow-none translate-y-1 translate-x-1' : 'border-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1'
                            }`}
                          onContextMenu={(e) => {
                            if (window.innerWidth < 768) {
                              e.preventDefault();
                              toggleSelect(img.id);
                            }
                          }}
                          onClick={() => {
                            if (isSelectMode) {
                              toggleSelect(img.id);
                            } else {
                              setLightboxIndex(idx);
                            }
                          }}
                        >
                          <img
                            src={getProxyUrl(img.thumb)}
                            alt={img.description}
                            className="w-full h-auto block border-2 border-black"
                            crossOrigin="anonymous"
                            draggable="false"
                            onContextMenu={(e) => e.preventDefault()}
                          />

                          {/* Source Label */}
                          <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
                            <span className={`text-[8px] md:text-[10px] font-black uppercase px-2 py-1 border-2 border-black shadow-[2px_2px_0px_#000000] text-black ${
                              img.source === 'portfolio' ? 'bg-pink-400' : 'bg-yellow-400'
                            }`}>
                              {img.source === 'portfolio' ? 'Portfolio' : 'AI Explorer'}
                            </span>
                          </div>

                          {/* Hover border glow — no overlay */}
                          <div className="no-export absolute inset-0 ring-1 ring-white/0 group-hover:ring-black/10 transition-all duration-300 pointer-events-none" />

                          {/* Corner buttons — visible on hover */}
                          <div className="no-export opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300">
                            {!isSelectMode && (
                              <button
                                onClick={(e) => { e.stopPropagation(); removeFavorite(img.id); }}
                                className="absolute top-4 left-4 p-3 bg-white text-black hover:text-white hover:bg-red-500 border-2 border-black transition-all shadow-[2px_2px_0px_#000000] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px]"
                                title="Delete from board"
                              >
                                <FaTrash fontSize={13} />
                              </button>
                            )}

                            <div
                              className={`absolute top-4 right-4 z-20 transition-all duration-300 ${isSelectMode ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelect(img.id);
                              }}
                            >
                              <div className={`w-8 h-8 flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_#000000] transition-colors duration-300 ${isSelected ? 'bg-pink-400 text-black' : 'bg-white text-black'
                                }`}>
                                <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </Masonry>
                )}

                {/* Watermark — hidden on page, visible on export */}
                <div className="watermark-export no-export hidden mt-12 pt-8 border-t-4 border-black items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black flex items-center justify-center">
                      <span className="text-white text-lg font-black uppercase">P</span>
                    </div>
                    <div>
                      <p className="text-black text-sm font-black uppercase">InteDesign Studio</p>
                      <p className="text-gray-500 font-bold text-[10px] tracking-widest uppercase">My Design Vision Board</p>
                    </div>
                  </div>
                  <p className="text-gray-500 font-bold text-[10px] font-mono">intedesign.studio</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Action Bar - Only when selections exist */}
      <AnimatePresence>
        {isSelectMode && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] max-w-[95vw] overflow-hidden bg-white shadow-[8px_8px_0px_#000000] no-scrollbar border-4 border-black"
          >
            <div className="flex items-center px-4 md:px-8 py-3 md:py-4 gap-4 md:gap-8">
              {/* Selection Count */}
              <div className="flex items-center gap-2 md:gap-3">
                <div className="bg-yellow-400 text-black w-7 h-7 md:w-9 md:h-9 flex items-center justify-center text-[10px] md:text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000000]">
                  {selectedIds.length}
                </div>
                <span className="text-xs font-black tracking-widest text-black uppercase ml-1 md:ml-2 hidden sm:inline">Selected</span>
              </div>

              <div className="w-1 h-8 bg-black" />

              {/* Actions */}
              <div className="flex items-center gap-4 md:gap-8">
                {/* Select All Action */}
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 md:gap-2.5 text-black hover:text-gray-700 font-black text-[10px] md:text-xs tracking-widest uppercase transition-colors active:translate-y-[1px]"
                >
                  <div className={`w-4 h-4 md:w-5 md:h-5 border-2 border-black flex items-center justify-center transition-colors ${selectedIds.length === tabFavorites.length ? 'bg-black text-white' : 'bg-white'}`}>
                    {selectedIds.length === tabFavorites.length && <FaCheck className="text-[8px] md:text-[10px]" />}
                  </div>
                  <span className="whitespace-nowrap">{selectedIds.length === tabFavorites.length ? 'Deselect All' : 'Select All'}</span>
                </button>

                <div className="w-1 h-8 bg-black" />

                <button
                  onClick={() => setShowSelectionDeleteModal(true)}
                  className="flex items-center gap-2 md:gap-2.5 text-red-500 hover:text-red-700 font-black text-[10px] md:text-xs tracking-widest uppercase transition-colors active:translate-y-[1px]"
                >
                  <FaTrash className="text-[12px] md:text-[14px]" /> 
                  <span className="whitespace-nowrap hidden sm:inline">Remove Selected</span>
                  <span className="whitespace-nowrap sm:hidden">Remove</span>
                </button>

                <div className="w-1 h-8 bg-black" />

                <button
                  onClick={clearSelection}
                  className="flex items-center gap-2 md:gap-2.5 text-black hover:text-gray-700 font-black text-[10px] md:text-xs tracking-widest uppercase transition-colors active:translate-y-[1px]"
                >
                  <FaTimes className="text-[12px] md:text-[14px]" /> 
                  <span className="whitespace-nowrap hidden sm:inline">Clear Selection</span>
                  <span className="whitespace-nowrap sm:hidden">Clear</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            key="board-lightbox-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] bg-white/90 backdrop-blur-md flex items-center justify-center p-6 md:p-12"
            onClick={closeLightbox}
          >
            {/* Close */}
            <button
              className="absolute top-12 right-12 text-black hover:text-white p-4 bg-white border-2 border-black hover:bg-black transition-all z-[1010] shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
              onClick={closeLightbox}
            >
              <FaTimes fontSize={20} />
            </button>

            {/* Desktop Navigation Arrows */}
            {favorites.length > 1 && (
              <div className="hidden md:block">
                <button
                  className="absolute left-10 top-1/2 -translate-y-1/2 w-16 h-16 bg-yellow-400 text-black hover:bg-black hover:text-white border-2 border-black transition-all z-[1010] flex items-center justify-center shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                >
                  <FaChevronLeft fontSize={22} />
                </button>
                <button
                  className="absolute right-10 top-1/2 -translate-y-1/2 w-16 h-16 bg-yellow-400 text-black hover:bg-black hover:text-white border-2 border-black transition-all z-[1010] flex items-center justify-center shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                >
                  <FaChevronRight fontSize={22} />
                </button>
              </div>
            )}

            {/* Mobile Arrows - Moved to bottom-left like Portfolio */}
            {favorites.length > 1 && (
              <div className="absolute bottom-12 left-12 flex items-center gap-4 md:hidden z-[1010]">
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="w-14 h-14 bg-yellow-400 text-black border-2 border-black flex items-center justify-center active:translate-y-1 shadow-[4px_4px_0px_#000000] active:shadow-none"
                >
                  <FaChevronLeft fontSize={20} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="w-14 h-14 bg-yellow-400 text-black border-2 border-black flex items-center justify-center active:translate-y-1 shadow-[4px_4px_0px_#000000] active:shadow-none"
                >
                  <FaChevronRight fontSize={20} />
                </button>
              </div>
            )}

            {/* Image + Actions */}
            {/* Image Box */}
            <div className="max-w-4xl w-full flex flex-col items-center gap-6 relative" onClick={(e) => e.stopPropagation()}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={lightboxImage.id}
                  initial={{ opacity: 0, scale: 0.94, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.94, x: -20 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipeThreshold = 50;
                    const velocityThreshold = 500;
                    if (Math.abs(offset.x) > swipeThreshold && Math.abs(velocity.x) > velocityThreshold) {
                      if (offset.x > 0) goPrev();
                      else goNext();
                    }
                  }}
                  className="w-full touch-none"
                >
                  <VisionBoardLightboxImage
                    src={lightboxImage.url || lightboxImage.thumb}
                    alt={lightboxImage.description}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Management Bar — Compacted for mobile */}
              <div className="relative h-[80px] w-full flex items-center justify-center">
                <div className="flex items-center gap-2 bg-white border-4 border-black px-3 md:px-6 py-3 shadow-[8px_8px_0px_#000000] max-w-[95vw]">
                  {/* Count */}
                  <span className="text-black text-[10px] md:text-xs font-black tracking-widest flex items-center justify-center min-w-[30px] md:min-w-[40px] px-1 md:px-2 uppercase">
                    {lightboxIndex + 1} <span className="mx-1 text-gray-400 font-normal">/</span> {tabFavorites.length}
                  </span>

                  <div className="w-1 h-8 bg-black mx-1 md:mx-2" />

                  {/* Select Toggle */}
                  <button
                    onClick={() => toggleSelect(lightboxImage.id)}
                    className={`flex items-center gap-2 md:gap-3 px-4 md:px-8 py-3 transition-all duration-300 text-[10px] font-black tracking-widest uppercase flex-shrink-0 border-2 border-black ${selectedIds.includes(lightboxImage.id) ? 'bg-pink-400 text-black shadow-none translate-y-[2px] translate-x-[2px]' : 'bg-white text-black shadow-[4px_4px_0px_#000000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none'}`}
                  >
                    <div className={`w-4 h-4 border-2 border-black flex items-center justify-center ${selectedIds.includes(lightboxImage.id) ? 'bg-black text-white' : 'bg-white'}`}>
                      {selectedIds.includes(lightboxImage.id) && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><FaCheck className="text-[10px]"/></motion.div>}
                    </div>
                    <span className="hidden sm:inline">{selectedIds.includes(lightboxImage.id) ? 'Deselect image' : 'Select image'}</span>
                    <span className="sm:hidden">{selectedIds.includes(lightboxImage.id) ? 'Deselect' : 'Select'}</span>
                  </button>

                  <div className="w-1 h-8 bg-black mx-1 md:mx-2" />

                  {/* Delete */}
                  <button
                    onClick={() => { removeFavorite(lightboxImage.id); }}
                    className="flex items-center gap-1 text-black hover:text-red-500 px-2 md:px-6 py-3 transition-colors text-[10px] md:text-xs font-black tracking-widest uppercase flex-shrink-0"
                  >
                    <FaTrash fontSize={14} className="md:mr-1" /> 
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Fixed constant "Enquire" button in bottom right of screen - Outside image box */}
            <div className="fixed bottom-12 right-12 z-[1020] pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); window.location.href = '/contact'; }}
                className="px-8 md:px-10 py-3 md:py-4 transition-all duration-300 text-[10px] md:text-[11px] font-black tracking-widest uppercase neopop-btn bg-pink-400 text-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1 border-2 border-black"
              >
                Enquire Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-white/60 backdrop-blur-sm touch-none"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-[calc(100%-8px)] sm:w-full max-w-sm bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_#000000] sm:shadow-[12px_12px_0px_#000000] text-center"
            >
              <div className="w-16 h-16 bg-red-400 border-2 border-black shadow-[4px_4px_0px_#000000] flex items-center justify-center mx-auto mb-6">
                <FaTrash className="text-black text-xl" />
              </div>
              <h3 className="text-2xl font-black text-black uppercase tracking-tighter mb-3">Clear Your Board?</h3>
              <p className="text-sm font-bold text-gray-700 mb-8 leading-relaxed">
                This will permanently remove all {favorites.length} saved items from your vision board. This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDeleteAll}
                  className="w-full py-4 bg-red-500 text-black border-2 border-black text-[11px] font-black tracking-widest uppercase transition-all shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
                >
                  Yes, Clear Everything
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-4 bg-white text-black border-2 border-black text-[11px] font-black tracking-widest uppercase transition-all shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Selection Delete Confirmation Modal */}
      <AnimatePresence>
        {showSelectionDeleteModal && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSelectionDeleteModal(false)}
              className="absolute inset-0 bg-white/60 backdrop-blur-sm touch-none"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-[calc(100%-8px)] sm:w-full max-w-sm bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_#000000] sm:shadow-[12px_12px_0px_#000000] text-center"
            >
              <div className="w-16 h-16 bg-red-400 border-2 border-black shadow-[4px_4px_0px_#000000] flex items-center justify-center mx-auto mb-6">
                <FaTrash className="text-black text-xl" />
              </div>
              <h3 className="text-2xl font-black text-black uppercase tracking-tighter mb-3">Remove Selected?</h3>
              <p className="text-sm font-bold text-gray-700 mb-8 leading-relaxed">
                You are about to remove {selectedIds.length} items from your board. This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDeleteSelected}
                  className="w-full py-4 bg-red-500 text-black border-2 border-black text-[11px] font-black tracking-widest uppercase transition-all shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
                >
                  Yes, Remove Selected
                </button>
                <button
                  onClick={() => setShowSelectionDeleteModal(false)}
                  className="w-full py-4 bg-white text-black border-2 border-black text-[11px] font-black tracking-widest uppercase transition-all shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showItemDeleteModal && itemToDelete && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowItemDeleteModal(false)}
              className="absolute inset-0 bg-white/60 backdrop-blur-sm touch-none"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-[calc(100%-8px)] sm:w-full max-w-sm bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_#000000] sm:shadow-[12px_12px_0px_#000000] text-center"
            >
              <div className="w-16 h-16 bg-red-400 border-2 border-black shadow-[4px_4px_0px_#000000] flex items-center justify-center mx-auto mb-6">
                <FaTrash className="text-black text-xl" />
              </div>
              <h3 className="text-2xl font-black text-black uppercase tracking-tighter mb-3">Remove this image?</h3>
              <p className="text-sm font-bold text-gray-700 mb-8 leading-relaxed">
                This item will be removed from your collection.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmItemDelete}
                  className="w-full py-4 bg-red-500 text-black border-2 border-black text-[11px] font-black tracking-widest uppercase transition-all shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
                >
                  Yes, Remove
                </button>
                <button
                  onClick={() => setShowItemDeleteModal(false)}
                  className="w-full py-4 bg-white text-black border-2 border-black text-[11px] font-black tracking-widest uppercase transition-all shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div ref={bottomRef} className="h-px w-full" />
      <style>{`
        .my-masonry-grid { display: flex; margin-left: -8px; width: auto; }
        .my-masonry-grid_column { padding-left: 8px; background-clip: padding-box; }
        @media (min-width: 768px) {
          .my-masonry-grid { margin-left: -16px; }
          .my-masonry-grid_column { padding-left: 16px; }
        }
      `}</style>
      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryModal(false)}
              className="absolute inset-0 bg-white/80 backdrop-blur-sm touch-none"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-[calc(100%-12px)] max-w-6xl bg-white border-4 border-black p-4 sm:p-10 shadow-[8px_8px_0px_#000000] sm:shadow-[12px_12px_0px_#000000] max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6 sm:mb-8 pb-4 border-b-4 border-black flex-shrink-0">
                <h3 className="text-2xl sm:text-4xl font-black text-black uppercase tracking-tighter">Canvas History</h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 sm:p-3 bg-white text-black hover:bg-black hover:text-white border-2 border-black transition-all shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
                >
                  <FaTimes className="text-lg sm:text-xl" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 pr-2 -mr-2 min-h-0">

              {isLoadingHistory ? (
                <div className="text-center py-20">
                  <p className="text-black font-black uppercase tracking-widest animate-pulse">Loading history...</p>
                </div>
              ) : historyBoards.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 border-4 border-black">
                  <p className="text-gray-500 font-bold">You haven't saved any vision boards yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pr-2">
                  {historyBoards.map(board => (
                    <div key={board.code} className="relative bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#000000] hover:shadow-[2px_2px_0px_#000000] hover:translate-y-1 hover:translate-x-1 transition-all flex flex-col justify-between"
                      onClick={() => {
                        if (selectedHistoryCodes.length > 0) toggleHistorySelect(board.code);
                      }}
>
                      <div>
                        
                        <div className="absolute top-2 right-2 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleHistorySelect(board.code);
                            }}
                            className={`w-6 h-6 border-2 border-black flex items-center justify-center transition-colors shadow-[2px_2px_0px_#000000] active:shadow-none active:translate-y-[2px] active:translate-x-[2px] ${selectedHistoryCodes.includes(board.code) ? 'bg-pink-400 text-black' : 'bg-white text-black'}`}
                          >
                            {selectedHistoryCodes.includes(board.code) && <FaCheck className="text-[10px]" />}
                          </button>
                        </div>

                          <div className="flex justify-between items-start mb-4 pr-8">
                          <span className="bg-yellow-400 text-black px-3 py-1 font-black uppercase tracking-widest text-xs border-2 border-black">
                            {board.code}
                          </span>
                          <span className="text-xs font-bold text-gray-500 text-right">
                            {new Date(board.createdAt).toLocaleString()}<br/>
                            {board.isDownloaded ? 'Downloaded' : 'Saved Draft'}
                          </span>
                        </div>

                        {renameData.code === board.code ? (
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            <input
                              type="text"
                              value={renameData.name}
                              onChange={(e) => setRenameData({ ...renameData, name: e.target.value })}
                              placeholder="Canvas Name..."
                              className="w-full sm:flex-1 p-2 text-sm font-bold border-2 border-black focus:outline-none"
                              autoFocus
                              onKeyDown={(e) => e.key === 'Enter' && handleRename(board.code, renameData.name)}
                            />
                            <div className="flex w-full sm:w-auto gap-2">
                              <button
                                onClick={() => handleRename(board.code, renameData.name)}
                                className="flex-1 bg-black text-white px-3 py-2 text-xs font-black uppercase tracking-widest border-2 border-black whitespace-nowrap"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setRenameData({ code: null, name: '' })}
                                className="flex-1 bg-gray-200 text-black px-3 py-2 text-xs font-black uppercase tracking-widest border-2 border-black whitespace-nowrap"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-black text-lg uppercase truncate">
                              {board.name || `${board.count} Canvas ${new Date(board.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })} ${new Date(board.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}`}
                            </h4>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setRenameData({ code: board.code, name: board.name || '' })}
                                className="text-xs font-bold text-blue-500 hover:underline"
                              >
                                Rename
                              </button>
                              <button
                                onClick={() => handleDeleteHistoryBoard(board.code)}
                                className="text-xs font-bold text-red-500 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex -space-x-4 mb-6 overflow-hidden py-2 pl-2">
                          {board.images.slice(0, 4).map((img, i) => (
                            <img 
                              key={i} 
                              src={getProxyUrl(img.thumb || img.url)} 
                              alt="thumbnail" 
                              className="w-16 h-16 object-cover border-2 border-black rounded-full shadow-[2px_2px_0px_#000000]"
                              style={{ zIndex: 4 - i }}
                            />
                          ))}
                          {board.images.length > 4 && (
                            <div className="w-16 h-16 bg-gray-100 border-2 border-black rounded-full flex items-center justify-center font-black text-xs z-0 shadow-[2px_2px_0px_#000000]">
                              +{board.images.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleLoadClick(board)}
                          className="w-full py-3 bg-black text-white font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_#FFCE00] hover:shadow-none hover:translate-y-1 hover:translate-x-1 border-2 border-black"
                        >
                          Load Canvas ({board.count} items)
                        </button>
                        <button
                          onClick={() => handleDownload(board.images)}
                          className="w-full py-3 bg-pink-400 text-black font-black uppercase tracking-widest text-xs hover:bg-pink-300 transition-colors shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1 border-2 border-black flex items-center justify-center gap-2"
                        >
                          <FiDownload /> Download PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>

              {selectedHistoryCodes.length > 0 && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[200] max-w-[95vw] overflow-hidden bg-white shadow-[8px_8px_0px_#000000] no-scrollbar border-4 border-black pointer-events-auto"
                >
                  <div className="flex items-center px-4 md:px-8 py-3 md:py-4 gap-4 md:gap-8">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="bg-yellow-400 text-black w-7 h-7 md:w-9 md:h-9 flex items-center justify-center text-[10px] md:text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000000]">
                        {selectedHistoryCodes.length}
                      </div>
                      <span className="text-xs font-black tracking-widest text-black uppercase ml-1 md:ml-2 hidden sm:inline">Selected</span>
                    </div>
                    <div className="w-1 h-8 bg-black" />
                    <div className="flex items-center gap-4 md:gap-8">
                      <button
                        onClick={toggleHistorySelectAll}
                        className="flex items-center gap-2 md:gap-2.5 text-black hover:text-gray-700 font-black text-[10px] md:text-xs tracking-widest uppercase transition-colors active:translate-y-[1px]"
                      >
                        <div className={`w-4 h-4 md:w-5 md:h-5 border-2 border-black flex items-center justify-center transition-colors ${selectedHistoryCodes.length === historyBoards.length ? 'bg-black text-white' : 'bg-white'}`}>
                          {selectedHistoryCodes.length === historyBoards.length && <FaCheck className="text-[8px] md:text-[10px]" />}
                        </div>
                        <span className="whitespace-nowrap">{selectedHistoryCodes.length === historyBoards.length ? 'Deselect' : 'Select All'}</span>
                      </button>
                      <div className="w-1 h-8 bg-black" />
                      <button
                        onClick={() => setShowHistorySelectionDeleteModal(true)}
                        className="flex items-center gap-2 md:gap-2.5 text-red-500 hover:text-red-700 font-black text-[10px] md:text-xs tracking-widest uppercase transition-colors active:translate-y-[1px]"
                      >
                        <FaTrash className="text-[12px] md:text-[14px]" /> 
                        <span className="whitespace-nowrap hidden sm:inline">Delete Selected</span>
                        <span className="whitespace-nowrap sm:hidden">Delete</span>
                      </button>
                      <div className="w-1 h-8 bg-black" />
                      <button
                        onClick={clearHistorySelection}
                        className="flex items-center gap-2 md:gap-2.5 text-black hover:text-gray-700 font-black text-[10px] md:text-xs tracking-widest uppercase transition-colors active:translate-y-[1px]"
                      >
                        <FaTimes className="text-[12px] md:text-[14px]" /> 
                        <span className="whitespace-nowrap hidden sm:inline">Clear</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unsaved Changes Confirmation Modal */}
      <AnimatePresence>
        {showLoadConfirmModal && (
          <div className="fixed inset-0 z-[7000] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowLoadConfirmModal(false)}
              className="absolute inset-0 bg-white/80 backdrop-blur-sm touch-none"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-[calc(100%-8px)] sm:w-full max-w-md bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_#000000] sm:shadow-[12px_12px_0px_#000000] text-center"
            >
              <h3 className="text-2xl font-black text-black uppercase tracking-tighter mb-4">Unsaved Changes</h3>
              <p className="text-sm font-bold text-gray-700 mb-8">
                Your current board has unsaved items. Loading a new board will clear them. Would you like to save your current board before continuing?
              </p>
              <div className="flex flex-col gap-4">
                <button
                  onClick={async () => {
                    await handleSaveOnly();
                    if (boardToLoad) executeLoadBoard(boardToLoad);
                  }}
                  className="w-full py-4 bg-yellow-400 text-black border-2 border-black text-xs font-black tracking-widest uppercase transition-all shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
                >
                  Save Current & Load
                </button>
                <button
                  onClick={() => {
                    if (boardToLoad) executeLoadBoard(boardToLoad);
                  }}
                  className="w-full py-4 bg-red-500 text-black border-2 border-black text-xs font-black tracking-widest uppercase transition-all shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
                >
                  Clear Current & Load
                </button>
                <button
                  onClick={() => setShowLoadConfirmModal(false)}
                  className="w-full py-3 bg-white text-black border-2 border-black text-xs font-black tracking-widest uppercase transition-all shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1 mt-2"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Delete Confirmation Modal */}
      <AnimatePresence>
        {showHistoryDeleteModal && (
          <div className="fixed inset-0 z-[7000] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowHistoryDeleteModal(false);
                setHistoryBoardToDelete(null);
              }}
              className="absolute inset-0 bg-white/60 backdrop-blur-sm touch-none"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-[calc(100%-8px)] sm:w-full max-w-sm bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_#000000] sm:shadow-[12px_12px_0px_#000000] text-center"
            >
              <div className="w-16 h-16 bg-red-400 border-2 border-black shadow-[4px_4px_0px_#000000] flex items-center justify-center mx-auto mb-6">
                <FaTrash className="text-black text-xl" />
              </div>
              <h3 className="text-2xl font-black text-black uppercase tracking-tighter mb-3">Delete this Canvas?</h3>
              <p className="text-sm font-bold text-gray-700 mb-8 leading-relaxed">
                This canvas will be permanently removed from your history. This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDeleteHistoryBoard}
                  className="w-full py-4 bg-red-500 text-black border-2 border-black text-[11px] font-black tracking-widest uppercase transition-all shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
                >
                  Yes, Delete Canvas
                </button>
                <button
                  onClick={() => {
                    setShowHistoryDeleteModal(false);
                    setHistoryBoardToDelete(null);
                  }}
                  className="w-full py-4 bg-white text-black border-2 border-black text-[11px] font-black tracking-widest uppercase transition-all shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* History Selection Delete Modal */}
      <AnimatePresence>
        {showHistorySelectionDeleteModal && (
          <div className="fixed inset-0 z-[7000] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowHistorySelectionDeleteModal(false)}
              className="absolute inset-0 bg-white/60 backdrop-blur-sm touch-none"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-[calc(100%-8px)] sm:w-full max-w-sm bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_#000000] sm:shadow-[12px_12px_0px_#000000] text-center"
            >
              <div className="w-16 h-16 bg-red-400 border-2 border-black shadow-[4px_4px_0px_#000000] flex items-center justify-center mx-auto mb-6">
                <FaTrash className="text-black text-xl" />
              </div>
              <h3 className="text-2xl font-black text-black uppercase tracking-tighter mb-3">Delete Selected?</h3>
              <p className="text-sm font-bold text-gray-700 mb-8 leading-relaxed">
                You are about to permanently delete {selectedHistoryCodes.length} canvases from your history. This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDeleteSelectedHistory}
                  className="w-full py-4 bg-red-500 text-black border-2 border-black text-[11px] font-black tracking-widest uppercase transition-all shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
                >
                  Yes, Delete Selected
                </button>
                <button
                  onClick={() => setShowHistorySelectionDeleteModal(false)}
                  className="w-full py-4 bg-white text-black border-2 border-black text-[11px] font-black tracking-widest uppercase transition-all shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </PageTransition>
  );
};


/* Sub-component: image with skeleton loader for Vision Board */
const VisionBoardLightboxImage = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative overflow-hidden bg-white border-4 border-black min-h-[400px] flex items-center justify-center w-full shadow-[8px_8px_0px_#000000]">
      {/* Background fill */}
      {src && (
        <div
          className="absolute inset-0 z-0 opacity-20 blur-md scale-110"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}

      {!loaded && (
        <div className="absolute inset-0 z-10 bg-gray-200 animate-pulse" />
      )}

      <img
        src={getProxyUrl(src)}
        alt={alt}
        onLoad={() => setLoaded(true)}
        draggable="false"
        onContextMenu={(e) => e.preventDefault()}
        className={`relative z-10 w-full max-h-[55vh] md:max-h-[60vh] object-contain border-4 border-black transition-all duration-500 ease-out bg-white p-2 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
      />
    </div>
  );
};

export default MyBoard;
