'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import BottomNav from '@/components/BottomNav';
import { 
  getPlantStage, getPlantImage, getPlantStageName, getDayLabel, getTodayStr, 
  getLastNDays, getStreakMultiplier, canRevivePlant, revivePlant, 
  getCalendarGrid, getMonthName 
} from '@/lib/gameLogic';
import { waterPlant, getRecentEntries, getEntriesByDateRange, updateUserProfile } from '@/lib/database';
import { DailyEntry } from '@/lib/types';
import { playWatering, toggleZenBgm } from '@/lib/audio';
import { usePathname } from 'next/navigation';

// Premium Glassmorphism Gauge
function CircularGauge({ percent, color, label, subLabel }: { percent: number; color: string; label: string; subLabel: string }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(percent / 100, 1)) * circ;

  return (
    <div className="bg-surface-container-lowest/80 backdrop-blur-xl p-4 rounded-[28px] flex flex-col items-center justify-center space-y-3 shadow-xl border border-on-surface/5 relative overflow-hidden group hover:bg-surface-container-lowest transition-all">
      <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
        <span className="material-symbols-outlined text-3xl">{label === 'Tasks' ? 'checklist' : 'payments'}</span>
      </div>
      <div className="relative w-28 h-28 transform group-hover:scale-105 transition-transform duration-700">
        <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_8px_rgba(0,0,0,0.05)]" viewBox="0 0 36 36">
          <circle 
            className="stroke-surface-container-highest" 
            cx="18" cy="18" r={r} 
            fill="none" 
            strokeWidth="3.5"
            opacity="0.2"
          ></circle>
          <circle
            cx="18" cy="18" r={r}
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeDasharray={`${dash}, ${circ}`}
            strokeLinecap="round"
            style={{ 
              transition: 'stroke-dasharray 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              filter: `drop-shadow(0 0 6px ${color}66)`
            }}
          ></circle>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-headline font-black tracking-tighter" style={{ color }}>{Math.round(percent)}<span className="text-[10px] ml-0.5 opacity-60">%</span></span>
        </div>
      </div>
      <div className="text-center relative z-10">
        <span className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-[0.2em] block mb-1">{label}</span>
        <div className="flex items-center justify-center gap-1.5 py-1 px-3 bg-surface-container-high/40 rounded-full border border-on-surface/5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }}></span>
          <span className="text-[9px] font-black uppercase tracking-widest text-on-surface" style={{ color: color }}>{subLabel}</span>
        </div>
      </div>
    </div>
  );
}


export default function DashboardPage() {
  const { user, profile, todayEntry, loading, refreshProfile, refreshTodayEntry } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [watering, setWatering] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [evoMsg, setEvoMsg] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [monthEntries, setMonthEntries] = useState<DailyEntry[]>([]);
  const [zenMode, setZenMode] = useState(false);

  useEffect(() => {
    toggleZenBgm(zenMode);
  }, [zenMode]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getRecentEntries(user.id, 31).then(setEntries);
    }
  }, [user, profile]);

  useEffect(() => {
    if (user) {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;
      getEntriesByDateRange(user.id, startDate, endDate).then(setMonthEntries);
    }
  }, [user, viewDate]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleWater = async () => {
    if (!user || !profile || watering || todayEntry?.wateredToday) return;

    setWatering(true);
    try {
      const result = await waterPlant(user.id, profile, todayEntry);
      await refreshProfile();
      await refreshTodayEntry();

      if (result.evolution.newTree) {
        setEvoMsg('🌳 Cây mới được lưu vào Khu rừng thành công!');
      } else if (result.evolution.newFruit) {
        setEvoMsg('🍎 4 Hoa đã chuyển thành 1 Quả!');
      } else if (result.evolution.newFlower) {
        setEvoMsg('🌸 Tuyệt vời! Cây ra 1 Hoa mới!');
      } else {
        playWatering();
        showToast('💧 Đã tưới cây! +1 điểm tích lũy');
      }
    } catch (e: any) {
      showToast(e.message);
    } finally {
      setWatering(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const plantStage = getPlantStage(profile);
  const plantImg = getPlantImage(plantStage);

  const last7Days = getLastNDays(7);
  const entryMap: Record<string, DailyEntry> = {};
  entries.forEach(e => { entryMap[e.date] = e; });
  const today = getTodayStr();

  const lastSubmitted = entries.slice().reverse().find(e => e.submitted);
  const taskPercent = lastSubmitted?.taskPercent ?? 0;
  const revenuePercent = lastSubmitted?.revenuePercent ?? 0;
  const plantProgressPct = ((profile.plantAccumulatedPoints) / 7) * 100;

  const getWeekPoints = () => {
    return entries.reduce((sum, e) => sum + (e.totalDayScore || 0), 0);
  };

  const wateredToday = todayEntry?.wateredToday ?? false;

  return (
    <div className="pb-60 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface px-6 py-3 rounded-full text-sm font-bold shadow-lg animate-fade-in whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* Evolution Modal */}
      {evoMsg && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setEvoMsg(null)}>
          <div className="bg-surface-container-lowest rounded-[2rem] p-8 text-center w-full max-w-[320px] shadow-2xl scale-100 transition-transform">
            <div className="text-6xl mb-4">{evoMsg.startsWith('🌳') ? '🌳' : evoMsg.startsWith('🍎') ? '🍎' : '🌸'}</div>
            <h2 className="text-xl font-headline font-bold text-on-surface mb-2">Tiến hóa mới!</h2>
            <p className="text-on-surface-variant font-body mb-6">{evoMsg}</p>
            <button className="bg-primary text-on-primary font-bold px-6 py-3 rounded-full w-full hover:opacity-90">Tuyệt vời! 🎉</button>
          </div>
        </div>
      )}

      {/* TopAppBar */}
      <header className="w-full top-0 sticky z-50 bg-gradient-to-b from-surface/80 to-transparent flex justify-between items-center px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-primary-container/30 flex items-center justify-center border border-primary/20">
            <span className="text-lg">🌿</span>
          </div>
          <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Greenhouse</div>
        </div>
        <button 
          onClick={() => setZenMode(!zenMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${zenMode ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container border-on-surface/5 text-on-surface-variant/60'}`}
        >
          <span className={`material-symbols-outlined text-base ${zenMode ? 'fill-1' : ''}`}>spa</span>
          <span className="text-[9px] font-black uppercase tracking-widest">{zenMode ? 'Zen ON' : 'Zen OFF'}</span>
        </button>
        <div className="text-right">
          <div className="text-primary font-headline tracking-tight font-bold text-sm">
            {profile.totalGamePoints} pts
          </div>
        </div>
      </header>

      <main className="px-4 pt-1 space-y-4">
        {/* Hero Section: Digital Plant with Reacting Atmosphere */}
        <section className="flex flex-col items-center justify-center py-4 relative overflow-hidden">
          <div className={`absolute inset-0 bg-radial-gradient ${profile.plantAccumulatedPoints < 5 ? 'from-error/20' : 'from-primary/20'} to-transparent transition-colors duration-1000 -z-10 blur-[100px] rounded-full scale-150`}></div>
          
          <div className="relative w-64 h-64 flex items-center justify-center transition-transform hover:scale-[1.02] duration-1000 group">
            {/* Evolution Ring: Multi-layered */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none drop-shadow-xl z-20" viewBox="0 0 100 100">
              <circle 
                cx="50" cy="50" r="46" 
                fill="none" 
                stroke="currentColor" 
                className="text-on-surface/5" 
                strokeWidth="4" 
              />
              <circle 
                cx="50" cy="50" r="46" 
                fill="none" 
                stroke={profile.plantAccumulatedPoints < 5 ? '#EF4444' : '#10B981'} 
                strokeWidth="4" 
                strokeDasharray="289" 
                strokeDashoffset={289 - (289 * plantProgressPct / 100)}
                strokeLinecap="round" 
                style={{ 
                  transition: 'stroke-dashoffset 2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  filter: `drop-shadow(0 0 12px ${profile.plantAccumulatedPoints < 5 ? '#EF4444' : '#10B981'}88)`
                }}
              />
            </svg>

            {/* Days Floating Badge */}
            <div className={`absolute -right-2 top-1/2 -translate-y-1/2 bg-surface-container-lowest border border-on-surface/10 py-3 px-4 rounded-[24px] shadow-2xl flex flex-col items-center z-20 min-w-[60px] transform hover:scale-110 active:scale-95 transition-all duration-300 ${profile.currentWinStreak > 0 ? 'animate-pulse' : ''}`}>
              <span className={`text-2xl font-headline font-black leading-none mb-1 ${profile.currentWinStreak > 0 ? 'text-primary' : 'text-on-surface'}`}>
                {profile.currentWinStreak}
              </span>
              <span className="text-[8px] font-black text-on-surface-variant/60 uppercase tracking-[0.2em]">{profile.currentWinStreak === 1 ? 'DAY' : 'DAYS'}</span>
              <div className={`h-1 w-4 rounded-full mt-1.5 ${profile.currentWinStreak > 0 ? 'bg-primary' : 'bg-on-surface/10'}`}></div>
            </div>

            {/* Plant Image with Biological Pulse and Circular Clipping */}
            <div className="relative w-[80%] h-[80%] rounded-full overflow-hidden transition-all duration-1000 group-hover:drop-shadow-[0_0_30px_rgba(16,185,129,0.2)] z-10">
              <Image
                src={plantImg}
                alt="Digital Plant"
                width={240}
                height={240}
                className={`relative w-full h-full object-cover transition-all duration-1000 ${plantStage === 'dead' ? 'opacity-40 grayscale translate-y-4' : 'animate-biological-pulse'}`}
                style={{ clipPath: 'circle(50%)' }}
              />
            </div>
          </div>
        </section>

        {/* Biological Health / Success Forest Stats */}
        <section className="flex flex-col items-center space-y-12 px-1 mb-8">
          {/* Plant Health Module: Bento Card Style */}
          <div className="w-full max-w-[260px] bg-surface-container-lowest/60 backdrop-blur-md p-4 rounded-[28px] border border-on-surface/5 shadow-xl relative group">
            <div className="flex justify-between items-center mb-2.5">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${profile.plantAccumulatedPoints < 5 ? 'bg-error animate-ping' : 'bg-primary shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                <span className="text-[9px] font-black text-on-surface uppercase tracking-[0.15em]">Biological Health</span>
              </div>
              <span className={`text-[10px] font-black tracking-tight ${profile.plantAccumulatedPoints < 5 ? 'text-error' : 'text-primary'}`}>
                {profile.plantAccumulatedPoints}/7 <span className="opacity-40 text-[7px]">XP</span>
              </span>
            </div>
            
            <div className="h-2.5 bg-on-surface/5 rounded-full overflow-hidden relative border border-white/10 shadow-inner">
              <div 
                className={`h-full transition-all duration-2000 ease-out relative ${profile.plantAccumulatedPoints < 5 ? 'bg-error' : 'bg-gradient-to-r from-primary via-primary-container to-primary'}`}
                style={{ width: `${Math.max(plantProgressPct, 2)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-shine opacity-30"></div>
                {/* Micro-sparkle effects for high health */}
                {profile.plantAccumulatedPoints >= 5 && (
                  <div className="absolute top-0 right-0 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                )}
              </div>
            </div>

            {profile.plantAccumulatedPoints < 5 && (
              <div className="flex items-center gap-1.5 mt-3 justify-center text-error font-black text-[9px] uppercase tracking-widest animate-pulse">
                <span className="material-symbols-outlined text-[12px] font-black">warning</span>
                Hệ sinh thái đang suy yếu
              </div>
            )}
          </div>

          {/* Success Forest Card (Relocated from Awards/Mockup) */}
          <Link href="/forest" className="w-full flex items-center justify-between bg-surface-container-lowest/80 backdrop-blur-xl p-8 rounded-[40px] shadow-sm border border-on-surface/5 active:scale-[0.98] transition-all group overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 relative transform group-hover:rotate-6 group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl">
                <Image src="/plants/mature.png" alt="Success Forest" fill className="object-contain" />
              </div>
              <div>
                <h4 className="font-headline font-black text-on-surface text-xl tracking-tight">Khu Rừng Thành Công</h4>
                <p className="text-xs text-on-surface-variant/60 font-black uppercase tracking-widest mt-1.5">{profile.savedTrees} Cây đã lưu</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-primary group-hover:translate-x-1.5 transition-transform relative z-10 font-black text-3xl">arrow_forward_ios</span>
          </Link>
        </section>


        {/* Progress Rings Bento */}
        <section className="grid grid-cols-2 gap-4">
          <CircularGauge percent={taskPercent} color="#10B981" label="Tasks" subLabel="Complete" />
          <CircularGauge percent={revenuePercent} color="#0EA5E9" label="Revenue" subLabel="Goal" />
        </section>

        {/* Weekly Score Line Chart: Premium SVG */}
        <section className="bg-surface-container-lowest p-4 rounded-[28px] shadow-sm border border-on-surface/5">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-[9px] font-bold text-on-surface-variant uppercase tracking-[0.15em] leading-none mb-1 px-0.5">Weekly Performance</h3>
              <p className="text-xl font-headline font-black text-on-surface">{getWeekPoints()} <span className="text-[10px] font-bold text-primary opacity-60">pts</span></p>
            </div>
            {profile.currentWinStreak > 0 && (
              <span className="text-[8px] text-primary font-black bg-primary-fixed/30 px-2.5 py-1 rounded-full border border-primary/10 tracking-tight">🔥 {profile.currentWinStreak}D STREAK</span>
            )}
          </div>

          <div className="relative h-20 w-full mb-2">
            {(() => {
              const maxScore = Math.max(10, ...last7Days.map(d => entryMap[d]?.totalDayScore || 0));
              const width = 300; // arbitrary viewBox width
              const height = 80;
              const padding = 10;
              const chartWidth = width - (padding * 2);
              const chartHeight = height - (padding * 2);
              const stepX = chartWidth / 6;

              const points = last7Days.map((date, i) => {
                const score = entryMap[date]?.totalDayScore || 0;
                return {
                  x: padding + (i * stepX),
                  y: height - padding - (Math.max(0, score) / maxScore * chartHeight),
                  date,
                  score
                };
              });

              // Create smooth path d string
              let pathD = `M ${points[0].x} ${points[0].y}`;
              for (let i = 0; i < points.length - 1; i++) {
                const curr = points[i];
                const next = points[i + 1];
                const controlX = (curr.x + next.x) / 2;
                pathD += ` C ${controlX} ${curr.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
              }

              const fillD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

              return (
                <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  {[0, 0.5, 1].map((p) => (
                    <line 
                      key={p} 
                      x1={padding} y1={padding + (p * chartHeight)} 
                      x2={width - padding} y2={padding + (p * chartHeight)} 
                      stroke="currentColor" 
                      className="text-on-surface/5" 
                      strokeWidth="0.5" 
                    />
                  ))}

                  {/* Gradient Fill */}
                  <path d={fillD} fill="url(#chartGradient)" className="transition-all duration-1000" />

                  {/* Main Line */}
                  <path 
                    d={pathD} 
                    fill="none" 
                    stroke="var(--color-primary)" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="drop-shadow-[0_4px_8px_rgba(16,185,129,0.3)] transition-all duration-1000"
                  />

                  {/* Points */}
                  {points.map((p, i) => {
                    const isToday = p.date === today;
                    return (
                      <g key={i}>
                        {isToday && (
                          <circle cx={p.x} cy={p.y} r="6" className="fill-primary/20 animate-ping" />
                        )}
                        <circle 
                          cx={p.x} cy={p.y} 
                          r={isToday ? "4" : "3"} 
                          fill={isToday ? "var(--color-primary)" : "var(--color-surface-container-lowest)"} 
                          stroke="var(--color-primary)" 
                          strokeWidth="2"
                          className="transition-all duration-500"
                        />
                      </g>
                    );
                  })}
                </svg>
              );
            })()}
          </div>

          <div className="flex justify-between px-0.5 mt-2">
            {last7Days.map((date) => (
              <span 
                key={date} 
                className={`text-[9px] font-black uppercase tracking-widest ${date === today ? 'text-primary' : 'text-on-surface-variant/40'}`}
              >
                {getDayLabel(date)}
              </span>
            ))}
          </div>
        </section>

        {/* Habit History: Navigatable Month Calendar */}
        <section className="bg-surface-container-lowest p-4 rounded-[28px] shadow-sm border border-on-surface/5 space-y-4">
          <div className="flex justify-between items-center px-0.5">
            <div className="flex flex-col">
              <h3 className="text-[9px] font-bold text-on-surface-variant uppercase tracking-[0.15em] mb-1">Habit Calendar</h3>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-headline font-black text-on-surface capitalize">{getMonthName(viewDate)}</h4>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                    className="w-7 h-7 rounded-full hover:bg-surface-container-high transition-colors flex items-center justify-center text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  <button 
                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                    className="w-7 h-7 rounded-full hover:bg-surface-container-high transition-colors flex items-center justify-center text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-[10px]">🏆</span>
                <span className="text-[8px] font-bold text-on-surface-variant/60 uppercase">Win</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px]">💩</span>
                <span className="text-[8px] font-bold text-on-surface-variant/60 uppercase">Lose</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 px-0.5">
            {/* Day Header Labels */}
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
              <div key={d} className="text-center text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest mb-1">
                {d}
              </div>
            ))}
            
            {(() => {
              const monthMap: Record<string, DailyEntry> = {};
              monthEntries.forEach(e => { monthMap[e.date] = e; });
              
              const grid = getCalendarGrid(viewDate.getFullYear(), viewDate.getMonth());
              
              return grid.map(({ date, isCurrentMonth, day }) => {
                const e = monthMap[date];
                const isToday = date === today;
                const isWin = e?.submitted && e.isWin;
                const isLose = e?.submitted && !e.isWin;

                return (
                  <div key={date} className={`flex flex-col items-center gap-1 relative group ${!isCurrentMonth ? 'opacity-20' : ''}`}>
                    <div className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-300 border
                      ${isToday ? 'border-primary bg-primary/5 ring-4 ring-primary/5 z-10' : 'border-on-surface/5 bg-on-surface/[0.02]'}
                      ${isWin ? 'bg-tertiary-container/10 border-tertiary-container/30' : ''}
                      ${isLose ? 'bg-error-container/10 border-error-container/30' : ''}
                      ${isCurrentMonth ? 'hover:scale-110 active:scale-95' : 'pointer-events-none'}
                    `}>
                      {isWin ? (
                        <span className="text-sm drop-shadow-sm">🏆</span>
                      ) : isLose ? (
                        <span className="text-sm drop-shadow-sm">💩</span>
                      ) : (
                        <span className={`text-[10px] font-bold ${isToday ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                          {day}
                        </span>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </section>

        {/* Weekly Revenue: Bar Chart with Target Background */}
        <section className="bg-surface-container-lowest p-4 rounded-[28px] shadow-sm border border-on-surface/5 space-y-4">
          <div className="flex justify-between items-center px-0.5">
            <h3 className="text-[9px] font-bold text-on-surface-variant uppercase tracking-[0.15em]">Doanh thu thực tế (tuần)</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-[8px] font-bold text-on-surface-variant/60 uppercase">Thực tế</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-on-surface/10"></div>
                <span className="text-[8px] font-bold text-on-surface-variant/60 uppercase">Mục tiêu</span>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between h-44 px-1 gap-2 pt-10">
            {getLastNDays(7).map((dateStr) => {
              const entry = entries.find(e => e.date === dateStr);
              const actual = entry?.revenueTotal || 0;
              const target = entry?.revenueTarget || profile?.dailyRevenueTarget || 0;
              const metTarget = actual >= target && target > 0;
              
              // We want the 'target' to be roughly 70% of the chart height to be clearly visible
              // We find the max values for the whole week to keep bars relative to each other
              const weekTargets = getLastNDays(7).map(d => entries.find(e => e.date === d)?.revenueTarget || profile?.dailyRevenueTarget || 0);
              const weekActuals = getLastNDays(7).map(d => entries.find(e => e.date === d)?.revenueTotal || 0);
              
              const maxWeekTarget = Math.max(...weekTargets, 1);
              const maxWeekActual = Math.max(...weekActuals, 1);
              
              // New scaling: normalize based on max target, but allow overshoot
              // chartMax is determined by the highest of (target / 0.7) or (actual / 1.0)
              const chartMax = Math.max(maxWeekTarget / 0.7, maxWeekActual / 0.95);
              
              const targetHeight = (target / chartMax) * 100;
              const actualHeight = (actual / chartMax) * 100;

              return (
                <div key={dateStr} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Diamond Indicator */}
                  {metTarget && (
                    <div className="absolute -top-8 transition-all z-20 drop-shadow-[0_4px_8px_rgba(255,255,255,0.4)]">
                      <span className="text-base">💎</span>
                    </div>
                  )}

                  <div className="w-full h-32 relative flex items-end justify-center">
                    {/* Target Bar (Ghost) */}
                    <div 
                      style={{ height: `${targetHeight}%` }}
                      className="absolute w-full bg-on-surface/[0.1] rounded-t-xl transition-all duration-500"
                    ></div>
                    {/* Actual Bar (Solid) */}
                    <div 
                      style={{ height: `${actualHeight}%` }}
                      className="relative w-4/5 bg-primary rounded-t-xl shadow-md transition-all duration-700 z-10 group-hover:brightness-110"
                    >
                      {/* Sub-indicator if reaching target */}
                      {actualHeight > 0 && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-white/20 rounded-full opacity-0 group-hover:opacity-100"></div>
                      )}
                    </div>
                  </div>
                  
                  <span className={`text-[8px] font-black uppercase tracking-tighter ${dateStr === today ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                    {getDayLabel(dateStr)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 30-Day Revenue Line Chart */}
        <section className="bg-surface-container-lowest p-6 rounded-[40px] shadow-sm border border-on-surface/5 space-y-6">
          <div className="flex justify-between items-start px-1">
            <div>
              <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">XU HƯỚNG 30 NGÀY</h3>
              <h4 className="text-xl font-headline font-black text-on-surface tracking-tight">Doanh thu thực tế</h4>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-full border border-primary/5">30 Ngày Qua</p>
            </div>
          </div>

          <div className="h-44 w-full relative">
            {(() => {
              const last30 = getLastNDays(30);
              const dataPoints = last30.map(d => entryMap[d]?.revenueTotal || 0);
              const maxVal = Math.max(1, ...dataPoints, profile.dailyRevenueTarget);
              
              const width = 400; // viewBox width
              const height = 150;
              const padding = 5;
              const chartW = width - (padding * 2);
              const chartH = height - (padding * 2);

              const points = last30.map((date, i) => {
                const val = entryMap[date]?.revenueTotal || 0;
                return {
                  x: padding + (i * (chartW / 29)),
                  y: height - padding - (val / maxVal * chartH)
                };
              });

              let pathD = `M ${points[0].x} ${points[0].y}`;
              for (let i = 0; i < points.length - 1; i++) {
                const xc = (points[i].x + points[i + 1].x) / 2;
                const yc = (points[i].y + points[i + 1].y) / 2;
                pathD += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
              }
              pathD += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;

              const fillD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

              return (
                <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                   <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Target line (Dashed) */}
                  <line 
                    x1={padding} y1={height - padding - (profile.dailyRevenueTarget / maxVal * chartH)} 
                    x2={width - padding} y2={height - padding - (profile.dailyRevenueTarget / maxVal * chartH)} 
                    stroke="currentColor" className="text-on-surface-variant/20" strokeDasharray="4 4"
                  />
                  <path d={fillD} fill="url(#lineGrad)" />
                  <path d={pathD} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Only last point highlight */}
                  <circle cx={points[29].x} cy={points[29].y} r="5" fill="var(--color-primary)" className="animate-pulse" />
                </svg>
              );
            })()}
          </div>
          <div className="flex justify-between px-1 border-t border-on-surface/5 pt-4">
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest mb-1">Tổng cộng</span>
                <span className="text-sm font-headline font-black text-on-surface">
                  {entries.reduce((sum, e) => sum + (e.revenueTotal || 0), 0).toLocaleString()} VNĐ
                </span>
             </div>
             <div className="flex flex-col text-right">
                <span className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest mb-1">Mục tiêu TB</span>
                <span className="text-sm font-headline font-black text-primary">{profile.dailyRevenueTarget}tr</span>
             </div>
          </div>
        </section>

        {/* 30-Day Tasks Stacked Bar Chart */}
        <section className="bg-surface-container-lowest p-6 rounded-[40px] shadow-sm border border-on-surface/5 space-y-6">
           <div>
              <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">NĂNG SUẤT</h3>
              <h4 className="text-xl font-headline font-black text-on-surface tracking-tight">Số Task Hoàn Thành</h4>
            </div>

            <div className="flex items-end justify-between h-32 px-1 gap-1">
              {getLastNDays(30).map((date) => {
                const e = entryMap[date];
                const done = (e?.normalTasksDone || 0) + (e?.hardTasksDone || 0);
                const total = (e?.normalTasksTotal || 0) + (e?.hardTasksTotal || 0) || 7;
                const missed = Math.max(0, total - done);
                
                const donePct = (done / total) * 100;
                const missedPct = (missed / total) * 100;

                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                    <div className="w-full relative flex flex-col-reverse items-center h-full max-w-[8px]">
                      {/* Done Part */}
                      <div 
                        style={{ height: `${donePct}%` }}
                        className="w-full bg-primary rounded-sm transition-all duration-700 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                      ></div>
                      {/* Missed Part */}
                      <div 
                        style={{ height: `${missedPct}%` }}
                        className="w-full bg-on-surface/5 rounded-t-sm transition-all duration-500"
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-surface-container/50 p-3 rounded-2xl border border-on-surface/5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Hoàn thành</span>
                </div>
                <p className="text-sm font-headline font-black text-on-surface">
                  {entries.reduce((sum, e) => sum + (e.normalTasksDone + e.hardTasksDone), 0)}
                </p>
              </div>
              <div className="bg-surface-container/50 p-3 rounded-2xl border border-on-surface/5 text-right">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Chưa đạt</span>
                  <div className="w-2 h-2 rounded-full bg-on-surface/10"></div>
                </div>
                <p className="text-sm font-headline font-black text-on-surface-variant">
                  {entries.reduce((sum, e) => {
                    const total = (e.normalTasksTotal || 0) + (e.hardTasksTotal || 0) || 7;
                    const done = e.normalTasksDone + e.hardTasksDone;
                    return sum + Math.max(0, total - done);
                  }, 0)}
                </p>
              </div>
            </div>
        </section>
      </main>

      {/* Contextual FAB */}
      <div className="fixed bottom-28 left-0 w-full flex justify-center px-6 z-40 pointer-events-none">
        <button 
          onClick={handleWater}
          disabled={wateredToday || watering || plantStage === 'dead'}
          className={`pointer-events-auto flex items-center gap-3 px-8 py-4 rounded-full font-headline font-extrabold shadow-[0_12px_32px_rgba(25,28,27,0.15)] active:scale-95 transition-all duration-300
            ${wateredToday ? 'bg-secondary-container text-on-secondary-container opacity-80' : plantStage === 'dead' ? 'bg-surface-container-highest text-on-surface-variant opacity-60' : 'bg-primary text-on-primary'}
          `}>
          <span className={`material-symbols-outlined text-2xl ${wateredToday ? 'fill-1' : ''}`}>water_drop</span>
          <span className="tracking-tight uppercase text-sm">
            {watering ? 'ĐANG TƯỚI...' : wateredToday ? 'ĐÃ TƯỚI' : plantStage === 'dead' ? 'CÂY ĐÃ CHẾT' : 'TƯỚI CÂY'}
          </span>
        </button>
      </div>

      <BottomNav active="/" />
    </div>
  );
}
