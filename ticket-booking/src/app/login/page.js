'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  
  // UI State
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'TRAVEL_AGENT',
    secretAnswer: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      // 🔐 Store in sessionStorage! This isolates the session per tab.
      sessionStorage.setItem('bengal_transit_token', data.token);
      sessionStorage.setItem('bengal_transit_user', JSON.stringify(data.user));

      // Route based on role
      if (data.user.role === 'ADMIN') {
        router.push('/admin'); // We will build this next!
      } else {
        router.push('/');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main 
      className="min-h-[100dvh] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/login_logo.jpg')" }}
    >
      {/* Dark translucent overlay with a subtle blur */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <img src="/BAPL_KNI.jpg" alt="KNI Logo" className="h-16 w-auto object-contain mb-3" />
          <h1 className="text-2xl font-light tracking-wide text-gray-800">
            <span className="font-bold text-[#B31B20]">BENGAL</span> TRANSIT
          </h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
            {isLogin ? 'Authorized Portal Access' : 'Create Access Account'}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 text-[#B31B20] text-xs font-medium px-4 py-3 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {!isLogin && (
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Full Name</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#B31B20] focus:ring-1 focus:ring-[#B31B20] transition-colors" placeholder="John Doe" />
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Email Address</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#B31B20] focus:ring-1 focus:ring-[#B31B20] transition-colors" placeholder="agent@bengaltransit.in" />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Password</label>
            <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#B31B20] focus:ring-1 focus:ring-[#B31B20] transition-colors" placeholder="••••••••" />
          </div>

          {!isLogin && (
            <div className="mt-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Account Type</label>
              <select name="role" value={formData.role} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none text-gray-900 font-medium">
                <option value="TRAVEL_AGENT">Travel Agent</option>
                <option value="ADMIN">System Admin</option>
              </select>

              {/* 🛡️ The Secret Admin Question */}
              {formData.role === 'ADMIN' && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-bold text-[#B31B20] uppercase tracking-widest mb-1 block">Security Challenge</label>
                  <p className="text-xs text-gray-600 mb-2 italic">Name the airport where the buses will leave from:</p>
                  <input type="text" name="secretAnswer" required value={formData.secretAnswer} onChange={handleChange} className="w-full border border-red-200 bg-red-50/30 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder:text-red-300 focus:outline-none focus:border-[#B31B20] transition-colors" placeholder="Type your answer here..." />
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} className="mt-4 w-full bg-[#B31B20] hover:bg-[#8f1419] text-white font-bold uppercase tracking-wider py-3.5 rounded-lg text-sm transition-all shadow-md disabled:opacity-70 flex justify-center items-center">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-xs text-gray-500 hover:text-[#B31B20] font-semibold transition-colors">
            {isLogin ? "Need access? Request an account" : "Already have access? Sign in here"}
          </button>
        </div>
      </div>
    </main>
  );
}