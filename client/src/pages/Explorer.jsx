import React, { useState, useEffect, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaHeart, FaRegHeart, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import axios from 'axios';
import Masonry from 'react-masonry-css';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import { AuthContext } from '../components/AuthContext';
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
    const saved = localStorage.getItem('intedesign_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('intedesign_favorites', JSON.stringify(favorites));
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
  const { user, loading: authLoading } = useContext(AuthContext);

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

      const res = await axios.post(`${API_BASE_URL}/api/pinterest/search`, {
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

      const res = await axios.post(`${API_BASE_URL}/api/pinterest/search`, {
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

  if (authLoading) {
    return <div className="min-h-screen pt-24 flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen pt-24 md:pt-32 pb-20 px-3 md:px-16 flex items-center justify-center relative bg-white">
          <div className="text-center bg-white border-4 border-black shadow-[8px_8px_0px_#000000] p-12 max-w-lg w-full">
            <h1 className="text-3xl font-black uppercase mb-4 text-black">Sign in Required</h1>
            <p className="text-black font-medium mb-8">Please log in to use the AI Style Explorer and get curated inspiration.</p>
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
      <div className="min-h-screen pt-32 pb-20 px-6 md:px-16 relative bg-white" onContextMenu={(e) => e.preventDefault()}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <p className="text-sm font-black uppercase text-black inline-block border-b-2 border-black mb-4">AI-Powered</p>
          <h1 className="text-5xl md:text-7xl font-black text-black uppercase tracking-tighter mb-5">
            Style Explorer
          </h1>
          <p className="text-sm font-bold text-gray-700 max-w-md mx-auto leading-relaxed">
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
            className="hidden sm:flex relative items-center bg-white border-4 border-black p-2 shadow-[8px_8px_0px_#000000]"
          >
            <div
              className="relative w-full flex items-center bg-white z-10"
              onMouseEnter={() => setIsGlowing(true)}
              onMouseLeave={() => setIsGlowing(false)}
            >
              <FaSearch className="absolute left-4 text-black text-sm z-20" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={triggerGlow}
                placeholder="Describe your vision here... (Type your design ideas)"
                className="w-full bg-transparent pl-12 pr-36 py-3 text-sm font-bold text-black placeholder-gray-400 focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 px-6 py-2.5 bg-yellow-400 text-black border-2 border-black text-[11px] tracking-widest font-black uppercase disabled:opacity-50 transition-all duration-300 shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px]"
              >
                {loading ? 'Searching…' : 'Inspire Me'}
              </button>
            </div>
          </motion.div>

          {/* Mobile: input full-width, button below */}
          <div className="flex sm:hidden flex-col gap-4">
            <motion.div
              animate={isShaking ? { x: [-3, 3, -3, 3, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="relative flex items-center bg-white border-4 border-black p-2 shadow-[4px_4px_0px_#000000]"
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
                className="relative w-full flex items-center bg-white z-10"
                onMouseEnter={() => setIsGlowing(true)}
                onMouseLeave={() => setIsGlowing(false)}
              >
                <FaSearch className="absolute left-4 text-black text-sm z-20" />
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your vision here... (Type your ideas)"
                  className="w-full bg-transparent pl-12 pr-12 py-3.5 text-sm font-bold text-black placeholder-gray-400 focus:outline-none transition-all"
                  onFocus={() => { setIsFocused(true); triggerGlow(); }}
                  onBlur={() => setIsFocused(false)}
                />
                {prompt && (
                  <button
                    type="button"
                    onClick={() => setPrompt('')}
                    className="absolute right-4 text-black hover:text-gray-500 p-1 z-20"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </motion.div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-yellow-400 text-black border-4 border-black text-sm font-black tracking-widest uppercase disabled:opacity-50 transition-all duration-300 shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px]"
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
                  className="flex-shrink-0 snap-start text-xs font-bold text-black border-2 border-black bg-white px-4 py-1.5 shadow-[2px_2px_0px_#000000] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none transition-all whitespace-nowrap"
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
                  className="text-xs font-bold text-black border-2 border-black bg-white px-4 py-1.5 shadow-[2px_2px_0px_#000000] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none transition-all"
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
              <p className="text-sm font-black text-black uppercase">
                {randomPhrase ? randomPhrase.replace('{count}', images.length) : `${images.length} inspiration images found`}
              </p>
              {favorites.filter(f => f.source === 'explorer').length > 0 && (
                <Link
                  to="/my-board"
                  className="group flex items-center gap-3 text-black hover:text-pink-500 transition-all duration-300 uppercase font-black tracking-widest bg-white border-2 border-black px-4 py-2 shadow-[2px_2px_0px_#000000]"
                >
                  <FaHeart className="text-sm text-pink-500 group-hover:text-pink-600 transition-colors" />
                  <div className="flex flex-col leading-tight whitespace-nowrap">
                    <span className="text-[10px]">{favorites.filter(f => f.source === 'explorer').length} Saved</span>
                    <span className="text-[9px] opacity-80">View Full Canvas</span>
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
                className="neopop-btn px-8 py-4 bg-pink-400 border-4 border-black text-black text-xs font-black uppercase shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1 transition-all disabled:opacity-50"
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
                className="neopop-btn px-8 py-4 bg-white border-4 border-black text-black text-xs font-black uppercase shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1 hover:bg-gray-100 transition-all"
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
              className="fixed top-20 right-0 h-[calc(100vh-80px)] w-full sm:w-80 bg-white border-l-4 border-black z-[100] flex flex-col shadow-[-8px_0px_0px_#000000]"
            >
              <div className="flex items-center justify-between p-5 border-b-4 border-black bg-yellow-400">
                <div>
                  <h3 className="text-xl font-black text-black uppercase">Saved Board</h3>
                  <p className="text-xs font-bold text-black">{favorites.filter(f => f.source === 'explorer').length} images</p>
                </div>
                <button onClick={() => setShowFavorites(false)} className="text-black hover:text-gray-700 transition-colors">
                  <FaTimes fontSize={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-4 content-start">
                {favorites.filter(f => f.source === 'explorer').map((img) => (
                  <div key={img.id} className="relative bg-white border-2 border-black p-1 shadow-[2px_2px_0px_#000000] group">
                    <img src={img.thumb} alt={img.description} className="w-full aspect-square object-cover border-2 border-black" />
                    <button
                      onClick={() => toggleFavorite(img)}
                      className="absolute inset-1 bg-white/90 border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center m-1 shadow-[2px_2px_0px_#000000]"
                    >
                      <FaTimes className="text-black text-xl" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t-4 border-black bg-white">
                <p className="text-xs font-bold text-black text-center uppercase tracking-widest">Attach this board to your consultation request</p>
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
              className="fixed inset-0 z-[5000] bg-white/90 backdrop-blur-md flex items-center justify-center p-6 md:p-12"
              onClick={closeLightbox}
            >
              {/* Top-right controls (Close) */}
              <div className="absolute top-12 right-12 z-[1010] flex items-center gap-4">
                <button
                  className="p-4 bg-white border-2 border-black text-black hover:bg-pink-400 hover:text-white transition-all shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(lightboxImage); }}
                >
                  {isFavorited(lightboxImage.id)
                    ? <FaHeart className="text-xl text-pink-500" />
                    : <FaRegHeart className="text-xl" />}
                </button>
                <button
                  className="p-4 bg-white border-2 border-black text-black hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
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
                    className="absolute left-10 top-1/2 -translate-y-1/2 w-16 h-16 bg-yellow-400 border-2 border-black flex items-center justify-center text-black hover:bg-black hover:text-white transition-all z-[1010] shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
                  >
                    <FaChevronLeft className="text-2xl" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                    className="absolute right-10 top-1/2 -translate-y-1/2 w-16 h-16 bg-yellow-400 border-2 border-black flex items-center justify-center text-black hover:bg-black hover:text-white transition-all z-[1010] shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
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
                    className="w-full bg-white border-4 border-black p-2 shadow-[16px_16px_0px_#000000]"
                  >
                    <ExplorerLightboxImage src={lightboxImage.url || lightboxImage.thumb} alt={lightboxImage.description} />
                  </motion.div>
                </AnimatePresence>

                {/* Bottom actions row — Fixed outside AnimatePresence */}
                <div className="w-full px-5 md:px-8 py-4 md:py-6 flex items-center justify-between">
                  <span className="text-black text-[10px] tracking-[0.3em] uppercase font-black">{lightboxIndex + 1} / {lightboxImages.length}</span>
                </div>
              </div>

              {/* Mobile arrows - Repositioned to bottom-left */}
              {lightboxImages.length > 1 && (
                <div className="absolute bottom-12 left-6 flex items-center gap-4 md:hidden z-[1010]">
                  <button
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    className="w-12 h-12 bg-yellow-400 border-2 border-black flex items-center justify-center text-black active:translate-y-1 shadow-[4px_4px_0px_#000000] active:shadow-none"
                  >
                    <FaChevronLeft fontSize={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                    className="w-12 h-12 bg-yellow-400 border-2 border-black flex items-center justify-center text-black active:translate-y-1 shadow-[4px_4px_0px_#000000] active:shadow-none"
                  >
                    <FaChevronRight fontSize={14} />
                  </button>
                </div>
              )}

              {/* Fixed constant "Enquire" button in bottom left/right of screen - Outside image box */}
              <div className="fixed bottom-12 right-6 md:right-12 z-[5010] pointer-events-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); window.location.href = '/contact'; }}
                  className="px-8 md:px-10 py-3 md:py-4 transition-all duration-300 text-[10px] md:text-[11px] font-black tracking-widest uppercase neopop-btn bg-pink-400 text-black border-2 border-black shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
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

const ExplorerLightboxImage = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative overflow-hidden bg-white min-h-[400px] flex items-center justify-center">
      {/* Background overlay */}
      {src && (
        <div
          className="absolute inset-0 z-0 opacity-20 blur-md scale-110"
          style={{
            backgroundImage: `url(${getProxyUrl(src)})`,
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
        className={`relative z-10 w-full max-h-[50vh] object-contain border-2 border-black bg-white p-2 transition-all duration-500 ease-out ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
      />
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
      className="relative mb-4 group cursor-pointer neopop-card bg-white border-4 border-black p-1 transition-all duration-300 shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
      onClick={() => onImageClick(img)}
    >
      <img
        src={getProxyUrl(img.thumb)}
        alt={img.description}
        onLoad={() => setLoaded(true)}
        draggable="false"
        onContextMenu={(e) => e.preventDefault()}
        className={`w-full h-auto border-2 border-black transition-all duration-700 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
      />

      {/* Hover border glow — no overlay */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-black/10 transition-all duration-300 pointer-events-none" />

      {/* Heart button — bottom-right, fades in on hover */}
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(img);
          }}
          className={`p-3 border-2 border-black transition-all duration-200 shadow-[2px_2px_0px_#000000] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] ${isFavorited(img.id)
            ? 'bg-pink-400 text-black'
            : 'bg-white text-black hover:bg-gray-100'
            }`}
        >
          {isFavorited(img.id) ? <FaHeart fontSize={14} /> : <FaRegHeart fontSize={14} />}
        </button>
      </div>
    </motion.div>
  );
};

export default Explorer;
