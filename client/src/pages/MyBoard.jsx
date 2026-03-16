import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { FaTrash, FaArrowLeft, FaHeart, FaCheckCircle, FaRegCircle, FaTimes, FaChevronLeft, FaChevronRight, FaCheck } from 'react-icons/fa';
import { FiDownload } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Masonry from 'react-masonry-css';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
import PageTransition from '../components/PageTransition';

const getProxyUrl = (url) => {
  if (!url || url.startsWith('/images') || url.startsWith('/uploads')) return url;
  try {
    const encoded = btoa(url);
    return `${API_BASE_URL}/api/images/proxy?url=${encoded}`;
  } catch (e) {
    return `${API_BASE_URL}/api/images/proxy?url=${encodeURIComponent(url)}`;
  }
};

const MyBoard = () => {
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('phantasia_favorites');
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
    localStorage.setItem('phantasia_favorites', JSON.stringify(favorites));
  }, [favorites]);

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

  // ── Custom Delete All ─────────────────────────────────────────
  const confirmDeleteAll = () => {
    setFavorites([]);
    localStorage.setItem('phantasia_favorites', JSON.stringify([]));
    setLightboxIndex(null);
    setShowDeleteModal(false);
  };

  const handleDownload = async (imagesToDownload = favorites) => {
    if (imagesToDownload.length === 0) return;
    setIsDownloading(true);

    try {
      // 1. Save board to DB → get unique code
      let boardCode = null;
      try {
        const res = await axios.post(`${API_BASE_URL}/api/visionboard/save`, { images: imagesToDownload });
        boardCode = res.data.code;
        // Save code locally to pre-fill contact form
        localStorage.setItem('phantasia_last_board_code', boardCode);
      } catch (err) {
        console.error('Failed to save vision board to DB:', err);
        // We really want that code for the admin to see, so if save fails, we stop or warn
        // For now, let's proceed but ideally admin should see a jumbled code even if DB fails?
        // User said: "Pdf name should be Phantasia Vision Board (6 digits and letters jumbled)"
        // If save fails, we don't have a code. Let's make it mandatory.
        setIsDownloading(false);
        alert('Unable to generate vision board reference. Please try again.');
        return;
      }

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // 2. First Page: Title page with the board code
      pdf.setFillColor(10, 10, 10);
      pdf.rect(0, 0, pageW, pageH, 'F');

      // Studio name
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PHANTASIA STUDIO', pageW / 2, pageH / 2 - 60, { align: 'center', charSpace: 4 });

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(150, 150, 150);
      pdf.text('My Design Vision Board', pageW / 2, pageH / 2 - 42, { align: 'center', charSpace: 2 });

      // Divider
      pdf.setDrawColor(60, 60, 60);
      pdf.setLineWidth(0.5);
      pdf.line(pageW / 2 - 80, pageH / 2 - 28, pageW / 2 + 80, pageH / 2 - 28);

      if (boardCode) {
        pdf.setFontSize(8);
        pdf.setTextColor(130, 130, 150);
        pdf.text('Board Reference Code', pageW / 2, pageH / 2 - 10, { align: 'center', charSpace: 3 });

        // Code box
        pdf.setFillColor(25, 25, 35);
        pdf.roundedRect(pageW / 2 - 60, pageH / 2 - 2, 120, 26, 4, 4, 'F');
        pdf.setFontSize(16);
        pdf.setFont('courier', 'bold');
        pdf.setTextColor(220, 220, 255);
        pdf.text(boardCode, pageW / 2, pageH / 2 + 14, { align: 'center', charSpace: 2 });

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(90, 90, 100);
        pdf.text('Share this code with Phantasia Studio to discuss your board', pageW / 2, pageH / 2 + 35, { align: 'center' });
      }

      pdf.setFontSize(7);
      pdf.setTextColor(60, 60, 70);
      pdf.text('phantasia.studio', pageW / 2, pageH - 20, { align: 'center', charSpace: 2 });

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
        const ratio = Math.min(pageW / tempImg.naturalWidth, pageH / tempImg.naturalHeight);
        const drawW = tempImg.naturalWidth * ratio;
        const drawH = tempImg.naturalHeight * ratio;

        pdf.setFillColor(10, 10, 10);
        pdf.rect(0, 0, pageW, pageH, 'F');
        pdf.addImage(dataUrl, 'JPEG', (pageW - drawW) / 2, (pageH - drawH) / 2, drawW, drawH);

        // Source Label
        pdf.setFontSize(7);
        pdf.setTextColor(80, 80, 80);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Source: ${img.source === 'portfolio' ? 'Portfolio' : 'AI Explorer'}`, 25, pageH - 20);
      }

      pdf.save(`Phantasia Vision Board ${boardCode}.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  /* Responsive columns for Vision Board */
  const breakpointColumnsObj = { default: 3, 1100: 3, 700: 2, 500: 2 };

  return (
    <PageTransition>
      <div className="min-h-screen pt-24 md:pt-32 pb-20 px-3 md:px-16 relative">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-3 transition-all duration-300">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex-1">
              <h1 className="text-4xl md:text-6xl font-serif text-white font-medium">My Vision Board</h1>
              <p className="text-sm text-white/40 mt-2">A curated collection of your design inspirations.</p>
            </motion.div>
          </div>


          {/* Empty State */}
          {favorites.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-32 border border-white/5 rounded-[3rem] bg-white/[0.02]"
            >
              <FaHeart className="text-white/10 text-6xl mx-auto mb-6" />
              <h2 className="text-xl text-white/60 font-serif mb-4">Your board is empty</h2>
              <p className="text-sm text-white/30 mb-8 max-w-xs mx-auto">
                Explore styles and heart your favorites to build your personalized design vision.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link
                  to="/explorer"
                  className="px-10 py-4 text-[11px] font-bold tracking-[0.2em] uppercase rounded-full transition-all duration-300 active:translate-y-[2px]"
                  style={{
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)',
                    color: '#1f2937',
                    boxShadow: 'inset 0 1px 3px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.2), 0 6px 8px rgba(0,0,0,0.3)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 50%, #6b7280 100%)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)'}
                >
                  Start Exploring AI →
                </Link>
                <Link to="/portfolio" className="px-10 py-4 bg-white/5 border border-white/10 text-white text-[11px] font-bold tracking-[0.2em] uppercase rounded-full hover:bg-white/10 transition-all flex items-center justify-center">
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
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-2xl -z-10 h-full w-full" 
                         style={{ maskImage: 'linear-gradient(to bottom, black, black 70%, transparent)' }} />
                    
                    <motion.div
                      animate={{
                        opacity: 1,
                        pointerEvents: 'auto',
                        y: 0
                      }}
                      transition={{ duration: 0.3 }}
                      className="pointer-events-auto flex items-center justify-between gap-3 no-scrollbar bg-black/40 backdrop-blur-xl border border-white/5 p-2 rounded-full shadow-2xl"
                    >
                      <div className="flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar px-2">
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
                          className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full text-[9px] md:text-[10px] tracking-[0.2em] font-bold uppercase transition-all duration-300 border whitespace-nowrap ${activeTab === tab.key
                            ? 'bg-white/10 border-white/30 text-white'
                            : 'bg-transparent border-white/10 text-white/40 hover:text-white/70'
                            }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 pr-2">
                      {favorites.length > 0 && (
                        <button
                          onClick={() => handleDownload(isSelectMode ? favorites.filter(f => selectedIds.includes(f.id)) : favorites)}
                          disabled={isDownloading}
                          className="flex items-center gap-2 px-6 py-2 md:py-3 rounded-full text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 shadow-lg whitespace-nowrap active:translate-y-[1px] disabled:opacity-30 cursor-pointer"
                          style={{
                            background: 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)',
                            color: '#1f2937',
                            boxShadow: 'inset 0 1px 3px rgba(255,255,255,1), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 6px rgba(0,0,0,0.3)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 50%, #6b7280 100%)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)'}
                        >
                          <FiDownload fontSize={12} className={isDownloading ? 'animate-bounce' : ''} />
                          <span className="hidden sm:inline">
                            {isDownloading ? 'Saving...' : (isSelectMode && selectedIds.length > 0 ? `Download (${selectedIds.length})` : 'Download')}
                          </span>
                          <span className="sm:hidden">
                            {isDownloading ? '...' : (isSelectMode && selectedIds.length > 0 ? `Download (${selectedIds.length})` : 'Download')}
                          </span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                </div>
                );
              })()}
              {/* Board Grid */}
              <div
                ref={boardRef}
                className="relative p-4 md:p-12 bg-[#000000] rounded-[2rem] md:rounded-[3rem] border border-white/10 overflow-hidden"
              >
                {/* Background Glows */}
                <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-purple-600/10 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-blue-600/10 blur-[120px] pointer-events-none" />

                {tabFavorites.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-white/30 text-sm">No items in this category yet.</p>
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
                          className={`relative mb-6 group rounded-2xl overflow-hidden bg-white/5 border transition-all duration-300 cursor-pointer ${isSelected ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-white/10'
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
                            className="w-full h-auto block"
                            crossOrigin="anonymous"
                            draggable="false"
                            onContextMenu={(e) => e.preventDefault()}
                          />

                          {/* Hover border glow — no overlay */}
                          <div className="no-export absolute inset-0 rounded-2xl ring-1 ring-white/0 group-hover:ring-white/30 transition-all duration-300 pointer-events-none" />

                          {/* Corner buttons — visible on hover */}
                          <div className="no-export opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300">
                            {/* Top-Left: Delete */}
                            {!isSelectMode && (
                              <button
                                onClick={(e) => { e.stopPropagation(); removeFavorite(img.id); }}
                                className="absolute top-4 left-4 p-3 bg-black/50 text-white/50 hover:text-red-400 hover:bg-red-400/10 border border-white/10 rounded-full transition-all backdrop-blur-md"
                                title="Delete from board"
                              >
                                <FaTrash fontSize={13} />
                              </button>
                            )}

                            {/* Top-Right: Select checkbox / enter select mode */}
                            <div
                              className={`absolute top-4 right-4 z-20 transition-all duration-300 ${isSelectMode ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelect(img.id);
                              }}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 ${isSelected ? 'bg-purple-500' : 'bg-black/40 backdrop-blur-md border border-white/20'
                                }`}>
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
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
                <div className="watermark-export no-export hidden mt-12 pt-8 border-t border-white/10 items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg font-serif">P</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-serif">Phantasia Studio</p>
                      <p className="text-white/30 text-[10px] tracking-widest uppercase">My Design Vision Board</p>
                    </div>
                  </div>
                  <p className="text-white/20 text-[10px] font-mono">phantasia.studio</p>
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
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] max-w-[95vw] overflow-hidden bg-white/90 backdrop-blur-2xl shadow-2xl rounded-full no-scrollbar border border-white/20"
          >
            <div className="flex items-center px-4 md:px-8 py-3 md:py-4 gap-4 md:gap-8">
              {/* Selection Count */}
              <div className="flex items-center gap-2 md:gap-3">
                <div className="bg-black text-white w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold shadow-lg shadow-black/20 border-2 border-white/20">
                  {selectedIds.length}
                </div>
                <span className="text-[9px] font-bold tracking-[0.2em] text-black/40 uppercase ml-1 md:ml-2 hidden sm:inline">Selected</span>
              </div>

              <div className="w-[1px] h-5 bg-black/5" />

              {/* Actions */}
              <div className="flex items-center gap-4 md:gap-8">
                {/* Select All Action */}
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 md:gap-2.5 text-black/60 hover:text-black font-bold text-[9px] md:text-[10px] tracking-widest uppercase transition-colors active:translate-y-[1px]"
                >
                  <div className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-sm border flex items-center justify-center transition-colors ${selectedIds.length === tabFavorites.length ? 'bg-black border-black text-white' : 'border-black/20'}`}>
                    {selectedIds.length === tabFavorites.length && <FaCheck className="text-[6px] md:text-[8px]" />}
                  </div>
                  <span className="whitespace-nowrap">{selectedIds.length === tabFavorites.length ? 'Deselect All' : 'Select All'}</span>
                </button>

                <div className="w-[1px] h-5 bg-black/5" />

                <button
                  onClick={() => setShowSelectionDeleteModal(true)}
                  className="flex items-center gap-2 md:gap-2.5 text-red-500 hover:text-red-700 font-bold text-[9px] md:text-[10px] tracking-widest uppercase transition-colors active:translate-y-[1px]"
                >
                  <FaTrash className="text-[10px] md:text-[12px]" /> 
                  <span className="whitespace-nowrap hidden sm:inline">Remove Selected</span>
                  <span className="whitespace-nowrap sm:hidden">Remove</span>
                </button>

                <div className="w-[1px] h-5 bg-black/5" />

                <button
                  onClick={clearSelection}
                  className="flex items-center gap-2 md:gap-2.5 text-black/60 hover:text-black font-bold text-[9px] md:text-[10px] tracking-widest uppercase transition-colors active:translate-y-[1px]"
                >
                  <FaTimes className="text-[10px] md:text-[12px]" /> 
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
            className="fixed inset-0 z-[5000] bg-black/75 backdrop-blur-[100px] flex items-center justify-center p-6 md:p-12"
            onClick={closeLightbox}
          >
            {/* Close */}
            <button
              className="absolute top-12 right-12 text-white/40 hover:text-white p-4 bg-white/5 rounded-full border border-white/10 transition-all backdrop-blur-md z-[1010]"
              onClick={closeLightbox}
            >
              <FaTimes fontSize={20} />
            </button>

            {/* Desktop Navigation Arrows */}
            {favorites.length > 1 && (
              <div className="hidden md:block">
                <button
                  className="absolute left-10 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/5 text-white/30 hover:text-white border border-white/10 rounded-full transition-all backdrop-blur-md z-[1010] flex items-center justify-center"
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                >
                  <FaChevronLeft fontSize={22} />
                </button>
                <button
                  className="absolute right-10 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/5 text-white/30 hover:text-white border border-white/10 rounded-full transition-all backdrop-blur-md z-[1010] flex items-center justify-center"
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
                  className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white backdrop-blur-md active:scale-90 transition-transform"
                >
                  <FaChevronLeft fontSize={20} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white backdrop-blur-md active:scale-90 transition-transform"
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
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-2xl shadow-2xl border border-white/10 px-3 md:px-6 py-3 rounded-full overflow-hidden max-w-[95vw]">
                  {/* Count */}
                  <span className="text-white/40 text-[9px] md:text-[10px] font-bold tracking-widest flex items-center justify-center min-w-[30px] md:min-w-[40px] px-1 md:px-2 uppercase">
                    {lightboxIndex + 1} <span className="mx-1 text-white/40 font-normal">/</span> {tabFavorites.length}
                  </span>

                  <div className="w-[1px] h-5 bg-white/10 mx-1 md:mx-2" />

                  {/* Select Toggle */}
                  <button
                    onClick={() => toggleSelect(lightboxImage.id)}
                    className="flex items-center gap-2 md:gap-3 px-4 md:px-8 py-3 rounded-full transition-all duration-300 text-[10px] font-bold tracking-widest uppercase active:translate-y-[1px] flex-shrink-0"
                    style={{
                      background: selectedIds.includes(lightboxImage.id)
                        ? 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 50%, #7c3aed 100%)'
                        : '#ffffff',
                      color: selectedIds.includes(lightboxImage.id) ? '#ffffff' : '#000000',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                    }}
                  >
                    <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${selectedIds.includes(lightboxImage.id) ? 'border-white bg-white/20' : 'border-black/20'}`}>
                      {selectedIds.includes(lightboxImage.id) && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <span className="hidden sm:inline">{selectedIds.includes(lightboxImage.id) ? 'Deselect image' : 'Select image'}</span>
                    <span className="sm:hidden">{selectedIds.includes(lightboxImage.id) ? 'Deselect' : 'Select'}</span>
                  </button>

                  <div className="w-[1px] h-5 bg-white/10 mx-1 md:mx-2" />

                  {/* Delete */}
                  <button
                    onClick={() => { removeFavorite(lightboxImage.id); }}
                    className="flex items-center gap-1 text-white/40 hover:text-red-400 px-2 md:px-6 py-3 transition-colors text-[10px] font-bold tracking-widest uppercase italic flex-shrink-0"
                  >
                    <FaTrash fontSize={11} className="md:mr-1" /> 
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Fixed constant "Enquire" button in bottom right of screen - Outside image box */}
            <div className="fixed bottom-12 right-12 z-[1020] pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); window.location.href = '/contact'; }}
                className="px-8 md:px-10 py-3 md:py-4 rounded-full transition-all duration-300 active:translate-y-[1px] text-[10px] md:text-[11px] font-bold tracking-[0.2em] uppercase shadow-2xl backdrop-blur-md"
                style={{
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)',
                  color: '#1f2937',
                  boxShadow: 'inset 0 1px 3px rgba(255,255,255,1), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 6px rgba(0,0,0,0.3)',
                  willChange: 'backdrop-filter, transform'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 50%, #6b7280 100%)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)'}
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[#111111] border border-white/10 rounded-[2rem] p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaTrash className="text-red-500 text-xl" />
              </div>
              <h3 className="text-xl font-serif text-white mb-3">Clear Your Board?</h3>
              <p className="text-sm text-white/40 mb-8 leading-relaxed">
                This will permanently remove all {favorites.length} saved items from your vision board. This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDeleteAll}
                  className="w-full py-4 bg-red-500 text-white text-[11px] font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-red-600 transition-all shadow-lg active:scale-[0.98]"
                >
                  Yes, Clear Everything
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-4 bg-white/5 text-white/40 text-[11px] font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-white/10 transition-all border border-white/5"
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[#111111] border border-white/10 rounded-[2rem] p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaTrash className="text-red-500 text-xl" />
              </div>
              <h3 className="text-xl font-serif text-white mb-3">Remove Selected?</h3>
              <p className="text-sm text-white/40 mb-8 leading-relaxed">
                You are about to remove {selectedIds.length} items from your board. This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDeleteSelected}
                  className="w-full py-4 bg-red-500 text-white text-[11px] font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-red-600 transition-all shadow-lg active:scale-[0.98]"
                >
                  Yes, Remove Selected
                </button>
                <button
                  onClick={() => setShowSelectionDeleteModal(false)}
                  className="w-full py-4 bg-white/5 text-white/40 text-[11px] font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-white/10 transition-all border border-white/5"
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[#111111] border border-white/10 rounded-[2rem] p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaTrash className="text-red-500 text-xl" />
              </div>
              <h3 className="text-xl font-serif text-white mb-3">Remove this image?</h3>
              <p className="text-sm text-white/40 mb-8 leading-relaxed">
                This item will be removed from your collection.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmItemDelete}
                  className="w-full py-4 bg-red-500 text-white text-[11px] font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-red-600 transition-all shadow-lg active:scale-[0.98]"
                >
                  Yes, Remove
                </button>
                <button
                  onClick={() => setShowItemDeleteModal(false)}
                  className="w-full py-4 bg-white/5 text-white/40 text-[11px] font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-white/10 transition-all border border-white/5"
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
    </PageTransition>
  );
};


/* Sub-component: image with skeleton loader for Vision Board */
const VisionBoardLightboxImage = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative overflow-hidden bg-black/40 min-h-[400px] flex items-center justify-center rounded-[2.5rem] w-full">
      {/* Blurred background image for premium feel */}
      {src && (
        <div
          className="absolute inset-0 z-0 opacity-40 blur-3xl scale-110"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}

      {!loaded && (
        <div className="absolute inset-0 z-10 bg-white/5 animate-pulse" />
      )}

      <img
        src={getProxyUrl(src)}
        alt={alt}
        onLoad={() => setLoaded(true)}
        draggable="false"
        onContextMenu={(e) => e.preventDefault()}
        className={`relative z-10 w-full max-h-[55vh] md:max-h-[60vh] object-contain transition-all duration-500 ease-out ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
      />
      {/* Reduced gradient overlay */}
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export default MyBoard;
