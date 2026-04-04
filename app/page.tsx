'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import BottomNav from '@/components/BottomNav';
import { getPlantStage, getPlantImage, getPlantStageName, getDayLabel, getTodayStr, getLastNDays, getStreakMultiplier, canRevivePlant, revivePlant } from '@/lib/gameLogic';
import { waterPlant, getRecentEntries, updateUserProfile } from '@/lib/database';
import { DailyEntry } from '@/lib/types';

// Custom Circle Progress
function CircularGauge({ percent, color, label, subLabel }: { percent: number; color: string; label: string; subLabel: string }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(percent / 100, 1)) * circ;

  return (
    <div className="bg-surface-container-lowest p-5 rounded-lg flex flex-col items-center justify-center space-y-3 shadow-sm">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle className="stroke-surface-container-high" cx="18" cy="18" r={r} fill="none" strokeWidth="3"></circle>
          <circle
            cx="18" cy="18" r={r}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${dash}, ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          ></circle>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-headline font-extrabold" style={{ color }}>{Math.round(percent)}%</span>
        </div>
      </div>
      <div className="text-center">
        <span className="text-xs font-label text-on-surface-variant uppercase tracking-wider block">{label}</span>
        <span className="text-[10px] font-medium" style={{ color }}>{subLabel}</span>
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

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getRecentEntries(user.id, 7).then(setEntries);
    }
  }, [user, profile]);

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
    <div className="pb-32 relative">
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
      <header className="w-full top-0 sticky z-50 bg-gradient-to-b from-surface/80 to-transparent flex justify-between items-center px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-container/30 flex items-center justify-center border border-primary/20">
            <span className="text-xl">🌿</span>
          </div>
          <h1 className="text-lg font-bold text-primary font-headline tracking-tight">The Digital Greenhouse</h1>
        </div>
        <div className="text-primary font-headline tracking-tight font-bold">
          {profile.totalGamePoints} pts
        </div>
      </header>

      <main className="px-6 pt-4 space-y-8">
        {/* Hero Section: Digital Plant */}
        <section className="flex flex-col items-center justify-center py-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-primary-fixed/30 to-transparent opacity-60 -z-10 blur-3xl rounded-full"></div>
          <div className="relative w-64 h-64 flex items-center justify-center transition-transform hover:scale-105 duration-700">
            <Image
              src={plantImg}
              alt="Digital Plant Blooming"
              width={250}
              height={250}
              className={`w-full h-full object-contain drop-shadow-2xl ${plantStage === 'dead' ? 'opacity-50 grayscale' : ''}`}
            />
          </div>
          <div className="mt-4 flex flex-col items-center">
            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${plantStage === 'dead' ? 'bg-error-container/20 text-error' : 'bg-primary-container/20 text-primary'} font-bold text-sm`}>
              <span className={`w-2 h-2 rounded-full ${plantStage === 'dead' ? 'bg-error' : 'bg-primary animate-pulse'}`}></span>
              State: {plantStage === 'dead' ? 'Dead 💀' : 'Growing 🌱'}
            </span>
            <p className="mt-2 text-on-surface-variant font-label text-xs tracking-widest uppercase">{getPlantStageName(profile)}</p>
          </div>
        </section>

        {/* Progress Rings Bento */}
        <section className="grid grid-cols-2 gap-4">
          <CircularGauge percent={taskPercent} color="var(--color-secondary-container)" label="Tasks" subLabel="Complete" />
          <CircularGauge percent={revenuePercent} color="var(--color-tertiary-container)" label="Revenue" subLabel="Goal" />
        </section>

        {/* Weekly Score Chart */}
        <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-xs font-label text-on-surface-variant uppercase tracking-widest leading-none mb-2">Weekly Score</h3>
              <p className="text-3xl font-headline font-extrabold text-on-surface">{getWeekPoints()} <span className="text-sm font-medium text-primary">pts</span></p>
            </div>
            {profile.currentWinStreak > 0 && (
              <span className="text-xs text-primary font-bold bg-primary-fixed/40 px-3 py-1.5 rounded-full">🔥 {profile.currentWinStreak} D Streak</span>
            )}
          </div>

          <div className="flex items-end justify-between h-24 gap-2">
            {last7Days.map((date) => {
              const e = entryMap[date];
              const score = e?.totalDayScore || 0;
              const maxScore = Math.max(10, ...Object.values(entryMap).map(x => x.totalDayScore || 0));
              const heightPct = e ? Math.max((score / maxScore) * 100, 10) : 0;
              const isToday = date === today;

              return (
                <div key={date} className="flex flex-col items-center gap-2 flex-1">
                  <div 
                    className={`w-full rounded-t-full transition-all duration-500 ${isToday ? 'bg-primary' : 'bg-surface-container-high'}`} 
                    style={{ height: `${heightPct}%`, minHeight: '10%' }}
                  />
                  <span className={`text-[10px] font-label ${isToday ? 'text-primary font-bold' : 'text-stone-400'}`}>{getDayLabel(date)[0]}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Habit History */}
        <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-label text-on-surface-variant uppercase tracking-widest px-1">Habit History</h3>
          <div className="flex justify-between items-center">
            {last7Days.map((date) => {
              const e = entryMap[date];
              const isToday = date === today;
              const isWin = e?.submitted && e.isWin;
              const isLose = e?.submitted && !e.isWin;

              return (
                <div key={date} className="flex flex-col items-center gap-2">
                  <span className={`text-[10px] font-label ${isToday ? 'text-primary font-bold' : 'text-stone-400'}`}>
                    {getDayLabel(date)[0]}
                  </span>
                  {isWin ? (
                    <div className="w-8 h-8 rounded-full bg-tertiary-container/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-tertiary-container text-lg fill-1">emoji_events</span>
                    </div>
                  ) : isLose ? (
                    <div className="w-8 h-8 rounded-full bg-error-container/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-error text-lg font-bold">close</span>
                    </div>
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isToday ? 'border-2 border-primary border-dashed' : 'bg-surface-container-high/50'}`}>
                      <span className="text-[10px] text-stone-400">-</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Upcoming Milestone */}
        <section className="space-y-3 pb-8">
          <h3 className="text-xs font-label text-on-surface-variant uppercase tracking-widest px-1">Evolution Progress</h3>
          <div className="bg-surface-container-lowest p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10 w-full">
              <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center flex-shrink-0 text-xl border border-primary-container/40">
                🌱
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <p className="text-sm font-bold text-on-surface">Tiến hóa cây</p>
                  <span className="text-xs font-bold text-primary">{profile.plantAccumulatedPoints}/7</span>
                </div>
                <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden w-full">
                  <div className="h-full bg-gradient-to-r from-primary to-primary-container transition-all duration-700" style={{ width: `${plantProgressPct}%` }}></div>
                </div>
              </div>
            </div>
            <div className="bg-primary/5 blur-[20px] absolute right-0 w-32 h-32 rounded-full z-0"></div>
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
