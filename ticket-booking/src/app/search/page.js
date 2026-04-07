'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Initial State from URL
  const initialOrigin = searchParams.get('origin') || 'KNI Airport';
  const initialDest = searchParams.get('destination') || 'Nababhat Bus Stop';
  const initialDate = searchParams.get('date') || '';

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Top Bar Edit State
  const [route, setRoute] = useState({ origin: initialOrigin, destination: initialDest });
  const [date, setDate] = useState(initialDate || minDate);
  const [swapped, setSwapped] = useState(false);

  // Data State
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter State
  const [selectedTimes, setSelectedTimes] = useState([]);

  // ── Fetch Data ──
  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/schedules/search?origin=${encodeURIComponent(initialOrigin)}&destination=${encodeURIComponent(initialDest)}&date=${initialDate}`
        );
        if (!res.ok) throw new Error('Failed to fetch schedules');
        const data = await res.json();
        setSchedules(data);
      } catch (err) {
        setError('System error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (initialOrigin && initialDest && initialDate) {
      fetchSchedules();
    }
  }, [initialOrigin, initialDest, initialDate]);

  // ── Top Bar Handlers ──
  const handleSwap = () => {
    setSwapped(!swapped);
    setRoute({ origin: route.destination, destination: route.origin });
  };

  const handleUpdateSearch = (e) => {
    e.preventDefault();
    router.push(`/search?origin=${encodeURIComponent(route.origin)}&destination=${encodeURIComponent(route.destination)}&date=${date}`);
  };

  // ── Formatting ──
  const formatTime = (dt) => new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const formatDate = (dt) => new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const getDuration = (dep, arr) => {
    const diffMs = new Date(arr) - new Date(dep);
    return `${Math.floor(diffMs / 3_600_000)}h ${Math.floor((diffMs % 3_600_000) / 60_000)}m`;
  };

  // ── Filter Logic ──
  const toggleTimeFilter = (timeLabel) => {
    setSelectedTimes(prev => prev.includes(timeLabel) ? prev.filter(t => t !== timeLabel) : [...prev, timeLabel]);
  };

  const clearFilters = () => setSelectedTimes([]);

  const filteredSchedules = schedules.filter(schedule => {
    if (selectedTimes.length === 0) return true;
    const hour = new Date(schedule.departureTime).getHours();
    
    return selectedTimes.some(filter => {
      if (filter === 'Early Morning') return hour >= 4 && hour < 8;
      if (filter === 'Morning') return hour >= 8 && hour < 12;
      if (filter === 'Afternoon') return hour >= 12 && hour < 16;
      if (filter === 'Evening') return hour >= 16 && hour < 20;
      if (filter === 'Night') return hour >= 20 || hour < 4;
      return false;
    });
  });

  return (
    <main className="min-h-[100dvh] bg-gray-50 font-sans">
      
      {/* ── TOP EDIT BAR (Inline Back Button Layout) ── */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleUpdateSearch} className="flex flex-col md:flex-row items-center justify-between gap-3 lg:gap-4 w-full">
            
            {/* 👇 BACK BUTTON NOW IN THE ROW 👇 */}
            <button 
              type="button" // Important so it doesn't trigger a search!
              onClick={() => router.push('/')} 
              className="flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-[#B31B20] transition-colors self-start md:self-center shrink-0 pr-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden lg:inline">Back</span>
            </button>

            {/* From */}
            <div className="w-full md:flex-1 border border-gray-300 rounded-xl bg-white px-4 py-2 min-h-[60px] flex flex-col justify-center shadow-sm">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">From</label>
              <p className="text-sm md:text-base font-bold text-gray-900 truncate">{route.origin}</p>
            </div>
            
            {/* Swap Button */}
            <button type="button" onClick={handleSwap} className="p-2 text-gray-400 hover:text-[#B31B20] transition-colors -my-2 md:my-0 z-10 bg-white rounded-full shrink-0">
              <svg className={`w-5 h-5 transition-transform ${swapped ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>

            {/* To */}
            <div className="w-full md:flex-1 border border-gray-300 rounded-xl bg-white px-4 py-2 min-h-[60px] flex flex-col justify-center shadow-sm">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">To</label>
              <p className="text-sm md:text-base font-bold text-gray-900 truncate">{route.destination}</p>
            </div>

            {/* Depart */}
            <div className="w-full md:flex-1 border border-gray-300 rounded-xl bg-white px-4 py-2 min-h-[60px] flex flex-col justify-center shadow-sm relative">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Depart</label>
              <input 
                type="date" 
                value={date} 
                min={minDate} 
                onChange={(e) => setDate(e.target.value)} 
                required 
                className="bg-transparent border-0 p-0 text-sm md:text-base font-bold text-gray-900 focus:ring-0 outline-none w-full cursor-pointer" 
              />
            </div>

            {/* Search Button */}
            <button type="submit" className="w-full md:w-auto bg-[#B31B20] hover:bg-[#8f1419] text-white rounded-xl min-h-[60px] font-bold text-sm md:text-base uppercase tracking-wider transition-colors shadow-md px-8 shrink-0">
              Search
            </button>
            
          </form>
        </div>
      </div>

      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6">
        
        {/* ── LEFT SIDEBAR (FILTERS) ── */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-28">
            <div className="flex items-center justify-between mb-4 border-b pb-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                Filters
              </h2>
              {selectedTimes.length > 0 && (
                <button onClick={clearFilters} className="text-[10px] text-[#B31B20] font-bold uppercase hover:underline">Clear all</button>
              )}
            </div>

            {/* Departure Time */}
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-900 mb-3">Departure Time</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Early Morning', sub: '4 am - 8 am' },
                  { label: 'Morning', sub: '8 am - 12 pm' },
                  { label: 'Afternoon', sub: '12 pm - 4 pm' },
                  { label: 'Evening', sub: '4 pm - 8 pm' },
                  { label: 'Night', sub: '8 pm - 12 am' }
                ].map((time) => {
                  const isActive = selectedTimes.includes(time.label);
                  return (
                    <button 
                      key={time.label} onClick={() => toggleTimeFilter(time.label)}
                      className={`flex flex-col items-center justify-center p-2 rounded border text-center transition-colors ${isActive ? 'bg-red-50 border-[#B31B20] text-[#B31B20]' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                    >
                      <span className="text-xs font-semibold">{time.label}</span>
                      <span className="text-[9px] text-gray-400 mt-0.5">{time.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Static Filters (As requested) */}
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-900 mb-3">Bus Type</p>
              <div className="flex gap-2">
                <div className="flex-1 text-center py-2 border border-[#B31B20] bg-red-50 text-[#B31B20] text-xs font-bold rounded">AC</div>
                <div className="flex-1 text-center py-2 border border-gray-200 text-gray-400 text-xs font-bold rounded bg-gray-50 opacity-50 cursor-not-allowed">Non-AC</div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs font-bold text-gray-900 mb-3">Single Seater/Sleeper</p>
              <div className="w-full text-center py-2 border border-[#B31B20] bg-red-50 text-[#B31B20] text-xs font-bold rounded">
                 Single Seater
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-900 mb-3 flex justify-between">Price <span>₹150</span></p>
              <div className="w-full h-1 bg-gray-200 rounded overflow-hidden">
                <div className="w-full h-full bg-[#B31B20]"></div>
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>₹150</span><span>₹150</span>
              </div>
            </div>

          </div>
        </aside>

        {/* ── MAIN CONTENT (BUS LIST) ── */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4 px-1">
            <h1 className="text-lg font-bold text-gray-900">{filteredSchedules.length} buses found</h1>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-10 h-10 border-4 border-[#B31B20] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-[#B31B20] p-4 rounded-lg text-center font-medium border border-red-100">{error}</div>
          ) : filteredSchedules.length === 0 ? (
            <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-200 text-center">
              <p className="text-gray-500 mb-4">No buses match your current filters.</p>
              <button onClick={clearFilters} className="text-[#B31B20] font-bold hover:underline">Clear all filters</button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredSchedules.map((s) => (
                <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  
                  {/* Top Row: Operator & Tag */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                       <div className="inline-block bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded mb-1 border border-green-200">★ 4.8</div>
                       <h3 className="font-bold text-gray-900 text-base">{s.bus.operatorName}</h3>
                       <p className="text-xs text-gray-500 mt-0.5">{s.bus.type}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-xl font-bold text-[#B31B20]">₹150</p>
                       <p className="text-xs text-gray-500">per seat</p>
                    </div>
                  </div>

                  {/* Middle Row: Timings */}
                  <div className="flex items-center justify-between py-4 border-y border-gray-100 mb-4">
                    <div className="text-left w-1/3">
                      <p className="text-lg font-bold text-gray-900">{formatTime(s.departureTime)}</p>
                      <p className="text-[10px] text-gray-500">{formatDate(s.departureTime)} · {s.origin}</p>
                    </div>
                    
                    <div className="flex flex-col items-center px-4 w-1/3">
                      <p className="text-[10px] text-gray-400 font-medium mb-1">{getDuration(s.departureTime, s.arrivalTime)}</p>
                      <div className="w-full flex items-center gap-2">
                        <div className="h-px bg-gray-300 flex-1"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                        <div className="h-px bg-gray-300 flex-1"></div>
                      </div>
                    </div>

                    <div className="text-right w-1/3">
                      <p className="text-lg font-bold text-gray-900">{formatTime(s.arrivalTime)}</p>
                      <p className="text-[10px] text-gray-500">{formatDate(s.arrivalTime)} · {s.destination}</p>
                    </div>
                  </div>

                  {/* Bottom Row: Actions */}
                  <div className="flex justify-between items-center">
                    
                    <button 
                      onClick={() => router.push(`/book/${s.id}`)}
                      className="bg-[#B31B20] hover:bg-[#8f1419] text-white px-6 py-2 rounded font-bold text-sm transition-colors shadow-sm"
                    >
                      Select Seat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// Wrap in Suspense for Next.js useSearchParams requirement
export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#B31B20] border-t-transparent rounded-full animate-spin"></div></div>}>
      <SearchContent />
    </Suspense>
  );
}