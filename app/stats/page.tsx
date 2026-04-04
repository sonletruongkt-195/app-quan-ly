'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import BottomNav from '@/components/BottomNav';
import { getAllEntries } from '@/lib/database';
import { getLastNDays, getDayLabel, getTodayStr } from '@/lib/gameLogic';
import { DailyEntry } from '@/lib/types';
import Link from 'next/link';

export default function StatsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); return; }
    if (user) {
      getAllEntries(user.id).then((e) => {
        setEntries(e);
        setLoadingEntries(false);
      });
    }
  }, [user, loading, router]);

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center bg-surface"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" /></div>;
  }

  const last7 = getLastNDays(7);
  const entryMap: Record<string, DailyEntry> = {};
  entries.forEach(e => { entryMap[e.date] = e; });
  const today = getTodayStr();

  const submittedEntries = entries.filter(e => e.submitted);
  
  // 1. Total Points (Recalculated from records)
  const totalPointsReal = submittedEntries.reduce((sum, e) => sum + e.totalDayScore, 0);
  
  // 2. Cumulative Revenue
  const cumulativeRevenue = submittedEntries.reduce((sum, e) => sum + (e.revenueTotal || 0), 0);
  
  // 3. Total Tasks Completed
  const totalTasksDone = submittedEntries.reduce((sum, e) => sum + (e.normalTasksDone + e.hardTasksDone), 0);
  const totalTasksTarget = submittedEntries.reduce((sum, e) => sum + (e.normalTasksTotal + e.hardTasksTotal), 0);
  
  // 4. Watering Success/Fail
  const wateringSuccess = entries.filter(e => e.wateredToday).length;
  const wateringMissed = entries.filter(e => !e.wateredToday && e.submitted).length;

  const winCount = submittedEntries.filter(e => e.isWin).length;
  const winRate = submittedEntries.length > 0
    ? Math.round((winCount / submittedEntries.length) * 100) : 0;

  const totalRevenueLast14 = submittedEntries.slice(-14).reduce((sum, e) => sum + (e.revenueTotal || 0), 0);
  
  const maxScore = last7.reduce((max, date) => {
    const e = entryMap[date];
    return e?.submitted ? Math.max(max, e.totalDayScore) : max;
  }, 0);

  // 30-day analytics calculations
  const last30 = getLastNDays(30);
  const maxRevenue30 = Math.max(...last30.map(d => entryMap[d]?.revenueTotal || 0), 0.1);
  const maxTasks30 = Math.max(...last30.map(d => (entryMap[d]?.normalTasksTotal || 0) + (entryMap[d]?.hardTasksTotal || 0)), 1);

  return (
    <div className="pb-32 bg-surface min-h-screen relative">
      {/* Header */}
      <header className="w-full top-0 sticky z-50 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-4 py-4 border-b border-on-surface/5">
        <div>
          <p className="text-secondary font-label text-[9px] uppercase tracking-[0.2em] font-black mb-0.5">Analytics</p>
          <h1 className="text-2xl font-headline font-black text-on-surface tracking-tight">Thống kê</h1>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary-container/30 flex items-center justify-center text-primary shadow-inner border border-primary-container/20">
          <span className="material-symbols-outlined text-xl font-bold">query_stats</span>
        </div>
      </header>


      <main className="px-4 space-y-4 mt-2">

        {/* Quick stats grid */}
        <section className="grid grid-cols-2 gap-3">
          {[
            { label: 'Tổng điểm', value: `${totalPointsReal.toFixed(1)}đ`, icon: 'star', color: 'text-tertiary', bg: 'bg-tertiary-container/30' },
            { label: 'Doanh thu (M)', value: `${cumulativeRevenue.toFixed(1)}M`, icon: 'payments', color: 'text-primary', bg: 'bg-primary-container/40' },
            { label: 'Task đã xong', value: `${totalTasksDone} / ${totalTasksTarget}`, icon: 'task_alt', color: 'text-secondary', bg: 'bg-secondary-container/20' },
            { label: 'Tưới cây (✅/❌)', value: `${wateringSuccess} / ${wateringMissed}`, icon: 'water_drop', color: 'text-[#0288D1]', bg: 'bg-[#0288D1]/10' },
          ].map((s, i) => (
            <div key={i} className="bg-surface-container-lowest p-3 rounded-[24px] shadow-sm border border-on-surface/5 flex flex-col items-center justify-center text-center group active:scale-95 transition-transform">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.bg} border border-white/10 shadow-sm`}>
                <span className={`material-symbols-outlined fill-1 text-lg ${s.color}`}>{s.icon}</span>
              </div>
              <span className="text-lg font-headline font-black text-on-surface leading-none">{s.value}</span>
              <span className="text-[9px] font-label font-bold uppercase tracking-wider text-on-surface-variant/80 mt-1">{s.label}</span>
            </div>
          ))}
        </section>


        {/* 7-day bar chart: Premium rounded bars with gradients */}
        <section className="bg-surface-container-lowest p-5 rounded-[28px] shadow-sm border border-on-surface/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <span className="material-symbols-outlined text-5xl">timeline</span>
          </div>
          <h3 className="text-[9px] font-label font-black text-on-surface-variant uppercase tracking-[0.2em] mb-6 px-0.5">Diễn biến 7 ngày</h3>
          <div className="flex items-end justify-between h-32 gap-3 relative z-10">
            {last7.map((date) => {
              const e = entryMap[date];
              const score = e?.submitted ? e.totalDayScore : 0;
              const heightPct = maxScore > 0 ? (score / Math.max(maxScore, 1)) * 100 : 0;
              const isToday = date === getTodayStr();

              return (
                <div key={date} className="flex flex-col items-center flex-1 h-full justify-end gap-3">
                  <div className="w-full relative flex items-end h-[85%] rounded-full bg-surface-container-highest/40 overflow-hidden shadow-inner border border-on-surface/5 group">
                    <div
                      className={`w-full rounded-full relative bottom-0 transition-all duration-1000 ease-out group-hover:brightness-110 ${
                        e?.submitted 
                          ? (e.isWin ? 'bg-gradient-to-t from-primary to-primary-container shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-gradient-to-t from-error to-error-container opacity-80') 
                          : 'bg-transparent'
                      }`}
                      style={{ height: `${Math.max(heightPct, e?.submitted ? 10 : 0)}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-shine"></div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center text-center h-[15%]">
                    <span className={`text-[10px] font-black ${isToday ? 'text-primary' : 'text-on-surface-variant/70'}`}>
                      {getDayLabel(date)[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>


        {/* Win streak info */}
        <section className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container-highest">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-label text-on-surface-variant uppercase tracking-widest">🔥 Win Streak</h3>
            <span className="text-lg font-headline font-extrabold text-error">{profile.currentWinStreak} D</span>
          </div>
          
          <div className="flex gap-2 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-1 h-2 rounded-full bg-surface-container-highest overflow-hidden">
                <div className={`h-full ${i < profile.currentWinStreak ? 'bg-gradient-to-r from-error to-[#FFB4A9]' : 'bg-transparent'}`}></div>
              </div>
            ))}
          </div>
          
          <div className="bg-error-container/20 px-4 py-3 rounded-xl border border-error-container/30">
            {profile.currentWinStreak >= 3 ? (
              <p className="text-sm font-bold text-error flex items-center gap-2">
                <span className="material-symbols-outlined fill-1 text-lg">bolt</span>
                Đang nhân ×1.2 điểm task + doanh thu!
              </p>
            ) : profile.currentWinStreak > 0 ? (
              <p className="text-sm text-on-surface-variant font-medium">
                Còn {3 - profile.currentWinStreak} ngày WIN liên tiếp để kích hoạt ×1.2
              </p>
            ) : (
              <p className="text-sm text-on-surface-variant font-medium">
                Thắng 3 ngày liên tiếp để nhân ×1.2 điểm!
              </p>
            )}
          </div>
        </section>

        {/* Revenue Bento Summary: High impact layout */}
        <section className="grid grid-cols-1 gap-3">
          <div className="bg-surface-container-lowest p-6 rounded-[28px] shadow-sm border border-on-surface/5 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/10 rounded-full blur-3xl"></div>
            <h3 className="text-[9px] font-label font-black text-on-surface-variant uppercase tracking-[0.2em] mb-3">Tổng doanh thu</h3>
            <div className="flex items-baseline gap-1.5 mb-1.5">
              <span className="text-4xl font-headline font-black text-primary tracking-tighter">{cumulativeRevenue.toFixed(1)}</span>
              <span className="text-lg font-black text-primary/60">M</span>
            </div>
            <p className="text-[10px] font-bold text-on-surface-variant/80">Tính từ tất cả {submittedEntries.length} bản ghi</p>
            
            <div className="mt-8 space-y-4">
              {[
                { label: 'Điện lạnh', total: submittedEntries.reduce((s, e) => s + e.revenue.dienLanh, 0), color: 'bg-[#0288D1]' },
                { label: 'Chay', total: submittedEntries.reduce((s, e) => s + e.revenue.chay, 0), color: 'bg-emerald-500' },
                { label: 'Lái xe', total: submittedEntries.reduce((s, e) => s + e.revenue.laiXe, 0), color: 'bg-amber-500' },
              ].map((cat) => {
                const pct = cumulativeRevenue > 0 ? (cat.total / cumulativeRevenue) * 100 : 0;
                return (
                  <div key={cat.label} className="group">
                    <div className="flex justify-between items-center mb-2 px-1">
                      <span className="text-xs font-black text-on-surface tracking-tight uppercase">{cat.label}</span>
                      <span className="text-xs font-black text-on-surface-variant">{cat.total.toFixed(1)}M</span>
                    </div>
                    <div className="h-2.5 bg-surface-container-highest rounded-full overflow-hidden border border-on-surface/5 shadow-inner">
                      <div 
                        className={`h-full transition-all duration-1000 ${cat.color} relative overflow-hidden`}
                        style={{ width: `${pct}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-shine"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 30-day Revenue Line Chart */}
        <section className="bg-surface-container-lowest p-6 rounded-[28px] shadow-sm border border-on-surface/5">
          <h3 className="text-[9px] font-label font-black text-on-surface-variant uppercase tracking-[0.2em] mb-6 px-0.5">Doanh thu thực tế (30 ngày)</h3>
          
          <div className="overflow-x-auto pb-4 -mx-1 scrollbar-hide">
            <div className="min-w-[800px] h-40 relative">
              <svg viewBox={`0 0 800 160`} className="w-full h-full" preserveAspectRatio="none">
                {/* Area Gradient */}
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--md-sys-color-primary)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--md-sys-color-primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Path Logic */}
                {(() => {
                  const points = last30.map((date, i) => {
                    const e = entryMap[date];
                    const val = e?.submitted ? e.revenueTotal : 0;
                    const x = (i / 29) * 800;
                    const y = 160 - (val / maxRevenue30) * 140 - 10;
                    return { x, y };
                  });
                  
                  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                  const areaD = `${d} L 800 160 L 0 160 Z`;

                  return (
                    <>
                      <path d={areaD} fill="url(#lineGradient)" />
                      <path d={d} fill="none" stroke="var(--md-sys-color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      {points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="var(--md-sys-color-surface-container-lowest)" stroke="var(--md-sys-color-primary)" strokeWidth="2" />
                      ))}
                    </>
                  );
                })()}
              </svg>
              
              {/* Date Labels */}
              <div className="flex justify-between mt-2 px-2 text-[8px] font-black text-on-surface-variant/40">
                {last30.filter((_, i) => i % 5 === 0 || i === 29).map((date, i) => (
                  <span key={i}>{date.slice(8, 10)}/{date.slice(5, 7)}</span>
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* 30-day Stacked Task Bar Chart */}
        <section className="bg-surface-container-lowest p-6 rounded-[28px] shadow-sm border border-on-surface/5">
          <h3 className="text-[9px] font-label font-black text-on-surface-variant uppercase tracking-[0.2em] mb-6 px-0.5">Tổng số task hoàn thành (30 ngày)</h3>
          
          <div className="overflow-x-auto pb-4 -mx-1 scrollbar-hide">
            <div className="min-w-[900px] h-48 flex items-end gap-1.5 px-2">
              {last30.map((date) => {
                const e = entryMap[date];
                const done = e?.submitted ? (e.normalTasksDone + e.hardTasksDone) : 0;
                const total = e?.submitted ? (e.normalTasksTotal + e.hardTasksTotal) : 0;
                const remaining = Math.max(0, total - done);
                
                const doneHeight = total > 0 ? (done / 10) * 100 : 0; // Max 10 tasks height
                const remHeight = total > 0 ? (remaining / 10) * 100 : 0;

                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full h-32 flex flex-col justify-end bg-surface-container-highest/20 rounded-full overflow-hidden border border-on-surface/5">
                      {/* Remainder Segment */}
                      <div 
                        className="w-full bg-on-surface/10 transition-all duration-700" 
                        style={{ height: `${remHeight}%` }}
                      ></div>
                      {/* Done Segment */}
                      <div 
                        className="w-full bg-secondary shadow-inner transition-all duration-700 relative" 
                        style={{ height: `${doneHeight}%` }}
                      >
                        <div className="absolute inset-0 bg-white/10 animate-shine"></div>
                      </div>
                    </div>
                    <span className="text-[7px] font-black text-on-surface-variant/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      {date.slice(8, 10)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mt-4 flex gap-4 px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-secondary"></div>
              <span className="text-[8px] font-bold text-on-surface-variant/80 uppercase">Đã hoàn thành</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-on-surface/20"></div>
              <span className="text-[8px] font-bold text-on-surface-variant/80 uppercase">Chưa hoàn thành</span>
            </div>
          </div>
        </section>


        {/* Recent history list: Clean transaction style */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-label font-black text-on-surface-variant uppercase tracking-[0.2em] px-1">Nhật ký hoạt động</h3>
          
          {submittedEntries.length === 0 ? (
            <div className="bg-surface-container-lowest p-12 rounded-[40px] border border-dashed border-on-surface/10 text-center">
              <div className="text-5xl mb-4 grayscale opacity-20">📭</div>
              <h4 className="text-sm font-black text-on-surface">Chưa có dữ liệu lịch sử</h4>
              <p className="text-xs text-on-surface-variant mt-2 font-medium">Bắt đầu hành trình của bạn ngay hôm nay!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {submittedEntries.slice(0, 10).reverse().map((e) => (
                <div key={e.date} className="bg-surface-container-lowest p-4 rounded-[24px] shadow-sm border border-on-surface/5 flex items-center justify-between group active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${e.isWin ? 'bg-primary-container/20 border-primary/20 text-primary' : 'bg-error-container/20 border-error/20 text-error'}`}>
                      <span className="material-symbols-outlined fill-1 text-xl">{e.isWin ? 'emoji_events' : 'close'}</span>
                    </div>
                    <div>
                      <div className="text-xs font-black text-on-surface tracking-tight">{e.date === today ? 'Hôm nay' : e.date}</div>
                      <div className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mt-0.5">Task {Math.round(e.taskPercent)}% • Rev {Math.round(e.revenuePercent)}%</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-headline font-black ${e.isWin ? 'text-primary' : 'text-error'}`}>
                      {e.totalDayScore.toFixed(1)}đ
                    </div>
                    <div className={`text-[8px] font-black uppercase tracking-[0.1em] px-1.5 py-0.5 rounded mt-1 ${e.isWin ? 'bg-primary-container text-primary' : 'bg-error-container text-error'}`}>
                      {e.isWin ? 'SUCCESS' : 'MISSED'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>


      </main>

      <BottomNav active="/stats" />
    </div>
  );
}
