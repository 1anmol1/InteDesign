import PageTransition from '../components/PageTransition';

const Privacy = () => {
  return (
    <PageTransition>
      <div className="min-h-screen pt-32 pb-24 px-6 md:px-16 z-10 relative bg-white">
        <div className="max-w-4xl mx-auto neopop-card p-8 md:p-12 bg-white">
          <h1 className="text-4xl md:text-5xl font-black text-black uppercase tracking-tighter mb-8 border-b-4 border-black pb-4">
            Privacy Policy
          </h1>
          
          <div className="space-y-6 text-sm font-bold text-gray-800 leading-relaxed">
            <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
            
            <h2 className="text-xl font-black uppercase text-black mt-8 mb-2">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when you use our website, contact us, or use the AI Style Explorer. This includes your name, email address, and any interior design preferences you enter into our systems.
            </p>

            <h2 className="text-xl font-black uppercase text-black mt-8 mb-2">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve our services, to develop new ones, and to protect InteDesign and our users. For the AI Explorer, your prompts are processed to generate design inspirations.
            </p>

            <h2 className="text-xl font-black uppercase text-black mt-8 mb-2">3. Third-Party Services</h2>
            <p>
              We may share information with third-party vendors, consultants, and other service providers (such as Google Gemini AI) who need access to such information to carry out work on our behalf.
            </p>

            <h2 className="text-xl font-black uppercase text-black mt-8 mb-2">4. Data Security</h2>
            <p>
              We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.
            </p>

            <h2 className="text-xl font-black uppercase text-black mt-8 mb-2">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at <strong>hello@intedesign.studio</strong>.
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Privacy;
