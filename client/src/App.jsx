import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import Lenis from 'lenis';


import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Public Pages
import Home from './pages/Home';
import Explorer from './pages/Explorer';
import Portfolio from './pages/Portfolio';
import Services from './pages/Services';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import MyBoard from './pages/MyBoard';
import Login from './pages/Login';
import SignUp from './pages/SignUp';

import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import LeadManager from './pages/admin/LeadManager';
import PortfolioCMS from './pages/admin/PortfolioCMS';
import ServicesEditor from './pages/admin/ServicesEditor';
import ApiHealth from './pages/admin/ApiHealth';
import LegalEditor from './pages/admin/LegalEditor';
import ReviewsManager from './pages/admin/ReviewsManager';
import VisionBoardManager from './pages/admin/VisionBoardManager';
import TrashManager from './pages/admin/TrashManager';

const isAdminRoute = (pathname) => pathname.startsWith('/admin');

function App() {
  const location = useLocation();
  const admin = isAdminRoute(location.pathname);

  useEffect(() => {
    if (admin) return;
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothTouch: false,
      touchMultiplier: 2,
    });
    window.lenis = lenis; // Expose globally for scroll restoration
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    const rafId = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(rafId); lenis.destroy(); delete window.lenis; };
  }, [admin]);

  // Handle scroll to top on navigation, but NOT on initial refresh/mount
  const lastPathname = useRef(location.pathname);
  useEffect(() => { 
    if (lastPathname.current !== location.pathname) {
      if (window.lenis) {
        window.lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo(0, 0); 
      }
      lastPathname.current = location.pathname;
    }
  }, [location.pathname]);

  // Handle document title updates
  useEffect(() => {
    const routeTitles = {
      '/': 'InteDesign | Home',
      '/explorer': 'InteDesign | AI Explorer',
      '/portfolio': 'InteDesign | Portfolio',
      '/services': 'InteDesign | Services',
      '/about': 'InteDesign | About',
      '/contact': 'InteDesign | Contact',
      '/my-board': 'InteDesign | Vision Board',
      '/login': 'InteDesign | Log In',
      '/signup': 'InteDesign | Sign Up',
      '/privacy': 'InteDesign | Privacy Policy',
      '/terms': 'InteDesign | Terms & Conditions',
      '/admin': 'InteDesign | Admin Dashboard',
    };
    
    // Find exact match or use default for admin sub-routes
    let title = routeTitles[location.pathname];
    if (!title && location.pathname.startsWith('/admin')) {
      title = 'InteDesign | Admin Dashboard';
    }
    
    document.title = title || 'InteDesign · Interior Design Studio';
  }, [location.pathname]);

  // ── Admin shell (no public nav/footer/3D) ─────────────────────────────────────────────────
  if (admin) {
    return (
      <Routes location={location} key={location.pathname}>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="leads" element={<LeadManager />} />
          <Route path="portfolio" element={<PortfolioCMS />} />
          <Route path="services" element={<ServicesEditor />} />
          <Route path="health" element={<ApiHealth />} />
          <Route path="legal" element={<LegalEditor />} />
          <Route path="reviews" element={<ReviewsManager />} />
          <Route path="visionboards" element={<VisionBoardManager />} />
          <Route path="trash" element={<TrashManager />} />
          <Route index element={<LeadManager />} />
        </Route>
      </Routes>
    );
  }

  // ── Public site ────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full min-h-screen bg-white text-black font-sans selection:bg-yellow-400 selection:text-black">

      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/my-board" element={<MyBoard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </AnimatePresence>
      <Footer />

    </div>
  );
}

export default App;
