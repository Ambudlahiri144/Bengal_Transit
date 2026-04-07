'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SeatSelector from '../../../components/SeatSelector';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const scheduleId = params.scheduleId;

  const [scheduleInfo, setScheduleInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Modal & Booking State ──
  const [showModal, setShowModal] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingError, setBookingError] = useState('');
  
  const [passengerDetails, setPassengerDetails] = useState({
    name: '',
    age: '',
    mobile: '',
    email: ''
  });

  useEffect(() => {
    if (!scheduleId) return;

    const fetchSchedule = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/schedules/${scheduleId}`);
        if (!res.ok) throw new Error('Schedule not found.');
        const data = await res.json();
        setScheduleInfo(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [scheduleId]);

  const formatTime = (dt) => new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const formatDate = (dt) => new Date(dt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const getDuration = (dep, arr) => {
    const diffMs = new Date(arr) - new Date(dep);
    return `${Math.floor(diffMs / 3_600_000)}h ${Math.floor((diffMs % 3_600_000) / 60_000)}m`;
  };

  const handleInputChange = (e) => {
    setPassengerDetails({ ...passengerDetails, [e.target.name]: e.target.value });
  };

  const isFormValid = passengerDetails.name.trim() !== '' && passengerDetails.age.trim() !== '' && passengerDetails.mobile.trim() !== '';

  // ── THE REAL API BOOKING LOGIC ──
  const handleConfirmBooking = async () => {
    setBookingInProgress(true);
    setBookingError('');

    try {
      const userStr = sessionStorage.getItem('bengal_transit_user');
      const userId = userStr ? JSON.parse(userStr).id : 1;

      const lockRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/bookings/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId, 
          scheduleId: parseInt(scheduleId),
          seatNumbers: selectedSeats,
          passengerName: passengerDetails.name,
          passengerAge: parseInt(passengerDetails.age),
          passengerMobile: passengerDetails.mobile,
          passengerEmail: passengerDetails.email
        }),
      });

      if (!lockRes.ok) {
        const err = await lockRes.json();
        throw new Error(err.error || 'Failed to lock seats.');
      }

      const { booking } = await lockRes.json();

      const confirmRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/bookings/${booking.id}/confirm`, { 
        method: 'PATCH' 
      });

      if (!confirmRes.ok) {
        const err = await confirmRes.json();
        throw new Error(err.error || 'Failed to confirm booking.');
      }

      router.push(`/book/confirmation/${booking.id}`);

    } catch (err) {
      console.error('Booking error:', err);
      setBookingError(err.message);
      setBookingInProgress(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[100dvh] bg-gray-50 flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-[#B31B20] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (error || !scheduleInfo) {
    return (
      <main className="min-h-[100dvh] bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-[#B31B20] font-semibold text-lg">{error || 'Schedule missing'}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm font-bold text-gray-500 hover:text-[#B31B20]">Go Back</button>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-gray-50 py-6 sm:py-8 px-3 sm:px-6 lg:px-8 font-sans relative">
      
      {/* ── Top Navigation ── */}
      <div className="max-w-[90rem] mx-auto mb-6 flex justify-between items-center">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-500 hover:text-[#B31B20] transition-colors">
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Search
        </button>
        <img src="/KNI_logo.jpg" alt="KNI Logo" className="h-8 sm:h-10 md:h-12 w-auto object-contain" />
      </div>

      {/* ── Side-by-Side Layout ── */}
      <div className="max-w-[90rem] mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        
        {/* 👇 THE FIX: Added 'order-2 lg:order-1' so it goes to the bottom on mobile 👇 */}
        {/* ── LEFT: Seat Selector ── */}
        <div className="w-full lg:w-3/5 order-2 lg:order-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6 sm:mb-8 border-b pb-3 sm:pb-4">Select your seats</h2>
          
          <SeatSelector
            scheduleId={scheduleId}
            onProceedClick={(seats) => {
              setSelectedSeats(seats);
              setShowModal(true);
            }} 
          />
        </div>

        {/* 👇 THE FIX: Added 'order-1 lg:order-2' so it jumps to the top on mobile 👇 */}
        {/* ── RIGHT: Bus Details ── */}
        <div className="w-full lg:w-2/5 order-1 lg:order-2 flex flex-col gap-6 lg:sticky lg:top-8">
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 lg:p-8">
            
            {/* Header info */}
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                {scheduleInfo.bus?.operatorName} <br/>
                <span className="text-sm sm:text-base font-medium text-gray-500">({scheduleInfo.origin} to {scheduleInfo.destination})</span>
              </h1>
              <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] sm:text-xs font-bold px-2 py-1 rounded border border-green-200">
                ★ 4.8
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-500 mb-5 sm:mb-6">
              {formatTime(scheduleInfo.departureTime)} - {formatTime(scheduleInfo.arrivalTime)} · {formatDate(scheduleInfo.departureTime)} <br/>
              Express ({scheduleInfo.bus?.type})
            </p>

            {/* Scaled Image Slider for Mobile */}
            <div className="flex overflow-x-auto gap-3 pb-3 mb-5 sm:mb-6 snap-x hide-scrollbar">
              <img 
                src="/bus_1.png" 
                alt="Bus exterior" 
                className="w-48 h-32 sm:w-56 sm:h-36 object-cover rounded-lg snap-start border border-gray-200 flex-shrink-0"
              />
              <img 
                src="/bus_2.png" 
                alt="Bus interior" 
                className="w-48 h-32 sm:w-56 sm:h-36 object-cover rounded-lg snap-start border border-gray-200 flex-shrink-0"
              />
              <img 
                src="/bus_3.png" 
                alt="Bus seating" 
                className="w-48 h-32 sm:w-56 sm:h-36 object-cover rounded-lg snap-start border border-gray-200 flex-shrink-0"
              />
            </div>

            {/* Tab (Only Bus Route remains) */}
            <div className="flex gap-6 border-b border-gray-200 mb-5 sm:mb-6">
              <button className="pb-2 border-b-2 border-[#B31B20] text-xs sm:text-sm font-bold text-gray-900">Bus Route</button>
            </div>

            {/* Route Details */}
            <div className="mb-2">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 mb-4">{getDuration(scheduleInfo.departureTime, scheduleInfo.arrivalTime)} total duration</p>
              
              {/* Departure Node */}
              <div className="flex gap-3 sm:gap-4 relative">
                <div className="text-right w-14 sm:w-16 shrink-0">
                  <p className="font-bold text-gray-900 text-xs sm:text-sm">{formatTime(scheduleInfo.departureTime)}</p>
                </div>
                <div className="relative flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#B31B20] z-10 ring-4 ring-white"></div>
                  <div className="w-[2px] h-full bg-gray-200 absolute top-2 bottom-0"></div>
                </div>
                <div className="pb-6 sm:pb-8">
                  <p className="font-bold text-gray-800 text-xs sm:text-sm">{scheduleInfo.origin}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Durgapur, West Bengal</p>
                </div>
              </div>

              {/* Arrival Node */}
              <div className="flex gap-3 sm:gap-4 relative">
                <div className="text-right w-14 sm:w-16 shrink-0">
                  <p className="font-bold text-gray-900 text-xs sm:text-sm">{formatTime(scheduleInfo.arrivalTime)}</p>
                </div>
                <div className="relative flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400 z-10 ring-4 ring-white"></div>
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-xs sm:text-sm">{scheduleInfo.destination}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Burdwan, West Bengal</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          GLASSMORPHISM PASSENGER POP-UP (MOBILE OPTIMIZED)
      ══════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          
          <div className="bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl rounded-xl sm:rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="bg-[#B31B20] px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center text-white">
              <div>
                <h3 className="font-bold text-base sm:text-lg tracking-wide">Passenger Details</h3>
                <p className="text-[9px] sm:text-[10px] text-white/70 uppercase tracking-widest mt-0.5">Required for Ticket Issuance</p>
              </div>
              <button onClick={() => setShowModal(false)} disabled={bookingInProgress} className="text-white/70 hover:text-white transition-colors disabled:opacity-50">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
              
              {bookingError && (
                <div className="bg-red-50 border border-red-200 text-[#B31B20] text-xs font-bold px-3 py-2 sm:py-3 rounded-lg text-center">
                  {bookingError}
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Passenger Name *</label>
                <input 
                  type="text" name="name" value={passengerDetails.name} onChange={handleInputChange} required disabled={bookingInProgress}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#B31B20] focus:ring-1 focus:ring-[#B31B20] transition-colors" 
                  placeholder="e.g. Rahul Sharma" 
                />
              </div>

              <div className="flex gap-3 sm:gap-4">
                <div className="w-1/3">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Age *</label>
                  <input 
                    type="number" name="age" value={passengerDetails.age} onChange={handleInputChange} min="1" max="120" required disabled={bookingInProgress}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#B31B20] focus:ring-1 focus:ring-[#B31B20] transition-colors" 
                    placeholder="25" 
                  />
                </div>
                <div className="w-2/3">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Mobile Number *</label>
                  <input 
                    type="tel" name="mobile" value={passengerDetails.mobile} onChange={handleInputChange} required disabled={bookingInProgress}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#B31B20] focus:ring-1 focus:ring-[#B31B20] transition-colors" 
                    placeholder="+91" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Email Address <span className="lowercase text-gray-400 font-medium">(Optional)</span></label>
                <input 
                  type="email" name="email" value={passengerDetails.email} onChange={handleInputChange} disabled={bookingInProgress}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#B31B20] focus:ring-1 focus:ring-[#B31B20] transition-colors" 
                  placeholder="passenger@example.com" 
                />
              </div>

              <button 
                onClick={handleConfirmBooking}
                disabled={!isFormValid || bookingInProgress}
                className={`mt-2 sm:mt-4 w-full py-3 sm:py-4 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-md flex justify-center items-center
                  ${isFormValid && !bookingInProgress
                    ? 'bg-[#B31B20] hover:bg-[#8f1419] text-white shadow-red-900/20 hover:shadow-xl cursor-pointer' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  }`}
              >
                {bookingInProgress ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Locking Seats...
                  </span>
                ) : (
                  'Confirm Seats'
                )}
              </button>

            </div>
          </div>
        </div>
      )}

    </main>
  );
}