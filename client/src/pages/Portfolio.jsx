import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Masonry from 'react-masonry-css';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { AuthContext } from '../components/AuthContext';
import { FaTimes, FaChevronLeft, FaChevronRight, FaHeart, FaRegHeart } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

const CATEGORIES = ['All', 'Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Commercial'];

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

// Fallback static projects if DB is empty / not connected
const FALLBACK = [
  { _id: '1', img: '/images/Ai Exp Dep/1.png', title: 'The Modern Zen Kitchen', category: 'Kitchen', location: 'Mumbai, MH', year: '2025', images: ['/images/Ai Exp Dep/1.png'], description: 'A serene minimalist kitchen with natural wood and stone textures.' },
  { _id: '2', img: '/images/Ai Exp Dep/2.png', title: 'The Alcott Residence', category: 'Living Room', location: 'San Francisco, CA', year: '2025', images: ['/images/Ai Exp Dep/2.png'], description: 'A serene minimalist living room bathed in natural light.' },
  { _id: '3', img: '/images/Ai Exp Dep/3.png', title: 'Kyoto Bath Retreat', category: 'Bathroom', location: 'Kyoto, JP', year: '2025', images: ['/images/Ai Exp Dep/3.png'], description: 'Spa-like Japandi bathroom with stone and natural wood.' },
  { _id: '4', img: '/images/Ai Exp Dep/4.png', title: 'Verdant HQ', category: 'Commercial', location: 'London, UK', year: '2024', images: ['/images/Ai Exp Dep/4.png'], description: 'Tech office with living walls and mid-century modern furniture.' },
  { _id: '5', img: '/images/Ai Exp Dep/5.png', title: 'Casa Serena Villa', category: 'Living Room', location: 'Malibu, CA', year: '2025', images: ['/images/Ai Exp Dep/5.png'], description: 'Warm boho villa with rattan textures and terracotta tones.' },
  { _id: '6', img: '/images/Ai Exp Dep/6.png', title: 'Urban Loft NYC', category: 'Apartment', location: 'New York, NY', year: '2025', images: ['/images/Ai Exp Dep/6.png'], description: 'Modern industrial loft with high ceilings and exposed brick.' },
];

const resolveImage = (img, width = 800) => {
  if (!img) return '/images/living_room.png';
  if (img.startsWith('http')) return getProxyUrl(img);
  const path = img.startsWith('/uploads') || img.startsWith('/images') ? img : `/uploads/${img}`;
  return `${API_BASE_URL}/api/images/resize?path=${encodeURIComponent(path)}&w=${width}&q=80`;
};

const Portfolio = () => {
  const [projects, setProjects] = useState(FALLBACK);
  const [active, setActive] = useState('All');
  const [lightbox, setLightbox] = useState(null);
  const [direction, setDirection] = useState(0);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('intedesign_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(9);

  const { user, loading: authLoading } = useContext(AuthContext);

  useEffect(() => {
    localStorage.setItem('intedesign_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Clear state when user changes to prevent cross-user leakage
  useEffect(() => {
    if (authLoading) return;
    const currentUserId = user?.id || 'anonymous';
    const savedUserId = localStorage.getItem('intedesign_last_user_id');
    
    if (savedUserId && savedUserId !== currentUserId) {
      setFavorites([]);
      localStorage.removeItem('intedesign_favorites');
      localStorage.removeItem('intedesign_last_board_code');
    }
    localStorage.setItem('intedesign_last_user_id', currentUserId);
  }, [user, authLoading]);

  useEffect(() => {
    setVisibleCount(9);
  }, [active]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/projects`)
      .then((res) => setProjects(Array.isArray(res.data) && res.data.length > 0 ? res.data : FALLBACK))
      .catch(() => setProjects(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  const filtered = active === 'All' ? projects : projects.filter((p) => p.category === active);

  const nextProject = (e) => {
    if (e) e.stopPropagation();
    if (!lightbox || filtered.length <= 1) return;
    setDirection(1);
    const currentIndex = filtered.findIndex(p => p._id === lightbox._id);
    if (currentIndex < filtered.length - 1) {
      setLightbox(filtered[currentIndex + 1]);
    } else {
      setLightbox(filtered[0]); // Wrap
    }
  };

  const prevProject = (e) => {
    if (e) e.stopPropagation();
    if (!lightbox || filtered.length <= 1) return;
    setDirection(-1);
    const currentIndex = filtered.findIndex(p => p._id === lightbox._id);
    if (currentIndex > 0) {
      setLightbox(filtered[currentIndex - 1]);
    } else {
      setLightbox(filtered[filtered.length - 1]); // Wrap
    }
  };

  const toggleFavorite = (p) => {
    const item = {
      id: p._id,
      thumb: resolveImage(p.images?.[0]),
      description: p.title,
      source: 'portfolio'
    };
    setFavorites((prev) =>
      prev.find((f) => f.id === item.id) ? prev.filter((f) => f.id !== item.id) : [...prev, item]
    );
  };

  const isFavorited = (id) => favorites.some((f) => f.id === id);

  // Body scroll lock
  useEffect(() => {
    if (lightbox) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [lightbox]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightbox) return;
      if (e.key === 'ArrowRight') nextProject();
      if (e.key === 'ArrowLeft') prevProject();
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox, filtered]);
  const displayed = filtered.slice(0, visibleCount);

  return (
    <PageTransition>
      <div className="min-h-screen pt-32 pb-24 px-6 md:px-16 relative bg-white">

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-14">
          <p className="text-sm font-black uppercase text-black inline-block border-b-2 border-black mb-4">The Work</p>
          <h1 className="text-5xl md:text-7xl font-black text-black uppercase tracking-tighter">Portfolio</h1>
          <div className="w-16 h-2 bg-black mx-auto mt-6" />
        </motion.div>

        {/* Favorites Counter Badge */}
        <div className="flex justify-end max-w-6xl mx-auto mb-8 px-1">
          {favorites.filter(f => f.source === 'portfolio').length > 0 && (
            <Link
              to="/my-board"
              className="group flex items-center gap-3 text-black hover:text-pink-500 transition-all duration-300 uppercase font-black tracking-widest bg-white border-2 border-black px-4 py-2 shadow-[2px_2px_0px_#000000]"
            >
              <FaHeart className="text-sm text-pink-500 group-hover:text-pink-600 transition-colors" />
              <div className="flex flex-col leading-tight whitespace-nowrap text-left">
                <span className="text-[10px]">{favorites.filter(f => f.source === 'portfolio').length} Saved</span>
                <span className="text-[9px] opacity-80">View Full Canvas</span>
              </div>
            </Link>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex md:flex-wrap gap-3 md:justify-center mb-14 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0 scroll-smooth"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`text-xs font-bold tracking-widest uppercase px-6 py-3 border-4 transition-all duration-300 flex-shrink-0 shadow-[2px_2px_0px_#000000] ${active === cat
                ? 'bg-yellow-400 text-black border-black'
                : 'bg-white border-black text-black hover:bg-gray-100'
                }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <>
            {/* Desktop Skeleton */}
            <div className="hidden md:grid grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[...Array(9)].map((_, i) => (
                <div
                  key={`portfolio-skeleton-desktop-${i}`}
                  className="bg-gray-200 border-4 border-black animate-pulse aspect-[4/5] shadow-[4px_4px_0px_#000000]"
                />
              ))}
            </div>
            {/* Mobile Skeleton */}
            <div className="md:hidden flex gap-4 px-1 max-w-6xl mx-auto">
              <div className="flex-1 flex flex-col gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={`left-skeleton-${i}`} className="bg-gray-200 border-4 border-black animate-pulse h-48 shadow-[2px_2px_0px_#000000]" />
                ))}
              </div>
              <div className="flex-1 flex flex-col gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={`right-skeleton-${i}`} className="bg-gray-200 border-4 border-black animate-pulse h-64 shadow-[2px_2px_0px_#000000]" />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Desktop Grid (Standard 3-column horizontal flow) */}
            <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <AnimatePresence mode="popLayout">
                {displayed.map((p, i) => (
                  <motion.div
                    key={p._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="relative group overflow-hidden cursor-pointer aspect-[4/5] neopop-card p-2 bg-white"
                    onClick={() => setLightbox(p)}
                  >
                    <div className="w-full h-full border-4 border-black overflow-hidden relative">
                      <img
                        src={resolveImage(p.images?.[0])}
                        alt={p.title}
                        loading={i < 6 ? "eager" : "lazy"}
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-blue-400 opacity-0 group-hover:opacity-90 transition-opacity duration-300 flex flex-col justify-center items-center p-6 border-4 border-transparent group-hover:border-black">
                        <span className="text-[10px] font-black uppercase text-black bg-white px-2 border-2 border-black shadow-[2px_2px_0px_#000000] mb-2">{p.category} · {p.year}</span>
                        <h3 className="text-2xl font-black text-black uppercase tracking-tighter text-center">{p.title}</h3>
                        <p className="text-xs font-bold uppercase text-gray-800 mt-2">{p.location}</p>
                      </div>

                      {/* Grid Like Button — bottom-right */}
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(p);
                          }}
                          className={`p-3 border-4 transition-all duration-200 shadow-[2px_2px_0px_#000000] ${isFavorited(p._id)
                            ? 'bg-pink-400 border-black text-black'
                            : 'bg-white border-black text-black hover:bg-pink-400'
                            }`}
                        >
                          {isFavorited(p._id) ? <FaHeart fontSize={16} /> : <FaRegHeart fontSize={16} />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Mobile Strict 2-Column Grid (Odd/Even Split) */}
            <div className="md:hidden flex gap-3 max-w-6xl mx-auto px-1">
              {/* Left Column (Odd 1, 3, 5...) */}
              <div className="flex-1 flex flex-col gap-3">
                <AnimatePresence>
                  {displayed.filter((_, i) => i % 2 === 0).map((p, i) => (
                    <motion.div
                      key={`left-${p._id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative overflow-hidden cursor-pointer neopop-card p-1 bg-white mb-2"
                      onClick={() => setLightbox(p)}
                    >
                      <div className="w-full h-full border-2 border-black overflow-hidden relative">
                        <img
                          src={resolveImage(p.images?.[0])}
                          alt={p.title}
                          className="w-full object-cover"
                          draggable="false"
                          onContextMenu={(e) => e.preventDefault()}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-black p-2">
                          <h3 className="text-[10px] font-black uppercase text-black truncate">{p.title}</h3>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {/* Right Column (Even 2, 4, 6...) */}
              <div className="flex-1 flex flex-col gap-3">
                <AnimatePresence>
                  {displayed.filter((_, i) => i % 2 !== 0).map((p, i) => (
                    <motion.div
                      key={`right-${p._id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative overflow-hidden cursor-pointer neopop-card p-1 bg-white mb-2"
                      onClick={() => setLightbox(p)}
                    >
                      <div className="w-full h-full border-2 border-black overflow-hidden relative">
                        <img src={resolveImage(p.images?.[0])} alt={p.title} className="w-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-black p-2">
                          <h3 className="text-[10px] font-black uppercase text-black truncate">{p.title}</h3>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}

        {/* Load More Button */}
        {!loading && visibleCount < filtered.length && (
          <div className="flex justify-center mt-12 mb-8">
              <button
                onClick={() => setVisibleCount((prev) => prev + 9)}
                className="neopop-btn bg-white px-8 py-4 text-black text-sm hover:bg-gray-100"
              >
                Load More Projects
              </button>
          </div>
        )}

        <AnimatePresence>
          {lightbox && (
            <motion.div
              key="portfolio-lightbox-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/90 backdrop-blur-md z-[5000] flex items-center justify-center p-6 md:p-12"
              onClick={() => setLightbox(null)}
            >
              {/* Controls - Positioned to avoid navbar conflict */}
              <div className="absolute top-12 right-12 z-[1010] flex items-center gap-4">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(lightbox); }}
                  className={`p-4 border-4 transition-all duration-300 shadow-[4px_4px_0px_#000000] ${isFavorited(lightbox._id)
                    ? 'bg-pink-400 border-black text-black'
                    : 'bg-white border-black text-black hover:bg-pink-400'
                    }`}
                >
                  {isFavorited(lightbox._id) ? <FaHeart className="text-2xl" /> : <FaRegHeart className="text-2xl" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
                  className="bg-white p-4 border-4 border-black text-black shadow-[4px_4px_0px_#000000] hover:bg-gray-200 transition-colors"
                >
                  <FaTimes className="text-2xl" />
                </button>
              </div>

              {/* Navigation Arrows */}
              {filtered.length > 1 && (
                <div className="contents hidden md:block">
                  <button
                    onClick={prevProject}
                    className="absolute left-10 top-1/2 -translate-y-1/2 w-16 h-16 bg-white border-4 border-black flex items-center justify-center text-black hover:bg-yellow-400 transition-all z-[1010] shadow-[4px_4px_0px_#000000]"
                  >
                    <FaChevronLeft className="text-2xl" />
                  </button>
                  <button
                    onClick={nextProject}
                    className="absolute right-10 top-1/2 -translate-y-1/2 w-16 h-16 bg-white border-4 border-black flex items-center justify-center text-black hover:bg-yellow-400 transition-all z-[1010] shadow-[4px_4px_0px_#000000]"
                  >
                    <FaChevronRight className="text-2xl" />
                  </button>
                </div>
              )}

              {/* Image + Info Container */}
              <div className="max-w-4xl w-full flex flex-col items-center relative mt-16 md:mt-20 touch-none" onClick={(e) => e.stopPropagation()}>
                <AnimatePresence mode="wait" initial={false} custom={direction}>
                  <motion.div
                    key={lightbox._id}
                    custom={direction}
                    initial={{ x: direction * 200, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: direction * -200, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipeThreshold = 50;
                      const velocityThreshold = 500;
                      if (Math.abs(offset.x) > swipeThreshold && Math.abs(velocity.x) > velocityThreshold) {
                        if (offset.x > 0) prevProject();
                        else nextProject();
                      }
                    }}
                    className="w-full bg-white border-4 border-black shadow-[12px_12px_0px_#000000] overflow-hidden"
                  >
                    <PortfolioLightboxImage
                      src={resolveImage(lightbox.images?.[0], 1200)}
                      alt={lightbox.title}
                    />
                    
                    <div className="w-full p-5 md:p-10 relative z-30 bg-white border-t-4 border-black">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="text-xs font-black tracking-widest uppercase text-black bg-pink-400 px-2 border-2 border-black">{lightbox.category}</span>
                            <span className="text-xs font-bold uppercase text-gray-500">{lightbox.location}</span>
                          </div>
                          <h3 className="text-3xl md:text-5xl font-black text-black mb-4 uppercase tracking-tighter">{lightbox.title}</h3>
                          <p className="text-sm md:text-base font-bold text-gray-700 leading-relaxed max-w-2xl">{lightbox.description}</p>
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-1 min-w-[140px]">
                          <span className="text-4xl md:text-6xl font-black text-gray-200 uppercase" style={{ WebkitTextStroke: '2px black' }}>{lightbox.year}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="w-full mt-4 md:mt-8 pt-3 md:pt-6 border-t-4 border-black flex items-center justify-between">
                  <span className="text-black text-xs font-black uppercase bg-yellow-400 px-4 py-1 border-2 border-black">
                    {filtered.findIndex(p => p._id === lightbox._id) + 1} / {filtered.length}
                  </span>
                </div>
              </div>

              {/* Mobile Arrows - Synchronized with AI Explorer */}
              <div className="absolute bottom-12 left-6 flex items-center gap-4 md:hidden z-[1010]">
                <button
                  onClick={(e) => { e.stopPropagation(); prevProject(); }}
                  className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center text-black shadow-[4px_4px_0px_#000000] active:translate-y-1 active:shadow-none transition-all"
                >
                  <FaChevronLeft fontSize={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextProject(); }}
                  className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center text-black shadow-[4px_4px_0px_#000000] active:translate-y-1 active:shadow-none transition-all"
                >
                  <FaChevronRight fontSize={14} />
                </button>
              </div>

              {/* Fixed constant "Enquire" button in bottom left/right of screen - Outside image box */}
              <div className="fixed bottom-12 right-6 md:right-12 z-[5010] pointer-events-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); window.location.href = '/contact'; }}
                  className="neopop-btn bg-yellow-400 px-8 py-4 text-black text-sm hover:bg-yellow-300 shadow-[8px_8px_0px_#000000]"
                >
                  Enquire Now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        <style>{`
          .my-masonry-grid {
            display: flex;
            margin-left: -12px; /* gutter size offset */
            width: auto;
          }
          .my-masonry-grid_column {
            padding-left: 12px; /* gutter size */
            background-clip: padding-box;
          }
          @media (min-width: 768px) {
            .my-masonry-grid {
              margin-left: -32px;
            }
            .my-masonry-grid_column {
              padding-left: 32px;
            }
          }
        `}</style>
      </div>
    </PageTransition>
  );
};


/* Sub-component: image with skeleton loader for Portfolio */
const PortfolioLightboxImage = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative overflow-hidden bg-gray-100 min-h-[400px] flex items-center justify-center">
      {!loaded && (
        <div className="absolute inset-0 z-10 bg-gray-200 animate-pulse" />
      )}

      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        draggable="false"
        onContextMenu={(e) => e.preventDefault()}
        className={`relative z-10 w-full max-h-[45vh] md:max-h-[50vh] object-contain transition-all duration-500 ease-out ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
      />
    </div>
  );
};

export default Portfolio;
