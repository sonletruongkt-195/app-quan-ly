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
      <header className="w-full top-0 sticky z-50 bg-gradient-to-b from-surface/90 to-surface/40 flex justify-between items-center px-6 py-4 pt-6 backdrop-blur-md">
        <div>
          <p className="text-primary font-label text-xs uppercase tracking-widest leading-none mb-1">Thống Kê</p>
          <h1 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">Phân tích</h1>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary-container/30 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-2xl">bar_chart</span>
        </div>
      </header>

      <main className="px-6 space-y-6 mt-4">

        {/* Quick stats */}
        <section className="grid grid-cols-2 gap-4">
          {[
            { label: 'Tổng điểm', value: profile.totalGamePoints, icon: 'star', color: 'text-tertiary-container', bg: 'bg-tertiary-container/20' },
            { label: 'Win Rate', value: `${winRate}%`, icon: 'emoji_events', color: 'text-primary', bg: 'bg-primary-container/30' },
            { label: 'Streak dài nhất', value: profile.longestWinStreak, icon: 'local_fire_department', color: 'text-error', bg: 'bg-error-container/30' },
            { label: 'Streak hiện tại', value: profile.currentWinStreak, icon: 'bolt', color: 'text-secondary-container', bg: 'bg-secondary-container/20' },
          ].map((s, i) => (
            <div key={i} className="bg-surface-container-lowest p-4 rounded-3xl shadow-sm border border-surface-container-highest flex flex-col items-center justify-center text-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${s.bg}`}>
                <span className={`material-symbols-outlined fill-1 ${s.color}`}>{s.icon}</span>
              </div>
              <span className="text-2xl font-headline font-extrabold text-on-surface">{s.value}</span>
              <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mt-1">{s.label}</span>
            </div>
          ))}
        </section>

        {/* 7-day bar chart */}
        <section className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container-highest">
          <h3 className="text-xs font-label text-on-surface-variant uppercase tracking-widest mb-6">📅 Điểm 7 ngày qua</h3>
          <div className="flex items-end justify-between h-32 gap-3">
            {last7.map((date) => {
              const e = entryMap[date];
              const score = e?.submitted ? e.totalDayScore : 0;
              const heightPct = maxScore > 0 ? (score / Math.max(maxScore, 1)) * 100 : 0;
              const isToday = date === getTodayStr();

              return (
                <div key={date} className="flex flex-col items-center flex-1 h-full justify-end gap-2">
                  <div className="w-full relative flex items-end h-[80%] rounded-t-full bg-surface-container-highest/30 overflow-hidden">
                    <div
                      className={`w-full rounded-t-full relative bottom-0 ${e?.submitted ? (e.isWin ? 'bg-primary' : 'bg-error') : 'bg-transparent'}`}
                      style={{ height: `${Math.max(heightPct, e?.submitted ? 10 : 0)}%`, transition: 'height 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    />
                  </div>
                  <div className="flex flex-col items-center text-center h-[20%]">
                    <span className={`text-[10px] font-label uppercase ${isToday ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                      {getDayLabel(date)[0]}
                    </span>
                    {e?.submitted && (
                      <span className={`text-[8px] font-bold ${e.isWin ? 'text-primary' : 'text-error'}`}>
                        {e.totalDayScore.toFixed(0)}
                      </span>
                    )}
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

        {/* Revenue summary */}
        <section className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container-highest">
          <h3 className="text-xs font-label text-on-surface-variant uppercase tracking-widest mb-4">💰 Doanh thu tích lũy</h3>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-4xl font-headline font-extrabold text-primary">{totalRevenue.toFixed(1)}</span>
            <span className="text-sm font-bold text-primary">M</span>
          </div>
          <p className="text-xs text-on-surface-variant mb-4">Tổng doanh thu ({submittedEntries.length} ngày)</p>
          
          <div className="space-y-3">
            {[
              { label: 'Điện lạnh', total: submittedEntries.reduce((s, e) => s + e.revenue.dienLanh, 0) },
              { label: 'Chay', total: submittedEntries.reduce((s, e) => s + e.revenue.chay, 0) },
              { label: 'Lái xe', total: submittedEntries.reduce((s, e) => s + e.revenue.laiXe, 0) },
            ].map((cat) => (
              <div key={cat.label} className="flex justify-between items-center text-sm border-b border-surface-container-high pb-2 last:border-0 last:pb-0">
                <span className="font-medium text-on-surface-variant">{cat.label}</span>
                <span className="font-bold text-on-surface">{cat.total.toFixed(1)}M</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recent history list */}
        <section className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container-highest">
          <h3 className="text-xs font-label text-on-surface-variant uppercase tracking-widest mb-4">📋 Lịch sử 7 ngày qua</h3>
          
          {submittedEntries.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3 opacity-30">📭</div>
              <h4 className="text-sm font-bold text-on-surface">Chưa có dữ liệu</h4>
              <p className="text-xs text-on-surface-variant mt-1">Bắt đầu ghi nhận hôm nay!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submittedEntries.slice(0, 7).reverse().map((e) => (
                <div key={e.date} className={`flex items-center justify-between p-4 rounded-2xl ${e.isWin ? 'bg-primary-container/20 border-primary-container/50' : 'bg-error-container/20 border-error-container/50'} border`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${e.isWin ? 'bg-primary-container/50' : 'bg-error-container/50'}`}>
                      <span className="material-symbols-outlined fill-1 text-lg">{e.isWin ? 'emoji_events' : 'close'}</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-on-surface">{e.date}</div>
                      <div className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5">Task {Math.round(e.taskPercent)}% • Rev {Math.round(e.revenuePercent)}%</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-headline font-extrabold ${e.isWin ? 'text-primary' : 'text-error'}`}>
                      {e.totalDayScore.toFixed(1)}đ
                    </div>
                    <div className={`text-[10px] font-bold uppercase ${e.isWin ? 'text-primary' : 'text-error'}`}>
                      {e.isWin ? 'WIN' : 'LOSE'}
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
