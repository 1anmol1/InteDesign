import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import { FaArrowDown, FaStar, FaWandMagicSparkles, FaCalendarCheck } from 'react-icons/fa6';
import { FaPencilRuler, FaCouch, FaHeart } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
import PageTransition from '../components/PageTransition';
import Scene3DBackground from '../components/Scene3dbackground';

/* ─── AI Explorer Demo: self-contained looping animation ─── */
const DEMO_PROMPTS = [
  'warm boho living room terracotta',
  'moody dark green home office',
  'luxury Japandi bathroom retreat',
  'minimalist open concept kitchen',
];

const PORTFOLIO_ITEMS = [
  { img: '/images/Ai Exp Dep/1.png', title: 'The Modern Zen Kitchen', location: 'Mumbai, MH' },
  { img: '/images/Ai Exp Dep/2.png', title: 'The Alcott Residence', location: 'San Francisco, CA' },
  { img: '/images/Ai Exp Dep/3.png', title: 'Kyoto Bath Retreat', location: 'Kyoto, JP' },
  { img: '/images/Ai Exp Dep/4.png', title: 'Verdant HQ', location: 'London, UK' },
  { img: '/images/Ai Exp Dep/5.png', title: 'Oceanfront Villa', location: 'Malibu, CA' },
  { img: '/images/Ai Exp Dep/6.png', title: 'Urban Loft', location: 'New York, NY' },
  { img: '/images/Ai Exp Dep/7.png', title: 'Highland Cabin', location: 'Aspen, CO' },
];

const IMAGE_POOL = PORTFOLIO_ITEMS.map(item => item.img);

const getRandomImages = (count) => {
  const shuffled = [...IMAGE_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const AiExplorerDemo = () => {
  const [prompt, setPrompt] = useState('');
  const [btnFlash, setBtnFlash] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | skeleton | images
  const [displayedImages, setDisplayedImages] = useState(Array(6).fill(null));
  const [visibleImages, setVisibleImages] = useState([]);

  useEffect(() => {
    let cancelled = false;
    let cycleIdx = 0;

    const run = async () => {
      while (!cancelled) {
        const targetPrompt = DEMO_PROMPTS[cycleIdx % DEMO_PROMPTS.length];

        // 1. Type prompt
        setPhase('idle');
        setPrompt('');
        for (let i = 1; i <= targetPrompt.length; i++) {
          if (cancelled) return;
          setPrompt(targetPrompt.slice(0, i));
          await sleep(50);
        }

        if (cancelled) return;
        await sleep(400);

        // 2. Flash the Inspire button
        setBtnFlash(true);
        await sleep(400);
        setBtnFlash(false);

        if (cancelled) return;

        // 3. Clear old images, generate new ones, show skeletons
        setDisplayedImages(getRandomImages(6));
        setVisibleImages([]);
        setPhase('skeleton');
        await sleep(1200);

        if (cancelled) return;

        // 4. Fade in images one by one
        setPhase('images');
        for (let i = 0; i < 6; i++) {
          if (cancelled) return;
          await sleep(100);
          setVisibleImages((prev) => [...prev, i]);
        }

        // 5. Pause so user can see the result
        if (cancelled) return;
        await sleep(3000);

        // 6. Backspace the prompt (images DONT clear, phase goes to 'idle')
        setPhase('idle');
        for (let i = targetPrompt.length; i >= 0; i--) {
          if (cancelled) return;
          setPrompt(targetPrompt.slice(0, i));
          await sleep(25);
        }

        if (cancelled) return;
        await sleep(800);

        // 7. Advance to next cycle
        cycleIdx++;
      }
    };

    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/20">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-white/3">
        <span className="w-3 h-3 rounded-full bg-red-500/50" />
        <span className="w-3 h-3 rounded-full bg-amber-500/50" />
        <span className="w-3 h-3 rounded-full bg-green-500/50" />
        <span className="flex-1 text-center text-[9px] text-white/20 font-mono">phantasia.studio/explorer</span>
      </div>

      <div className="p-4">
        {/* Search bar */}
        <div className="relative flex items-center gap-3 bg-white/5 border border-white/20 rounded-xl px-4 py-3 mb-4 overflow-hidden group">
          <div className="absolute inset-0 w-full h-full border-t-[1px] border-l-[1px] border-white/40 scale-[1.05] -translate-x-full transition-all duration-[2000ms] ease-linear repeat-infinite animate-[spin_4s_linear_infinite]" />
          <span className="text-white/40 text-sm relative z-10">✦</span>
          <span className="text-[11px] md:text-sm text-white font-light flex-1 min-h-[20px] block relative z-10 whitespace-nowrap overflow-hidden">
            {prompt}
            <span className="animate-pulse text-white/70">|</span>
          </span>
          <motion.span
            animate={btnFlash
              ? { scale: [1, 0.85, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] }
              : {}
            }
            transition={{ duration: 0.4 }}
            className="text-[10px] tracking-widest text-[#1f2937] bg-gradient-to-br from-[#f8f9fa] to-[#9ca3af] uppercase px-3 py-1 rounded-lg font-bold shadow-md relative z-10"
          >
            Inspire
          </motion.span>
        </div>

        {/* Image grid — fixed layout, 2 col × 3 row */}
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="aspect-[4/5] rounded-lg overflow-hidden bg-white/5 relative">
              {phase === 'skeleton' && (
                <div className="absolute inset-0 bg-white/8 animate-pulse rounded-lg" />
              )}
              {displayedImages[i] && (phase === 'images' || phase === 'idle') && visibleImages.includes(i) && (
                <motion.img
                  src={displayedImages[i]}
                  alt=""
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full object-cover relative z-10"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


const FALLBACK_PROJECTS = [
  { _id: '1', title: 'The Modern Zen Kitchen', category: 'Kitchen', location: 'Mumbai, MH', images: ['/images/Ai Exp Dep/1.png'] },
  { _id: '2', title: 'The Alcott Residence', category: 'Living Room', location: 'San Francisco, CA', images: ['/images/Ai Exp Dep/2.png'] },
  { _id: '3', title: 'Kyoto Bath Retreat', category: 'Bathroom', location: 'Kyoto, JP', images: ['/images/Ai Exp Dep/3.png'] },
  { _id: '4', title: 'Verdant HQ', category: 'Commercial', location: 'London, UK', images: ['/images/Ai Exp Dep/4.png'] },
  { _id: '5', title: 'Casa Serena Villa', category: 'Living Room', location: 'Malibu, CA', images: ['/images/Ai Exp Dep/5.png'] },
  { _id: '6', title: 'Urban Loft NYC', category: 'Apartment', location: 'New York, NY', images: ['/images/Ai Exp Dep/6.png'] },
];

const FALLBACK_REVIEWS = [
  { _id: 'f1', name: 'Priyal S.', location: 'Mumbai', quote: 'The AI Style Explorer saved us weeks of mood boarding. We could literally show Aria exactly what we wanted before our first meeting.', stars: 5 },
  { _id: 'f2', name: 'Rahul & Neha', location: 'Bangalore', quote: 'Phantasia transformed our dark, cramped kitchen into a marble-and-light sanctuary. The process was completely stress-free.', stars: 5 },
  { _id: 'f3', name: 'Vikram Adani', location: 'Delhi', quote: 'Aria has an incredible eye for detail. Every corner of our new villa feels intentional and luxurious. Highly recommend the Full-Service Remodel.', stars: 5 },
];

const resolveImage = (img, width = 800) => {
  if (!img) return '/images/living_room.png';
  if (img.startsWith('http')) return img;
  const cleanPath = img.startsWith('/uploads') || img.startsWith('/images') ? img : `/uploads/${img}`;
  return `${API_BASE_URL}/api/images/resize?path=${encodeURIComponent(cleanPath)}&w=${width}&q=80`;
};

const processSteps = [
  { icon: FaWandMagicSparkles, label: 'Dream It', desc: 'Use the AI Explorer to build a visual mood board of your perfect space.' },
  { icon: FaPencilRuler, label: 'Plan It', desc: 'Consultation & service selection tailored to your timeline and budget.' },
  { icon: FaCouch, label: 'Live It', desc: 'We handle every detail. You just walk in and feel at home.' },
];

// Removed static testimonials array; will be fetched dynamically

/* ─── Overlapping Card Carousel (mobile-first) ─── */
const TestimonialsCarousel = ({ items }) => {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = left slide
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(0);

  const next = useCallback(() => {
    setDirection(1);
    setActive((a) => (a + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setActive((a) => (a - 1 + items.length) % items.length);
  }, [items.length]);

  // Auto-advance (Stopped on mobile to allow manual swipe exploration)
  useEffect(() => {
    if (window.innerWidth < 768) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [next]);

  const nextIdx = (active + 1) % items.length;

  // Touch/drag handlers
  const handleDragStart = (x) => { setDragging(true); dragStart.current = x; };
  const handleDragEnd = (x) => {
    if (!dragging) return;
    const diff = dragStart.current - x;
    if (diff > 40) next();
    else if (diff < -40) prev();
    setDragging(false);
  };

  return (
    <div className="relative">
      {/* ── Mobile: overlapping stack ── */}
      <div
        className="md:hidden relative min-h-[350px] select-none z-10 touch-pan-y w-[85vw] max-w-[340px] mx-auto"
        style={{ willChange: 'transform', transform: 'translateZ(0)', isolation: 'isolate' }}
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseUp={(e) => handleDragEnd(e.clientX)}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
      >
        {/* Back card (next) — slightly to the right, smaller, dimmer */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`back-${nextIdx}`}
            className="absolute inset-y-4 -right-4 left-4 bg-white/4 border border-white/8 rounded-2xl"
            style={{ transformOrigin: 'left center' }}
            initial={{ x: 40, scale: 0.92, opacity: 0.4 }}
            animate={{ x: 60, scale: 0.93, opacity: 0.6 }}
            exit={{ x: -60, scale: 0.88, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          />
        </AnimatePresence>

        {/* Front card (active) */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`front-${active}`}
            className="absolute inset-0 bg-white/6 border border-white/12 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-110%', opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          >
            <div>
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, s) => <FaStar key={s} className="text-amber-400/70 text-xs" />)}
              </div>
              <p className="text-base text-white/70 leading-relaxed italic">"{items[active].quote}"</p>
            </div>
            <div className="flex items-center justify-between mt-6">
              <div>
                <p className="text-sm font-medium text-white/80">{items[active].name}</p>
                <p className="text-[10px] text-white/25 tracking-wider uppercase mt-1">{items[active].location}</p>
              </div>
              {/* Dot indicators */}
              <div className="flex gap-1.5">
                {items.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setDirection(i > active ? 1 : -1); setActive(i); }}
                    className={`rounded-full transition-all duration-300 ${i === active ? 'w-4 h-1.5 bg-purple-400' : 'w-1.5 h-1.5 bg-white/20'
                      }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Desktop: 3-column row ── */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="hidden md:grid grid-cols-3 gap-6 max-w-5xl mx-auto"
      >
        {items.map((t, i) => (
          <motion.div
            key={i}
            variants={{
              hidden: { opacity: 0, scale: 0.95, y: 20 },
              show: { opacity: 1, scale: 1, y: 0 }
            }}
            whileHover={{ y: -8, scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' }}
            transition={{
              show: { duration: 0.8, ease: "easeOut" },
              hover: { duration: 0.3, ease: "easeInOut" }
            }}
            className="bg-white/4 border border-white/8 rounded-2xl p-7 backdrop-blur-sm shadow-xl"
          >
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, s) => <FaStar key={s} className="text-amber-400/70 text-xs" />)}
            </div>
            <p className="text-sm text-white/55 leading-relaxed italic mb-6">"{t.quote}"</p>
            <div>
              <p className="text-xs font-medium text-white/80">{t.name}</p>
              <p className="text-[10px] text-white/25 tracking-wider uppercase">{t.location}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

const Home = () => {
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 700], [0, -140]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const [fetchedProjects, setFetchedProjects] = useState(FALLBACK_PROJECTS);
  const [hoveredProject, setHoveredProject] = useState(null);
  const [fetchedReviews, setFetchedReviews] = useState(FALLBACK_REVIEWS);
  const [randomAiImage, setRandomAiImage] = useState('/images/Ai Exp Dep/1.png');

  // Skip hero animations if already visited this session
  const [alreadyVisited, setAlreadyVisited] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const visited = sessionStorage.getItem('home_visited');
    if (visited) setAlreadyVisited(true);

    // Brief delay to allow scroll restoration to happen before showing hero
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    sessionStorage.setItem('home_visited', '1');
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setRandomAiImage(IMAGE_POOL[Math.floor(Math.random() * IMAGE_POOL.length)]);

    // Parallel fetching for faster load
    Promise.all([
      axios.get(`${API_BASE_URL}/api/projects?featured=true`),
      axios.get(`${API_BASE_URL}/api/reviews`)
    ]).then(([projectsRes, reviewsRes]) => {
      setFetchedProjects(projectsRes.data.length > 0 ? projectsRes.data.slice(0, 6) : FALLBACK_PROJECTS);
      setFetchedReviews(reviewsRes.data.length > 0 ? reviewsRes.data : FALLBACK_REVIEWS);
    }).catch(err => {
      console.error('Home load error:', err);
      // Ensure fallbacks on error
      setFetchedProjects(FALLBACK_PROJECTS);
      setFetchedReviews(FALLBACK_REVIEWS);
    });
  }, []);

  return (
    <PageTransition>
      <div className="overflow-x-hidden w-full max-w-[100vw] snap-y snap-mandatory">

        {/* ═══════════════════════════════════════════════════════════
            1. HERO SECTION
        ═══════════════════════════════════════════════════════════ */}
        <motion.section
          ref={heroRef}
          style={{
            y: heroY,
            opacity: isReady ? heroOpacity : 0
          }}
          className="relative h-[100svh] flex flex-col justify-center items-center z-10 overflow-hidden snap-start snap-always"
        >
          {/* Background image & Reveal Overlay */}
          <div className="absolute inset-0">
            <motion.div
              initial={alreadyVisited ? { scale: 1 } : { scale: 1.1, filter: 'blur(10px)' }}
              animate={{ scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full"
            >
              <img
                src="/images/hero_room.png"
                alt="Luxury interior design transformation"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#000000]" />

            {/* Premium Reveal Wipe (only for first visit) */}
            {!alreadyVisited && (
              <motion.div
                initial={{ x: '0%' }}
                animate={{ x: '100%' }}
                transition={{ delay: 0.2, duration: 1.2, ease: [0.77, 0, 0.175, 1] }}
                className="absolute inset-0 bg-[#000000] z-50 pointer-events-none"
              >
                {/* Reveal line glow */}
                <div className="absolute top-0 left-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-white/50 to-transparent shadow-[0_0_20px_rgba(255,255,255,0.3)]" />
              </motion.div>
            )}
          </div>

          {/* Content */}
          <div className={`relative z-[60] text-center px-6 max-w-4xl mx-auto transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
            <motion.h1
              initial={alreadyVisited ? false : { opacity: 0, x: -20, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: alreadyVisited ? 0 : 0.8, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-serif font-medium text-white leading-[1.05] mb-10 sm:mb-6"
            >
              Design Your Dream Space,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
                Powered by Your Imagination.
              </span>
            </motion.h1>

            <motion.p
              initial={alreadyVisited ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: alreadyVisited ? 0 : 1.2, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm md:text-base text-white/50 font-light max-w-xl mx-auto leading-relaxed mb-14 sm:mb-10"
            >
              Experience the future of interior design. Tell us what you love,
              and our AI will visualize it instantly.
            </motion.p>

            <motion.div
              initial={alreadyVisited ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: alreadyVisited ? 0 : 1.4, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-5 sm:gap-3 justify-center"
            >
              {/* AI Explorer Button (Silver 3D Style) */}
              <Link
                to="/explorer"
                className="px-6 py-3.5 sm:px-8 sm:py-3.5 rounded-full text-[10px] sm:text-xs tracking-[0.2em] font-bold uppercase transition-all duration-300 active:translate-y-[2px] active:shadow-inner flex items-center justify-center text-center w-full sm:w-auto blur-optimized"
                style={{
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)',
                  color: '#1f2937',
                  boxShadow: 'inset 0 1px 3px rgba(255,255,255,1), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 6px rgba(0,0,0,0.3)',
                  willChange: 'transform, backdrop-filter'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 50%, #6b7280 100%)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)'}
              >
                Try the AI Style Explorer →
              </Link>
              <Link
                to="/portfolio"
                className="px-6 py-3.5 sm:px-8 sm:py-3.5 border border-white/30 text-white text-[10px] sm:text-xs tracking-[0.25em] uppercase hover:bg-white/10 hover:border-white/60 transition-all duration-300 rounded-full backdrop-blur-sm blur-optimized"
                style={{ willChange: 'transform, backdrop-filter' }}
              >
                View Portfolio
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={alreadyVisited ? { opacity: 0.1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: alreadyVisited ? 0.2 : 2.5, duration: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce"
          >
            <span className="text-[9px] tracking-[0.3em] uppercase text-white/20">Scroll</span>
            <FaArrowDown className="text-white/20 text-sm" />
          </motion.div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════
            2. TRUST BUILDER — About Teaser
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative z-10 min-h-[100dvh] flex flex-col justify-center py-10 px-6 md:px-16 snap-start snap-always">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
            {/* AI Generated image placeholder */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Link to="/about" className="block overflow-hidden rounded-2xl aspect-[4/5] border border-white/10 group/trust-img relative">
                <img src="/images/designer.png" alt="Aria Voss – Principal Designer" className="w-full h-full object-cover transition-transform duration-700 group-hover/trust-img:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
              </Link>
              {/* Stats pill */}
              <div className="absolute -bottom-5 -right-5 bg-black/80 backdrop-blur-lg border border-white/10 rounded-2xl px-6 py-4 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xl font-serif text-white">10k+</p>
                  <p className="text-[9px] text-white/30 uppercase tracking-wide">Designs</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-serif text-white">AI</p>
                  <p className="text-[9px] text-white/30 uppercase tracking-wide">Powered</p>
                </div>
              </div>
            </motion.div>

            {/* Copy */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <p className="text-[10px] tracking-[0.35em] uppercase text-white/30">Meet the Designer</p>
              <h2 className="text-4xl md:text-5xl font-serif text-white font-light leading-tight">
                Your home should reflect <em>you</em>, not a catalog.
              </h2>
              <div className="w-12 h-[1px] bg-white/20" />
              <p className="text-base text-white/50 leading-relaxed">
                We put you at the center of the design process to create spaces that breathe life into your daily routine. Every project starts with listening deeply until we understand not just how you want your space to look, but how you want to <em>feel</em> inside it.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-xs tracking-[0.25em] uppercase text-white border-b border-white/20 hover:border-white pb-1 transition-all"
              >
                Meet Your Designer →
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            3. AI FEATURE HIGHLIGHT
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative z-10 min-h-[100dvh] flex flex-col justify-center py-10 px-6 md:px-16 bg-gradient-to-b from-transparent via-purple-950/15 to-transparent snap-start snap-always">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="order-2 md:order-1"
            >
              <Link to="/explorer" className="block group/demo">
                <div className="transition-transform duration-500 group-hover/demo:scale-[1.02]">
                  <AiExplorerDemo />
                </div>
              </Link>
            </motion.div>

            {/* Copy */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="space-y-6 order-1 md:order-2"
            >
              <p className="text-[10px] tracking-[0.35em] uppercase text-purple-400/60">Powered by Gemini AI</p>
              <h2 className="text-4xl md:text-5xl font-serif text-white font-light leading-tight">
                Can't quite picture it? Let our AI do the heavy lifting.
              </h2>
              <div className="w-12 h-[1px] bg-purple-400/30" />
              <p className="text-base text-white/50 leading-relaxed">
                Stop endlessly scrolling. Type in your vibe, your favorite colors, or a feeling and our smart design engine instantly pulls curated inspiration from our approved design vaults.
              </p>
              <Link
                to="/explorer"
                className="inline-block px-10 py-4 text-[11px] font-bold tracking-[0.2em] uppercase rounded-full transition-all duration-300 active:translate-y-[2px]"
                style={{
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)',
                  color: '#1f2937',
                  boxShadow: 'inset 0 1px 3px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.2), 0 6px 8px rgba(0,0,0,0.3)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 50%, #6b7280 100%)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)'}
              >
                Generate Your Vision Board →
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            NEW: VISION BOARD CTA (Design Blueprint)
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative z-10 min-h-[100dvh] flex flex-col justify-center py-16 md:py-28 px-6 md:px-16 lg:px-24 overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-12 md:gap-20">

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="flex-1 space-y-6 max-w-2xl"
            >
              <p className="text-[10px] tracking-[0.35em] uppercase text-white/30">Your Design Blueprint</p>
              <h2 className="text-3xl md:text-6xl font-serif text-white font-light leading-[1.1]">
                Don't just dream.<br />
                <span className="italic">Curate</span> your vision.
              </h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed max-w-lg">
                Your inspirations deserve a home. Save your favorite AI Explorer concepts and portfolio pieces into a unified vision board. It's the ultimate blueprint for your future space.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to="/explorer"
                  className="px-8 py-3.5 md:px-10 md:py-4 text-[11px] font-bold tracking-[0.2em] uppercase rounded-full transition-all duration-300 active:translate-y-[2px] text-center"
                  style={{
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)',
                    color: '#1f2937',
                    boxShadow: 'inset 0 1px 3px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.2), 0 6px 8px rgba(0,0,0,0.3)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 50%, #6b7280 100%)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)'}
                >
                  Start Curating
                </Link>
                <Link
                  to="/my-board"
                  className="px-8 py-3.5 bg-white/5 border border-white/20 text-white text-[11px] font-bold tracking-widest uppercase rounded-full hover:bg-white/10 transition-all text-center"
                >
                  View My Board
                </Link>
              </div>
            </motion.div>

            <Link
              to="/my-board"
              className="w-full flex-1 relative group/vision-cta mt-12 md:mt-0 block"
            >
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02, rotate: -1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true }}
                className="w-full flex justify-center"
              >
                <div className="relative aspect-square md:aspect-[4/3] w-[80vw] max-w-[280px] md:w-full md:max-w-[480px] transition-transform duration-500 md:group-hover/vision-cta:-translate-y-2">

                  {/* Background Layer (slanted) */}
                  <div className="absolute inset-0 bg-[#1a1a1a] rounded-3xl rotate-3 scale-105 border border-white/10 transition-transform duration-500 md:group-hover/vision-cta:rotate-6 md:group-hover/vision-cta:scale-110" />

                  {/* Main Card Layer */}
                  <div className="absolute inset-0 bg-[#0a0a0a] rounded-3xl -rotate-2 border border-white/10 overflow-hidden shadow-2xl transition-transform duration-500 md:group-hover/vision-cta:-rotate-4 md:group-hover/vision-cta:scale-105">
                    <img
                      src="/images/Ai Exp Dep/2.png"
                      alt="Vision Board Preview"
                      className="w-full h-full object-cover opacity-80 md:opacity-50 transition-opacity duration-500 md:group-hover/vision-cta:opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  </div>

                  {/* Center Content */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3 z-10 pointer-events-none w-full">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-lg"
                    >
                      <FaHeart className="text-pink-500 text-lg md:text-2xl animate-pulse" />
                    </motion.div>
                    <p className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-white font-bold drop-shadow-lg text-center">Vision Board</p>
                  </div>

                </div>
              </motion.div>
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            4. PORTFOLIO TEASER
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative z-10 min-h-[100dvh] flex flex-col justify-center py-10 px-6 md:px-16 snap-start snap-always">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-14 max-w-xl mx-auto"
          >
            <p className="text-[10px] tracking-[0.35em] uppercase text-white/30 mb-3">Selected Work</p>
            <h2 className="text-4xl md:text-5xl font-serif text-white font-light mb-4">Spaces We've Transformed.</h2>
            <p className="text-sm text-white/40 leading-relaxed">From concept to the final throw pillow. See how we've brought our clients' visions to life.</p>
          </motion.div>

          {/* Animated Marquee Grid */}
          <div className="relative max-w-[100vw] overflow-hidden -mx-6 md:-mx-16 mb-10 pb-4 touch-pan-y" style={{ overflowY: 'hidden', overflowX: 'hidden' }}>
            <style>
              {`
                @keyframes marqueeLeft {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                @keyframes marqueeRight {
                  0% { transform: translateX(-50%); }
                  100% { transform: translateX(0); }
                }
                .animate-marquee-left {
                  animation: marqueeLeft 40s linear infinite;
                  display: flex;
                  width: max-content;
                }
                .animate-marquee-right {
                  animation: marqueeRight 40s linear infinite;
                  display: flex;
                  width: max-content;
                }
                .animate-marquee-left:hover, .animate-marquee-right:hover {
                  animation-play-state: paused;
                }
              `}
            </style>

            <div className="flex flex-col gap-4">
              {/* Top Row (Moving Left) */}
              <div className="animate-marquee-left gap-4">
                {[...PORTFOLIO_ITEMS, ...PORTFOLIO_ITEMS].map((item, i) => (
                  <Link
                    key={`row1-${i}`}
                    to="/portfolio"
                    className="w-64 md:w-80 aspect-[4/3] rounded-xl overflow-hidden flex-shrink-0 group relative cursor-pointer"
                  >
                    <img
                      src={resolveImage(item.img, 600)}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                      <p className="text-white font-serif text-lg translate-y-2 group-hover:translate-y-0 transition-transform duration-500">{item.title}</p>
                      <p className="text-white/50 text-[10px] tracking-[0.2em] uppercase translate-y-2 group-hover:translate-y-0 transition-transform duration-500 delay-75">{item.location}</p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Bottom Row (Moving Right) */}
              <div className="animate-marquee-right gap-4">
                {[...PORTFOLIO_ITEMS, ...PORTFOLIO_ITEMS].reverse().map((item, i) => (
                  <Link
                    key={`row2-${i}`}
                    to="/portfolio"
                    className="w-64 md:w-80 aspect-[4/3] rounded-xl overflow-hidden flex-shrink-0 group relative cursor-pointer"
                  >
                    <img
                      src={resolveImage(item.img, 600)}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                      <p className="text-white font-serif text-lg translate-y-2 group-hover:translate-y-0 transition-transform duration-500">{item.title}</p>
                      <p className="text-white/50 text-[10px] tracking-[0.2em] uppercase translate-y-2 group-hover:translate-y-0 transition-transform duration-500 delay-75">{item.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 text-xs tracking-[0.25em] uppercase text-white/40 hover:text-white border-b border-white/20 hover:border-white pb-1 transition-all"
            >
              View Full Portfolio →
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            5. HOW IT WORKS — 3 Steps
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative z-10 min-h-[100dvh] flex flex-col justify-center py-10 px-6 md:px-16 snap-start snap-always">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-14 max-w-xl mx-auto"
          >
            <p className="text-[10px] tracking-[0.35em] uppercase text-white/30 mb-3">The Process</p>
            <h2 className="text-4xl md:text-5xl font-serif text-white font-light mb-4">A Seamless, Stress-Free Process.</h2>
            <p className="text-sm text-white/40 leading-relaxed">Whether you need a quick virtual consultation or a full-scale remodel, our process is entirely built around your timeline and budget.</p>
          </motion.div>

          {/* 3-step horizontal flow */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" style={{ left: '18%', right: '18%' }} />

            {processSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: i * 0.4 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center group cursor-default"
              >
                {/* Icon circle w/ Hover & Scroll-triggered Brightening */}
                <motion.div
                  className="relative mb-6"
                  whileHover={{ scale: 1.1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <motion.div
                    initial={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)', filter: 'drop-shadow(0 0 0px rgba(255,255,255,0))' }}
                    whileInView={{
                      borderColor: '#ffffff',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      filter: 'drop-shadow(0 0 25px rgba(255,255,255,0.4))',
                      scale: [1, 1.05, 1],
                    }}
                    viewport={{ once: true, margin: "-100px" }}
                    whileHover={{
                      scale: 1.1,
                      borderColor: '#ffffff',
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.6))',
                    }}
                    transition={{
                      whileInView: { duration: 1.2, delay: i * 0.4 },
                      whileHover: { duration: 0.2 }
                    }}
                    className="w-20 h-20 rounded-full border backdrop-blur-sm flex items-center justify-center group"
                  >
                    <step.icon className="text-2xl text-white transition-transform duration-500 group-hover:scale-110" />
                  </motion.div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-black border border-white/20 flex items-center justify-center">
                    <span className="text-[9px] text-white/50 font-serif">{i + 1}</span>
                  </div>
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0.3, filter: 'brightness(0.4)' }}
                  whileInView={{
                    opacity: 1,
                    filter: 'brightness(1.5)',
                  }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: i * 0.4 }}
                  whileHover={{ scale: 1.05, filter: 'brightness(2)', color: '#ffffff', transition: { duration: 0.2 } }}
                  className="text-xl font-serif text-white mb-3"
                >
                  {step.label}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1, delay: (i * 0.4) + 0.2 }}
                  className="text-sm text-white/50 leading-relaxed max-w-xs"
                >
                  {step.desc}
                </motion.p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-xs tracking-[0.25em] uppercase text-white/40 hover:text-white border-b border-white/20 hover:border-white pb-1 transition-all"
            >
              Explore Our Services →
            </Link>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            TESTIMONIALS
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative z-20 min-h-[100dvh] flex flex-col justify-center py-10 px-6 md:px-16 snap-start snap-always">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center mb-10 md:mb-12"
          >
            <p className="text-[10px] tracking-[0.35em] uppercase text-white/30 mb-3">Happy Clients</p>
            <h2 className="text-3xl md:text-4xl font-serif text-white font-light">What They Say</h2>
          </motion.div>

          <div className="max-w-5xl mx-auto min-h-[300px] flex items-center justify-center relative">
            <AnimatePresence mode="wait">
              {fetchedReviews.length > 0 ? (
                <motion.div
                  key="testimonials-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full"
                >
                  <TestimonialsCarousel items={fetchedReviews} />
                </motion.div>
              ) : (
                <motion.p
                  key="testimonials-loading"
                  exit={{ opacity: 0 }}
                  className="text-center text-white/30 text-sm tracking-widest uppercase"
                >
                  Loading testimonials...
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            6. FINAL CTA — Pre-footer (3D Living Room Background)
            Animation plays only when user scrolls into this section.
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative z-10 min-h-[100dvh] flex flex-col justify-center overflow-hidden snap-start snap-always">

          {/* Solid black base — no gradient */}
          <div className="absolute inset-0 bg-black" />

          {/* 3D Living Room — triggered by IntersectionObserver inside component */}
          <Scene3DBackground />

          {/* Top Edge Gradient Transition — smoothly hides the section line */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black to-transparent pointer-events-none" style={{ zIndex: 6 }} />

          {/* Glass Overlay for Text Readability */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1.7px] pointer-events-none" style={{ zIndex: 5 }} />

          {/* Very faint ambient glows so they don't fight the 3D scene */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
            <div className="absolute top-0 left-1/4 w-[480px] h-[480px] bg-amber-800/8 rounded-full blur-[130px]" />
            <div className="absolute bottom-0 right-1/4 w-[480px] h-[480px] bg-blue-900/8 rounded-full blur-[130px]" />
          </div>

          {/* UI Content — always on top */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            viewport={{ once: true }}
            className="relative py-20 md:py-32 px-6 text-center max-w-2xl mx-auto"
            style={{ zIndex: 10 }}
          >
            <FaCalendarCheck className="text-4xl text-white/15 mx-auto mb-8" />
            <p className="text-[10px] tracking-[0.4em] uppercase text-white/30 mb-5">Take the First Step</p>
            <h2 className="text-4xl md:text-6xl font-serif text-white font-light leading-tight mb-6">
              Ready to Love<br />Where You Live?
            </h2>
            <p className="text-base text-white/45 leading-relaxed mb-10">
              Let's chat about your ideas. One conversation is all it takes to start transforming your space.
            </p>
            <Link
              to="/contact"
              className="inline-block px-10 py-4 text-xs font-bold tracking-[0.2em] uppercase rounded-full transition-all duration-300 active:translate-y-[2px]"
              style={{
                background: 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)',
                color: '#1f2937',
                boxShadow: 'inset 0 1px 3px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.2), 0 6px 8px rgba(0,0,0,0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 50%, #6b7280 100%)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)'}
            >
              Book Your Free Consultation
            </Link>
            <p className="mt-5 text-[10px] text-white/20 tracking-widest">No commitment. 100% free. 30 minutes.</p>
          </motion.div>

        </section>

      </div>
    </PageTransition>
  );
};

export default Home;