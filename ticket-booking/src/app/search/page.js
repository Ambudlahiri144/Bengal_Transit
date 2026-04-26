'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const LOCATIONS = ['KNI Airport', 'Nababhat Bus Stop', 'City Centre'];

// ── MASTER FLIGHT SCHEDULE MATRIX ──
const FLIGHT_SCHEDULES = [
  { id: 'DEL_ARR_1240', label: 'Delhi (DEL) - Arr 12:40 PM', type: 'ARR', days: [0,1,2,3,4,5,6] },
  { id: 'DEL_DEP_1830', label: 'Delhi (DEL) - Dep 06:30 PM', type: 'DEP', days: [0,1,2,3,4,5,6] },
  { id: 'HYD_ARR_1800', label: 'Hyderabad (HYD) - Arr 06:00 PM', type: 'ARR', days: [0,1,2,3,4,5,6] },
  { id: 'HYD_DEP_1310', label: 'Hyderabad (HYD) - Dep 01:10 PM', type: 'DEP', days: [0,1,2,3,4,5,6] },
  { id: 'MUM_ARR_1340', label: 'Mumbai (MUM) - Arr 01:40 PM', type: 'ARR', days: [0,1,3,4,5] },
  { id: 'MUM_DEP_1425', label: 'Mumbai (MUM) - Dep 02:25 PM', type: 'DEP', days: [0,1,3,4,5] },
  { id: 'BLR_ARR_1355', label: 'Bangalore (BLR) - Arr 01:55 PM', type: 'ARR', days: [0,1,2,3,4,5,6] },
  { id: 'BLR_DEP_1425', label: 'Bangalore (BLR) - Dep 02:25 PM', type: 'DEP', days: [0,1,2,3,4,5,6] },
  { id: 'MAA_ARR_1440', label: 'Chennai (MAA) - Arr 02:40 PM', type: 'ARR', days: [2] }, 
  { id: 'MAA_DEP_1550', label: 'Chennai (MAA) - Dep 03:50 PM', type: 'DEP', days: [2] }, 
  { id: 'MAA_ARR_1615', label: 'Chennai (MAA) - Arr 04:15 PM', type: 'ARR', days: [0,1,3,5] }, 
  { id: 'MAA_DEP_1655', label: 'Chennai (MAA) - Dep 04:55 PM', type: 'DEP', days: [0,1,3,5] }, 
];

const CustomDropdown = ({ value, options, onChange, placeholder, isFlight }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-transparent border-0 p-0 cursor-pointer flex items-center justify-between gap-2 group"
      >
        <div className="flex-1 min-w-0 text-left">
          <span className={`block truncate font-bold text-gray-900 leading-snug ${isFlight ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span
            className="block h-[2px] rounded-full mt-0.5 transition-all duration-300 ease-out"
            style={{ background: 'linear-gradient(90deg, #B31B20 0%, transparent 100%)', width: isOpen ? '100%' : '0%' }}
          />
        </div>
        <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isOpen ? 'bg-[rgba(179,27,32,0.12)] rotate-180' : 'bg-black/[0.04] group-hover:bg-[rgba(179,27,32,0.08)]'}`}>
          <svg className="w-2.5 h-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-[-12px] mt-2 py-1.5 rounded-xl overflow-hidden bg-white/95 backdrop-blur-md border border-[rgba(179,27,32,0.12)] shadow-xl w-[calc(100%+24px)] min-w-[220px] animate-in fade-in zoom-in-95 duration-200">
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isDisabled = opt.disabled;

            return (
              <div key={opt.value + idx}>
                {idx === 1 && isFlight && <div className="h-px mx-3 my-1 bg-gradient-to-r from-transparent via-red-900/10 to-transparent" />}
                <div
                  onClick={() => {
                    if (!isDisabled) {
                      onChange(opt.value);
                      setIsOpen(false);
                    }
                  }}
                  className={`relative px-3 py-2 flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors duration-150 select-none ${isDisabled ? 'text-gray-300 cursor-not-allowed italic' : isSelected ? 'text-[#B31B20] cursor-pointer' : 'text-gray-600 hover:text-[#B31B20] cursor-pointer'}`}
                  style={{ background: isSelected ? 'linear-gradient(90deg, rgba(179,27,32,0.05) 0%, transparent 100%)' : undefined }}
                >
                  {!isDisabled && (
                    <span className="absolute left-0 top-[20%] w-[3px] rounded-r-[3px] transition-all duration-200 bg-[#B31B20]" style={{ height: '60%', opacity: isSelected ? 1 : 0, transform: isSelected ? 'scaleY(1)' : 'scaleY(0.4)' }} />
                  )}
                  <span className="w-1 h-1 rounded-full flex-shrink-0 transition-colors duration-150" style={{ border: `1px solid ${isSelected ? '#B31B20' : 'currentColor'}`, background: isSelected ? '#B31B20' : 'transparent', opacity: isDisabled ? 0.3 : isSelected ? 1 : 0.45 }} />
                  <span className="leading-snug">{opt.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Initial State from URL
  const initialOrigin = searchParams.get('origin') || 'KNI Airport';
  const initialDest = searchParams.get('destination') || 'Nababhat Bus Stop';
  const initialDate = searchParams.get('date') || '';
  const initialFlight = searchParams.get('flight') || 'ALL';

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Top Bar Edit State
  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDest);
  const [date, setDate] = useState(initialDate || minDate);
  const [flight, setFlight] = useState(initialFlight);
  const [swapped, setSwapped] = useState(false);

  // Data State
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 👇 NEW: Admin Security State 👇
  const [isAdmin, setIsAdmin] = useState(false);

  // Filter State
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [priceLimit, setPriceLimit] = useState(150); 

  // DYNAMIC FLIGHT FILTER LOGIC
  const isArrival = origin === 'KNI Airport';
  const selectedDayOfWeek = new Date(date).getDay();
  
  const availableFlights = FLIGHT_SCHEDULES.filter(f => 
    f.type === (isArrival ? 'ARR' : 'DEP') && f.days.includes(selectedDayOfWeek)
  );

  useEffect(() => {
    const isValid = availableFlights.find(f => f.id === flight);
    if (!isValid && flight !== 'ALL' && flight !== 'NONE') {
      setFlight('ALL');
    }
  }, [origin, destination, date]);

  // Dropdown Formatters
  const locationOptions = LOCATIONS.map(loc => ({ value: loc, label: loc }));
  const flightOptions = [
    { value: 'ALL', label: 'Show All Scheduled Buses' },
    ...(availableFlights.length > 0 
        ? availableFlights.map(f => ({ value: f.id, label: f.label }))
        : [{ value: 'NONE_DISABLED', label: 'No flights mapped for this route today', disabled: true }]
    )
  ];

  // ── Fetch Data & Check Auth ──
  useEffect(() => {
    // 1. Check if user is ADMIN
    const userStr = sessionStorage.getItem('bengal_transit_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setIsAdmin(user.role === 'ADMIN');
    }

    // 2. Fetch Schedules
    const fetchSchedules = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/schedules/search?origin=${encodeURIComponent(initialOrigin)}&destination=${encodeURIComponent(initialDest)}&date=${initialDate}&flight=${initialFlight}`
        );
        if (!res.ok) throw new Error('Failed to fetch schedules');
        const data = await res.json();
        setSchedules(data);
        
        if (data.length > 0) {
          const maxP = Math.max(...data.map(s => Number(s.price) || 150));
          setPriceLimit(maxP);
        }

      } catch (err) {
        setError('System error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (initialOrigin && initialDest && initialDate) {
      fetchSchedules();
    }
  }, [initialOrigin, initialDest, initialDate, initialFlight]);

  // ── Top Bar Handlers ──
  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    setSwapped(!swapped);
  };

  const handleUpdateSearch = (e) => {
    e.preventDefault();
    if (flight !== 'ALL') {
      sessionStorage.setItem('bengal_transit_preferred_flight', flight);
    } else {
      sessionStorage.removeItem('bengal_transit_preferred_flight');
    }
    router.push(`/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${date}&flight=${flight}`);
  };

  // 👇 NEW: Delete Schedule Logic 👇
  const handleDeleteRoute = async (scheduleId) => {
    const confirmDelete = window.confirm("🚨 Are you sure you want to permanently delete this route? This action cannot be undone.");
    
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/schedules/${scheduleId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error('Failed to delete route from database.');
      
      // Instantly remove it from the UI without reloading
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
      
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // ── Formatting & Math ──
  const formatTime = (dt) => new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const formatDate = (dt) => new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const getDuration = (dep, arr) => {
    const diffMs = new Date(arr) - new Date(dep);
    return `${Math.floor(diffMs / 3_600_000)}h ${Math.floor((diffMs % 3_600_000) / 60_000)}m`;
  };
  
  const formatPrice = (p) => Number(p).toFixed(2).replace(/\.00$/, '');

  const prices = schedules.map(s => Number(s.price) || 150);
  const minDataPrice = prices.length > 0 ? Math.min(...prices) : 150;
  const maxDataPrice = prices.length > 0 ? Math.max(...prices) : 150;

  // ── Filter Logic ──
  const toggleTimeFilter = (timeLabel) => {
    setSelectedTimes(prev => prev.includes(timeLabel) ? prev.filter(t => t !== timeLabel) : [...prev, timeLabel]);
  };
  
  const clearFilters = () => {
    setSelectedTimes([]);
    setPriceLimit(maxDataPrice); 
  };

  const filteredSchedules = schedules.filter(schedule => {
    const sPrice = Number(schedule.price) || 150;
    if (sPrice > priceLimit) return false;
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
      
      {/* ── TOP EDIT BAR ── */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleUpdateSearch} className="flex flex-col xl:flex-row items-center justify-between gap-3 lg:gap-4 w-full">
            
            <button 
              type="button" 
              onClick={() => router.push('/')} 
              className="flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-[#B31B20] transition-colors self-start xl:self-center shrink-0 pr-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden lg:inline">Back</span>
            </button>

            <div className="w-full xl:flex-1 border border-gray-300 rounded-xl bg-white px-4 py-2 min-h-[50px] flex flex-col justify-center shadow-sm">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">From</label>
              <CustomDropdown value={origin} options={locationOptions} onChange={setOrigin} placeholder="Select Origin" />
            </div>
            
            <button type="button" onClick={handleSwap} className="p-2 text-gray-400 hover:text-[#B31B20] transition-colors -my-2 xl:my-0 z-10 bg-white rounded-full shrink-0">
              <svg className={`w-5 h-5 transition-transform ${swapped ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>

            <div className="w-full xl:flex-1 border border-gray-300 rounded-xl bg-white px-4 py-2 min-h-[50px] flex flex-col justify-center shadow-sm">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">To</label>
              <CustomDropdown value={destination} options={locationOptions} onChange={setDestination} placeholder="Select Destination" />
            </div>

            <div className="w-full xl:w-40 border border-gray-300 rounded-xl bg-white px-4 py-2 min-h-[50px] flex flex-col justify-center shadow-sm relative shrink-0">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Depart</label>
              <input 
                type="date" 
                value={date} 
                min={minDate} 
                onChange={(e) => setDate(e.target.value)} 
                required 
                className="bg-transparent border-0 p-0 text-sm sm:text-base font-bold text-gray-900 focus:ring-0 outline-none w-full cursor-pointer" 
              />
            </div>

            <div className="w-full xl:flex-[1.2] border border-gray-300 rounded-xl bg-white px-4 py-2 min-h-[50px] flex flex-col justify-center shadow-sm">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Connecting Flight</label>
              <CustomDropdown value={flight} options={flightOptions} onChange={setFlight} placeholder="Select Connecting Flight" isFlight={true} />
            </div>

            <button type="submit" className="w-full xl:w-auto bg-[#B31B20] hover:bg-[#8f1419] text-white rounded-xl min-h-[50px] font-bold text-sm md:text-base uppercase tracking-wider transition-colors shadow-md px-6 shrink-0">
              Update
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
              {(selectedTimes.length > 0 || priceLimit < maxDataPrice) && (
                <button onClick={clearFilters} className="text-[10px] text-[#B31B20] font-bold uppercase hover:underline">Clear all</button>
              )}
            </div>

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
              <p className="text-xs font-bold text-gray-900 mb-3 flex justify-between">
                Max Price <span className="text-[#B31B20]">₹{formatPrice(priceLimit)}</span>
              </p>
              
              <input 
                type="range" 
                min={minDataPrice} 
                max={maxDataPrice} 
                step="10"
                value={priceLimit} 
                onChange={(e) => setPriceLimit(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#B31B20] focus:outline-none focus:ring-2 focus:ring-[#B31B20] focus:ring-offset-2"
                disabled={minDataPrice === maxDataPrice} 
              />
              
              <div className="flex justify-between text-[10px] text-gray-500 mt-2 font-medium">
                <span>₹{formatPrice(minDataPrice)}</span>
                <span>₹{formatPrice(maxDataPrice)}</span>
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
                       <p className="text-xl font-bold text-[#B31B20]">₹{formatPrice(s.price || 150)}</p>
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

                  {/* 👇 UPDATED Bottom Row: Actions + Admin Controls 👇 */}
                  <div className="flex justify-between items-center mt-2">
                    
                    {/* If Admin, show Delete Button. Otherwise, keep it empty to maintain flex layout */}
                    {isAdmin ? (
                      <button 
                        onClick={() => handleDeleteRoute(s.id)}
                        className="text-[10px] sm:text-xs font-bold text-gray-400 hover:text-red-600 uppercase tracking-widest transition-colors flex items-center gap-1.5 p-2 -ml-2 rounded-lg hover:bg-red-50"
                        title="Permanently remove this route"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Remove Route
                      </button>
                    ) : (
                      <div aria-hidden="true" />
                    )}

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

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#B31B20] border-t-transparent rounded-full animate-spin"></div></div>}>
      <SearchContent />
    </Suspense>
  );
}