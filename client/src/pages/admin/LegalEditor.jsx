import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';

const DOCS = [
  { key: 'privacy_policy', label: 'Privacy Policy' },
  { key: 'terms_conditions', label: 'Terms & Conditions' },
];

const BASE = `${API_BASE_URL}/api/admin/legal`;
const token = () => localStorage.getItem('intedesign_admin_token');

const DocEditor = ({ docKey, label }) => {
  const [html, setHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState('');
  const [status, setStatus] = useState('idle'); // idle | success | error
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BASE}/${docKey}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((res) => { 
        setHtml(res.data.htmlContent || ''); 
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [docKey]);

  const handleSave = async () => {
    setSaving(true);
    setStatus('idle');
    try {
      const res = await axios.put(
        `${BASE}/${docKey}`,
        { htmlContent: html },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      setStatus('success');
      setSavedAt(new Date(res.data.updatedAt).toLocaleTimeString('en-IN'));
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <h3 className="text-sm font-serif text-white">{label}</h3>
        <div className="flex items-center gap-4">
          {status === 'success' && (
            <span className="text-[10px] text-green-400/70">Saved at {savedAt}</span>
          )}
          {status === 'error' && (
            <span className="text-[10px] text-red-400/70">Save failed</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full text-[11px] tracking-widest uppercase text-white hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save Updates'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-white/5 rounded animate-pulse" style={{ width: `${60 + i * 8}%` }} />
          ))}
        </div>
      ) : (
        <div className="p-6 bg-black/20">
          <label className="text-[9px] tracking-widest uppercase text-white/20 block mb-2">Editor (HTML Allowed)</label>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            className="w-full min-h-[400px] bg-transparent border border-white/10 rounded-xl p-6 text-white/70 text-sm font-mono leading-relaxed focus:outline-none focus:border-purple-500/30 transition-colors resize-y"
            placeholder="Enter document content here..."
          />
        </div>
      )}
    </div>
  );
};

const LegalEditor = () => {
  const [activeTab, setActiveTab] = useState('privacy_policy');

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-1">Admin</p>
        <h1 className="text-2xl font-serif text-white font-light">Legal Documents</h1>
        <p className="text-xs text-white/30 mt-2">
          Changes are saved to the database and immediately reflected on the public site.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {DOCS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-5 py-2 rounded-full text-[11px] tracking-widest uppercase transition-all ${activeTab === key
              ? 'bg-white/12 text-white border border-white/20'
              : 'text-white/35 hover:text-white/70 border border-transparent'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {DOCS.filter(({ key }) => key === activeTab).map(({ key, label }) => (
        <DocEditor key={key} docKey={key} label={label} />
      ))}
    </div>
  );
};

export default LegalEditor;
