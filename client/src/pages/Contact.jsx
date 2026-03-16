import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaInstagram, FaPinterest, FaLinkedinIn, FaEnvelope } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
import PageTransition from '../components/PageTransition';

const roomTypes = [
  'Living Room', 'Kitchen', 'Bedroom', 'Bathroom',
  'Home Office', 'Commercial / Office', 'Full Home', 'Other',
];

const servicePackages = [
  'Full-Service Remodel', 'Virtual E-Design', 'Color Consultation', 'Other / Bespoke'
];

const Contact = () => {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    roomType: '', 
    servicePackage: searchParams.get('service') || '',
    message: '',
    visionBoardCode: localStorage.getItem('phantasia_last_board_code') || ''
  });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const service = searchParams.get('service');
    if (service) {
      setForm(prev => ({ ...prev, servicePackage: service }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear the specific field error when user starts typing
    if (validationErrors[e.target.name]) {
      setValidationErrors((prev) => ({ ...prev, [e.target.name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) errs.email = 'Valid email is required';
    if (!form.message.trim()) errs.message = 'Message is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs);
      return;
    }
    
    setValidationErrors({});
    setStatus('loading');
    setErrorMsg('');

    try {
      await axios.post(`${API_BASE_URL}/api/contact`, form);
      setStatus('success');
      // Clear last board code after successful inquiry
      localStorage.removeItem('phantasia_last_board_code');
      setForm({ name: '', email: '', phone: '', roomType: '', servicePackage: '', message: '', visionBoardCode: '' });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.error || 'Submission failed. Please try again.');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen pt-32 pb-24 px-6 md:px-16 z-10 relative">

        {/* Header */}
        <motion.div
// ... skipping some code here to keep snippet concise, will just provide the full replace for safety
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-[10px] tracking-[0.35em] uppercase text-white/30 mb-3">Let's Talk</p>
          <h1 className="text-5xl md:text-7xl font-serif text-white font-medium">Contact</h1>
          <div className="w-16 h-[1px] bg-white/20 mx-auto mt-6" />
        </motion.div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-16 items-start">

          {/* Left: Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="md:col-span-2 space-y-10"
          >
            <div>
              <h2 className="text-2xl font-serif text-white font-light mb-4">Book a Free Discovery Call</h2>
              <p className="text-sm text-white/50 leading-relaxed">
                Not sure where to start? Reach out and we'll set up a free 30-minute call to explore your vision, budget, and timeline together.
              </p>
            </div>

            <div className="space-y-4">
              <a href="mailto:hello@phantasia.studio" className="flex items-center gap-3 text-sm text-white/50 hover:text-white transition-colors group">
                <div className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center group-hover:border-white/40 transition-colors">
                  <FaEnvelope className="text-xs" />
                </div>
                hello@phantasia.studio
              </a>
              <a href="tel:+919172464639" className="flex items-center gap-3 text-sm text-white/50 hover:text-white transition-colors group">
                <div className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center group-hover:border-white/40 transition-colors">
                  <span className="text-[10px] font-bold">📞</span>
                </div>
                +91 91724 64639
              </a>
              <div className="flex items-center gap-3 text-xs text-white/20 tracking-widest uppercase pl-11">
                Pune, Maharashtra, India
              </div>
            </div>

            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-white/25 mb-4">Follow the Studio</p>
              <div className="flex gap-3">
                {[{ icon: FaInstagram, label: 'Instagram' }, { icon: FaPinterest, label: 'Pinterest' }, { icon: FaLinkedinIn, label: 'LinkedIn' }].map(({ icon: Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/50 transition-all"
                  >
                    <Icon className="text-sm" />
                  </a>
                ))}
              </div>
            </div>

          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="md:col-span-3"
          >
            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center"
              >
                <div className="text-5xl mb-5">✦</div>
                <h3 className="text-2xl font-serif text-white mb-3">Message Received</h3>
                <p className="text-sm text-white/50">Thank you for reaching out. We'll be in touch within 24 hours to schedule your discovery call.</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-8 text-xs tracking-widest uppercase text-white/40 hover:text-white border-b border-white/20 hover:border-white pb-1 transition-all"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[10px] tracking-widest uppercase text-white/30 block mb-2">Name *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className={`w-full bg-white/5 border ${validationErrors.name ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors`}
                    />
                    {validationErrors.name && <p className="text-[10px] text-red-500 mt-1.5">{validationErrors.name}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] tracking-widest uppercase text-white/30 block mb-2">Email *</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className={`w-full bg-white/5 border ${validationErrors.email ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors`}
                    />
                    {validationErrors.email && <p className="text-[10px] text-red-500 mt-1.5">{validationErrors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[10px] tracking-widest uppercase text-white/30 block mb-2">Phone (Optional)</label>
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] tracking-widest uppercase text-white/30 block mb-2">Room / Project Type</label>
                    <select
                      name="roomType"
                      value={form.roomType}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 focus:outline-none focus:border-white/30 transition-colors appearance-none"
                    >
                      <option value="" className="bg-[#000000]">Select a type…</option>
                      {roomTypes.map((r) => (
                        <option key={r} value={r} className="bg-[#000000]">{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] tracking-widest uppercase text-white/30 block mb-2">Vision Board Code (Optional)</label>
                  <input
                    name="visionBoardCode"
                    value={form.visionBoardCode}
                    onChange={handleChange}
                    placeholder="e.g. PH-XXXXXX"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                  />
                  <p className="text-[9px] text-white/20 mt-1.5 px-1">If you've downloaded a vision board, enter its code here to share it with us.</p>
                </div>

                <div>
                  <label className="text-[10px] tracking-widest uppercase text-white/30 block mb-2">Service of Interest</label>
                  <select
                    name="servicePackage"
                    value={form.servicePackage}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 focus:outline-none focus:border-white/30 transition-colors appearance-none"
                  >
                    <option value="" className="bg-[#000000]">Select a package…</option>
                    {servicePackages.map((s) => (
                      <option key={s} value={s} className="bg-[#000000]">{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] tracking-widest uppercase text-white/30 block mb-2">Message *</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us about your space, vision, and timeline…"
                    rows={6}
                    className={`w-full bg-white/5 border ${validationErrors.message ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none`}
                  />
                  {validationErrors.message && <p className="text-[10px] text-red-500 mt-1.5">{validationErrors.message}</p>}
                </div>

                {status === 'error' && (
                  <p className="text-sm text-red-400/70">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-4 text-xs font-bold tracking-[0.2em] uppercase rounded-xl transition-all duration-300 active:translate-y-[2px] disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)',
                    color: '#1f2937',
                    boxShadow: 'inset 0 1px 3px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.2), 0 6px 8px rgba(0,0,0,0.3)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 50%, #6b7280 100%)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #d1d5db 50%, #9ca3af 100%)'}
                >
                  {status === 'loading' ? 'Sending…' : 'Send Message →'}
                </button>

                <p className="text-[10px] text-white/20 text-center tracking-wide">We respond within 24 hours. No spam, ever.</p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Contact;
