import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const navLinks = [
  { to: '/explorer', label: 'AI Explorer' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/services', label: 'Services' },
  { to: '/my-board', label: 'Vision Board' },
  { to: '/about', label: 'About' },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-[4100] px-6 md:px-10 py-5 flex justify-between items-center isolate">
        {/* Frosted glass background */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-md border-b border-white/5 -z-10" />

        <Link
          to="/"
          onClick={() => {
            if (location.pathname === '/') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="relative z-10 text-xl font-serif font-bold tracking-[0.3em] text-white uppercase"
        >
          Phantasia
        </Link>

        {/* Desktop Nav Links */}
        <div className="relative z-10 hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `relative text-[11px] font-light tracking-[0.2em] uppercase transition-colors duration-300 pb-1 ${
                  isActive
                    ? 'text-white border-b border-white'
                    : 'text-white/50 hover:text-white/90 border-b border-transparent'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop CTA */}
        <Link
          to="/contact"
          className="relative z-10 hidden md:block text-[10px] font-bold tracking-[0.2em] uppercase px-6 py-2.5 rounded-full transition-all duration-300 active:translate-y-[1px] blur-optimized"
          style={{
            background: 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)',
            color: '#1f2937',
            boxShadow: 'inset 0 1px 3px rgba(255,255,255,1), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 6px rgba(0,0,0,0.3)',
            willChange: 'backdrop-filter, transform'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 50%, #6b7280 100%)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)'}
        >
          Book a Call
        </Link>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="relative z-[120] flex md:hidden flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm blur-optimized"
          style={{ willChange: 'transform, backdrop-filter' }}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          <motion.span
            animate={menuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="block w-4 h-[1px] bg-white origin-center"
          />
          <motion.span
            animate={menuOpen ? { opacity: 0, x: 20 } : { opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="block w-4 h-[1px] bg-white"
          />
          <motion.span
            animate={menuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="block w-4 h-[1px] bg-white origin-center"
          />
        </button>
      </nav>

      {/* Mobile Fullscreen Menu */}
      <AnimatePresence mode="wait">
        {menuOpen && (
          <motion.div
            key="mobile-nav-root"
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-[4000] md:hidden"
          >
            {/* Backdrop */}
            <motion.div
              variants={{
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 }
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setMenuOpen(false)}
            />

            {/* Slide-in panel */}
            <motion.div
              variants={{
                initial: { x: '100%' },
                animate: { x: 0 },
                exit: { x: '100%' }
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-full w-[80vw] max-w-sm bg-[#000000]/95 backdrop-blur-2xl border-l border-white/10 flex flex-col"
            >
              {/* Decorative Glows */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[40%] bg-purple-600/10 blur-[100px] rounded-full" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[40%] bg-cyan-600/10 blur-[100px] rounded-full" />
              </div>

              <div className="relative z-10 flex flex-col h-full px-10 pt-32 pb-12">
                <nav className="flex-1 space-y-2">
                  {navLinks.map((link, i) => (
                    <motion.div
                      key={link.to}
                      variants={{
                        initial: { opacity: 0, x: 20 },
                        animate: { opacity: 1, x: 0 },
                        exit: { opacity: 0, x: 20 }
                      }}
                      transition={{ delay: 0.1 + (i * 0.05) }}
                    >
                      <NavLink
                        to={link.to}
                        end={link.to === '/'}
                        className={({ isActive }) =>
                          `block py-4 border-b border-white/5 text-sm font-serif tracking-[0.15em] uppercase transition-all ${
                            isActive ? 'text-white translate-x-1' : 'text-white/40 hover:text-white/80'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <span className="flex items-center justify-between">
                            {link.label}
                            {isActive && (
                              <motion.span 
                                layoutId="active-dot"
                                className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                              />
                            )}
                          </span>
                        )}
                      </NavLink>
                    </motion.div>
                  ))}
                </nav>

                <motion.div
                  variants={{
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    exit: { opacity: 0, y: 20 }
                  }}
                  transition={{ delay: 0.4 }}
                  className="mt-auto space-y-6"
                >
                  <Link
                    to="/contact"
                    className="flex items-center justify-center w-full py-4 text-[11px] font-bold tracking-[0.2em] uppercase rounded-full transition-all active:translate-y-[2px]"
                    style={{
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)',
                      color: '#1f2937',
                      boxShadow: 'inset 0 1px 3px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.2), 0 6px 8px rgba(0,0,0,0.3)'
                    }}
                  >
                    Book Your Free Call
                  </Link>
                  <div className="text-center">
                    <p className="text-[9px] text-white/20 tracking-[0.3em] uppercase mb-1">Get in Touch</p>
                    <a href="mailto:hello@phantasia.studio" className="text-[11px] text-white/40 hover:text-white transition-colors tracking-widest">
                      hello@phantasia.studio
                    </a>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
