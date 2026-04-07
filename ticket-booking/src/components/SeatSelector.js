'use client';

import { useState, useEffect } from 'react';

const SeatSelector = ({ scheduleId, onProceedClick }) => {
  const totalSeats  = 15;
  const seatPrice   = 150;

  // ── State ────────────────────────────────────────────────────
  const [confirmedBookedSeats, setConfirmedBookedSeats] = useState([]);
  const [pendingLockedSeats,   setPendingLockedSeats]   = useState([]);
  const [selectedSeats,        setSelectedSeats]        = useState([]);
  const [loadingSeats,         setLoadingSeats]         = useState(true);

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

  // ── Trigger Modal in Parent ──────────────────────────────────
  const handleProceed = () => {
    if (selectedSeats.length > 0) {
      onProceedClick(selectedSeats, selectedSeats.length * seatPrice);
    }
  };

  // ── Render a single seat ─────────────────────────────────────
  const renderSeat = (id) => {
    const isConfirmedBooked = confirmedBookedSeats.includes(id);
    const isPendingLocked   = pendingLockedSeats.includes(id);
    const isOccupied        = isConfirmedBooked || isPendingLocked;
    const isSelected        = selectedSeats.includes(id);

    // Default to empty seat
    let imageSrc = 'empty_seat.png';
    let textColor = 'text-gray-500';
    let containerClass = 'cursor-pointer hover:scale-105 transition-transform';
    let imageOpacity = 'opacity-100';

    if (isConfirmedBooked) {
      imageSrc = 'taken_seat.png';
      textColor = 'text-gray-300 line-through';
      containerClass = 'cursor-not-allowed';
      imageOpacity = 'opacity-60'; 
    } else if (isPendingLocked) {
      imageSrc = 'taken_seat.png';
      textColor = 'text-amber-500';
      containerClass = 'cursor-not-allowed';
      imageOpacity = 'opacity-80';
    } else if (isSelected) {
      imageSrc = 'selected_seat.png';
      textColor = 'text-[#B31B20]';
      containerClass = 'cursor-pointer scale-105 drop-shadow-md transition-transform';
    }

    return (
      <div 
        key={id} 
        // Added sm:m-3 to give the bigger icons breathing room
        className={`flex flex-col items-center m-2 sm:m-3 ${containerClass}`} 
        onClick={() => toggleSeat(id)}
      >
        <img 
          src={`/${imageSrc}`} 
          alt={`Seat ${id}`} 
          // 👇 Scaled up the icons (w-10 to w-14 on desktop)
          className={`w-10 h-10 sm:w-14 sm:h-14 object-contain ${imageOpacity}`} 
        />
        {/* 👇 Added whitespace-nowrap to prevent double-digits from breaking to a new line */}
        <span className={`text-[10px] sm:text-[11px] mt-1.5 font-bold uppercase tracking-wider whitespace-nowrap ${textColor}`}>
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
      // Reduced side padding slightly to fit the bigger icons
      <div key={i} className="flex justify-between w-full px-2 sm:px-6 mb-2">
        <div className="flex">{seat1 <= totalSeats && renderSeat(seat1)}</div>
        {/* 👇 Widened the aisle to keep proportions correct */}
        <div className="w-10 sm:w-20" /> 
        <div className="flex">
          {seat2 <= totalSeats && renderSeat(seat2)}
          {seat3 <= totalSeats && renderSeat(seat3)}
        </div>
      </div>
    );
  }

  if (loadingSeats) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-[#B31B20] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full font-sans">
      
      {/* ── Legend ── */}
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded border border-emerald-100 text-xs font-bold">
          {remainingSeats} seats left
        </div>
        <div className="flex gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <img src="/selected_seat.png" alt="Selected" className="w-4 h-4 object-contain" /> 
            Selected
          </span>
          <span className="flex items-center gap-1.5">
            <img src="/taken_seat.png" alt="Taken" className="w-4 h-4 object-contain opacity-60" /> 
            Taken
          </span>
        </div>
      </div>

      {/* ── Bus Layout Container ── */}
      {/* 👇 Changed from max-w-sm to max-w-md to widen the bus body */}
      <div className="bg-[#f8f9fa] border border-gray-200 rounded-[3rem] p-6 sm:p-10 relative max-w-md mx-auto shadow-inner">
        
        {/* Steering Wheel PNG */}
        <div className="flex justify-end mb-6 pr-2 sm:pr-6">
          <img 
            src="/drive.png" 
            alt="Steering Wheel" 
            // 👇 Scaled the steering wheel up slightly to match the larger seats
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain opacity-40" 
          />
        </div>
        
        {rows}
      </div>

      {/* ── Summary & CTA ── */}
      <div className="mt-6 md:mt-8 pt-5 md:pt-6 border-t border-gray-100 px-1 sm:px-2 flex flex-col gap-4">
        
        {/* Top line: Selected & Total */}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-bold mb-0.5 sm:mb-1">Selected</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
              {selectedSeats.length > 0 ? selectedSeats.sort((a, b) => a - b).join(', ') : 'None'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-bold mb-0.5 sm:mb-1">Total</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#B31B20]">
              ₹{(selectedSeats.length * seatPrice).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Bottom line: Full-width button */}
        <button
          onClick={handleProceed}
          disabled={selectedSeats.length === 0}
          className={`w-full py-3 sm:py-3.5 rounded-lg font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md ${
            selectedSeats.length > 0 
              ? 'bg-[#B31B20] hover:bg-[#8f1419] text-white' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          Proceed to Booking
        </button>

      </div>
      {/* 👆 ── THE FIX ENDS ── 👆 */}

    </div>
  );
};
export default SeatSelector;