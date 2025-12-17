import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Set dark mode by default for the login page
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate login logic here
    if (email && password) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] flex items-center justify-center p-4 font-['Noto_Sans',sans-serif]">
       {/* Inject Fonts */}
       <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Noto+Sans:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
      `}</style>

      <div className="w-full max-w-md bg-white dark:bg-[#18232c] rounded-2xl border border-gray-200 dark:border-[#2a3b4c] shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 text-[#137fec] mb-3">
             <span className="material-symbols-outlined text-5xl">flight_takeoff</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk',sans-serif]">AeroGraph AI</h1>
          <p className="text-slate-500 dark:text-[#92adc9] text-sm">Sign in to your dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-[#101922] border border-gray-300 dark:border-[#2a3b4c] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#137fec] focus:border-transparent outline-none transition-all"
              placeholder="admin@aerograph.ai"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">
                Password
              </label>
              <a href="#" className="text-xs text-[#137fec] hover:underline">Forgot password?</a>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-[#101922] border border-gray-300 dark:border-[#2a3b4c] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#137fec] focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-[#137fec] hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-500/20 transition-all transform active:scale-95"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-[#92adc9]">
          Don't have an account? <a href="#" className="text-[#137fec] font-bold hover:underline">Contact Sales</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;