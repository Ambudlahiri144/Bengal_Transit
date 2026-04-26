'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const LOCATIONS = ['KNI Airport', 'Nababhat Bus Stop', 'City Centre'];

const MASTER_FLIGHTS = [
  { id: 'DEL_ARR_1240', label: 'Delhi (DEL) - Arr 12:40 PM' },
  { id: 'DEL_DEP_1830', label: 'Delhi (DEL) - Dep 06:30 PM' },
  { id: 'HYD_ARR_1800', label: 'Hyderabad (HYD) - Arr 06:00 PM' },
  { id: 'HYD_DEP_1310', label: 'Hyderabad (HYD) - Dep 01:10 PM' },
  { id: 'MUM_ARR_1340', label: 'Mumbai (MUM) - Arr 01:40 PM' },
  { id: 'MUM_DEP_1425', label: 'Mumbai (MUM) - Dep 02:25 PM' },
  { id: 'BLR_ARR_1355', label: 'Bangalore (BLR) - Arr 01:55 PM' },
  { id: 'BLR_DEP_1425', label: 'Bangalore (BLR) - Dep 02:25 PM' },
  { id: 'MAA_ARR_1440', label: 'Chennai (MAA) - Arr 02:40 PM' },
  { id: 'MAA_DEP_1550', label: 'Chennai (MAA) - Dep 03:50 PM' },
  { id: 'MAA_ARR_1615', label: 'Chennai (MAA) - Arr 04:15 PM' },
  { id: 'MAA_DEP_1655', label: 'Chennai (MAA) - Dep 04:55 PM' },
];

// ── CUSTOM DROPDOWN — unchanged logic, restyled trigger+panel ──
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
          <span className={`block truncate font-bold text-gray-900 leading-snug ${isFlight ? 'text-sm sm:text-base' : 'text-sm'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span
            className="block h-[2px] rounded-full mt-1 transition-all duration-300 ease-out"
            style={{
              background: 'linear-gradient(90deg, #B31B20 0%, transparent 100%)',
              width: isOpen ? '100%' : '0%',
            }}
          />
        </div>
        <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isOpen ? 'bg-[rgba(179,27,32,0.12)] rotate-180' : 'bg-black/[0.04] group-hover:bg-[rgba(179,27,32,0.08)]'}`}>
          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 top-full left-[-18px] mt-3 py-1.5 rounded-[14px] overflow-hidden"
          style={{
            width: 'calc(100% + 36px)', minWidth: '240px',
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(179,27,32,0.12)',
            boxShadow: '0 2px 8px rgba(179,27,32,0.06), 0 12px 40px rgba(0,0,0,0.12)',
            animation: 'dropdownIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          <style>{`
            @keyframes dropdownIn { from{opacity:0;transform:scaleY(0.88) translateY(-6px)} to{opacity:1;transform:scaleY(1) translateY(0)} }
            @keyframes itemIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
          `}</style>
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isDisabled = opt.disabled;
            return (
              <div key={opt.value + idx}>
                {idx === 1 && isFlight && (
                  <div style={{ height: '1px', margin: '4px 12px', background: 'linear-gradient(90deg, transparent, rgba(179,27,32,0.1), transparent)' }} />
                )}
                <div
                  onClick={() => { if (!isDisabled) { onChange(opt.value); setIsOpen(false); } }}
                  className={`relative px-4 py-2.5 flex items-center gap-2.5 text-sm font-semibold transition-colors duration-150 select-none ${isDisabled ? 'text-gray-300 cursor-not-allowed italic' : isSelected ? 'text-[#B31B20] cursor-pointer' : 'text-gray-600 hover:text-[#B31B20] cursor-pointer'}`}
                  style={{ animation: `itemIn 0.2s ${idx * 0.03}s both`, background: isSelected ? 'linear-gradient(90deg, rgba(179,27,32,0.08) 0%, transparent 90%)' : undefined }}
                  onMouseEnter={e => { if (!isSelected && !isDisabled) e.currentTarget.style.background = 'rgba(179,27,32,0.05)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  {!isDisabled && (
                    <span className="absolute left-0 top-[20%] w-[3px] rounded-r-[3px] transition-all duration-200" style={{ height: '60%', background: '#B31B20', opacity: isSelected ? 1 : 0, transform: isSelected ? 'scaleY(1)' : 'scaleY(0.4)' }} />
                  )}
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-150" style={{ border: `1.5px solid ${isSelected ? '#B31B20' : 'currentColor'}`, background: isSelected ? '#B31B20' : 'transparent', opacity: isDisabled ? 0.3 : isSelected ? 1 : 0.45 }} />
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

// ── FIELD LABEL — consistent small caps label ──
const FieldLabel = ({ children, required }) => (
  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-2">
    {children}{required && <span className="text-[#B31B20] ml-0.5">*</span>}
  </label>
);

// ── INPUT CLASS — shared across all text/number/date inputs ──
const inputCls = `w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold
  text-gray-900 placeholder:text-gray-300 placeholder:font-normal
  focus:outline-none focus:border-[#B31B20] focus:ring-2 focus:ring-[rgba(179,27,32,0.08)]
  transition-all duration-200 hover:border-gray-300`;

// ── SECTION HEADER ──
const SectionHeader = ({ number, title, subtitle }) => (
  <div className="flex items-start gap-4 mb-6">
    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[rgba(179,27,32,0.06)] border border-[rgba(179,27,32,0.12)] flex items-center justify-center">
      <span className="text-[11px] font-black text-[#B31B20] tracking-tight">{number}</span>
    </div>
    <div>
      <h3 className="text-sm font-bold text-gray-900 tracking-tight leading-none">{title}</h3>
      {subtitle && <p className="text-[11px] text-gray-400 mt-1 leading-snug">{subtitle}</p>}
    </div>
  </div>
);

export default function AddRoutePage() {
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('bengal_transit_user') || '{}');
    if (user.role !== 'ADMIN') router.push('/login');
  }, [router]);

  const [formData, setFormData] = useState({
    operatorName: 'Bengal Transit Express',
    busNumber: '',
    capacity: 25,
    type: 'AC Seater',
    origin: 'KNI Airport',
    destination: 'Nababhat Bus Stop',
    date: '',
    time: '',
    durationMinutes: 120,
    price: 150,
  });

  const [selectedFlights, setSelectedFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleDropdownChange = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));
  const toggleFlight = (id) => setSelectedFlights(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const departureDateTime = new Date(`${formData.date}T${formData.time}`).toISOString();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, departureDateTime, cateredFlights: selectedFlights })
      });
      if (!res.ok) throw new Error('Failed to deploy new route');
      setMessage({ type: 'success', text: 'Route officially deployed to the live database!' });
      setFormData(prev => ({ ...prev, busNumber: '', time: '' }));
      setSelectedFlights([]);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const locationOptions = LOCATIONS.map(loc => ({ value: loc, label: loc }));

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        .section-card { animation: fadeUp 0.4s ease both; }
        .section-card:nth-child(2) { animation-delay: 0.08s; }
        .section-card:nth-child(3) { animation-delay: 0.16s; }
      `}</style>

      <main className="relative min-h-[100dvh] font-sans pb-20 overflow-x-hidden"
        style={{ background: 'linear-gradient(160deg, #fafafa 0%, #f4f3f1 100%)' }}>

        {/* ── Ambient red glow top-left ── */}
        <div className="absolute top-0 left-0 pointer-events-none"
          style={{ width: 'clamp(300px,40vw,500px)', height: 'clamp(300px,40vw,500px)', background: 'radial-gradient(circle, rgba(179,27,32,0.07) 0%, transparent 65%)', filter: 'blur(40px)' }} />

        {/* ── Top bar with logos ── */}
        <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 md:px-10 pt-5 sm:pt-7">
          <img src="/BAPL_logo.jpg" alt="Bengal Aerotropolis Projects Limited"
            className="h-10 sm:h-12 md:h-14 w-auto object-contain" />
          <img src="/KNI_logo.jpg" alt="Kazi Nazrul Islam Airport Durgapur"
            className="h-10 sm:h-12 md:h-14 w-auto object-contain" />
        </div>

        {/* ── Page header ── */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-6 sm:pb-8"
          style={{ animation: 'slideIn 0.35s ease both' }}>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-[#B31B20] transition-colors mb-4 group"
          >
            <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>

          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="inline-block w-1 h-6 rounded-sm bg-[#B31B20]" />
                <span className="text-[10px] font-black text-[#B31B20] uppercase tracking-[0.22em]">Admin Console</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 leading-none tracking-tight">
                Deploy New Route
              </h1>
              <p className="text-[11px] sm:text-xs text-gray-400 uppercase tracking-[0.18em] mt-2">
                Bus Schedule Configuration
              </p>
            </div>

            {/* Live status pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live DB</span>
            </div>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 space-y-4 sm:space-y-5">

          {/* Status message */}
          {message.text && (
            <div className={`rounded-xl px-5 py-4 text-sm font-semibold flex items-center gap-3 animate-[fadeUp_0.3s_ease_both] ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-[#B31B20] border border-red-200'
            }`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${message.type === 'success' ? 'bg-emerald-500' : 'bg-[#B31B20]'}`} />
              {message.text}
            </div>
          )}

          {/* ── SECTION 1: Bus & Capacity ── */}
          <div className="section-card bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.03)' }}>
            <div className="px-5 sm:px-8 pt-6 sm:pt-7 pb-5 sm:pb-7">
              <SectionHeader number="01" title="Bus & Capacity" subtitle="Vehicle identification and passenger configuration" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <FieldLabel required>Operator Name</FieldLabel>
                  <input type="text" name="operatorName" value={formData.operatorName}
                    onChange={handleChange} required className={inputCls} />
                </div>
                <div>
                  <FieldLabel required>Bus Number Plate</FieldLabel>
                  <input type="text" name="busNumber" value={formData.busNumber}
                    onChange={handleChange} placeholder="e.g. WB-72-2969" required
                    className={`${inputCls} uppercase font-black tracking-widest`} />
                </div>
                <div>
                  <FieldLabel required>Total Seats</FieldLabel>
                  <input type="number" name="capacity" value={formData.capacity}
                    onChange={handleChange} min="10" max="60" required className={inputCls} />
                </div>
                <div>
                  <FieldLabel required>Ticket Price (₹)</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">₹</span>
                    <input type="number" name="price" value={formData.price}
                      onChange={handleChange} min="0" required
                      className={`${inputCls} pl-8`} />
                  </div>
                </div>
              </div>
            </div>
            {/* Section footer stripe */}
            <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #B31B20 0%, rgba(179,27,32,0.15) 40%, transparent 100%)' }} />
          </div>

          {/* ── SECTION 2: Route & Timings ── */}
          <div className="section-card bg-white rounded-2xl border border-gray-100 overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.03)' }}>
            <div className="px-5 sm:px-8 pt-6 sm:pt-7 pb-5 sm:pb-7">
              <SectionHeader number="02" title="Route & Timings" subtitle="Origin, destination, and schedule configuration" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">

                {/* From dropdown */}
                <div>
                  <FieldLabel required>From</FieldLabel>
                  <div className={`${inputCls} flex items-center cursor-pointer`} style={{ padding: '10px 16px' }}>
                    <CustomDropdown
                      value={formData.origin}
                      options={locationOptions}
                      onChange={(val) => handleDropdownChange('origin', val)}
                      placeholder="Select Origin"
                    />
                  </div>
                </div>

                {/* To dropdown */}
                <div>
                  <FieldLabel required>To</FieldLabel>
                  <div className={`${inputCls} flex items-center cursor-pointer`} style={{ padding: '10px 16px' }}>
                    <CustomDropdown
                      value={formData.destination}
                      options={locationOptions}
                      onChange={(val) => handleDropdownChange('destination', val)}
                      placeholder="Select Destination"
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel required>Departure Date</FieldLabel>
                  <input type="date" name="date" value={formData.date}
                    onChange={handleChange} required className={inputCls} />
                </div>
                <div>
                  <FieldLabel required>Departure Time</FieldLabel>
                  <input type="time" name="time" value={formData.time}
                    onChange={handleChange} required className={inputCls} />
                </div>

                <div className="sm:col-span-2">
                  <FieldLabel required>Journey Duration (Minutes)</FieldLabel>
                  <div className="flex items-center gap-4">
                    <input type="number" name="durationMinutes" value={formData.durationMinutes}
                      onChange={handleChange} min="10" required
                      className={`${inputCls} w-40 flex-shrink-0`} />
                    
                  </div>
                </div>
              </div>
            </div>
            <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #B31B20 0%, rgba(179,27,32,0.15) 40%, transparent 100%)' }} />
          </div>

          {/* ── SECTION 3: Flight Targeting ── */}
          <div className="section-card bg-white rounded-2xl border border-gray-100 overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.03)' }}>
            <div className="px-5 sm:px-8 pt-6 sm:pt-7 pb-5 sm:pb-7">
              <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <SectionHeader
                  number="03"
                  title="Catered Flights"
                  subtitle="Link this bus to specific flight connections for smart search targeting"
                />
                {selectedFlights.length > 0 && (
                  <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-[10px] font-black text-[#B31B20] bg-[rgba(179,27,32,0.06)] border border-[rgba(179,27,32,0.12)] px-3 py-1.5 rounded-full uppercase tracking-wider animate-[fadeUp_0.2s_ease_both]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B31B20]" />
                    {selectedFlights.length} selected
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5">
                {MASTER_FLIGHTS.map((f, idx) => {
                  const isChecked = selectedFlights.includes(f.id);
                  return (
                    <label
                      key={f.id}
                      className={`relative flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border cursor-pointer
                        transition-all duration-200 group select-none
                        ${isChecked
                          ? 'bg-[rgba(179,27,32,0.04)] border-[rgba(179,27,32,0.25)] shadow-sm'
                          : 'bg-white border-gray-150 hover:border-gray-300 hover:bg-gray-50/80'
                        }`}
                      style={{
                        animation: `fadeUp 0.3s ease ${idx * 0.03}s both`,
                        borderColor: isChecked ? 'rgba(179,27,32,0.22)' : undefined,
                      }}
                    >
                      {/* Custom checkbox visual */}
                      <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all duration-200 border
                        ${isChecked
                          ? 'bg-[#B31B20] border-[#B31B20]'
                          : 'bg-white border-gray-300 group-hover:border-gray-400'
                        }`}>
                        {isChecked && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFlight(f.id)}
                        className="sr-only"
                      />
                      <span className={`text-[11px] sm:text-xs font-bold leading-snug transition-colors
                        ${isChecked ? 'text-[#B31B20]' : 'text-gray-600 group-hover:text-gray-800'}`}>
                        {f.label}
                      </span>

                      {/* Subtle red corner accent when selected */}
                      {isChecked && (
                        <span className="absolute top-0 right-0 w-0 h-0"
                          style={{
                            borderTop: '14px solid rgba(179,27,32,0.18)',
                            borderLeft: '14px solid transparent',
                            borderRadius: '0 10px 0 0',
                          }}
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #B31B20 0%, rgba(179,27,32,0.15) 40%, transparent 100%)' }} />
          </div>

          {/* ── Submit Footer ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 pb-4">
            <p className="text-[11px] text-gray-400 leading-relaxed">
              All fields marked <span className="text-[#B31B20] font-bold">*</span> are required.<br className="hidden sm:block" />
              Route will be instantly published to the live booking system.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="relative sm:w-auto w-full bg-[#B31B20] text-white px-8 sm:px-10 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.16em] hover:bg-[#8f1419] active:scale-[0.98] transition-all duration-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 overflow-hidden group"
              style={{ boxShadow: '0 4px 20px rgba(179,27,32,0.3)' }}
            >
              {/* Shine sweep on hover */}
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)' }} />

              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Publishing…</>
                : <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    Publish Route
                  </>
              }
            </button>
          </div>

        </form>
      </main>
    </>
  );
}