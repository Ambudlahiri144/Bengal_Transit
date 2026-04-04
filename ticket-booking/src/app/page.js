'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// The two fixed routes — swapping just flips these
const ROUTE_A = { origin: 'KNI Airport',        destination: 'Nababhat Bus Stop' };
const ROUTE_B = { origin: 'Nababhat Bus Stop',  destination: 'KNI Airport'       };

export default function Home() {
  const router = useRouter();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const formattedDate = tomorrow.toISOString().split('T')[0];

  const [route,   setRoute]   = useState(ROUTE_A);
  const [date,    setDate]    = useState(formattedDate);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [swapped, setSwapped] = useState(false);

  // ── Swap the two route endpoints ────────────────────────────
  const handleSwap = () => {
    setSwapped(s => !s);
    setRoute(r => r.origin === ROUTE_A.origin ? ROUTE_B : ROUTE_A);
    setError('');
  };

  // ── Search handler ───────────────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `http://localhost:5000/api/schedules/search?origin=${encodeURIComponent(route.origin)}&destination=${encodeURIComponent(route.destination)}&date=${date}`
      );

      if (!res.ok) throw new Error('Failed to fetch schedules');
      const data = await res.json();

      if (data && data.length > 0) {
        router.push(`/book/${data[0].id}`);
      } else {
        setError('No buses found on this route for the selected date.');
      }
    } catch {
      setError('System error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-white flex flex-col items-center justify-center p-6 md:p-8 font-sans overflow-hidden">

      {/* ── Subtle background texture ── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(179,27,32,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(179,27,32,0.03) 0%, transparent 50%)',
        }}
      />

      {/* ── Top-left logo ── */}
      <div className="absolute top-28 left-10 md:top-40 md:left-20 z-10">
        <img
          src="/BAPL_logo.jpg"
          alt="Bengal Aerotropolis Projects Limited"
          className="h-20 md:h-32 w-auto object-contain"
        />
      </div>

      {/* ── Center header ── */}
      <div className="mb-10 flex flex-col items-center text-center mt-16 md:mt-0">
        <img
          src="/KNI_logo.jpg"
          alt="Kazi Nazrul Islam Airport Durgapur"
          className="h-20 md:h-28 w-auto object-contain mb-2"
        />
        <h1 className="text-3xl md:text-4xl font-light tracking-wide text-gray-800">
          <span className="font-bold text-[#B31B20]">BENGAL</span> TRANSIT
        </h1>
        <p className="tracking-[0.22em] text-gray-400 text-xs mt-2 uppercase">
          Express Booking Portal
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════
          SEARCH WIDGET
      ══════════════════════════════════════════════════════ */}
      <form onSubmit={handleSearch} className="w-full max-w-4xl">

        <div className="flex flex-col md:flex-row items-stretch rounded-2xl border border-gray-200 shadow-lg shadow-gray-100/80 bg-white overflow-visible relative">

          {/* ── Panel 1: FROM ── */}
          {/* Notice: Added 'relative' here so the swap button anchors to its edge */}
          <div className="relative flex-1 px-6 py-4 border-b md:border-b-0 md:border-r border-gray-200 cursor-default group">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-1">
              From
            </p>
            <p className="text-xl md:text-2xl font-bold text-gray-900 leading-tight truncate transition-all duration-300">
              {route.origin}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              
              {route.origin === 'KNI Airport' ? 'Durgapur, West Bengal' : 'Burdwan, West Bengal'}
              
            </p>

            {/* ── Swap button (Desktop) ── pinned directly to the right edge */}
            <div className="hidden md:flex absolute top-1/2 -right-5 -translate-y-1/2 z-20">
              <button
                type="button"
                onClick={handleSwap}
                aria-label="Swap origin and destination"
                className="
                  w-10 h-10 rounded-full bg-white border-2 border-gray-200
                  flex items-center justify-center
                  shadow-md hover:shadow-lg
                  hover:border-[#B31B20] hover:bg-red-50
                  transition-all duration-200 group
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`
                    w-4 h-4 text-gray-500 group-hover:text-[#B31B20]
                    transition-all duration-300
                    ${swapped ? 'rotate-180' : 'rotate-0'}
                  `}
                  style={{ transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), color 0.2s' }}
                >
                  <path d="M7 16V4m0 0L3 8m4-4l4 4" />
                  <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile swap button — sits between rows */}
          <div className="flex md:hidden justify-center py-2 border-b border-gray-200 bg-gray-50/50 relative z-10">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap origin and destination"
              className="
                flex items-center gap-2 px-4 py-1.5 rounded-full
                border border-gray-200 bg-white text-xs font-semibold text-gray-500
                hover:border-[#B31B20] hover:text-[#B31B20] hover:bg-red-50
                transition-all duration-200 shadow-sm
              "
            >
              <svg
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`w-3.5 h-3.5 transition-transform duration-300 ${swapped ? 'rotate-180' : ''}`}
              >
                <path d="M7 16V4m0 0L3 8m4-4l4 4" />
                <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Swap Route
            </button>
          </div>

          {/* ── Panel 2: TO ── */}
          <div className="flex-1 px-6 py-4 border-b md:border-b-0 md:border-r border-gray-200 cursor-default">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-1">
              To
            </p>
            <p className="text-xl md:text-2xl font-bold text-gray-900 leading-tight truncate transition-all duration-300">
              {route.destination}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              
              {route.destination === 'KNI Airport' ? 'Durgapur, West Bengal' : 'Burdwan, West Bengal'}
              
            </p>
          </div>

          {/* ── Panel 3: TRAVEL DATE ── */}
          <div className="flex-[0.8] px-6 py-4 group cursor-pointer hover:bg-gray-50 transition-colors rounded-r-2xl">
            <p className="text-[10px] font-bold text-[#B31B20] uppercase tracking-[0.18em] mb-1">
              Travel Date
            </p>
            {/* Restored Native Date Input */}
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              required
              className="
                w-full bg-transparent border-0 p-0 
                text-xl md:text-2xl font-bold text-gray-900 
                focus:ring-0 outline-none cursor-pointer
              "
            />
          </div>
        </div>

        {/* ── Find Seats CTA ── */}
        <div className="mt-5 flex justify-center md:justify-end">
          <button
            type="submit"
            disabled={loading}
            className="
              bg-[#B31B20] text-white font-bold tracking-[0.12em] uppercase
              py-4 px-14 text-sm
              hover:bg-[#8f1419] active:scale-[0.98]
              transition-all duration-200
              disabled:opacity-60 disabled:cursor-not-allowed
              shadow-lg shadow-red-900/20 hover:shadow-xl hover:shadow-red-900/30
              rounded-sm
            "
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Routing…
              </span>
            ) : (
              'Find Seats →'
            )}
          </button>
        </div>

        {/* ── Error message ── */}
        {error && (
          <div className="mt-4 text-[#B31B20] text-center text-sm font-medium bg-red-50 border border-red-100 py-3 px-4 rounded-lg">
            {error}
          </div>
        )}
      </form>

      {/* ── Subtle footer note ── */}
      <p className="absolute bottom-5 text-[10px] text-gray-300 uppercase tracking-[0.2em]">
        Operated by Bengal Aerotropolis Projects Limited
      </p>
    </main>
  );
}