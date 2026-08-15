import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../components/AuthContext';

export default function SignUp() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    preferredStyle: 'Modern',
    projectType: 'Residential',
    budget: 'Not Specified',
    timeline: 'Flexible'
  });
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await register(formData);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-12 px-6 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white border-4 border-black p-8 shadow-[8px_8px_0px_#000000]">
        <h1 className="text-4xl font-black mb-6 uppercase tracking-tighter">Sign Up</h1>
        {error && <div className="bg-red-500 text-white p-3 mb-4 font-bold border-2 border-black uppercase">{error}</div>}
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-xl font-bold mb-2 uppercase">Full Name</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full p-3 border-4 border-black bg-white focus:outline-none focus:bg-yellow-100 font-medium" autoComplete="name" required />
          </div>
          <div className="col-span-1">
            <label className="block text-xl font-bold mb-2 uppercase">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-3 border-4 border-black bg-white focus:outline-none focus:bg-yellow-100 font-medium" autoComplete="username" required />
          </div>
          <div className="col-span-1">
            <label className="block text-xl font-bold mb-2 uppercase">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full p-3 border-4 border-black bg-white focus:outline-none focus:bg-yellow-100 font-medium" autoComplete="new-password" required />
          </div>
          
          <div className="col-span-1 md:col-span-2 my-4 border-t-4 border-black pt-4">
            <h2 className="text-2xl font-black uppercase mb-4">Design Preferences</h2>
          </div>

          <div className="col-span-1">
            <label className="block text-lg font-bold mb-2 uppercase">Preferred Style</label>
            <select name="preferredStyle" value={formData.preferredStyle} onChange={handleChange} className="w-full p-3 border-4 border-black bg-white focus:outline-none focus:bg-yellow-100 font-bold">
              <option>Modern</option>
              <option>Minimalist</option>
              <option>Industrial</option>
              <option>Bohemian</option>
              <option>Mid-Century</option>
              <option>Traditional</option>
              <option>Eclectic</option>
            </select>
          </div>
          <div className="col-span-1">
            <label className="block text-lg font-bold mb-2 uppercase">Project Type</label>
            <select name="projectType" value={formData.projectType} onChange={handleChange} className="w-full p-3 border-4 border-black bg-white focus:outline-none focus:bg-yellow-100 font-bold">
              <option>Residential</option>
              <option>Commercial</option>
              <option>Retail</option>
              <option>Hospitality</option>
            </select>
          </div>
          <div className="col-span-1">
            <label className="block text-lg font-bold mb-2 uppercase">Estimated Budget</label>
            <select name="budget" value={formData.budget} onChange={handleChange} className="w-full p-3 border-4 border-black bg-white focus:outline-none focus:bg-yellow-100 font-bold">
              <option>Not Specified</option>
              <option>Under ₹5,00,000</option>
              <option>₹5,00,000 - ₹15,00,000</option>
              <option>₹15,00,000 - ₹50,00,000</option>
              <option>Over ₹50,00,000</option>
            </select>
          </div>
          <div className="col-span-1">
            <label className="block text-lg font-bold mb-2 uppercase">Timeline</label>
            <select name="timeline" value={formData.timeline} onChange={handleChange} className="w-full p-3 border-4 border-black bg-white focus:outline-none focus:bg-yellow-100 font-bold">
              <option>Flexible</option>
              <option>Within 1 Month</option>
              <option>1 - 3 Months</option>
              <option>3 - 6 Months</option>
              <option>6+ Months</option>
            </select>
          </div>

          <div className="col-span-1 md:col-span-2 mt-4">
            <button
              type="submit"
              className="w-full bg-yellow-400 text-black border-4 border-black p-4 text-xl font-black uppercase tracking-wide shadow-[4px_4px_0px_#000000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              Create Account
            </button>
          </div>
        </form>
        <p className="mt-6 text-center font-bold">
          Already have an account? <Link to="/login" className="text-blue-600 underline hover:bg-yellow-200">Log In</Link>
        </p>
      </div>
    </div>
  );
}
