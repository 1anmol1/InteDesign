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
      <div className="min-h-screen pt-32 pb-24 z-10 relative">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20 px-6"
        >
          <p className="text-[10px] tracking-[0.35em] uppercase text-white/30 mb-3">The Studio</p>
          <h1 className="text-5xl md:text-7xl font-serif text-white font-medium">About</h1>
          <div className="w-16 h-[1px] bg-white/20 mx-auto mt-6" />
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
            <div className="relative overflow-hidden rounded-2xl aspect-[3/4]">
              <img
                src="/images/designer.png"
                alt="Aria Voss – Principal Designer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
            {/* Name card */}
            <div className="absolute -bottom-6 -right-6 bg-black/70 backdrop-blur-md border border-white/10 rounded-xl px-5 py-4">
              <p className="text-sm font-serif text-white">Aria Voss</p>
              <p className="text-[10px] text-white/40 tracking-widest uppercase mt-0.5">Principal Designer</p>
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
            <h2 className="text-4xl font-serif text-white font-light leading-tight">
              Designing the Space<br />Between Feeling and Form
            </h2>
            <div className="w-12 h-[1px] bg-white/20" />
            <p className="text-sm text-white/60 leading-relaxed">
              With over a decade of experience spanning residential, hospitality, and commercial design, Aria Voss founded Phantasia in 2021 with a simple conviction: spaces should feel like the truest expression of the person who inhabits them.
            </p>
            <p className="text-sm text-white/60 leading-relaxed">
              Trained at the Pratt Institute and sharpened across projects in Milan, Tokyo, and New York, Aria brings a global perspective filtered through a deeply human lens. She believes great design is never about the designer, it's always about the story.
            </p>
            <blockquote className="border-l-2 border-white/20 pl-5 italic text-white/50 text-sm leading-relaxed">
              "I want every client to walk into their space and feel, for the first time, completely at home."
            </blockquote>
            <div className="flex gap-6 pt-2">
              <div>
                <p className="text-2xl font-serif text-white">12+</p>
                <p className="text-[10px] text-white/30 tracking-wide uppercase">Years Experience</p>
              </div>
              <div className="w-[1px] bg-white/10" />
              <div>
                <p className="text-2xl font-serif text-white">200+</p>
                <p className="text-[10px] text-white/30 tracking-wide uppercase">Projects Completed</p>
              </div>
              <div className="w-[1px] bg-white/10" />
              <div>
                <p className="text-2xl font-serif text-white">8</p>
                <p className="text-[10px] text-white/30 tracking-wide uppercase">Design Awards</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Values */}
        <div className="bg-black/20 backdrop-blur-sm border-t border-white/5 py-20 px-8 md:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-[10px] tracking-[0.35em] uppercase text-white/30 mb-3">What We Believe</p>
            <h2 className="text-4xl font-serif text-white font-light">Our Values</h2>
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
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mx-auto transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] group-hover:border-white/50 group-hover:scale-110 group-hover:bg-white/5">
                  <v.icon className="text-white/40 text-sm transition-colors duration-500 group-hover:text-white" />
                </div>
                <h3 className="text-lg font-serif text-white">{v.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default About;
