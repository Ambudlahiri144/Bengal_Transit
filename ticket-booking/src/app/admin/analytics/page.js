'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer
} from 'recharts';

const FLIGHT_LABEL_MAP = {
  'DEL_ARR_1240': 'Delhi · Arr 12:40 PM',
  'DEL_DEP_1830': 'Delhi · Dep 6:30 PM',
  'HYD_ARR_1800': 'Hyderabad · Arr 6:00 PM',
  'HYD_DEP_1310': 'Hyderabad · Dep 1:10 PM',
  'MUM_ARR_1340': 'Mumbai · Arr 1:40 PM',
  'MUM_DEP_1425': 'Mumbai · Dep 2:25 PM',
  'BLR_ARR_1355': 'Bangalore · Arr 1:55 PM',
  'BLR_DEP_1425': 'Bangalore · Dep 2:25 PM',
  'MAA_ARR_1440': 'Chennai · Arr 2:40 PM',
  'MAA_DEP_1550': 'Chennai · Dep 3:50 PM',
  'MAA_ARR_1615': 'Chennai · Arr 4:15 PM',
  'MAA_DEP_1655': 'Chennai · Dep 4:55 PM',
};
const cleanLabel = (raw) => FLIGHT_LABEL_MAP[raw] || raw.replace(/_/g, ' ');

// ── Custom Tooltip ──────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, suffix = 'passengers' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xl max-w-[180px]">
      {label && <p className="text-gray-400 mb-1 font-normal text-[10px] leading-tight truncate">{label}</p>}
      <p>{payload[0].value} <span className="text-gray-400 font-normal">{suffix}</span></p>
    </div>
  );
};

const PALETTE = ['#B31B20', '#111827', '#6b7280', '#d1d5db', '#374151', '#9ca3af'];

// ── Legend ──────────────────────────────────────────────────────
const Legend = ({ items }) => (
  <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-3">
    {items.map((item, i) => (
      <span key={i} className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-500 font-medium min-w-0">
        <span
          className="w-2 h-2 rounded-[2px] flex-shrink-0"
          style={{ background: item.color }}
        />
        <span className="truncate max-w-[120px] sm:max-w-none">{item.label}</span>
        {item.badge && (
          <span className="font-bold text-gray-800 flex-shrink-0">{item.badge}</span>
        )}
      </span>
    ))}
  </div>
);

// ── Chart Card Wrapper ──────────────────────────────────────────
const ChartCard = ({ title, sub, badge, legend, children, full, delay }) => (
  <div
    className={`
      bg-white rounded-xl sm:rounded-2xl border border-black/[0.06]
      overflow-hidden animate-[fadeUp_0.5s_ease_both]
      ${full ? 'col-span-1 lg:col-span-2' : ''}
    `}
    style={{ animationDelay: delay }}
  >
    <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-gray-100 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[12px] sm:text-[13px] font-bold text-gray-900 tracking-tight truncate">{title}</h2>
        <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5 leading-snug">{sub}</p>
      </div>
      {badge && (
        <span className="text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded-full bg-[rgba(179,27,32,0.08)] text-[#B31B20] tracking-wide flex-shrink-0">
          {badge}
        </span>
      )}
    </div>
    <div className="px-4 sm:px-5 pt-3 sm:pt-4 pb-4 sm:pb-5">
      {legend && <Legend items={legend} />}
      {children}
    </div>
  </div>
);

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [flightData, setFlightData] = useState([]);
  const [routeData, setRouteData]   = useState([]);
  const [stats, setStats] = useState({ total: 0, topFlight: '—', busierRoute: '—' });

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('bengal_transit_user') || '{}');
    if (user.role !== 'ADMIN') { router.push('/login'); return; }

    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/bookings`);
        const bookings = await res.json();

        const flightCounts = {};
        bookings.forEach(b => {
          const raw = b.flightConnection;
          if (!raw || raw === 'NONE' || raw === '') return;
          flightCounts[raw] = (flightCounts[raw] || 0) + b.seatNumbers.length;
        });

        const formatted = Object.entries(flightCounts)
          .map(([key, seats]) => ({ id: key, name: cleanLabel(key), seats }))
          .sort((a, b) => b.seats - a.seats);

        setFlightData(formatted);

        const routeCounts = { toAirport: 0, fromAirport: 0 };
        bookings.forEach(b => {
          if (b.schedule.destination === 'KNI Airport')
            routeCounts.toAirport += b.seatNumbers.length;
          else
            routeCounts.fromAirport += b.seatNumbers.length;
        });
        setRouteData([
          { name: 'To Airport',   passengers: routeCounts.toAirport },
          { name: 'From Airport', passengers: routeCounts.fromAirport },
        ]);

        const total = formatted.reduce((s, f) => s + f.seats, 0);
        setStats({
          total,
          topFlight:    formatted[0]?.name.split('·')[0].trim() || '—',
          busierRoute:  routeCounts.toAirport >= routeCounts.fromAirport ? 'To Airport' : 'From Airport',
        });

      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-white flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-[#B31B20] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalSeats = flightData.reduce((s, f) => s + f.seats, 0);

  const pieLegendItems = flightData.map((f, i) => ({
    color: PALETTE[i % PALETTE.length],
    label: f.name,
    badge: `${Math.round(f.seats / (totalSeats || 1) * 100)}%`,
  }));

  const barLegendItems = routeData.map((r, i) => ({
    color: PALETTE[i],
    label: r.name,
    badge: r.passengers,
  }));

  const statItems = [
    { label: 'Total Passengers', value: stats.total,      sub: 'all routes',     delay: '0.10s' },
    { label: 'Top Flight',       value: stats.topFlight,  sub: 'highest demand', delay: '0.18s' },
    { label: 'Busier Route',     value: stats.busierRoute, sub: 'by seat count', delay: '0.26s' },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
      `}</style>

      <main className="min-h-[100dvh] bg-[#f4f3f1] font-sans">

        {/* ── Glassmorphism Hero ── */}
        <div className="relative overflow-hidden bg-white">

          {/* Ambient glow blobs — scale down on mobile */}
          <div className="absolute pointer-events-none"
            style={{
              top: '-40px', left: '-60px',
              width: 'clamp(200px, 40vw, 420px)',
              height: 'clamp(200px, 40vw, 420px)',
              background: 'radial-gradient(circle, rgba(179,27,32,0.13) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          <div className="absolute pointer-events-none"
            style={{
              top: '-10px', right: '-40px',
              width: 'clamp(160px, 28vw, 300px)',
              height: 'clamp(160px, 28vw, 300px)',
              background: 'radial-gradient(circle, rgba(179,27,32,0.08) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />
          <div className="absolute pointer-events-none hidden sm:block"
            style={{
              bottom: '-40px', left: '40%',
              width: '260px', height: '260px',
              background: 'radial-gradient(circle, rgba(179,27,32,0.07) 0%, transparent 70%)',
              filter: 'blur(35px)',
            }}
          />

          {/* Glass panel */}
          <div
            className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-8 sm:pb-10"
            style={{
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderBottom: '1px solid rgba(179,27,32,0.1)',
            }}
          >
            {/* Back button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-gray-400 hover:text-[#B31B20] transition-colors mb-5 sm:mb-6"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Command Center
            </button>

            {/* Title block */}
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#B31B20] mb-1.5 flex items-center gap-1.5">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"
                  style={{ animation: 'pulse 2s infinite' }}
                />
                Live Dashboard
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
                Traffic Analytics
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest mt-2">
                Passenger · Flight Correlation · Route Intelligence
              </p>
            </div>

            {/* Stat strip — 1 col on xs, 3 on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 sm:mt-8">
              {statItems.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl p-3.5 sm:p-4 animate-[fadeUp_0.5s_ease_both]"
                  style={{
                    animationDelay: s.delay,
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(179,27,32,0.1)',
                    boxShadow: '0 2px 16px rgba(179,27,32,0.05), 0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* On mobile: stat items go horizontal to save vertical space */}
                  <div className="flex sm:block items-center justify-between sm:justify-start gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 sm:mb-2 flex-shrink-0">
                      {s.label}
                    </p>
                    <p className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight leading-none">
                      {s.value}
                    </p>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#B31B20] font-semibold mt-1 sm:mt-1.5">
                    {s.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom hairline */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(179,27,32,0.15), transparent)' }}
          />
        </div>

        {/* ── Charts Grid ── */}
        {/* 
          Single col on mobile/tablet, 2-col on lg+.
          Full-width card uses col-span-1 on mobile, col-span-2 on lg.
        */}
        <div className="max-w-6xl mx-auto p-4 sm:p-5 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">

          {/* Donut — Connecting Flights */}
          <ChartCard
            title="Top Connecting Flights"
            sub="Seats booked per connecting flight"
            badge="Donut"
            legend={pieLegendItems}
            delay="0.35s"
          >
            {/* Shorter on mobile so it doesn't eat the whole screen */}
            <div className="h-[200px] sm:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={flightData}
                    dataKey="seats"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="52%"
                    outerRadius="78%"
                    paddingAngle={4}
                    strokeWidth={3}
                    stroke="#fff"
                    animationBegin={200}
                    animationDuration={900}
                  >
                    {flightData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip suffix="seats" />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Bar — Directional Traffic */}
          <ChartCard
            title="Bus Traffic Direction"
            sub="Inbound vs outbound passengers"
            badge="Bar"
            legend={barLegendItems}
            delay="0.45s"
          >
            <div className="h-[200px] sm:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={routeData}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                  barCategoryGap="40%"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                  <Bar
                    dataKey="passengers"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={80}
                    animationBegin={300}
                    animationDuration={1000}
                  >
                    {routeData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Line — Full width, sorted by volume */}
          <ChartCard
            title="Flight Volume Distribution"
            sub="Ranked by seat bookings — highest to lowest"
            badge="Line"
            full
            delay="0.55s"
          >
            {/* 
              Taller on desktop since it spans full width.
              On mobile it's single column so standard height is fine.
            */}
            <div className="h-[220px] sm:h-[240px] lg:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={flightData}
                  margin={{ top: 8, right: 16, left: -20, bottom: 12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={48}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip content={<CustomTooltip suffix="seats" />} />
                  <Line
                    type="monotone"
                    dataKey="seats"
                    stroke="#B31B20"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: '#B31B20', strokeWidth: 2.5, stroke: '#fff' }}
                    activeDot={{ r: 8, fill: '#B31B20', stroke: '#fff', strokeWidth: 2.5 }}
                    animationBegin={400}
                    animationDuration={1100}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

        </div>

        <p className="text-center text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-widest pb-6 sm:pb-8 px-4">
          Operated by Bengal Aerotropolis Projects Limited
        </p>

      </main>
    </>
  );
}