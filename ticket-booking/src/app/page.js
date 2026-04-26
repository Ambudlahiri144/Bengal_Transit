'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const LOCATIONS = ['KNI Airport', 'Nababhat Bus Stop', 'City Centre'];

// ── MASTER FLIGHT SCHEDULE MATRIX ──
// Days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const FLIGHT_SCHEDULES = [
  { id: 'DEL_ARR_1240', label: 'Delhi (DEL) - Arr 12:40 PM', type: 'ARR', days: [0,1,2,3,4,5,6] },
  { id: 'DEL_DEP_1830', label: 'Delhi (DEL) - Dep 06:30 PM', type: 'DEP', days: [0,1,2,3,4,5,6] },
  
  { id: 'HYD_ARR_1800', label: 'Hyderabad (HYD) - Arr 06:00 PM', type: 'ARR', days: [0,1,2,3,4,5,6] },
  { id: 'HYD_DEP_1310', label: 'Hyderabad (HYD) - Dep 01:10 PM', type: 'DEP', days: [0,1,2,3,4,5,6] },
  
  { id: 'MUM_ARR_1340', label: 'Mumbai (MUM) - Arr 01:40 PM', type: 'ARR', days: [0,1,3,4,5] },
  { id: 'MUM_DEP_1425', label: 'Mumbai (MUM) - Dep 02:25 PM', type: 'DEP', days: [0,1,3,4,5] },
  
  { id: 'BLR_ARR_1355', label: 'Bangalore (BLR) - Arr 01:55 PM', type: 'ARR', days: [0,1,2,3,4,5,6] },
  { id: 'BLR_DEP_1425', label: 'Bangalore (BLR) - Dep 02:25 PM', type: 'DEP', days: [0,1,2,3,4,5,6] },
  
  { id: 'MAA_ARR_1440', label: 'Chennai (MAA) - Arr 02:40 PM', type: 'ARR', days: [2] }, // Tuesday Only
  { id: 'MAA_DEP_1550', label: 'Chennai (MAA) - Dep 03:50 PM', type: 'DEP', days: [2] }, // Tuesday Only
  { id: 'MAA_ARR_1615', label: 'Chennai (MAA) - Arr 04:15 PM', type: 'ARR', days: [0,1,3,5] }, // Mon, Wed, Fri, Sun
  { id: 'MAA_DEP_1655', label: 'Chennai (MAA) - Dep 04:55 PM', type: 'DEP', days: [0,1,3,5] }, // Mon, Wed, Fri, Sun
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

      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-transparent border-0 p-0 cursor-pointer flex items-center justify-between gap-2 group"
      >
        <div className="flex-1 min-w-0 text-left">
          <span className={`block truncate font-bold text-gray-900 leading-snug
            ${isFlight ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {/* Animated underline */}
          <span
            className="block h-[2px] rounded-full mt-1 transition-all duration-300 ease-out"
            style={{
              background: 'linear-gradient(90deg, #B31B20 0%, transparent 100%)',
              width: isOpen ? '100%' : '0%',
            }}
          />
        </div>

        {/* Chevron pill */}
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300
            ${isOpen
              ? 'bg-[rgba(179,27,32,0.12)] rotate-180'
              : 'bg-black/[0.04] group-hover:bg-[rgba(179,27,32,0.08)]'
            }`}
        >
          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* ── Panel ── */}
      {isOpen && (
        <div
          className="absolute z-50 top-full left-[-18px] mt-3 py-1.5 rounded-[14px] overflow-hidden"
          style={{
            width: 'calc(100% + 36px)',
            minWidth: '240px',
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(179,27,32,0.12)',
            boxShadow: '0 2px 8px rgba(179,27,32,0.06), 0 12px 40px rgba(0,0,0,0.12)',
            animation: 'dropdownIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          <style>{`
            @keyframes dropdownIn {
              from { opacity: 0; transform: scaleY(0.88) translateY(-6px); }
              to   { opacity: 1; transform: scaleY(1) translateY(0); }
            }
            @keyframes itemIn {
              from { opacity: 0; transform: translateX(-6px); }
              to   { opacity: 1; transform: translateX(0); }
            }
          `}</style>

          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isDisabled = opt.disabled;

            return (
              <div key={opt.value + idx}>
                {/* Optional divider after first item (e.g. "Show All") */}
                {idx === 1 && isFlight && (
                  <div style={{
                    height: '1px',
                    margin: '4px 12px',
                    background: 'linear-gradient(90deg, transparent, rgba(179,27,32,0.1), transparent)'
                  }} />
                )}

                <div
                  onClick={() => {
                    if (!isDisabled) {
                      onChange(opt.value);
                      setIsOpen(false);
                    }
                  }}
                  className={`relative px-4 py-2.5 flex items-center gap-2.5 text-sm font-semibold
                    transition-colors duration-150 select-none
                    ${isDisabled
                      ? 'text-gray-300 cursor-not-allowed italic'
                      : isSelected
                        ? 'text-[#B31B20] cursor-pointer'
                        : 'text-gray-600 hover:text-[#B31B20] cursor-pointer'
                    }`}
                  style={{
                    animation: `itemIn 0.2s ${idx * 0.03}s both`,
                    background: isSelected
                      ? 'linear-gradient(90deg, rgba(179,27,32,0.08) 0%, transparent 90%)'
                      : undefined,
                  }}
                  onMouseEnter={e => {
                    if (!isSelected && !isDisabled) {
                      e.currentTarget.style.background = 'rgba(179,27,32,0.05)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {/* Left accent bar */}
                  {!isDisabled && (
                    <span
                      className="absolute left-0 top-[20%] w-[3px] rounded-r-[3px] transition-all duration-200"
                      style={{
                        height: '60%',
                        background: '#B31B20',
                        opacity: isSelected ? 1 : 0,
                        transform: isSelected ? 'scaleY(1)' : 'scaleY(0.4)',
                      }}
                    />
                  )}

                  {/* Dot indicator */}
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-150"
                    style={{
                      border: `1.5px solid ${isSelected ? '#B31B20' : 'currentColor'}`,
                      background: isSelected ? '#B31B20' : 'transparent',
                      opacity: isDisabled ? 0.3 : isSelected ? 1 : 0.45,
                    }}
                  />

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

export default function Home() {
  const router = useRouter();

  // ── Authentication Guard ─────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState(''); 

  useEffect(() => {
    const token = sessionStorage.getItem('bengal_transit_token');
    const userStr = sessionStorage.getItem('bengal_transit_user');
    
    if (!token) {
      router.push('/login');
    } else {
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        setUserName(parsedUser.name);
        setUserRole(parsedUser.role); 
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

  const [origin, setOrigin] = useState('Nababhat Bus Stop');
  const [destination, setDestination] = useState('KNI Airport');
  const [date, setDate] = useState(formattedDate);
  const [flight, setFlight] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 👇 DYNAMIC FLIGHT FILTER LOGIC 👇
  const isArrival = origin === 'KNI Airport';
  const selectedDayOfWeek = new Date(date).getDay();
  
  // Filter flights based on Arrival/Departure direction AND the exact day of the week
  const availableFlights = FLIGHT_SCHEDULES.filter(f => 
    f.type === (isArrival ? 'ARR' : 'DEP') && f.days.includes(selectedDayOfWeek)
  );

  // If the user swaps routes or dates, reset the flight to 'ALL' if the previously selected flight is no longer valid
  useEffect(() => {
    const isValid = availableFlights.find(f => f.id === flight);
    if (!isValid && flight !== 'ALL' && flight !== 'NONE') {
      setFlight('ALL');
    }
  }, [origin, destination, date]);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (origin === destination) {
      setError("Origin and Destination cannot be the same.");
      return;
    }
    if (flight !== 'ALL') {
      sessionStorage.setItem('bengal_transit_preferred_flight', flight);
    } else {
      sessionStorage.removeItem('bengal_transit_preferred_flight');
    }

    router.push(`/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${date}&flight=${flight}`);
  };


  if (!isAuthenticated) {
    return (
      <div className="min-h-[100dvh] bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#B31B20] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  const locationOptions = LOCATIONS.map(loc => ({ value: loc, label: loc }));
  
  const flightOptions = [
    { value: 'ALL', label: 'Show All Scheduled Buses' },
    ...(availableFlights.length > 0 
        ? availableFlights.map(f => ({ value: f.id, label: f.label }))
        : [{ value: 'NONE_DISABLED', label: 'No flights mapped for this route today', disabled: true }]
    )
  ];

  return (
    <main className="relative min-h-[100dvh] bg-white flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans overflow-hidden">

      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(179,27,32,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(179,27,32,0.03) 0%, transparent 50%)' }}
      />

      <div className="absolute top-8 left-4 sm:top-10 sm:left-10 md:top-16 md:left-16 z-10">
        <img src="/BAPL_logo.jpg" alt="Bengal Aerotropolis Projects Limited" className="h-12 sm:h-16 md:h-24 lg:h-32 w-auto object-contain" />
      </div>

      <div className="absolute top-8 right-4 sm:top-10 sm:right-10 md:top-16 md:right-16 z-20 flex items-center gap-2 sm:gap-4">
        {userRole === 'ADMIN' && (
          <button onClick={() => router.push('/admin')} className="flex items-center gap-1.5 bg-red-50 text-[#B31B20] border border-red-100 hover:bg-[#B31B20] hover:text-white px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors shadow-md">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Admin Panel
          </button>
        )}
        <button onClick={handleLogout} className="bg-red-50 text-[#B31B20] border border-red-100 hover:bg-[#B31B20] hover:text-white px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors shadow-md">
          Sign Out
        </button>
      </div>

      <div className="mb-8 md:mb-10 flex flex-col items-center text-center mt-24 sm:mt-16 md:mt-0 px-2 w-full">
        <img src="/KNI_logo.jpg" alt="Kazi Nazrul Islam Airport Durgapur" className="h-16 sm:h-20 md:h-28 w-auto object-contain mb-2" />
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-wide text-gray-800 break-words w-full">
          <span className="font-bold text-[#B31B20]">BENGAL</span> TRANSIT
        </h1>
        <p className="tracking-[0.15em] sm:tracking-[0.22em] text-gray-400 text-[10px] sm:text-xs mt-2 uppercase w-full">
          Express Booking Portal
        </p>
      </div>

      <form onSubmit={handleSearch} className="w-full max-w-6xl z-10 relative px-2 sm:px-0">
        <div className="flex flex-col lg:flex-row items-stretch rounded-2xl border border-gray-200 shadow-lg shadow-gray-100/80 bg-white overflow-visible relative">
          
          {/* 1. FROM */}
          <div className="relative flex-1 px-4 sm:px-6 py-4 border-b lg:border-b-0 lg:border-r border-gray-200 group">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-1">From</p>
            <CustomDropdown 
              value={origin} 
              options={locationOptions} 
              onChange={setOrigin} 
              placeholder="Select Origin" 
            />
            
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{origin === 'KNI Airport' || origin === 'City Centre' ? 'Durgapur, WB' : 'Burdwan, WB'}</p>

            <div className="hidden lg:flex absolute top-1/2 -right-5 -translate-y-1/2 z-20">
              <button type="button" onClick={handleSwap} aria-label="Swap origin and destination" className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-md hover:shadow-lg hover:border-[#B31B20] hover:bg-red-50 transition-all duration-200 group">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-500 group-hover:text-[#B31B20] transition-colors">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4" />
                  <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex lg:hidden justify-center py-2 border-b border-gray-200 bg-gray-50/50 relative z-10">
            <button type="button" onClick={handleSwap} className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-semibold text-gray-500 hover:border-[#B31B20] hover:text-[#B31B20] transition-all shadow-sm">
              Swap Route
            </button>
          </div>

          {/* 2. TO */}
          <div className="flex-1 px-4 sm:px-6 py-4 border-b lg:border-b-0 lg:border-r border-gray-200">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-1">To</p>
            <CustomDropdown 
              value={destination} 
              options={locationOptions} 
              onChange={setDestination} 
              placeholder="Select Destination" 
            />
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{destination === 'KNI Airport' || destination === 'City Centre' ? 'Durgapur, WB' : 'Burdwan, WB'}</p>
          </div>

          {/* 3. TRAVEL DATE */}
          <div className="flex-[0.8] px-4 sm:px-6 py-4 border-b lg:border-b-0 lg:border-r border-gray-200 hover:bg-gray-50 transition-colors">
            <p className="text-[10px] font-bold text-[#B31B20] uppercase tracking-[0.18em] mb-1">Travel Date</p>
            <input 
              type="date" value={date} min={formattedDate} onChange={(e) => setDate(e.target.value)} required 
              className="w-full bg-transparent border-0 p-0 text-lg sm:text-xl font-bold text-gray-900 focus:ring-0 outline-none cursor-pointer" 
            />
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Select your journey date</p>
          </div>

          {/* 4. DYNAMIC FLIGHT SELECTION */}
          <div className="flex-[1.2] px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors rounded-b-2xl lg:rounded-b-none lg:rounded-r-2xl">
            <p className="text-[10px] font-bold text-[#B31B20] uppercase tracking-[0.18em] mb-1">Travelling Flight</p>
            <CustomDropdown 
              value={flight} 
              options={flightOptions} 
              onChange={setFlight} 
              placeholder="Select Connecting Flight" 
              isFlight={true} 
            />
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
              {isArrival ? 'Showing Arrival Flights' : 'Showing Departure Flights'}
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-center lg:justify-end">
          <button type="submit" disabled={loading} className="bg-[#B31B20] text-white font-bold tracking-[0.12em] uppercase py-3 sm:py-4 px-8 sm:px-14 text-xs sm:text-sm hover:bg-[#8f1419] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-red-900/20 hover:shadow-xl rounded-sm w-full md:w-auto">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : 'Find Seats →'}
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








