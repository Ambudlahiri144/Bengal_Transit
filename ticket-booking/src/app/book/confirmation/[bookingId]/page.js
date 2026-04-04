'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import QRCode from 'react-qr-code';

export default function ConfirmationPage() {
  const params  = useParams();
  const router  = useRouter();
  const bookingId = params.bookingId;

  const ticketRef = useRef(null);

  const [booking,        setBooking]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [pdfLoading,     setPdfLoading]     = useState(false);
  const [shareLoading,   setShareLoading]   = useState(false);
  const [copied,         setCopied]         = useState(false);
  const [ticketUrl,      setTicketUrl]      = useState(''); // For QR Code & Sharing

  // ── Fetch booking ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTicketUrl(window.location.href);
    }

    if (!bookingId) return;

    const fetchBooking = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${bookingId}`);
        if (!res.ok) throw new Error('Booking not found.');
        const data = await res.json();
        setBooking(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  // ── Format helpers ─────────────────────────────────────────────────────────
  const formatTime = (dt) =>
    new Date(dt).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

  const formatDate = (dt) =>
    new Date(dt).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

  const formatDateShort = (dt) =>
    new Date(dt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

  const getDuration = (dep, arr) => {
    const diffMs  = new Date(arr) - new Date(dep);
    const hours   = Math.floor(diffMs / 3_600_000);
    const mins    = Math.floor((diffMs % 3_600_000) / 60_000);
    return `${hours}h ${mins}m`;
  };

  // 1. FIXED PRICE: Hardcoded to 150
  const SEAT_PRICE = 150;
  const totalFare = booking ? SEAT_PRICE * booking.seatNumbers.length : 0;

  // ── PDF generation ─────────────────────────────────────────────────────────
  const generatePdf = async () => {
    if (!booking || !ticketRef.current) return;
    setPdfLoading(true);

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(ticketRef.current, {
        scale:           3,
        useCORS:         true,
        backgroundColor: '#ffffff',
        logging:         false,
      });

      const imgData  = canvas.toDataURL('image/png');
      const pdf      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageW    = pdf.internal.pageSize.getWidth();
      const pageH    = pdf.internal.pageSize.getHeight();
      const margin   = 15;
      const maxW     = pageW - margin * 2;
      const imgW     = canvas.width;
      const imgH     = canvas.height;
      const ratio    = Math.min(maxW / imgW, (pageH - margin * 2) / imgH);
      const finalW   = imgW * ratio;
      const finalH   = imgH * ratio;
      const xOffset  = (pageW - finalW) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, margin, finalW, finalH);

      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      const footer = `Booking Ref: #${booking.id}  ·  Generated: ${new Date().toLocaleString('en-IN')}  ·  Bengal Transit Express`;
      pdf.text(footer, pageW / 2, pageH - 8, { align: 'center' });

      pdf.save(`BengalTransit_Ticket_${booking.id}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF generation failed. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Share ticket ──────────────────────────────────────────────────────────
  const shareTicket = async () => {
    if (!booking) return;

    const shareTitle = `Bengal Transit Ticket #${booking.id}`;
    const shareText = `Here is my bus ticket (Ref: #${booking.id}) for ${booking.schedule.origin} to ${booking.schedule.destination}. View the live ticket here:`;
    // Fallback to window.location if ticketUrl state hasn't mounted yet
    const shareUrl = ticketUrl || window.location.href; 

    // Use Native Share API if supported (Mobile phones, macOS Safari)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // AbortError just means the user closed the share sheet, ignore it
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      // Fallback for Desktop Browsers: Copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (err) {
        console.error('Failed to copy to clipboard', err);
      }
    }
  };
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#B31B20] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm uppercase tracking-[0.15em]">Fetching your ticket…</p>
        </div>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#B31B20] font-bold text-xl mb-2">Ticket Not Found</p>
          <p className="text-gray-400 text-sm mb-6">{error || 'The booking reference is invalid.'}</p>
          <button onClick={() => router.push('/')} className="bg-[#B31B20] text-white px-6 py-2.5 font-semibold text-sm hover:bg-[#8f1419] transition-colors">
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  const s = booking.schedule;
  const b = s.bus;

  return (
    <main className="min-h-screen bg-gray-100 py-10 px-4 font-sans">
      <img 
        src="/KNI_2.png" 
        alt="KNI Logo" 
        className="absolute top-0 left-20 md:top-0 md:left-25 h-32 md:h-45 w-auto object-contain" 
      />
      <div className="text-center mb-8">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.25em] mb-1">
          Bengal Transit · Booking Confirmed
        </p>
        <h1 className="text-3xl font-light text-gray-800">
          YOUR <span className="font-bold text-[#B31B20]">TICKET</span>
        </h1>
      </div>

      <div ref={ticketRef} className="max-w-lg mx-auto bg-[#ffffff] shadow-2xl rounded-none overflow-hidden" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        
        <div className="bg-[#B31B20] px-7 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#ffffff99] text-[10px] font-bold uppercase tracking-[0.25em]">Bengal Transit</p>
              <p className="text-[#ffffff] text-xl font-bold tracking-wide mt-0.5">Express Booking Portal</p>
            </div>
            <span className="bg-[#ffffff33] border border-[#ffffff4d] text-[#ffffff] text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              {booking.status}
            </span>
          </div>
        </div>

        <div className="bg-[#8f1419] px-7 py-4">
          <div className="flex items-center justify-between text-[#ffffff]">
            <div>
              <p className="text-2xl font-bold">{s.origin}</p>
              <p className="text-[#ffffff99] text-xs mt-0.5">{formatTime(s.departureTime)}</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-[#ffffff80] text-[10px] mb-1">{getDuration(s.departureTime, s.arrivalTime)}</p>
              <div className="flex items-center gap-1">
                <div className="w-10 h-px bg-[#ffffff66]" />
                <div className="w-2 h-2 rounded-full bg-[#ffffffb3]" />
                <div className="w-10 h-px bg-[#ffffff66]" />
              </div>
              <p className="text-[#ffffff66] text-[9px] mt-1 uppercase tracking-widest">{b.type}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{s.destination}</p>
              <p className="text-[#ffffff99] text-xs mt-0.5">{formatTime(s.arrivalTime)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center px-4 py-0 bg-[#ffffff] relative">
          <div className="w-6 h-6 rounded-full bg-[#f3f4f6] border border-[#e5e7eb] -ml-7 flex-shrink-0" />
          <div className="flex-1 border-t-2 border-dashed border-[#e5e7eb] mx-2" />
          <div className="w-6 h-6 rounded-full bg-[#f3f4f6] border border-[#e5e7eb] -mr-7 flex-shrink-0" />
        </div>

        <div className="px-7 py-6 bg-[#ffffff]">
          <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-[0.18em] mb-4">
            {formatDate(s.departureTime)}
          </p>

          <div className="grid grid-cols-2 gap-x-8 gap-y-5 mb-6">
            <div>
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">Passenger</p>
              <p className="text-[#111827] font-semibold mt-0.5">{booking.user.name}</p>
              <p className="text-[#9ca3af] text-xs">{booking.user.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">Booking Ref</p>
              <p className="text-[#111827] font-bold mt-0.5 font-mono tracking-wider">#{String(booking.id).padStart(6, '0')}</p>
              <p className="text-[#9ca3af] text-xs"> Booking Date: {formatDateShort(booking.createdAt)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">Seats</p>
              <p className="text-[#111827] font-semibold mt-0.5">{booking.seatNumbers.sort((a, b) => a - b).join(', ')}</p>
              <p className="text-[#9ca3af] text-xs">{booking.seatNumbers.length} {booking.seatNumbers.length === 1 ? 'seat' : 'seats'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">Bus</p>
              <p className="text-[#111827] font-semibold mt-0.5">{b.operatorName}</p>
              <p className="text-[#9ca3af] text-xs">{b.busNumber}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">Departure</p>
              <p className="text-[#111827] font-semibold mt-0.5">{formatTime(s.departureTime)}</p>
              <p className="text-[#9ca3af] text-xs">{formatDateShort(s.departureTime)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">Arrival</p>
              <p className="text-[#111827] font-semibold mt-0.5">{formatTime(s.arrivalTime)}</p>
              <p className="text-[#9ca3af] text-xs">{formatDateShort(s.arrivalTime)}</p>
            </div>
          </div>

          <div className="flex justify-between items-center bg-[#f9fafb] border border-[#f3f4f6] rounded-lg px-4 py-3 mb-6">
            <div>
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">Fare per seat</p>
              <p className="text-[#374151] font-medium mt-0.5">₹{SEAT_PRICE} × {booking.seatNumbers.length}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">Total Paid</p>
              <p className="text-[#B31B20] text-2xl font-bold mt-0.5">₹{totalFare.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="flex items-center px-0 mb-6 relative">
            <div className="w-6 h-6 rounded-full bg-[#f3f4f6] border border-[#e5e7eb] -ml-11 flex-shrink-0" />
            <div className="flex-1 border-t-2 border-dashed border-[#e5e7eb] mx-2" />
            <div className="w-6 h-6 rounded-full bg-[#f3f4f6] border border-[#e5e7eb] -mr-11 flex-shrink-0" />
          </div>

          <div className="flex flex-col items-center">
            <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-[0.2em] mb-4">Scan for Verification</p>
            <div className="bg-[#ffffff] border-2 border-[#B31B20] p-4 rounded-sm shadow-md">
              {/* 2. QR CODE: URL instead of JSON */}
              <QRCode value={ticketUrl || 'https://bengaltransit.in'} size={160} fgColor="#1a1a1a" bgColor="#ffffff" level="H" />
            </div>
            <p className="text-[#9ca3af] text-[10px] mt-3 font-mono tracking-wider">REF #{String(booking.id).padStart(6, '0')}</p>
          </div>
        </div>

        <div className="bg-[#111827] px-7 py-3 flex items-center justify-between">
          <p className="text-[#6b7280] text-[10px] uppercase tracking-wider">bengaltransit.in</p>
          <p className="text-[#6b7280] text-[10px]">Valid for travel on {formatDateShort(s.departureTime)}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto mt-6 flex flex-col sm:flex-row gap-3">
        <button onClick={generatePdf} disabled={pdfLoading} className="flex-1 flex items-center justify-center gap-2 bg-[#B31B20] hover:bg-[#8f1419] text-white font-bold uppercase tracking-wider py-3.5 px-6 transition-all duration-200 disabled:opacity-60 shadow-md">
          {pdfLoading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</> : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Download Ticket</>}
        </button>

        <button 
          onClick={shareTicket} 
          className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-[#B31B20] text-[#B31B20] font-bold uppercase tracking-wider py-3.5 px-6 hover:bg-red-50 transition-all duration-200 shadow-sm"
        >
          {copied ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Link Copied!
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Link
            </>
          )}
        </button>

        <button onClick={() => router.push('/')} className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white font-bold uppercase tracking-wider py-3.5 px-6 hover:bg-gray-700 transition-all duration-200 shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>Book Again
        </button>
      </div>
    </main>
  );
}