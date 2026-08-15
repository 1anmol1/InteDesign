import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaCheckCircle, FaTimesCircle, FaDatabase, FaImage, FaBrain } from 'react-icons/fa';
import { API_BASE_URL } from '../../constants';

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('intedesign_admin_token')}` },
});

const IndicatorRow = ({ icon: Icon, label, ok, description }) => (
  <div className="flex items-center justify-between py-4 border-b border-white/6 last:border-0">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ok ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
        <Icon className={`text-sm ${ok ? 'text-emerald-400' : 'text-red-400/60'}`} />
      </div>
      <div>
        <p className="text-sm text-white">{label}</p>
        <p className="text-[10px] text-white/30">{description}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {ok
        ? <><FaCheckCircle className="text-emerald-400 text-sm" /><span className="text-xs text-emerald-400">Connected</span></>
        : <><FaTimesCircle className="text-red-400/60 text-sm" /><span className="text-xs text-red-400/60">Not configured</span></>
      }
    </div>
  </div>
);

const ApiHealth = () => {
  const [health, setHealth] = useState(null);
  const [counts, setCounts] = useState({ leads: 0, projects: 0 });
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const [healthRes, leadsRes, projectsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/pinterest/health`),
        axios.get(`${API_BASE_URL}/api/admin/leads`, authHeader()),
        axios.get(`${API_BASE_URL}/api/admin/projects`, authHeader()),
      ]);
      setHealth(healthRes.data);
      setCounts({ leads: leadsRes.data.length, projects: projectsRes.data.length });
      setLastChecked(new Date());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHealth(); }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif text-white">API Health</h1>
          <p className="text-xs text-white/30 mt-1">
            {lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : 'Checking…'}
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="px-5 py-2 text-xs tracking-widests uppercase border border-white/15 text-white/40 hover:border-white/30 hover:text-white/70 rounded-full transition-all disabled:opacity-40"
        >
          {loading ? 'Checking…' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Leads', value: counts.leads, sub: 'All time' },
          { label: 'Portfolio Projects', value: counts.projects, sub: 'Live on site' },
          { label: 'MongoDB', value: health?.mongodb === 'connected' ? '●' : '○', sub: health?.mongodb || '—' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/4 border border-white/8 rounded-2xl p-6"
          >
            <p className={`font-serif mb-1 ${stat.label === 'MongoDB' ? (health?.mongodb === 'connected' ? 'text-2xl text-emerald-400' : 'text-2xl text-red-400/60') : 'text-3xl text-white'}`}>
              {loading ? '—' : stat.value}
            </p>
            <p className="text-xs text-white">{stat.label}</p>
            <p className="text-[10px] text-white/25">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white/4 border border-white/8 rounded-2xl p-6">
        <p className="text-xs tracking-widests uppercase text-white/30 mb-4">Service Connections</p>
        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />)}</div>
        ) : health ? (
          <>
            <IndicatorRow icon={FaImage} label="Unsplash API" ok={health.unsplash} description="Powers the AI Style Explorer image results" />
            <IndicatorRow icon={FaBrain} label="Gemini AI" ok={health.gemini} description="Keyword extraction + architecture chat assistant" />
            <IndicatorRow icon={FaDatabase} label="MongoDB Database" ok={health.mongodb === 'connected'} description={`Status: ${health.mongodb}`} />
          </>
        ) : (
          <p className="text-sm text-white/30">Unable to fetch health data.</p>
        )}
      </div>
    </div>
  );
};

export default ApiHealth;
