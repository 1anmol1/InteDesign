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
      className={`relative flex flex-col h-full w-full border-4 border-black p-8 neopop-card shadow-[8px_8px_0px_#000000] ${
        service.isPopular 
          ? 'bg-pink-400 text-black' 
          : 'bg-white text-black'
      }`}
    >
      {service.isPopular && (
        <div className="absolute top-5 right-7 bg-yellow-400 text-black text-xs tracking-widest font-black uppercase px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 z-10">
          <FaStar className="text-[10px]" /> Signature 
        </div>
      )}

      <div className="flex flex-col mb-6">
        <span className="text-xs font-black tracking-widest uppercase text-black mb-2 inline-block bg-yellow-400 w-max px-2 border-2 border-black shadow-[2px_2px_0px_#000000]">{service.price}</span>
        <h3 className="text-3xl md:text-4xl font-black text-black uppercase tracking-tighter mt-2">{service.title}</h3>
      </div>

      <p className="text-sm font-bold text-gray-800 leading-relaxed mb-6">
        {service.description}
      </p>

      <div className="w-full h-1 bg-black mb-6" />
      
      <div className="flex-1">
        <p className="text-sm font-black uppercase text-black border-b-2 border-black inline-block mb-4">Deliverables & Process</p>
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
              <div className="w-2 h-2 border-2 border-black bg-white mt-1 flex-shrink-0" />
              <span className="text-xs font-bold text-gray-900 leading-relaxed">{f}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleBook}
        className={`w-full py-4 text-xs font-black uppercase border-4 border-black transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-[4px_4px_0px_#000000] hover:translate-y-1 hover:shadow-none ${
          service.isPopular ? 'bg-black text-white hover:bg-gray-800' : 'bg-yellow-400 text-black hover:bg-yellow-300'
        }`}
      >
        Book This Service <FaArrowRight className="text-lg transition-transform duration-300 group-hover/btn:translate-x-1" />
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
      <div className="min-h-screen pt-32 pb-24 px-6 md:px-16 z-10 relative overflow-hidden bg-white">

        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} 
          className="text-center mb-24"
        >
          <p className="text-sm font-black uppercase text-black inline-block border-b-2 border-black mb-4">Luxury Design Solutions</p>
          <h1 className="text-5xl md:text-8xl font-black text-black uppercase tracking-tighter">Services</h1>
          <div className="w-20 h-2 bg-black mx-auto mt-6" />
        </motion.div>

        {/* Dynamic Grid */}
        <div className="max-w-7xl mx-auto">
          {isLoading && !services ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-[400px] bg-gray-200 border-4 border-black animate-pulse" />
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
          className="mt-32 max-w-4xl mx-auto neopop-card bg-blue-400 border-4 border-black p-12 md:p-20 text-center relative overflow-hidden group shadow-[12px_12px_0px_#000000]"
        >
          <h2 className="text-4xl md:text-6xl font-black text-black mb-6 uppercase tracking-tighter">Not sure which path to take?</h2>
          <p className="text-black font-bold text-sm md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Every home is unique. Book a complimentary discovery session to discuss your specific needs and create a bespoke design strategy.
          </p>
          <button
            onClick={() => window.location.href = '/contact'}
            className="neopop-btn bg-white text-black px-12 py-5 text-sm hover:bg-gray-100 shadow-[8px_8px_0px_#000000]"
          >
            Schedule Free Call →
          </button>
        </motion.div>

        {/* 4-Step Process - Refactored for better mobile display */}
        <div className="mt-32 text-center px-4">
           <p className="text-sm font-black uppercase text-black inline-block border-b-2 border-black mb-10">The InteDesign Signature Process</p>
           <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12">
              {['01. Discovery', '02. Curation', '03. Execution', '04. The Reveal'].map(step => (
                <span key={step} className="whitespace-nowrap font-black uppercase text-black text-xl md:text-2xl">{step}</span>
              ))}
           </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Services;
