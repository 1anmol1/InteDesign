import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

const PageTransition = ({ children }) => {
  const location = useLocation();

  const hasVisited = useMemo(() => {
    const visitedKey = `visited_${location.pathname}`;
    if (!sessionStorage.getItem(visitedKey)) {
      sessionStorage.setItem(visitedKey, 'true');
      return false;
    }
    return true;
  }, [location.pathname]);

  return (
    <motion.div
      initial={hasVisited ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
