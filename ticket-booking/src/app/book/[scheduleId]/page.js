'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import SeatSelector from '../../../components/SeatSelector';

export default function BookingPage() {
  const params = useParams();
  const scheduleId = params.scheduleId;

  const [scheduleInfo, setScheduleInfo] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

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

  const formatTime = (dt) =>
    new Date(dt).toLocaleTimeString('en-IN', {
      hour:   '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  const formatDate = (dt) =>
    new Date(dt).toLocaleDateString('en-IN', {
      weekday: 'short',
      day:     'numeric',
      month:   'short',
      year:    'numeric',
    });

  const getDuration = (dep, arr) => {
    const diffMs   = new Date(arr) - new Date(dep);
    const hours    = Math.floor(diffMs / 3_600_000);
    const minutes  = Math.floor((diffMs % 3_600_000) / 60_000);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <main className="min-h-[100dvh] bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-[#B31B20] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-xs sm:text-sm uppercase tracking-wider">Loading schedule…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[100dvh] bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center px-4">
          <p className="text-[#B31B20] font-semibold text-base sm:text-lg">{error}</p>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">Please go back and try again.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-gray-50 py-10 sm:py-12 px-2 sm:px-4 font-sans relative">
      <img 
        src="/KNI_logo.jpg" 
        alt="KNI Logo" 
        className="absolute top-4 left-4 sm:top-6 sm:left-8 md:left-12 h-12 sm:h-16 md:h-20 w-auto object-contain" 
      />

      {/* ── Page header ── */}
      <div className="max-w-4xl mx-auto mt-16 sm:mt-8 md:mt-0 mb-8 sm:mb-10 text-center px-4">
        <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-1 sm:mb-2">
          Bengal Transit · Express Booking
        </p>
        <h1 className="text-2xl sm:text-3xl font-light text-gray-800">
          SELECT <span className="font-bold text-[#B31B20]">SEATS</span>
        </h1>
      </div>

      {/* ── Route summary card ── */}
      {scheduleInfo && (
        <div className="max-w-2xl mx-auto mb-8 sm:mb-10 bg-white border border-gray-200 rounded-2xl shadow-sm px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between">

            {/* Origin */}
            <div className="text-left flex-1">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                {scheduleInfo.origin}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{formatTime(scheduleInfo.departureTime)}</p>
              <p className="text-[10px] sm:text-xs text-gray-400">{formatDate(scheduleInfo.departureTime)}</p>
            </div>

            {/* Arrow + duration */}
            <div className="flex flex-col items-center px-2 sm:px-4 flex-shrink-0">
              <p className="text-[10px] sm:text-xs text-gray-400 mb-1">
                {getDuration(scheduleInfo.departureTime, scheduleInfo.arrivalTime)}
              </p>
              <div className="flex items-center gap-1">
                <div className="w-8 sm:w-16 h-px bg-gray-300" />
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-[#B31B20]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-[8px] sm:text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
                {scheduleInfo.bus?.type ?? 'Bus'}
              </p>
            </div>

            {/* Destination */}
            <div className="text-right flex-1">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                {scheduleInfo.destination}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{formatTime(scheduleInfo.arrivalTime)}</p>
              <p className="text-[10px] sm:text-xs text-gray-400">{formatDate(scheduleInfo.arrivalTime)}</p>
            </div>
          </div>

          {/* Bus info row */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 text-[10px] sm:text-xs text-gray-500">
            <span>
              🚌 {scheduleInfo.bus?.operatorName} &nbsp;·&nbsp; {scheduleInfo.bus?.busNumber}
            </span>
            <span className="font-bold text-[#B31B20] text-xs sm:text-sm">
              ₹150 / seat
            </span>
          </div>
        </div>
      )}

      {/* ── Seat selector ── */}
      <SeatSelector
        scheduleId={scheduleId}
        scheduleInfo={scheduleInfo}
      />

    </main>
  );
}