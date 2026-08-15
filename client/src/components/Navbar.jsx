import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';

const navLinks = [
  { to: '/explorer', label: 'AI Explorer' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/services', label: 'Services' },
  { to: '/my-board', label: 'Vision Board' },
  { to: '/about', label: 'About' },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

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
      <nav className="fixed top-0 left-0 w-full z-[4100] px-4 md:px-8 py-3 flex justify-between items-center isolate">
        {/* Solid white background with black bottom border */}
        <div className="absolute inset-0 bg-white border-b-4 border-black -z-10" />

        <Link
          to="/"
          onClick={() => {
            if (location.pathname === '/') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="relative z-10 text-xl font-black tracking-tighter text-black uppercase"
        >
          InteDesign
        </Link>

        {/* Desktop Nav Links */}
        <div className="relative z-10 hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `relative text-[12px] font-bold tracking-widest uppercase transition-colors duration-200 pb-1 ${
                  isActive
                    ? 'text-black border-b-4 border-black'
                    : 'text-gray-500 hover:text-black border-b-4 border-transparent'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="relative z-10 hidden md:flex items-center gap-4">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="neopop-btn bg-white px-4 py-2 text-black hover:bg-gray-100 text-sm flex items-center gap-2"
              >
                Profile <span className="text-[10px]">▼</span>
              </button>
              
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-white border-4 border-black shadow-[4px_4px_0px_#000000] flex flex-col z-[5000]"
                  >
                    <div className="p-3 border-b-4 border-black bg-gray-50">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Logged in as</p>
                      <p className="text-sm font-black truncate">{user.fullName || user.email}</p>
                    </div>
                    {user.role === 'admin' ? (
                      <Link to="/admin" onClick={() => setProfileOpen(false)} className="p-3 font-bold uppercase text-xs hover:bg-yellow-200 border-b-4 border-black transition-colors block">
                        Admin Dashboard
                      </Link>
                    ) : (
                      <Link to="/my-board" onClick={() => setProfileOpen(false)} className="p-3 font-bold uppercase text-xs hover:bg-yellow-200 border-b-4 border-black transition-colors block">
                        My Vision Board
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); setProfileOpen(false); }}
                      className="p-3 text-left font-bold uppercase text-xs text-red-600 hover:bg-red-100 transition-colors w-full"
                    >
                      Log Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              state={{ from: location.pathname }}
              className="neopop-btn bg-white px-4 py-2 text-black hover:bg-gray-100 text-sm"
            >
              Log In
            </Link>
          )}
          
          <Link
            to="/contact"
            className="neopop-btn bg-yellow-400 px-4 py-2 text-black hover:bg-yellow-300 text-sm"
          >
            Book a Call
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="relative z-[120] flex md:hidden flex-col justify-center items-center w-12 h-12 gap-1.5 border-4 border-black bg-white shadow-[4px_4px_0px_#000000] active:translate-y-1 active:translate-x-1 active:shadow-none"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          <motion.span
            animate={menuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.2 }}
            className="block w-6 h-1 bg-black origin-center"
          />
          <motion.span
            animate={menuOpen ? { opacity: 0, x: 20 } : { opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="block w-6 h-1 bg-black"
          />
          <motion.span
            animate={menuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.2 }}
            className="block w-6 h-1 bg-black origin-center"
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
              className="absolute top-0 right-0 h-full w-[80vw] max-w-sm bg-white border-l-4 border-black shadow-[-8px_0px_0px_#000000] flex flex-col"
            >
              {/* Decorative Glows */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
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
                          `block py-4 border-b-4 border-black text-xl font-black uppercase transition-all ${
                            isActive ? 'text-black translate-x-2' : 'text-gray-500 hover:text-black'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <span className="flex items-center justify-between">
                            {link.label}
                            {isActive && (
                              <motion.span 
                                layoutId="active-dot"
                                className="w-4 h-4 bg-yellow-400 border-2 border-black shadow-[2px_2px_0px_#000000]" 
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
                    onClick={() => setMenuOpen(false)}
                    className="neopop-btn bg-yellow-400 w-full py-4 text-center text-black block"
                  >
                    Book Your Free Call
                  </Link>

                  {user ? (
                    <div className="border-4 border-black bg-gray-50 p-4">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Logged in as</p>
                      <p className="text-sm font-black truncate mb-4">{user.fullName || user.email}</p>
                      <div className="flex gap-2">
                        {user.role === 'admin' ? (
                          <Link to="/admin" onClick={() => setMenuOpen(false)} className="neopop-btn flex-1 bg-white border-2 border-black py-2 text-center text-xs font-black uppercase text-black hover:bg-yellow-200 shadow-[2px_2px_0px_#000000]">
                            Admin
                          </Link>
                        ) : (
                          <Link to="/my-board" onClick={() => setMenuOpen(false)} className="neopop-btn flex-1 bg-white border-2 border-black py-2 text-center text-xs font-black uppercase text-black hover:bg-yellow-200 shadow-[2px_2px_0px_#000000]">
                            Vision Board
                          </Link>
                        )}
                        <button
                          onClick={() => { logout(); setMenuOpen(false); }}
                          className="neopop-btn flex-1 bg-red-50 border-2 border-black py-2 text-center text-xs font-black uppercase text-red-600 hover:bg-red-100 shadow-[2px_2px_0px_#000000]"
                        >
                          Log Out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="neopop-btn bg-white border-4 border-black w-full py-4 text-center text-black block shadow-[4px_4px_0px_#000000] active:translate-y-1 active:translate-x-1 active:shadow-none"
                    >
                      Log In
                    </Link>
                  )}
                  
                  <div className="text-center">
                    <p className="text-sm font-black uppercase mb-1">Get in Touch</p>
                    <a href="mailto:hello@intedesign.studio" className="text-sm font-bold text-blue-600 underline hover:bg-yellow-200">
                      hello@intedesign.studio
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
