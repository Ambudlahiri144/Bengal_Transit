'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ─────────────────────────────────────────────────────────────
// SeatSelector.js — now wired to real API + booking flow
// Props:
//   scheduleId  : string | number  (from URL params)
//   scheduleInfo: object           (origin, destination, departureTime, price, bus)
// ─────────────────────────────────────────────────────────────
const SeatSelector = ({ scheduleId, scheduleInfo }) => {
  const router = useRouter();

  const totalSeats  = 15;
  const seatPrice   = 150;

  // ── State ────────────────────────────────────────────────────
  const [confirmedBookedSeats, setConfirmedBookedSeats] = useState([]);
  const [pendingLockedSeats,   setPendingLockedSeats]   = useState([]);
  const [selectedSeats,        setSelectedSeats]        = useState([]);
  const [loadingSeats,         setLoadingSeats]         = useState(true);
  const [bookingInProgress,    setBookingInProgress]    = useState(false);
  const [bookingError,         setBookingError]         = useState('');

  // ── Fetch occupied seats on mount ───────────────────────────
  useEffect(() => {
    if (!scheduleId) return;

    const fetchOccupied = async () => {
      try {
        const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/schedules/${scheduleId}/seats`);
        const data = await res.json();
        setConfirmedBookedSeats(data.confirmedSeats ?? []);
        setPendingLockedSeats(data.pendingSeats   ?? []);
      } catch (err) {
        console.error('Failed to fetch seat availability:', err);
        // Fall back to empty — seats will still work, worst case
        // double-booking is caught server-side by the lock endpoint
      } finally {
        setLoadingSeats(false);
      }
    };

    fetchOccupied();
  }, [scheduleId]);

  const occupiedSeats = [...confirmedBookedSeats, ...pendingLockedSeats];
  const remainingSeats = totalSeats - occupiedSeats.length - selectedSeats.length;

  // ── Seat toggle ──────────────────────────────────────────────
  const toggleSeat = (id) => {
    if (occupiedSeats.includes(id)) return;
    setSelectedSeats(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // ── Booking handler ──────────────────────────────────────────
  const handleProceedToBooking = async () => {
    if (selectedSeats.length === 0) return;

    setBookingInProgress(true);
    setBookingError('');

    try {
      // 1. Lock seats (creates a Pending booking)
      const lockRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/bookings/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:      1,          // TODO: replace with real auth user ID
          scheduleId:  parseInt(scheduleId),
          seatNumbers: selectedSeats,
        }),
      });

      if (!lockRes.ok) {
        const err = await lockRes.json();
        throw new Error(err.error || 'Failed to lock seats.');
      }

      const { booking } = await lockRes.json();

      // 2. Confirm the booking immediately
      //    (In production, this would happen AFTER payment gateway callback)
      const confirmRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/bookings/${booking.id}/confirm`,
          { method: 'PATCH' }
      );

      if (!confirmRes.ok) {
        const err = await confirmRes.json();
        throw new Error(err.error || 'Failed to confirm booking.');
      }

      // 3. Navigate to confirmation page
      router.push(`/book/confirmation/${booking.id}`);

    } catch (err) {
      console.error('Booking error:', err);
      setBookingError(err.message);
      setBookingInProgress(false);
    }
  };

  // ── Render a single seat ─────────────────────────────────────
  const renderSeat = (id) => {
    const isConfirmedBooked = confirmedBookedSeats.includes(id);
    const isPendingLocked   = pendingLockedSeats.includes(id);
    const isOccupied        = isConfirmedBooked || isPendingLocked;
    const isSelected        = selectedSeats.includes(id);

    let strokeColor = 'text-gray-400 hover:text-[#B31B20] cursor-pointer';
    let fillColor   = 'white';
    let textColor   = 'text-gray-700';

    if (isConfirmedBooked) {
      strokeColor = 'text-gray-300 cursor-not-allowed';
      fillColor   = '#f3f4f6';
      textColor   = 'text-gray-400 line-through';
    } else if (isPendingLocked) {
      strokeColor = 'text-amber-300 cursor-not-allowed';
      fillColor   = '#fef3c7';
      textColor   = 'text-amber-500';
    } else if (isSelected) {
      strokeColor = 'text-[#B31B20]';
      fillColor   = '#fff1f1';
      textColor   = 'text-[#B31B20]';
    }

    return (
      <div
        key={id}
        className="flex flex-col items-center m-2 relative"
        onClick={() => toggleSeat(id)}
        title={
          isConfirmedBooked ? 'Booked'
          : isPendingLocked  ? 'Temporarily held'
          : isSelected       ? 'Selected — click to deselect'
          : `Seat ${id} — ₹${seatPrice}`
        }
      >
        <div
          className={`w-12 h-12 relative transition-all duration-200 ${strokeColor} ${
            isSelected ? 'drop-shadow-md scale-105' : ''
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            <rect x="6" y="3" width="12" height="15" rx="2.5" fill={fillColor} />
            <path d="M4 10v9a3 3 0 003 3h10a3 3 0 003-3v-9" strokeLinecap="round" />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center pb-2">
            {isSelected && (
              <svg className="w-5 h-5 text-[#B31B20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {isConfirmedBooked && (
              <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            )}
            {isPendingLocked && !isConfirmedBooked && (
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-10V5a2 2 0 10-4 0v4" />
              </svg>
            )}
          </div>
        </div>

        <span className={`text-[10px] mt-1 font-semibold uppercase tracking-wider ${textColor}`}>
          {isOccupied ? (isPendingLocked ? 'Held' : 'Taken') : `Seat ${id}`}
        </span>
      </div>
    );
  };

  // ── Build seat grid ──────────────────────────────────────────
  const rows = [];
  const rowCount = Math.ceil(totalSeats / 3);

  for (let i = 0; i < rowCount; i++) {
    const startId = i * 3 + 1;
    const seat1   = startId;
    const seat2   = startId + 1;
    const seat3   = startId + 2;

    rows.push(
      <div key={i} className="flex justify-between w-full px-6 mb-1">
        <div className="flex">{seat1 <= totalSeats && renderSeat(seat1)}</div>
        <div className="w-10" />
        <div className="flex">
          {seat2 <= totalSeats && renderSeat(seat2)}
          {seat3 <= totalSeats && renderSeat(seat3)}
        </div>
      </div>
    );
  }

  if (loadingSeats) {
    return (
      <div className="max-w-sm mx-auto p-8 bg-white rounded-2xl shadow-xl border border-gray-200 text-center">
        <div className="w-8 h-8 border-4 border-[#B31B20] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading seat availability…</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto p-4 bg-white rounded-2xl shadow-xl border border-gray-200 font-sans">

      {/* ── Header stats ── */}
      <div className="flex justify-between items-center mb-5 px-4">
        <div className="bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
          {remainingSeats} seats left
        </div>

        {/* Legend */}
        <div className="flex gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-[#fff1f1] border border-[#B31B20] inline-block" />
            Selected
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300 inline-block" />
            Held
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-gray-200 border border-gray-300 inline-block" />
            Taken
          </span>
        </div>
      </div>

      {/* ── Seat grid ── */}
      <div className="border-[3px] border-gray-300 rounded-[2rem] py-6 relative bg-gray-50/30">
        {/* Bus front indicator */}
        <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
          ▲ Front
        </p>
        {rows}
      </div>

      {/* ── Summary & CTA ── */}
      <div className="mt-6 border-t pt-4 px-2">
        {bookingError && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm font-medium">
            {bookingError}
          </div>
        )}

        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
              Selected Seats
            </p>
            <p className="text-lg font-bold text-gray-800">
              {selectedSeats.length > 0 ? selectedSeats.sort((a, b) => a - b).join(', ') : 'None'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total</p>
            <p className="text-2xl font-bold text-[#B31B20]">
              ₹{(selectedSeats.length * seatPrice).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <button
          onClick={handleProceedToBooking}
          disabled={selectedSeats.length === 0 || bookingInProgress}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-lg tracking-wide transition-all ${
            selectedSeats.length > 0 && !bookingInProgress
              ? 'bg-[#B31B20] hover:bg-[#8f1419] text-white shadow-md hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {bookingInProgress ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Confirming…
            </span>
          ) : (
            'Proceed to Booking'
          )}
        </button>
      </div>
    </div>
  );
};

export default SeatSelector;