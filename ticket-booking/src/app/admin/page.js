'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminHub() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('bengal_transit_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'ADMIN') {
      router.push('/'); 
      return;
    }

    setUser(parsedUser);
  }, [router]);

  if (!user) return <div className="min-h-screen bg-gray-50" />;

  return (
    <main className="min-h-[100dvh] bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative">
      
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        <img 
          src="/BAPL_logo.jpg" 
          alt="Bengal Aerotropolis Projects Limited" 
          className="w-[120px] sm:w-[150px] md:w-[200px] h-auto object-contain" 
        />
      </div>

      {/* Header */}
      <div className="text-center mb-10 mt-24 md:mt-0"> 
        <img src="/KNI_logo.jpg" alt="KNI Logo" className="h-14 sm:h-16 w-auto object-contain mx-auto mb-4" />
        <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-[0.25em] mb-1">
          System Administrator
        </p>
        <h1 className="text-2xl sm:text-4xl font-light text-gray-800">
          COMMAND <span className="font-bold text-[#B31B20]">CENTER</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-2">Welcome back, {user.name}</p>
      </div>

      {/* 👇 3-Card Grid Layout 👇 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full px-2 sm:px-4">
        
        {/* Card 1: Data Dashboard */}
        <Link href="/admin/dashboard" className="group bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden relative transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 md:hover:-translate-y-2 cursor-pointer h-72 md:h-80 flex flex-col">
          <div className="p-6 md:p-8 pb-0 flex-1">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-red-50 text-[#B31B20] rounded-2xl flex items-center justify-center mb-4 md:mb-6">
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Master Database</h2>
            <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
              View Excel-style reports of all bookings and passengers. Export to CSV.
            </p>
          </div>
          <div className="h-28 md:h-32 bg-gray-50 border-t border-gray-100 relative overflow-hidden group-hover:bg-[#B31B20]/5 transition-colors duration-500">
             <div className="absolute top-4 left-4 right-4 h-20 bg-white shadow-sm border border-gray-200 rounded-lg flex flex-col gap-2 p-3 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
               <div className="h-2 w-1/3 bg-gray-200 rounded-full" />
               <div className="h-2 w-full bg-gray-100 rounded-full" />
               <div className="h-2 w-4/5 bg-gray-100 rounded-full" />
             </div>
          </div>
        </Link>

        {/* 👇 NEW Card 2: Flight Analytics 👇 */}
        <Link href="/admin/analytics" className="group bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden relative transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 md:hover:-translate-y-2 cursor-pointer h-72 md:h-80 flex flex-col">
          <div className="p-6 md:p-8 pb-0 flex-1">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Flight Analytics</h2>
            <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
              Interactive charts tracking passenger flight origins and destinations.
            </p>
          </div>
          <div className="h-28 md:h-32 bg-gray-50 border-t border-gray-100 relative overflow-hidden group-hover:bg-emerald-50/50 transition-colors duration-500">
             <div className="absolute top-4 left-4 right-4 h-20 bg-white shadow-sm border border-gray-200 rounded-lg flex items-end gap-2 p-3 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
               <div className="w-1/3 h-2/3 bg-emerald-100 rounded-t-sm" />
               <div className="w-1/3 h-full bg-emerald-200 rounded-t-sm" />
               <div className="w-1/3 h-1/2 bg-emerald-100 rounded-t-sm" />
             </div>
          </div>
        </Link>

        {/* Card 3: Travel Agent Mode */}
        <div onClick={() => router.push('/')} className="group bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden relative transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 md:hover:-translate-y-2 cursor-pointer h-72 md:h-80 flex flex-col">
          <div className="p-6 md:p-8 pb-0 flex-1">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Agent Mode</h2>
            <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
              Redirect to the booking portal. Tickets booked are logged to Admin.
            </p>
          </div>
          <div className="h-28 md:h-32 bg-gray-50 border-t border-gray-100 relative overflow-hidden group-hover:bg-blue-50/50 transition-colors duration-500">
             <div className="absolute top-4 left-4 right-4 h-20 bg-white shadow-sm border border-gray-200 rounded-lg flex gap-3 p-3 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
               <div className="w-10 md:w-12 h-full bg-gray-100 rounded-md" />
               <div className="flex-1 flex flex-col gap-2 justify-center">
                 <div className="h-2 w-2/3 bg-gray-200 rounded-full" />
                 <div className="h-2 w-1/2 bg-gray-100 rounded-full" />
               </div>
             </div>
          </div>
        </div>

      </div>

      <button onClick={() => { sessionStorage.clear(); router.push('/login'); }} className="mt-10 md:mt-12 mb-6 md:mb-0 text-xs md:text-sm font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors pb-safe">
        Secure Logout
      </button>

    </main>
  );
}