'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('bengal_transit_user') || '{}');
    if (user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    const fetchAllData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/bookings`);
        if (!res.ok) throw new Error('Failed to fetch database records');
        const data = await res.json();
        setBookings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [router]);

  // ── CSV EXPORT LOGIC ──
  const downloadCSV = () => {
    if (bookings.length === 0) return;

    // 1. Define the Excel Column Headers
    const headers = [
      "Booking Ref", "Booking Date", "Status", 
      "Booked By (Agent/Admin)", "Account Role",
      "Passenger Name", "Passenger Age", "Passenger Mobile", "Passenger Email",
      "Bus Operator", "Bus Number", "Bus Type",
      "Origin", "Destination", "Departure Time", "Arrival Time",
      "Seats Booked", "Total Seats", "Total Amount Paid (INR)"
    ];

    // 2. Map the JSON data to rows matching the headers
    const csvRows = bookings.map(b => {
      const s = b.schedule;
      const bus = s.bus;
      const totalPaid = b.seatNumbers.length * 150; // Hardcoded 150 price

      // Escape quotes and wrap fields in quotes to handle commas within data
      const clean = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

      return [
        b.id, new Date(b.createdAt).toLocaleString('en-IN'), b.status,
        b.user?.name || 'Unknown', b.user?.role || 'Unknown',
        b.passengerName || '--', b.passengerAge || '--', b.passengerMobile || '--', b.passengerEmail || '--',
        bus.operatorName, bus.busNumber, bus.type,
        s.origin, s.destination, new Date(s.departureTime).toLocaleString('en-IN'), new Date(s.arrivalTime).toLocaleString('en-IN'),
        b.seatNumbers.join(', '), b.seatNumbers.length, totalPaid
      ].map(clean).join(',');
    });

    // 3. Combine headers and rows
    const csvContent = [headers.join(','), ...csvRows].join('\n');

    // 4. Create a Blob and trigger browser download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BengalTransit_Database_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><span className="w-8 h-8 border-4 border-[#B31B20] border-t-transparent rounded-full animate-spin"></span></div>;
  }

  return (
    <main className="min-h-[100dvh] bg-gray-50 font-sans flex flex-col w-full overflow-hidden">
      
      {/* ── Navbar ── */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={() => router.push('/admin')} className="text-gray-400 hover:text-[#B31B20] transition-colors p-1">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Master Database</h1>
            <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest">{bookings.length} Total Records</p>
          </div>
        </div>
        
        {/* 👇 Button text collapses to just "Export" on mobile 👇 */}
        <button onClick={downloadCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 transition-colors shadow-sm whitespace-nowrap">
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          <span className="hidden sm:inline">Export to Excel (CSV)</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>

      {/* ── Table Container ── */}
      {/* 👇 Reduced padding on mobile (p-3) 👇 */}
      <div className="flex-1 p-3 sm:p-6 overflow-hidden flex flex-col w-full">
        {error && <div className="bg-red-50 text-red-600 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4 text-xs sm:text-sm">{error}</div>}

        {/* 👇 Added overflow-x-auto for native mobile swiping 👇 */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 overflow-x-auto relative w-full">
          
          {/* 👇 Added min-w-[1000px] so the table never squishes unreadably 👇 */}
          <table className="w-full min-w-[1000px] text-left border-collapse text-xs whitespace-nowrap">
            <thead className="bg-gray-100/80 text-gray-500 font-bold uppercase tracking-wider sticky top-0 z-10 shadow-sm backdrop-blur-md">
              <tr>
                <th className="px-4 py-3 border-b border-gray-200 font-semibold">Ref #</th>
                <th className="px-4 py-3 border-b border-gray-200 font-semibold">Date Booked</th>
                <th className="px-4 py-3 border-b border-gray-200 font-semibold">Booked By</th>
                <th className="px-4 py-3 border-b border-gray-200 font-semibold">Passenger</th>
                <th className="px-4 py-3 border-b border-gray-200 font-semibold">Contact</th>
                <th className="px-4 py-3 border-b border-gray-200 font-semibold">Route</th>
                <th className="px-4 py-3 border-b border-gray-200 font-semibold">Bus Details</th>
                <th className="px-4 py-3 border-b border-gray-200 font-semibold">Seats</th>
                <th className="px-4 py-3 border-b border-gray-200 font-semibold">Amount</th>
                <th className="px-4 py-3 border-b border-gray-200 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono">#{String(b.id).padStart(5, '0')}</td>
                  <td className="px-4 py-3">{new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{b.user?.name || 'Unknown'}</p>
                    <p className="text-[10px] text-gray-400">{b.user?.role || '--'}</p>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{b.passengerName || '--'}</p>
                    <p className="text-[10px] text-gray-400">{b.passengerAge ? `${b.passengerAge} yrs` : ''}</p>
                  </td>

                  <td className="px-4 py-3">
                    <p>{b.passengerMobile || '--'}</p>
                    <p className="text-[10px] text-gray-400">{b.passengerEmail || ''}</p>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-medium">{b.schedule.origin} <span className="text-gray-400">→</span> {b.schedule.destination}</p>
                    <p className="text-[10px] text-gray-400">{new Date(b.schedule.departureTime).toLocaleDateString('en-IN')} | {new Date(b.schedule.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>

                  <td className="px-4 py-3">
                    <p>{b.schedule.bus.operatorName}</p>
                    <p className="text-[10px] text-gray-400">{b.schedule.bus.busNumber}</p>
                  </td>

                  <td className="px-4 py-3 font-medium">
                    {b.seatNumbers.length} ({b.seatNumbers.sort((a,b)=>a-b).join(', ')})
                  </td>

                  <td className="px-4 py-3 font-bold text-[#B31B20]">
                    ₹{b.seatNumbers.length * 150}
                  </td>

                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      b.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-gray-500 italic">No bookings found in the database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}