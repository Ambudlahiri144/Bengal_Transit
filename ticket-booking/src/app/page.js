'use client';

import { useState, useEffect } from 'react'; 
import { useRouter } from 'next/navigation';

const ROUTE_A = { origin: 'KNI Airport',        destination: 'Nababhat Bus Stop' };
const ROUTE_B = { origin: 'Nababhat Bus Stop',  destination: 'KNI Airport'       };

export default function Home() {
  const router = useRouter();

  // ── Authentication Guard ─────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState(''); // 👈 Track the user's role

  useEffect(() => {
    // Check if the user is logged in
    const token = sessionStorage.getItem('bengal_transit_token');
    const userStr = sessionStorage.getItem('bengal_transit_user');
    
    if (!token) {
      router.push('/login');
    } else {
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        setUserName(parsedUser.name);
        setUserRole(parsedUser.role); // 👈 Store the role
      }
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.clear(); 
    router.push('/login');  
  };
  // ─────────────────────────────────────────────────────────────

  const getTomorrowDateString = () => {
    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    
    return `${yyyy}-${mm}-${dd}`;
  };

  const [formattedDate] = useState(getTomorrowDateString());

  const [route,   setRoute]   = useState(ROUTE_A);
  const [date,    setDate]    = useState(formattedDate);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [swapped, setSwapped] = useState(false);

  const handleSwap = () => {
    setSwapped(s => !s);
    setRoute(r => r.origin === ROUTE_A.origin ? ROUTE_B : ROUTE_A);
    setError('');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(`/search?origin=${encodeURIComponent(route.origin)}&destination=${encodeURIComponent(route.destination)}&date=${date}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[100dvh] bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#B31B20] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="relative min-h-[100dvh] bg-white flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans overflow-hidden">

      {/* ── Subtle background texture ── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(179,27,32,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(179,27,32,0.03) 0%, transparent 50%)' }}
      />

      {/* ── Top-left logo ── */}
      <div className="absolute top-8 left-4 sm:top-10 sm:left-10 md:top-16 md:left-16 z-10">
        <img src="/BAPL_logo.jpg" alt="Bengal Aerotropolis Projects Limited" className="h-12 sm:h-16 md:h-24 lg:h-32 w-auto object-contain" />
      </div>

      {/* ── Top-right Controls ── */}
      <div className="absolute top-8 right-4 sm:top-10 sm:right-10 md:top-16 md:right-16 z-20 flex items-center gap-2 sm:gap-4">
        
        {/* 👇 Only show this button if the logged-in user is an ADMIN 👇 */}
        {userRole === 'ADMIN' && (
          <button 
            onClick={() => router.push('/admin')}
            className="flex items-center gap-1.5 bg-red-50 text-[#B31B20] border border-red-100 hover:bg-[#B31B20] hover:text-white px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors shadow-md"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Admin Panel
          </button>
        )}

        <button 
          onClick={handleLogout}
          className="bg-red-50 text-[#B31B20] border border-red-100 hover:bg-[#B31B20] hover:text-white px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* ── Center header ── */}
      <div className="mb-8 md:mb-10 flex flex-col items-center text-center mt-24 sm:mt-16 md:mt-0 px-2 w-full">
        <img src="/KNI_logo.jpg" alt="Kazi Nazrul Islam Airport Durgapur" className="h-16 sm:h-20 md:h-28 w-auto object-contain mb-2" />
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-wide text-gray-800 break-words w-full">
          <span className="font-bold text-[#B31B20]">BENGAL</span> TRANSIT
        </h1>
        <p className="tracking-[0.15em] sm:tracking-[0.22em] text-gray-400 text-[10px] sm:text-xs mt-2 uppercase w-full">
          Express Booking Portal
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════
          SEARCH WIDGET
      ══════════════════════════════════════════════════════ */}
      <form onSubmit={handleSearch} className="w-full max-w-4xl z-10 relative px-2 sm:px-0">
        <div className="flex flex-col md:flex-row items-stretch rounded-2xl border border-gray-200 shadow-lg shadow-gray-100/80 bg-white overflow-visible relative">
          
          <div className="relative flex-1 px-4 sm:px-6 py-4 border-b md:border-b-0 md:border-r border-gray-200 cursor-default group">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-1">From</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight truncate transition-all duration-300">{route.origin}</p>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{route.origin === 'KNI Airport' ? 'Durgapur, West Bengal' : 'Burdwan, West Bengal'}</p>

            <div className="hidden md:flex absolute top-1/2 -right-5 -translate-y-1/2 z-20">
              <button type="button" onClick={handleSwap} aria-label="Swap origin and destination" className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-md hover:shadow-lg hover:border-[#B31B20] hover:bg-red-50 transition-all duration-200 group">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 text-gray-500 group-hover:text-[#B31B20] transition-all duration-300 ${swapped ? 'rotate-180' : 'rotate-0'}`} style={{ transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), color 0.2s' }}>
                  <path d="M7 16V4m0 0L3 8m4-4l4 4" />
                  <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex md:hidden justify-center py-2 border-b border-gray-200 bg-gray-50/50 relative z-10">
            <button type="button" onClick={handleSwap} className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-semibold text-gray-500 hover:border-[#B31B20] hover:text-[#B31B20] hover:bg-red-50 transition-all duration-200 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-3.5 h-3.5 transition-transform duration-300 ${swapped ? 'rotate-180' : ''}`}>
                <path d="M7 16V4m0 0L3 8m4-4l4 4" />
                <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Swap Route
            </button>
          </div>

          <div className="flex-1 px-4 sm:px-6 py-4 border-b md:border-b-0 md:border-r border-gray-200 cursor-default">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-1">To</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight truncate transition-all duration-300">{route.destination}</p>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{route.destination === 'KNI Airport' ? 'Durgapur, West Bengal' : 'Burdwan, West Bengal'}</p>
          </div>

          <div className="flex-[0.8] px-4 sm:px-6 py-4 group cursor-pointer hover:bg-gray-50 transition-colors rounded-b-2xl md:rounded-b-none md:rounded-r-2xl">
            <p className="text-[10px] font-bold text-[#B31B20] uppercase tracking-[0.18em] mb-1">Travel Date</p>
            <input 
              type="date" 
              value={date} 
              min={formattedDate} 
              onChange={(e) => setDate(e.target.value)} 
              required 
              className="w-full bg-transparent border-0 p-0 text-lg sm:text-xl md:text-2xl font-bold text-gray-900 focus:ring-0 outline-none cursor-pointer" 
            />
          </div>
        </div>

        <div className="mt-5 flex justify-center md:justify-end">
          <button type="submit" disabled={loading} className="bg-[#B31B20] text-white font-bold tracking-[0.12em] uppercase py-3 sm:py-4 px-8 sm:px-14 text-xs sm:text-sm hover:bg-[#8f1419] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-red-900/20 hover:shadow-xl hover:shadow-red-900/30 rounded-sm w-full md:w-auto">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Routing…
              </span>
            ) : ('Find Seats →')}
          </button>
        </div>

        {error && (
          <div className="mt-4 text-[#B31B20] text-center text-xs sm:text-sm font-medium bg-red-50 border border-red-100 py-3 px-4 rounded-lg">
            {error}
          </div>
        )}
      </form>

      <p className="absolute bottom-3 sm:bottom-5 text-[8px] sm:text-[10px] text-gray-300 uppercase tracking-[0.2em] text-center w-full px-4">
        Operated by Bengal Aerotropolis Projects Limited
      </p>
    </main>
  );
}