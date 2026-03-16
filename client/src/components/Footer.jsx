import { Link } from 'react-router-dom';
import { FaInstagram, FaPinterest, FaLinkedinIn } from 'react-icons/fa';
import BrandkritAttribution from './BrandkritAttribution';

const footerLinks = [
  { to: '/', label: 'Home' },
  { to: '/explorer', label: 'AI Explorer' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const Footer = () => {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/30 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-10 text-left">
          {/* Brand */}
          <div>
            <p className="text-2xl font-serif font-bold text-white tracking-[0.3em] uppercase mb-3">Phantasia</p>
            <p className="text-xs text-white/40 leading-relaxed tracking-wide max-w-xs">
              Turning spaces into stories. Interior design that speaks to the soul.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/30 mb-4">Navigation</p>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-xs text-white/50 hover:text-white transition-colors tracking-widest uppercase"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/30 mb-4">Follow the Vision</p>
            <div className="flex gap-4 mb-6 justify-start">
              <a href="#" className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 transition-all">
                <FaInstagram className="text-sm" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 transition-all">
                <FaPinterest className="text-sm" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 transition-all">
                <FaLinkedinIn className="text-sm" />
              </a>
            </div>
            <p className="text-[10px] text-white/20 uppercase tracking-widest leading-relaxed">
              Pune, Maharashtra, India
            </p>
            <div className="space-y-1">
              <a
                href="mailto:hello@phantasia.studio"
                className="block text-xs text-white/40 hover:text-white transition-colors"
              >
                hello@phantasia.studio
              </a>
              <a
                href="tel:+919172464639"
                className="block text-xs text-white/40 hover:text-white transition-colors"
              >
                +91 91724 64639
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-[10px] text-white/20 tracking-widest uppercase">
          <span>© 2026 Phantasia. All rights reserved.</span>
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center w-full md:w-auto">
            <div className="flex flex-wrap gap-x-6 gap-y-2 items-center">
              <Link to="/privacy-policy" className="hover:text-white/50 transition-colors">Privacy Policy</Link>
              <Link to="/terms-and-conditions" className="hover:text-white/50 transition-colors">Terms & Conditions</Link>
            </div>
            <BrandkritAttribution width="60" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
