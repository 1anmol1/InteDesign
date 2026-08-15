import { motion } from 'framer-motion';
import { FaLeaf, FaCompass, FaHeart, FaPalette } from 'react-icons/fa'; // Added FaPalette
import PageTransition from '../components/PageTransition';

const values = [
  { icon: FaLeaf, title: 'Sustainability First', desc: "Every project prioritizes natural materials and eco-conscious sourcing because a beautiful home shouldn't cost the Earth." },
  { icon: FaPalette, title: 'Timeless Aesthetic', desc: 'We avoid fast-furniture fads. Our designs are built to age gracefully and remain beautiful for decades.' }, // Replaced original second item
  { icon: FaHeart, title: 'Human-Centred Design', desc: 'Spaces are designed for the people who live in them, not for Instagram. Comfort and character come before trend.' }, // Removed emdash and added comma
];

const About = () => {
  return (
    <PageTransition>
      <div className="min-h-screen pt-32 pb-24 z-10 relative bg-white">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20 px-6"
        >
          <p className="text-sm font-black uppercase text-black inline-block border-b-2 border-black mb-4">The Studio</p>
          <h1 className="text-5xl md:text-7xl font-black text-black uppercase tracking-tighter">About</h1>
          <div className="w-16 h-2 bg-black mx-auto mt-6" />
        </motion.div>

        {/* Designer Section */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center px-8 md:px-16 mb-28">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="neopop-card relative p-2 bg-yellow-400 aspect-[3/4]">
              <div className="w-full h-full border-4 border-black overflow-hidden">
                <img
                  src="/images/designer.png"
                  alt="Aria Voss – Principal Designer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {/* Name card */}
            <div className="absolute -bottom-6 -right-6 neopop-card bg-white px-6 py-4 shadow-[4px_4px_0px_#000000]">
              <p className="text-xl font-black text-black uppercase">Aria Voss</p>
              <p className="text-xs font-bold text-gray-500 uppercase mt-0.5">Principal Designer</p>
            </div>
          </motion.div>

          {/* Bio */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-black text-black leading-tight uppercase tracking-tighter">
              Designing the Space<br />Between Feeling and Form
            </h2>
            <div className="w-16 h-2 bg-black" />
            <p className="text-sm font-bold text-gray-800 leading-relaxed">
              With over a decade of experience spanning residential, hospitality, and commercial design, Aria Voss founded InteDesign in 2021 with a simple conviction: spaces should feel like the truest expression of the person who inhabits them.
            </p>
            <p className="text-sm font-bold text-gray-800 leading-relaxed">
              Trained at the Pratt Institute and sharpened across projects in Milan, Tokyo, and New York, Aria brings a global perspective filtered through a deeply human lens. She believes great design is never about the designer, it's always about the story.
            </p>
            <blockquote className="border-l-4 border-black pl-5 italic text-gray-600 font-bold text-sm leading-relaxed">
              "I want every client to walk into their space and feel, for the first time, completely at home."
            </blockquote>
            <div className="flex gap-6 pt-2">
              <div>
                <p className="text-3xl font-black text-black">12+</p>
                <p className="text-xs font-bold text-gray-500 uppercase">Years Experience</p>
              </div>
              <div className="w-1 bg-black" />
              <div>
                <p className="text-3xl font-black text-black">200+</p>
                <p className="text-xs font-bold text-gray-500 uppercase">Projects Completed</p>
              </div>
              <div className="w-1 bg-black" />
              <div>
                <p className="text-3xl font-black text-black">8</p>
                <p className="text-xs font-bold text-gray-500 uppercase">Design Awards</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Values */}
        <div className="bg-pink-400 border-y-4 border-black py-20 px-8 md:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-sm font-black uppercase text-black inline-block border-b-2 border-black mb-4">What We Believe</p>
            <h2 className="text-4xl md:text-6xl font-black text-black uppercase tracking-tighter">Our Values</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                viewport={{ once: true }}
                className="text-center space-y-4 group cursor-pointer"
              >
                <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center mx-auto shadow-[4px_4px_0px_#000000] transition-transform duration-300 group-hover:-translate-y-1">
                  <v.icon className="text-black text-2xl" />
                </div>
                <h3 className="text-xl font-black text-black uppercase tracking-tighter bg-white inline-block px-2 border-2 border-black shadow-[2px_2px_0px_#000000]">{v.title}</h3>
                <p className="text-sm font-bold text-gray-900 leading-relaxed mt-2">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default About;
