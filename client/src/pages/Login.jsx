import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { AuthContext } from '../components/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loginType, setLoginType] = useState('user');
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const [timer, setTimer] = useState(60);

  const location = useLocation();
  const from = location.state?.from || '/';

  const performLogin = async (loginEmail, loginPassword) => {
    setError('');
    const result = await login(loginEmail, loginPassword, loginType);
    if (result.success) {
      if (result.role === 'admin' || loginType === 'admin') {
        navigate('/admin');
      } else {
        navigate(from);
      }
    } else {
      setError(result.message);
    }
  };

  const handleQuickLogin = () => {
    const testEmail = loginType === 'admin' ? 'admin@intedesign.studio' : 'test@example.com';
    const testPass = '123456';
    setEmail(testEmail);
    setPassword(testPass);
    performLogin(testEmail, testPass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (serverStatus !== 'online') return;
    performLogin(email, password);
  };

  useEffect(() => {
    let intervalId;
    let countdownId;

    const checkHealth = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/health`, { timeout: 5000 });
        if (res.status === 200) {
          setServerStatus('online');
          clearInterval(intervalId);
          clearInterval(countdownId);
        }
      } catch (err) {
        // still waking up
      }
    };

    checkHealth(); // Initial check
    
    // Poll every 3 seconds indefinitely until online
    intervalId = setInterval(checkHealth, 3000);

    countdownId = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(countdownId);
          // Keep the intervalId running! The server might just be taking a long time (Render free tier can take up to 2 mins)
          setServerStatus(s => s === 'online' ? 'online' : 'delayed');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
      clearInterval(countdownId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white pt-24 pb-12 px-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-white border-4 border-black p-8 shadow-[8px_8px_0px_#000000]">
        
        {/* Toggle Login Type */}
        <p className="text-xs font-bold text-gray-500 mb-4 text-center uppercase tracking-widest leading-relaxed">
          For easier navigation, I placed both logins alongside each other
        </p>
        <div className="flex border-4 border-black mb-8 p-1 bg-gray-100 shadow-[4px_4px_0px_#000000]">
          <button
            type="button"
            className={`flex-1 py-3 text-sm font-black uppercase transition-all ${
              loginType === 'user' ? 'bg-yellow-400 border-2 border-black scale-[1.02]' : 'bg-transparent text-gray-500 hover:text-black border-2 border-transparent'
            }`}
            onClick={() => setLoginType('user')}
          >
            Client Login
          </button>
          <button
            type="button"
            className={`flex-1 py-3 text-sm font-black uppercase transition-all ${
              loginType === 'admin' ? 'bg-blue-400 border-2 border-black scale-[1.02] text-white' : 'bg-transparent text-gray-500 hover:text-black border-2 border-transparent'
            }`}
            onClick={() => setLoginType('admin')}
          >
            Studio Login
          </button>
        </div>

        <h1 className="text-3xl font-black mb-6 uppercase tracking-tighter">
          {loginType === 'user' ? 'Welcome Back' : 'Studio Portal'}
        </h1>

        {serverStatus === 'checking' && (
          <div className="bg-yellow-100 text-yellow-800 p-3 mb-4 font-bold border-2 border-yellow-400 uppercase text-xs flex justify-between items-center">
            <span>Server Waking Up...</span>
            <span className="bg-yellow-400 text-black px-2 py-1 border-2 border-black">
              {timer}s
            </span>
          </div>
        )}

        {serverStatus === 'delayed' && (
          <div className="bg-orange-100 text-orange-800 p-3 mb-4 font-bold border-2 border-orange-400 uppercase text-xs flex justify-between items-center animate-pulse">
            <span>Server is taking longer than usual...</span>
            <span className="bg-orange-400 text-black px-2 py-1 border-2 border-black">
              Wait
            </span>
          </div>
        )}

        {serverStatus === 'online' && (
           <div className="bg-green-100 text-green-800 p-3 mb-4 font-bold border-2 border-green-400 uppercase text-xs text-center">
             Server Online
           </div>
        )}

        {error && <div className="bg-red-500 text-white p-3 mb-4 font-bold border-2 border-black uppercase text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 uppercase">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full p-3 border-4 border-black bg-white focus:outline-none font-medium transition-colors ${loginType === 'admin' ? 'focus:bg-blue-50' : 'focus:bg-yellow-50'} disabled:opacity-50`}
              placeholder={loginType === 'admin' ? "admin@intedesign.studio" : "you@example.com"}
              autoComplete="username"
              required
              disabled={serverStatus !== 'online'}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-3 border-4 border-black bg-white focus:outline-none font-medium transition-colors ${loginType === 'admin' ? 'focus:bg-blue-50' : 'focus:bg-yellow-50'} disabled:opacity-50`}
              autoComplete="current-password"
              required
              disabled={serverStatus !== 'online'}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleQuickLogin}
              disabled={serverStatus !== 'online'}
              className="text-xs font-black uppercase bg-gray-200 border-2 border-black px-3 py-1 text-black shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all active:bg-gray-300 disabled:opacity-50 disabled:shadow-none"
            >
              Quick Login
            </button>
          </div>

          <button
            type="submit"
            disabled={serverStatus !== 'online'}
            className={`w-full text-white border-4 border-black p-4 text-lg font-black uppercase tracking-wide transition-all disabled:opacity-50 disabled:shadow-none ${
              loginType === 'admin' ? 'bg-black' : 'bg-blue-500'
            } ${serverStatus === 'online' ? 'shadow-[4px_4px_0px_#000000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none' : ''}`}
          >
            {loginType === 'user' ? 'Sign In' : 'Access Portal'}
          </button>
        </form>
        
        {loginType === 'user' && (
          <p className="mt-6 text-center font-bold text-sm">
            Don't have an account? <Link to="/signup" className="text-blue-600 underline hover:bg-yellow-200 px-1">Sign Up</Link>
          </p>
        )}
      </div>
    </div>
  );
}
