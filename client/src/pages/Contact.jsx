import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaInstagram, FaPinterest, FaLinkedinIn } from 'react-icons/fa';
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
    visionBoardCode: localStorage.getItem('intedesign_last_board_code') || ''
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
      localStorage.removeItem('intedesign_last_board_code');
      setForm({ name: '', email: '', phone: '', roomType: '', servicePackage: '', message: '', visionBoardCode: '' });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.error || 'Submission failed. Please try again.');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen pt-32 pb-24 px-6 md:px-16 z-10 relative bg-white">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-sm font-black uppercase text-black inline-block border-b-2 border-black mb-4">Let's Talk</p>
          <h1 className="text-5xl md:text-7xl font-black text-black uppercase tracking-tighter">Contact</h1>
          <div className="w-16 h-2 bg-black mx-auto mt-6" />
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
              <h2 className="text-3xl md:text-4xl font-black text-black uppercase tracking-tighter mb-4">Book a Free Discovery Call</h2>
              <p className="text-base md:text-lg font-bold text-gray-800 leading-relaxed">
                Not sure where to start? Reach out and we'll set up a free 30-minute call to explore your vision, budget, and timeline together.
              </p>
            </div>



            <div>
              <p className="text-xs font-black uppercase text-black inline-block border-b-2 border-black mb-4">Follow the Studio</p>
              <div className="flex gap-4">
                {[{ icon: FaInstagram, label: 'Instagram' }, { icon: FaPinterest, label: 'Pinterest' }, { icon: FaLinkedinIn, label: 'LinkedIn' }].map(({ icon: Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="w-12 h-12 bg-white border-4 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-center text-black hover:bg-yellow-400 hover:shadow-none active:translate-y-1 transition-all"
                  >
                    <Icon className="text-xl" />
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
                className="neopop-card bg-yellow-400 p-12 text-center"
              >
                <div className="text-6xl mb-5 text-black">✦</div>
                <h3 className="text-4xl font-black text-black uppercase tracking-tighter mb-4">Message Received</h3>
                <p className="text-lg font-bold text-gray-800">Thank you for reaching out. We'll be in touch within 24 hours to schedule your discovery call.</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-8 neopop-btn bg-white px-8 py-3 text-black text-sm"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-black uppercase text-black block mb-2">Name *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className={`w-full bg-white border-4 ${validationErrors.name ? 'border-red-500' : 'border-black'} px-4 py-3 text-sm font-bold text-black placeholder-gray-400 focus:outline-none focus:bg-gray-100 transition-colors shadow-[2px_2px_0px_#000000]`}
                    />
                    {validationErrors.name && <p className="text-xs font-bold text-red-500 mt-2">{validationErrors.name}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase text-black block mb-2">Email *</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className={`w-full bg-white border-4 ${validationErrors.email ? 'border-red-500' : 'border-black'} px-4 py-3 text-sm font-bold text-black placeholder-gray-400 focus:outline-none focus:bg-gray-100 transition-colors shadow-[2px_2px_0px_#000000]`}
                    />
                    {validationErrors.email && <p className="text-xs font-bold text-red-500 mt-2">{validationErrors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-black uppercase text-black block mb-2">Phone (Optional)</label>
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full bg-white border-4 border-black px-4 py-3 text-sm font-bold text-black placeholder-gray-400 focus:outline-none focus:bg-gray-100 transition-colors shadow-[2px_2px_0px_#000000]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase text-black block mb-2">Room / Project Type</label>
                    <select
                      name="roomType"
                      value={form.roomType}
                      onChange={handleChange}
                      className="w-full bg-white border-4 border-black px-4 py-3 text-sm font-bold text-black focus:outline-none focus:bg-gray-100 transition-colors appearance-none shadow-[2px_2px_0px_#000000]"
                    >
                      <option value="">Select a type…</option>
                      {roomTypes.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-black block mb-2">Vision Board Code (Optional)</label>
                  <input
                    name="visionBoardCode"
                    value={form.visionBoardCode}
                    onChange={handleChange}
                    placeholder="e.g. PH-XXXXXX"
                    className="w-full bg-white border-4 border-black px-4 py-3 text-sm font-bold text-black placeholder-gray-400 focus:outline-none focus:bg-gray-100 transition-colors shadow-[2px_2px_0px_#000000]"
                  />
                  <p className="text-xs font-bold text-gray-500 mt-2">If you've downloaded a vision board, enter its code here to share it with us.</p>
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-black block mb-2">Service of Interest</label>
                  <select
                    name="servicePackage"
                    value={form.servicePackage}
                    onChange={handleChange}
                    className="w-full bg-white border-4 border-black px-4 py-3 text-sm font-bold text-black focus:outline-none focus:bg-gray-100 transition-colors appearance-none shadow-[2px_2px_0px_#000000]"
                  >
                    <option value="">Select a package…</option>
                    {servicePackages.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-black block mb-2">Message *</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us about your space, vision, and timeline…"
                    rows={6}
                    className={`w-full bg-white border-4 ${validationErrors.message ? 'border-red-500' : 'border-black'} px-4 py-3 text-sm font-bold text-black placeholder-gray-400 focus:outline-none focus:bg-gray-100 transition-colors resize-none shadow-[2px_2px_0px_#000000]`}
                  />
                  {validationErrors.message && <p className="text-xs font-bold text-red-500 mt-2">{validationErrors.message}</p>}
                </div>

                {status === 'error' && (
                  <p className="text-sm font-bold text-red-500">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full neopop-btn bg-black text-white px-8 py-4 text-center disabled:opacity-50 shadow-[4px_4px_0px_#FFCE00] hover:shadow-none hover:bg-gray-800 hover:translate-y-1 hover:translate-x-1"
                >
                  {status === 'loading' ? 'Sending…' : 'Send Message →'}
                </button>

                <p className="text-xs font-bold text-gray-500 text-center tracking-wide uppercase">We respond within 24 hours. No spam, ever.</p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Contact;
