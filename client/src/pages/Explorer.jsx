import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaHeart, FaRegHeart, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import axios from 'axios';
import Masonry from 'react-masonry-css';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

const API_BASE = 'http://localhost:5000';

const getProxyUrl = (url) => {
  if (!url || url.startsWith('/images') || url.startsWith('/uploads')) return url;
  try {
    const encoded = btoa(url);
    return `${API_BASE}/api/images/proxy?url=${encoded}`;
  } catch (e) {
    return `${API_BASE}/api/images/proxy?url=${encodeURIComponent(url)}`;
  }
};

const Explorer = () => {
  const [prompt, setPrompt] = useState(() => sessionStorage.getItem('explorer_prompt') || '');
  const [images, setImages] = useState(() => {
    const cached = sessionStorage.getItem('explorer_images');
    return cached ? JSON.parse(cached) : [];
  });
  const [aiData, setAiData] = useState(() => {
    const cached = sessionStorage.getItem('explorer_aiData');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('phantasia_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('phantasia_favorites', JSON.stringify(favorites));
  }, [favorites]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [page, setPage] = useState(() => {
    const cached = sessionStorage.getItem('explorer_page');
    return cached ? parseInt(cached) : 1;
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [randomPhrase, setRandomPhrase] = useState(() => sessionStorage.getItem('explorer_phrase') || '');

  const inspirationPhrases = [
    "We’ve curated {count} design concepts for your space.",
    "{count} tailored inspirations, hand-picked for your vibe.",
    "We’ve pulled {count} concepts from our design vault.",
    "Your vision board is taking shape: {count} ideas unlocked.",
    "{count} beautiful starting points for your dream room.",
    "We visualized {count} ways to bring your prompt to life.",
    "We found {count} perfect matches. Let's explore.",
    "{count} sparks of inspiration. Which one catches your eye?",
    "Here are {count} concepts to start your journey.",
    "{count} Concepts Unlocked",
    "{count} Curated Matches",
    "{count} Ideas Generated"
  ];

  const triggerGlow = () => {
    setIsGlowing(true);
    setTimeout(() => setIsGlowing(false), 2000);
  };

  const suggestions = [
    'Cozy minimalist living room with plants',
    'Modern boho bedroom terracotta tones',
    'Dark moody kitchen marble and brass',
    'Japandi bathroom spa retreat',
    'Scandinavian open plan living dining',
  ];

  const executeSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    setLoading(true);
    setError('');
    setImages([]);
    setAiData(null);
    setPage(1);

    try {
      const lastPrompt = sessionStorage.getItem('explorer_prompt');
      const randomLimit = Math.floor(Math.random() * (30 - 15 + 1)) + 15;

      const res = await axios.post(`${API_BASE}/api/pinterest/search`, {
        prompt: searchQuery,
        page: 1,
        contextPrompt: lastPrompt,
        limit: randomLimit
      });
      setImages(res.data.images);
      setAiData(res.data.aiData);
      // Persist to session
      sessionStorage.setItem('explorer_images', JSON.stringify(res.data.images));
      sessionStorage.setItem('explorer_aiData', JSON.stringify(res.data.aiData));
      sessionStorage.setItem('explorer_prompt', searchQuery);
      sessionStorage.setItem('explorer_page', '1');

      const phraseTemplate = inspirationPhrases[Math.floor(Math.random() * inspirationPhrases.length)];
      setRandomPhrase(phraseTemplate);
      sessionStorage.setItem('explorer_phrase', phraseTemplate);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load inspiration. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    executeSearch(prompt);
  };

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const randomLimit = Math.floor(Math.random() * (25 - 12 + 1)) + 12; // Slightly smaller range for load more

      const res = await axios.post(`${API_BASE}/api/pinterest/search`, {
        prompt,
        page: nextPage,
        keywords: aiData?.keywords, // Pass existing keywords to bypass Gemini
        aiData, // Pass existing aiData to retain UI state
        limit: randomLimit
      });

      const newImages = res.data.images;
      setImages((prev) => {
        const existingIds = new Set(prev.map(img => img.id));
        const filteredNew = newImages.filter(img => !existingIds.has(img.id));
        return [...prev, ...filteredNew];
      });
      setPage(nextPage);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load more images.');
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleFavorite = (img) => {
    const item = { ...img, source: 'explorer' };
    setFavorites((prev) =>
      prev.find((f) => f.id === item.id) ? prev.filter((f) => f.id !== item.id) : [...prev, item]
    );
  };

  const isFavorited = (id) => favorites.some((f) => f.id === id);

  // Lightbox state + direction tracking
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [lightboxDirection, setLightboxDirection] = useState(1);

  const openLightbox = useCallback((imgs, idx) => {
    setLightboxImages(imgs);
    setLightboxIndex(idx);
  }, []);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goPrev = useCallback(() => {
    setLightboxDirection(-1);
    setLightboxIndex(prev => (prev > 0 ? prev - 1 : lightboxImages.length - 1));
  }, [lightboxImages.length]);

  const goNext = useCallback(() => {
    setLightboxDirection(1);
    setLightboxIndex(prev => (prev < lightboxImages.length - 1 ? prev + 1 : 0));
  }, [lightboxImages.length]);

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

  const lightboxImage = lightboxIndex !== null ? lightboxImages[lightboxIndex] : null;

  return (
    <PageTransition>
      <div className="min-h-screen pt-32 pb-20 px-6 md:px-16 relative" onContextMenu={(e) => e.preventDefault()}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <p className="text-[10px] tracking-[0.35em] uppercase text-purple-400/70 mb-3">AI-Powered</p>
          <h1 className="text-5xl md:text-7xl font-serif text-white font-medium mb-5">
            Style Explorer
          </h1>
          <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed">
            Describe your dream space in plain language. Our AI extracts the essence and curates real interior design inspiration for you.
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          onSubmit={handleSearch}
          className="max-w-2xl mx-auto mb-6 px-1"
        >
          {/* Desktop: inline pill with button inside */}
          <motion.div
            animate={isShaking ? { x: [-3, 3, -3, 3, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="hidden sm:flex relative items-center p-[1px] rounded-full overflow-hidden group"
          >
            {/* Bright Silver Edge Glow */}
            <motion.div
              animate={{
                opacity: (isGlowing || isFocused || loading) ? 1 : 0.7,
                scale: (isGlowing || isFocused || loading) ? 1.02 : 1
              }}
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(200,200,220,0.3) 50%, rgba(255,255,255,0.5) 100%)',
                boxShadow: (isGlowing || isFocused || loading)
                  ? '0 0 28px rgba(255,255,255,0.55), 0 0 60px rgba(200,200,255,0.25), inset 0 0 10px rgba(255,255,255,0.1)'
                  : '0 0 10px rgba(255,255,255,0.2), inset 0 0 4px rgba(255,255,255,0.05)'
              }}
            />

            <div
              className="relative w-full flex items-center bg-[#000000] rounded-full z-10 p-1"
              onMouseEnter={() => setIsGlowing(true)}
              onMouseLeave={() => setIsGlowing(false)}
            >
              <FaSearch className="absolute left-6 text-white/30 text-sm z-20" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={triggerGlow}
                placeholder="Describe your vision here... (Type your design ideas)"
                className="w-full bg-transparent pl-12 pr-36 py-3 text-sm text-white placeholder-white/25 focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 px-6 py-2.5 rounded-full text-[11px] tracking-[0.2em] font-bold uppercase disabled:opacity-50 transition-all duration-300 active:translate-y-[2px] active:shadow-inner"
                style={{
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)',
                  color: '#1f2937',
                  boxShadow: 'inset 0 1px 3px rgba(255,255,255,1), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 6px rgba(0,0,0,0.3)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 50%, #6b7280 100%)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)'}
              >
                {loading ? 'Searching…' : 'Inspire Me'}
              </button>
            </div>
          </motion.div>

          {/* Mobile: input full-width, button below */}
          <div className="flex sm:hidden flex-col gap-3">
            <motion.div
              animate={isShaking ? { x: [-3, 3, -3, 3, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="relative flex items-center p-[1px] rounded-2xl overflow-hidden group"
            >
              {/* Bright Silver Edge Glow (Mobile) */}
              <motion.div
                animate={{
                  opacity: (isGlowing || isFocused || loading) ? 1 : 0.7,
                  scale: (isGlowing || isFocused || loading) ? 1.02 : 1
                }}
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(200,200,220,0.3) 50%, rgba(255,255,255,0.5) 100%)',
                  boxShadow: (isGlowing || isFocused || loading)
                    ? '0 0 28px rgba(255,255,255,0.55), 0 0 60px rgba(200,200,255,0.25)'
                    : '0 0 10px rgba(255,255,255,0.2)'
                }}
              />

              <div
                className="relative w-full flex items-center bg-[#000000] rounded-2xl z-10 p-[1px]"
                onMouseEnter={() => setIsGlowing(true)}
                onMouseLeave={() => setIsGlowing(false)}
              >
                <FaSearch className="absolute left-5 text-white/30 text-sm z-20" />
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your vision here... (Type your ideas)"
                  className="w-full bg-transparent pl-12 pr-12 py-3.5 text-sm text-white placeholder-white/25 focus:outline-none transition-all"
                  onFocus={() => { setIsFocused(true); triggerGlow(); }}
                  onBlur={() => setIsFocused(false)}
                />
                {prompt && (
                  <button
                    type="button"
                    onClick={() => setPrompt('')}
                    className="absolute right-4 text-white/30 hover:text-white/60 p-1 z-20"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </motion.div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl text-sm font-bold tracking-[0.2em] uppercase disabled:opacity-50 transition-all duration-300 active:translate-y-[2px] active:shadow-inner"
              style={{
                background: 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)',
                color: '#1f2937',
                boxShadow: 'inset 0 1px 3px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.2), 0 6px 8px rgba(0,0,0,0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 50%, #6b7280 100%)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)'}
            >
              {loading ? 'Searching…' : 'Inspire Me'}
            </button>
          </div>
        </motion.form>

        {/* Suggestions */}
        {!images.length && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-10 md:mb-16"
          >
            {/* Mobile: horizontal scroll row */}
            <div className="flex sm:hidden overflow-x-auto gap-2 pb-2 px-1 scrollbar-hide snap-x snap-mandatory">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="flex-shrink-0 snap-start text-[10px] tracking-wide text-white/40 border border-white/10 px-4 py-1.5 rounded-full hover:text-white/70 hover:border-white/30 transition-all whitespace-nowrap"
                >
                  {s}
                </button>
              ))}
            </div>
            {/* Desktop: centered wrap */}
            <div className="hidden sm:flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="text-[10px] tracking-wide text-white/40 border border-white/10 px-4 py-1.5 rounded-full hover:text-white/70 hover:border-white/30 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}



        {/* Loading Skeleton (Initial) */}
        {loading && (
          <div className="max-w-7xl mx-auto">
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className="my-masonry-grid"
              columnClassName="my-masonry-grid_column"
            >
              {[...Array(12)].map((_, i) => (
                <div
                  key={`initial-skeleton-${i}`}
                  className="mb-4 rounded-xl bg-white/5 animate-pulse"
                  style={{ height: `${[280, 180, 320, 210, 300, 190, 260, 290, 200, 310, 220, 270][i % 12]}px` }}
                />
              ))}
            </Masonry>
          </div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 text-red-400/70 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Results Masonry Grid */}
        {images.length > 0 && (
          <>
            <div className="flex justify-between items-end max-w-7xl mx-auto mb-8 px-1">
              <p className="text-[11px] text-white/30 tracking-[0.1em] uppercase font-medium">
                {randomPhrase ? randomPhrase.replace('{count}', images.length) : `${images.length} inspiration images found`}
              </p>
              {favorites.length > 0 && (
                <Link
                  to="/my-board"
                  className="group flex items-center gap-3 text-white/40 hover:text-pink-400 transition-all duration-300 uppercase tracking-[0.2em] font-bold"
                >
                  <FaHeart className="text-[12px] text-pink-500/60 group-hover:text-pink-500 transition-colors" />
                  <div className="flex flex-col leading-tight whitespace-nowrap">
                    <span className="text-[9px]">{favorites.length} Saved</span>
                    <span className="text-[8px] opacity-60">View Full Canvas</span>
                  </div>
                </Link>
              )}
            </div>

            <div className="max-w-7xl mx-auto min-h-[400px]">
              <Masonry
                breakpointCols={breakpointColumnsObj}
                className="my-masonry-grid"
                columnClassName="my-masonry-grid_column"
              >
                {images.map((img, idx) => (
                  <LoadedImage
                    key={img.id}
                    img={img}
                    isFavorited={isFavorited}
                    toggleFavorite={toggleFavorite}
                    onImageClick={() => openLightbox(images, idx)}
                  />
                ))}
                {/* Localized "Load More" Skeletons - Integrated into Masonry */}
                {loadingMore && [...Array(4)].map((_, i) => (
                  <div
                    key={`skeleton-more-${i}`}
                    className="mb-4 rounded-xl bg-white/5 animate-pulse"
                    style={{ height: `${[250, 300, 200, 320][i % 4]}px` }}
                  />
                ))}
              </Masonry>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mt-12 mb-8">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-8 py-3 bg-white/5 border border-white/10 text-white text-xs tracking-[0.2em] font-medium uppercase rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More Options'}
              </button>

              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => {
                    const input = document.querySelector('input[type="text"]');
                    if (input) input.focus();
                  }, 800);
                }}
                className="px-8 py-3 bg-white/5 border border-white/10 text-white/40 text-xs tracking-[0.2em] font-medium uppercase rounded-full hover:text-white hover:border-white/30 transition-all"
              >
                Refine Prompt
              </button>
            </div>
          </>
        )}

        {/* Favorites Panel */}
        <AnimatePresence>
          {showFavorites && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 25 }}
              className="fixed top-20 right-0 h-[calc(100vh-80px)] w-full sm:w-80 bg-black/80 backdrop-blur-xl border-l border-white/10 z-[100] flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div>
                  <h3 className="text-sm font-serif text-white">Saved Board</h3>
                  <p className="text-[10px] text-white/30">{favorites.length} images</p>
                </div>
                <button onClick={() => setShowFavorites(false)} className="text-white/40 hover:text-white transition-colors">
                  <FaTimes />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 content-start">
                {favorites.map((img) => (
                  <div key={img.id} className="relative rounded-lg overflow-hidden aspect-square group">
                    <img src={img.thumb} alt={img.description} className="w-full h-full object-cover" />
                    <button
                      onClick={() => toggleFavorite(img)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <FaTimes className="text-white text-sm" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-white/10">
                <p className="text-[9px] text-white/20 text-center">Attach this board to your consultation request</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lightbox for Explorer images */}
        <AnimatePresence>
          {lightboxImage && (
            <motion.div
              key="explorer-lightbox-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[5000] bg-black/75 backdrop-blur-[100px] flex items-center justify-center p-6 md:p-12"
              onClick={closeLightbox}
            >
              {/* Top-right controls (Close) */}
              <div className="absolute top-12 right-12 z-[1010] flex items-center gap-4">
                <button
                  className="p-4 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all backdrop-blur-md"
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(lightboxImage); }}
                >
                  {isFavorited(lightboxImage.id)
                    ? <FaHeart className="text-xl text-pink-400" />
                    : <FaRegHeart className="text-xl" />}
                </button>
                <button
                  className="p-4 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all backdrop-blur-md"
                  onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              {/* Desktop side arrows */}
              {lightboxImages.length > 1 && (
                <div className="contents hidden md:block">
                  <button
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    className="absolute left-10 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all z-[1010] backdrop-blur-md"
                  >
                    <FaChevronLeft className="text-2xl" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                    className="absolute right-10 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all z-[1010] backdrop-blur-md"
                  >
                    <FaChevronRight className="text-2xl" />
                  </button>
                </div>
              )}

              {/* Image Container */}
              <div className="max-w-5xl w-full flex flex-col items-center relative mt-16 touch-none" onClick={(e) => e.stopPropagation()}>
                <AnimatePresence mode="wait" initial={false} custom={lightboxDirection}>
                  <motion.div
                    key={lightboxImage.id}
                    custom={lightboxDirection}
                    initial={{ x: lightboxDirection * 200, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: lightboxDirection * -200, opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
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
                    className="w-full bg-[#000000] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
                  >
                    <ExplorerLightboxImage src={lightboxImage.url || lightboxImage.thumb} alt={lightboxImage.description} />
                  </motion.div>
                </AnimatePresence>

                {/* Bottom actions row — Fixed outside AnimatePresence */}
                <div className="w-full px-5 md:px-8 py-4 md:py-6 flex items-center justify-between">
                  <span className="text-white/20 text-[10px] tracking-[0.3em] uppercase font-bold">{lightboxIndex + 1} / {lightboxImages.length}</span>
                </div>
              </div>

              {/* Mobile arrows - Repositioned to bottom-left */}
              {lightboxImages.length > 1 && (
                <div className="absolute bottom-12 left-6 flex items-center gap-4 md:hidden z-[1010]">
                  <button
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    className="w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white backdrop-blur-md active:scale-95"
                  >
                    <FaChevronLeft fontSize={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                    className="w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white backdrop-blur-md active:scale-95"
                  >
                    <FaChevronRight fontSize={14} />
                  </button>
                </div>
              )}

              {/* Fixed constant "Enquire" button in bottom left/right of screen - Outside image box */}
              <div className="fixed bottom-12 right-6 md:right-12 z-[5010] pointer-events-auto">
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
      </div>
    </PageTransition>
  );
};

/* Sub-component: image with skeleton loader */
const ExplorerLightboxImage = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative overflow-hidden bg-black/40 min-h-[400px] flex items-center justify-center">
      {/* Blurred background image for premium feel */}
      {src && (
        <div
          className="absolute inset-0 z-0 opacity-40 blur-3xl scale-110"
          style={{
            backgroundImage: `url(${getProxyUrl(src)})`,
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
        className={`relative z-10 w-full max-h-[50vh] object-contain transition-all duration-500 ease-out ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
      />

      {/* Reduced gradient overlay */}
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

const breakpointColumnsObj = {
  default: 4,
  1100: 3,
  700: 2,
};

const LoadedImage = ({ img, isFavorited, toggleFavorite, onImageClick }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-4 group cursor-pointer overflow-hidden rounded-xl bg-white/5"
      onClick={() => onImageClick(img)}
    >
      <img
        src={getProxyUrl(img.thumb)}
        alt={img.description}
        onLoad={() => setLoaded(true)}
        draggable="false"
        onContextMenu={(e) => e.preventDefault()}
        className={`w-full h-auto transition-all duration-700 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
      />

      {/* Silver white border on hover — no black overlay */}
      <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-white/80 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300 pointer-events-none" />

      {/* Heart button — bottom-right, fades in on hover */}
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(img);
          }}
          className={`p-2.5 rounded-full border backdrop-blur-md transition-all duration-200 ${isFavorited(img.id)
            ? 'bg-pink-500/30 border-pink-500 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.4)]'
            : 'bg-black/30 border-white/20 text-white/60 hover:text-pink-400 hover:border-pink-500/40'
            }`}
        >
          {isFavorited(img.id) ? <FaHeart fontSize={13} /> : <FaRegHeart fontSize={13} />}
        </button>
      </div>
    </motion.div>
  );
};

export default Explorer;
