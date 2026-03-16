import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Masonry from 'react-masonry-css';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { FaTimes, FaChevronLeft, FaChevronRight, FaHeart, FaRegHeart } from 'react-icons/fa';
import PageTransition from '../components/PageTransition';

const CATEGORIES = ['All', 'Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Commercial'];

const getProxyUrl = (url) => {
  if (!url || url.startsWith('/images') || url.startsWith('/uploads')) return url;
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
    const saved = localStorage.getItem('phantasia_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    localStorage.setItem('phantasia_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    setVisibleCount(9);
  }, [active]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/projects`)
      .then((res) => setProjects(res.data.length > 0 ? res.data : FALLBACK))
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
      <div className="min-h-screen pt-32 pb-24 px-6 md:px-16 relative">

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-14">
          <p className="text-[10px] tracking-[0.35em] uppercase text-white/30 mb-3">The Work</p>
          <h1 className="text-5xl md:text-7xl font-serif text-white font-medium">Portfolio</h1>
          <div className="w-16 h-[1px] bg-white/20 mx-auto mt-6" />
        </motion.div>

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
              className={`text-[10px] tracking-[0.2em] uppercase px-5 py-2 rounded-full border transition-all duration-300 flex-shrink-0 ${active === cat
                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                : 'border-white/10 text-white/30 hover:border-white/30 hover:text-white/60'
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
                  className="rounded-2xl bg-white/5 animate-pulse aspect-[4/5]"
                />
              ))}
            </div>
            {/* Mobile Skeleton */}
            <div className="md:hidden flex gap-3 px-1 max-w-6xl mx-auto">
              <div className="flex-1 flex flex-col gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={`left-skeleton-${i}`} className="rounded-2xl bg-white/5 animate-pulse h-48" />
                ))}
              </div>
              <div className="flex-1 flex flex-col gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={`right-skeleton-${i}`} className="rounded-2xl bg-white/5 animate-pulse h-64" />
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
                    className="relative group overflow-hidden rounded-2xl cursor-pointer aspect-[4/5]"
                    onClick={() => setLightbox(p)}
                  >
                    <img
                      src={resolveImage(p.images?.[0])}
                      alt={p.title}
                      loading={i < 6 ? "eager" : "lazy"}
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

                    {/* Grid Like Button — bottom-right */}
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(p);
                        }}
                        className={`p-2.5 rounded-full border backdrop-blur-md transition-all duration-200 ${isFavorited(p._id)
                          ? 'bg-pink-500/30 border-pink-500 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                          : 'bg-black/30 border-white/20 text-white/60 hover:text-pink-400 hover:border-pink-500/40'
                          }`}
                      >
                        {isFavorited(p._id) ? <FaHeart fontSize={13} /> : <FaRegHeart fontSize={13} />}
                      </button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-400">
                      <span className="text-[8px] md:text-[9px] tracking-widest uppercase text-white/50">{p.category} · {p.year}</span>
                      <h3 className="text-base md:text-lg font-serif text-white mt-1">{p.title}</h3>
                      <p className="text-[9px] md:text-[10px] text-white/40 mt-1">{p.location}</p>
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
                      className="relative rounded-2xl overflow-hidden cursor-pointer"
                      onClick={() => setLightbox(p)}
                    >
                      <img
                        src={resolveImage(p.images?.[0])}
                        alt={p.title}
                        className="w-full object-cover"
                        draggable="false"
                        onContextMenu={(e) => e.preventDefault()}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <h3 className="text-[10px] font-serif text-white">{p.title}</h3>
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
                      className="relative rounded-2xl overflow-hidden cursor-pointer"
                      onClick={() => setLightbox(p)}
                    >
                      <img src={resolveImage(p.images?.[0])} alt={p.title} className="w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <h3 className="text-[10px] font-serif text-white">{p.title}</h3>
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
              className="px-8 py-3 bg-white/5 border border-white/10 text-white text-xs tracking-[0.2em] font-medium uppercase rounded-full hover:bg-white/10 transition-colors"
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
              className="fixed inset-0 bg-black/75 backdrop-blur-[100px] z-[5000] flex items-center justify-center p-6 md:p-12"
              onClick={() => setLightbox(null)}
            >
              {/* Controls - Positioned to avoid navbar conflict */}
              <div className="absolute top-12 right-12 z-[1010] flex items-center gap-4">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(lightbox); }}
                  className={`p-4 rounded-full border backdrop-blur-md transition-all duration-300 ${isFavorited(lightbox._id)
                    ? 'bg-pink-500/20 border-pink-500 text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                    }`}
                >
                  {isFavorited(lightbox._id) ? <FaHeart className="text-2xl" /> : <FaRegHeart className="text-2xl" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
                  className="text-white/40 hover:text-white transition-colors bg-white/5 p-4 rounded-full border border-white/10 backdrop-blur-md"
                >
                  <FaTimes className="text-2xl" />
                </button>
              </div>

              {/* Navigation Arrows */}
              {filtered.length > 1 && (
                <div className="contents hidden md:block">
                  <button
                    onClick={prevProject}
                    className="absolute left-10 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all z-[1010] backdrop-blur-md"
                  >
                    <FaChevronLeft className="text-2xl" />
                  </button>
                  <button
                    onClick={nextProject}
                    className="absolute right-10 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all z-[1010] backdrop-blur-md"
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
                    className="w-full bg-[#000000] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
                  >
                    <PortfolioLightboxImage
                      src={resolveImage(lightbox.images?.[0], 1200)}
                      alt={lightbox.title}
                    />
                    
                    <div className="w-full p-5 md:p-10 -mt-6 relative z-30 bg-black/60 backdrop-blur-xl border-t border-white/5">
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1 md:mb-1.5 flex-wrap">
                            <span className="text-[8px] md:text-[10px] tracking-[0.4em] uppercase text-purple-400 font-bold whitespace-nowrap">{lightbox.category}</span>
                            <span className="text-[8px] md:text-[10px] tracking-[0.4em] uppercase text-white/30">{lightbox.location}</span>
                          </div>
                          <h3 className="text-2xl md:text-5xl font-serif text-white mb-2.5 md:mb-3 leading-snug md:leading-tight">{lightbox.title}</h3>
                          <p className="text-[12px] md:text-base text-white/40 leading-relaxed max-w-2xl">{lightbox.description}</p>
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-1 min-w-[140px]">
                          <span className="text-4xl md:text-6xl font-serif italic text-white/5 leading-none">{lightbox.year}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="w-full mt-4 md:mt-8 pt-3 md:pt-6 border-t border-white/5 flex items-center justify-between">
                  <span className="text-white/20 text-[10px] tracking-[0.3em] uppercase font-bold">
                    {filtered.findIndex(p => p._id === lightbox._id) + 1} / {filtered.length}
                  </span>
                </div>
              </div>

              {/* Mobile Arrows - Synchronized with AI Explorer */}
              <div className="absolute bottom-12 left-6 flex items-center gap-4 md:hidden z-[1010]">
                <button
                  onClick={(e) => { e.stopPropagation(); prevProject(); }}
                  className="w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white backdrop-blur-md active:scale-95 transition-transform"
                >
                  <FaChevronLeft fontSize={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextProject(); }}
                  className="w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white backdrop-blur-md active:scale-95 transition-transform"
                >
                  <FaChevronRight fontSize={14} />
                </button>
              </div>

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
    <div className="relative overflow-hidden bg-black/40 min-h-[400px] flex items-center justify-center">
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
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        draggable="false"
        onContextMenu={(e) => e.preventDefault()}
        className={`relative z-10 w-full max-h-[45vh] md:max-h-[50vh] object-contain transition-all duration-500 ease-out ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
      />
      {/* Reduced gradient overlay */}
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export default Portfolio;
