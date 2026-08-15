import PageTransition from '../components/PageTransition';

const Terms = () => {
  return (
    <PageTransition>
      <div className="min-h-screen pt-32 pb-24 px-6 md:px-16 z-10 relative bg-white">
        <div className="max-w-4xl mx-auto neopop-card p-8 md:p-12 bg-white">
          <h1 className="text-4xl md:text-5xl font-black text-black uppercase tracking-tighter mb-8 border-b-4 border-black pb-4">
            Terms & Conditions
          </h1>
          
          <div className="space-y-6 text-sm font-bold text-gray-800 leading-relaxed">
            <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
            
            <h2 className="text-xl font-black uppercase text-black mt-8 mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing and using InteDesign's website and services, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.
            </p>

            <h2 className="text-xl font-black uppercase text-black mt-8 mb-2">2. Use of AI Services</h2>
            <p>
              Our AI Style Explorer is provided for inspiration purposes. The generated images and recommendations are the product of generative AI (Google Gemini) and should be used as conceptual guidance, not final architectural plans.
            </p>

            <h2 className="text-xl font-black uppercase text-black mt-8 mb-2">3. Intellectual Property</h2>
            <p>
              All content on this website, including but not limited to text, graphics, logos, and images (except for user-generated AI content), is the property of InteDesign and is protected by copyright laws.
            </p>

            <h2 className="text-xl font-black uppercase text-black mt-8 mb-2">4. Service Limitations</h2>
            <p>
              We reserve the right to refuse service, terminate accounts, or cancel requests at our sole discretion. Prices for services are subject to change without notice.
            </p>

            <h2 className="text-xl font-black uppercase text-black mt-8 mb-2">5. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Terms;
