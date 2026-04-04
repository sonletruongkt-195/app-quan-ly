'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import BottomNav from '@/components/BottomNav';
import { getRecentEntries } from '@/lib/database';
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
      getRecentEntries(user.id, 14).then((e) => {
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

  const winCount = submittedEntries.filter(e => e.isWin).length;
  const winRate = submittedEntries.length > 0
    ? Math.round((winCount / submittedEntries.length) * 100) : 0;

  const totalRevenue = submittedEntries.reduce((sum, e) => sum + (e.revenueTotal || 0), 0);
  const avgScore = submittedEntries.length > 0
    ? (submittedEntries.reduce((sum, e) => sum + e.totalDayScore, 0) / submittedEntries.length).toFixed(1)
    : '0';

  const maxScore = last7.reduce((max, date) => {
    const e = entryMap[date];
    return e?.submitted ? Math.max(max, e.totalDayScore) : max;
  }, 0);

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
            { label: 'Tổng điểm', value: profile.totalGamePoints, icon: 'star', color: 'text-tertiary', bg: 'bg-tertiary-container/30' },
            { label: 'Win Rate', value: `${winRate}%`, icon: 'emoji_events', color: 'text-primary', bg: 'bg-primary-container/40' },
            { label: 'Kỷ lục Streak', value: profile.longestWinStreak, icon: 'local_fire_department', color: 'text-error', bg: 'bg-error-container/30' },
            { label: 'Streak hiện tại', value: profile.currentWinStreak, icon: 'bolt', color: 'text-[#0288D1]', bg: 'bg-[#0288D1]/10' },
          ].map((s, i) => (
            <div key={i} className="bg-surface-container-lowest p-3 rounded-[24px] shadow-sm border border-on-surface/5 flex flex-col items-center justify-center text-center group active:scale-95 transition-transform">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.bg} border border-white/10 shadow-sm`}>
                <span className={`material-symbols-outlined fill-1 text-lg ${s.color}`}>{s.icon}</span>
              </div>
              <span className="text-xl font-headline font-black text-on-surface leading-none">{s.value}</span>
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
              <span className="text-4xl font-headline font-black text-primary tracking-tighter">{totalRevenue.toFixed(1)}</span>
              <span className="text-lg font-black text-primary/60">M</span>
            </div>
            <p className="text-[10px] font-bold text-on-surface-variant/80">Phân tích từ {submittedEntries.length} ngày gần nhất</p>
            
            <div className="mt-8 space-y-4">
              {[
                { label: 'Điện lạnh', total: submittedEntries.reduce((s, e) => s + e.revenue.dienLanh, 0), color: 'bg-[#0288D1]' },
                { label: 'Chay', total: submittedEntries.reduce((s, e) => s + e.revenue.chay, 0), color: 'bg-emerald-500' },
                { label: 'Lái xe', total: submittedEntries.reduce((s, e) => s + e.revenue.laiXe, 0), color: 'bg-amber-500' },
              ].map((cat) => {
                const pct = totalRevenue > 0 ? (cat.total / totalRevenue) * 100 : 0;
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
