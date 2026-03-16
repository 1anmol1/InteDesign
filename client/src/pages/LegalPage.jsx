import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
import PageTransition from '../components/PageTransition';

const LegalPage = ({ docKey }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    axios
      .get(`${API_BASE_URL}/api/legal/${docKey}`)
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load document. Please try again later.'))
      .finally(() => setLoading(false));
  }, [docKey]);

  const formatted = data?.updatedAt
    ? new Date(data.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <PageTransition>
      <div className="min-h-screen pt-32 pb-24 px-6 md:px-16 z-10 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-[10px] tracking-[0.35em] uppercase text-white/30 mb-3">Phantasia Studio</p>
          {loading ? (
            <div className="h-12 w-64 mx-auto bg-white/5 rounded-xl animate-pulse" />
          ) : (
            <h1 className="text-4xl md:text-6xl font-serif text-white font-medium">{data?.title || 'Legal'}</h1>
          )}
          <div className="w-16 h-[1px] bg-white/20 mx-auto mt-6" />
          {formatted && (
            <p className="text-[10px] text-white/25 tracking-widest uppercase mt-4">Last updated: {formatted}</p>
          )}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          {loading && (
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-4 bg-white/5 rounded animate-pulse"
                  style={{ width: `${70 + Math.random() * 30}%` }}
                />
              ))}
            </div>
          )}

          {error && (
            <p className="text-center text-red-400/70 text-sm py-20">{error}</p>
          )}

          {!loading && !error && data && (
            <div
              className="prose prose-invert prose-sm max-w-none 
                [&_h2]:text-2xl [&_h2]:font-serif [&_h2]:text-white [&_h2]:font-light [&_h2]:mb-4 [&_h2]:mt-10
                [&_h3]:text-lg [&_h3]:font-serif [&_h3]:text-white/80 [&_h3]:font-light [&_h3]:mb-3 [&_h3]:mt-8
                [&_p]:text-white/50 [&_p]:leading-relaxed [&_p]:mb-4
                [&_ul]:text-white/50 [&_ul]:space-y-2 [&_ul]:mb-4
                [&_li]:leading-relaxed
                [&_strong]:text-white/70
                [&_a]:text-purple-400 [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: data.htmlContent }}
            />
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default LegalPage;
