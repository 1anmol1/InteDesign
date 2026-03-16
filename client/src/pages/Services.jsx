import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaArrowRight, FaStar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
import PageTransition from '../components/PageTransition';

const FALLBACK_SERVICES = [
  { _id: '2', title: 'Virtual E-Design', price: 'From ₹1,20,000', description: "Get a complete design package delivered digitally, perfect for those who want a designer's eye without full-service commitment.", features: ['AI-curated mood board', 'Full floor plan & layout', 'Shopping list with direct links', '2 rounds of revisions', 'Implementation guide'], accent: 'from-cyan-600/20 to-transparent' },
  { _id: '1', title: 'Full-Service Remodel', price: 'From ₹8,00,000', description: 'End-to-end interior transformation. We handle every detail from concept to final install.', features: ['Full space planning & 3D renders', 'Contractor coordination', 'Furniture & material sourcing', 'On-site installation oversight', 'Final styling & reveal'], accent: 'from-purple-600/20 to-transparent', isPopular: true },
  { _id: '3', title: 'Color Consultation', price: 'From ₹35,000', description: 'A focused 90-minute session to find your perfect palette.', features: ['90-minute virtual session', 'Custom color palette deck', 'Paint brand & code recommendations', 'Before/after visualization', 'Follow-up Q&A email'], accent: 'from-amber-600/20 to-transparent' },
];

const ServiceCard = ({ service, index }) => {
  const navigate = useNavigate();

  const handleBook = (e) => {
    e.stopPropagation();
    navigate(`/contact?service=${encodeURIComponent(service.title)}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.32, 0.72, 0, 1] }}
      whileHover={{ 
        scale: 1.02, 
        y: -5,
        transition: { duration: 0.2, ease: "easeOut" } 
      }}
      className={`relative flex flex-col h-full w-full bg-gradient-to-b ${service.accent || 'from-white/5 to-transparent'} border rounded-[2rem] p-8 overflow-hidden ${
        service.isPopular 
          ? 'border-purple-500/40 ring-2 ring-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)] bg-purple-900/10' 
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {service.isPopular && (
        <div className="absolute top-5 right-7 bg-purple-500 text-white text-[9px] tracking-[0.2em] font-bold uppercase px-3 py-1 rounded-full shadow-lg shadow-purple-500/20 flex items-center gap-1.5 z-10">
          <FaStar className="text-[8px]" /> Signature 
        </div>
      )}

      <div className="flex flex-col mb-6">
        <span className="text-[10px] tracking-[0.3em] font-medium uppercase text-white/30 mb-2">{service.price}</span>
        <h3 className="text-2xl md:text-3xl font-serif text-white font-medium">{service.title}</h3>
      </div>

      <p className="text-sm text-white/50 leading-relaxed mb-6">
        {service.description}
      </p>

      <div className="w-full h-[1px] bg-white/10 mb-6" />
      
      <div className="flex-1">
        <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-4 font-bold">Deliverables & Process</p>
        <ul className="space-y-3.5 mb-10">
          {(service.features || []).map((f, fi) => (
            <motion.li 
              key={fi} 
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: fi * 0.05 + 0.2 }}
              className="flex items-start gap-3.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50 mt-1.5 flex-shrink-0" />
              <span className="text-xs text-white/60 leading-relaxed">{f}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleBook}
        className="w-full py-4 text-[11px] font-bold tracking-[0.25em] uppercase rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group/btn"
        style={{
          background: service.isPopular 
            ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' 
            : 'rgba(255,255,255,0.06)',
          color: 'white',
          border: service.isPopular ? 'none' : '1px solid rgba(255,255,255,0.15)',
          boxShadow: service.isPopular ? '0 8px 20px -6px rgba(124,58,237,0.5)' : 'none'
        }}
      >
        Book This Service <FaArrowRight className="text-[10px] transition-transform duration-300 group-hover/btn:translate-x-1" />
      </button>
    </motion.div>
  );
};

const FaArrowDown = ({ className }) => (
  <svg className={className} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
  </svg>
);

const Services = () => {
  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/api/services`);
      return res.data.length > 0 ? res.data : FALLBACK_SERVICES;
    },
    initialData: FALLBACK_SERVICES,
  });

  return (
    <PageTransition>
      <div className="min-h-screen pt-32 pb-24 px-6 md:px-16 z-10 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[150px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/5 blur-[150px] -z-10" />

        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} 
          className="text-center mb-24"
        >
          <p className="text-[11px] tracking-[0.4em] uppercase text-white/30 mb-4 font-bold">Luxury Design Solutions</p>
          <h1 className="text-5xl md:text-8xl font-serif text-white font-medium tracking-tight">Services</h1>
          <div className="w-20 h-[1.5px] bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mt-10" />
        </motion.div>

        {/* Dynamic Grid */}
        <div className="max-w-7xl mx-auto">
          {isLoading && !services ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-[400px] bg-white/5 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {services.map((s, i) => (
                <ServiceCard key={s._id} service={s} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Consultation Prompt */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 max-w-4xl mx-auto rounded-[2.5rem] bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 p-12 md:p-20 text-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-serif text-white mb-6 font-light">Not sure which path to take?</h2>
          <p className="text-white/40 text-sm md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Every home is unique. Book a complimentary discovery session to discuss your specific needs and create a bespoke design strategy.
          </p>
          <button
            onClick={() => window.location.href = '/contact'}
            className="px-12 py-5 bg-white text-black text-[11px] font-bold tracking-[0.3em] uppercase rounded-full hover:scale-105 transition-all duration-300 shadow-xl shadow-white/5"
          >
            Schedule Free Call →
          </button>
        </motion.div>

        {/* 4-Step Process - Refactored for better mobile display */}
        <div className="mt-32 text-center opacity-40 px-4">
           <p className="text-[10px] tracking-widest uppercase mb-10">The Phantasia Signature Process</p>
           <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12">
              {['01. Discovery', '02. Curation', '03. Execution', '04. The Reveal'].map(step => (
                <span key={step} className="whitespace-nowrap font-serif italic text-xl md:text-lg">{step}</span>
              ))}
           </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Services;
