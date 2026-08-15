import { Link } from 'react-router-dom';
import { FaInstagram, FaPinterest, FaLinkedinIn } from 'react-icons/fa';

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
    <footer className="relative z-10 border-t-4 border-black bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-10 text-left">
          {/* Brand */}
          <div>
            <p className="text-4xl font-black text-white tracking-tighter uppercase mb-3">InteDesign</p>
            <p className="text-sm text-gray-300 font-bold leading-relaxed tracking-wide max-w-xs">
              Turning spaces into stories. Interior design that speaks to the soul.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-lg font-black uppercase text-white mb-4 border-b-2 border-white inline-block">Navigation</p>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm font-bold text-gray-300 hover:text-yellow-400 transition-colors uppercase hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <p className="text-lg font-black uppercase text-white mb-4 border-b-2 border-white inline-block">Follow the Vision</p>
            <div className="flex gap-4 mb-6 justify-start">
              <a href="#" className="w-10 h-10 border-4 border-white bg-yellow-400 flex items-center justify-center text-black hover:bg-yellow-300 shadow-[2px_2px_0px_#FFFFFF] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all">
                <FaInstagram className="text-lg" />
              </a>
              <a href="#" className="w-10 h-10 border-4 border-white bg-blue-400 flex items-center justify-center text-black hover:bg-blue-300 shadow-[2px_2px_0px_#FFFFFF] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all">
                <FaPinterest className="text-lg" />
              </a>
              <a href="#" className="w-10 h-10 border-4 border-white bg-pink-400 flex items-center justify-center text-black hover:bg-pink-300 shadow-[2px_2px_0px_#FFFFFF] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all">
                <FaLinkedinIn className="text-lg" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t-4 border-white pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-xs font-bold text-white uppercase">
          <span>© 2026 InteDesign. All rights reserved.</span>
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center w-full md:w-auto">
            <div className="flex flex-wrap gap-x-6 gap-y-2 items-center">
              <Link to="/privacy" className="hover:text-yellow-400 hover:underline transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-yellow-400 hover:underline transition-colors">Terms & Conditions</Link>
            </div>
            <span className="text-gray-400 whitespace-nowrap">
              Designed and Developed by <a href="https://anmol-patil-portfolio.vercel.app" target="_blank" rel="noopener noreferrer" className="text-white hover:text-yellow-400 hover:underline transition-colors">Anmol Patil</a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
