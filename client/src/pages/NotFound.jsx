import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

const NotFound = () => {
  return (
    <PageTransition>
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 bg-white text-black text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-8xl md:text-9xl font-black uppercase tracking-tighter mb-4"
        >
          404
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl font-bold uppercase tracking-widest text-gray-400 mb-12"
        >
          Page Not Found
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-sm"
        >
          <Link
            to="/"
            className="flex-1 py-4 bg-black text-white font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_#FFCE00] hover:shadow-none hover:translate-y-1 hover:translate-x-1 border-2 border-black"
          >
            Go Home
          </Link>
          <Link
            to="/login"
            className="flex-1 py-4 bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors shadow-[4px_4px_0px_#000000] hover:shadow-none hover:translate-y-1 hover:translate-x-1 border-2 border-black"
          >
            Log In
          </Link>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default NotFound;
