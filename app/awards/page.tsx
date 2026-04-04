'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';

interface Badge {
  id: string;
  icon: string;
  name: string;
  desc: string;
  condition: (totalPts: number, streak: number, flowers: number, fruits: number, trees: number) => boolean;
}

const BADGES: Badge[] = [
  { id: 'first_water', icon: '💧', name: 'Người Mới Bắt Đầu', desc: 'Lần đầu tưới cây', condition: (pts) => pts >= 1 },
  { id: 'week_warrior', icon: '🌻', name: 'Chiến Binh Tuần', desc: 'Tích lũy 20 điểm', condition: (pts) => pts >= 20 },
  { id: 'sun_lover', icon: '☀️', name: 'Sun-Lover Medal', desc: 'Tích lũy 50 điểm', condition: (pts) => pts >= 50 },
  { id: 'first_flower', icon: '🌸', name: 'Người Trồng Hoa', desc: 'Ra được hoa đầu tiên 🌸', condition: (_p, _s, fl) => fl >= 1 },
  { id: 'first_fruit', icon: '🍎', name: 'Người Thu Hoạch', desc: 'Ra được quả đầu tiên 🍎', condition: (_p, _s, _f, fr) => fr >= 1 },
  { id: 'first_tree', icon: '🌳', name: 'Người Trồng Rừng', desc: 'Lưu được cây đầu tiên', condition: (_p, _s, _f, _fr, tr) => tr >= 1 },
  { id: 'streak_3', icon: '🔥', name: 'Bộ Ba Chiến Thắng', desc: 'Win streak 3 ngày', condition: (_p, str) => str >= 3 },
  { id: 'streak_7', icon: '⚡', name: 'Siêu Streak', desc: 'Win streak 7 ngày', condition: (_p, str) => str >= 7 },
  { id: 'century', icon: '💯', name: 'Tích Lũy 100 Điểm', desc: 'Đạt 100 tổng điểm', condition: (pts) => pts >= 100 },
  { id: 'forest_3', icon: '🌲', name: 'Người Rừng', desc: 'Lưu được 3 cây rừng', condition: (_p, _s, _f, _fr, tr) => tr >= 3 },
];

export default function AwardsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center bg-surface"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" /></div>;
  }

  const unlocked = BADGES.filter(b => b.condition(
    profile.totalGamePoints,
    profile.longestWinStreak,
    profile.flowers,
    profile.fruits,
    profile.savedTrees,
  ));
  const locked = BADGES.filter(b => !b.condition(
    profile.totalGamePoints,
    profile.longestWinStreak,
    profile.flowers,
    profile.fruits,
    profile.savedTrees,
  ));

  return (
    <div className="pb-32 bg-surface min-h-screen relative">
      {/* Header with collection progress */}
      <header className="w-full top-0 sticky z-50 bg-surface/80 backdrop-blur-xl px-6 py-6 border-b border-on-surface/5">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-tertiary font-label text-[10px] uppercase tracking-[0.3em] font-black mb-1">Collection</p>
            <h1 className="text-3xl font-headline font-black text-on-surface tracking-tight">Huy hiệu</h1>
          </div>
          <div className="text-right">
            <div className="text-3xl font-headline font-black text-tertiary tracking-tighter leading-none">
              {unlocked.length}<span className="text-on-surface-variant/30 font-light mx-1">/</span>{BADGES.length}
            </div>
            <div className="text-[10px] font-label text-on-surface-variant font-black uppercase tracking-widest mt-1">unlocked</div>
          </div>
        </div>
      </header>


      <main className="px-6 space-y-6 mt-4">

        {/* Progress Card */}
        <section className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container-highest">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-label text-on-surface-variant uppercase tracking-widest">Tiến độ thu thập</h3>
            <span className="text-sm font-bold text-primary">{Math.round((unlocked.length / BADGES.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-tertiary-fixed-dim to-[#FFE082] transition-all duration-1000" style={{ width: `${(unlocked.length / BADGES.length) * 100}%` }}></div>
          </div>
        </section>

        {/* Unlocked Badges: Premium card style */}
        {unlocked.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-xl font-bold">workspace_premium</span>
              <h3 className="text-[10px] font-label text-on-surface-variant uppercase tracking-[0.2em] font-black">Thành tích đã đạt</h3>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              {unlocked.map(badge => (
                <div key={badge.id} className="bg-surface-container-lowest border border-on-surface/5 shadow-sm p-5 rounded-[32px] flex flex-col items-center text-center relative overflow-hidden group active:scale-95 transition-all">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="text-4xl mb-3 drop-shadow-md transform group-hover:scale-125 transition-transform duration-500">{badge.icon}</div>
                  <div className="text-sm font-headline font-black text-on-surface mb-1 leading-tight">{badge.name}</div>
                  <div className="text-[9px] text-on-surface-variant/80 font-bold leading-relaxed px-2">{badge.desc}</div>
                  <div className="mt-4 px-3 py-1 rounded-full bg-primary-container/40 text-primary text-[8px] font-label font-black uppercase tracking-widest shadow-inner border border-primary/10">ACHIEVED</div>
                </div>
              ))}
            </div>
          </section>
        )}


        {/* Locked Badges: Sophisticated grayscale grid */}
        {locked.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4 mt-10">
              <span className="material-symbols-outlined text-on-surface-variant/40 text-xl">lock_open</span>
              <h3 className="text-[10px] font-label text-on-surface-variant/60 uppercase tracking-[0.2em] font-black">Chưa mở khóa</h3>
            </div>
            <div className="grid grid-cols-2 gap-3.5 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
              {locked.map(badge => (
                <div key={badge.id} className="bg-surface-container p-5 rounded-[32px] flex flex-col items-center text-center border border-on-surface/5">
                  <div className="text-3xl mb-3 opacity-30">{badge.icon}</div>
                  <div className="text-sm font-headline font-black text-on-surface/60 mb-1 leading-tight">{badge.name}</div>
                  <div className="text-[9px] text-on-surface-variant/50 font-bold leading-relaxed px-2">{badge.desc}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Guide: Premium info card */}
        <section className="bg-primary/5 border border-primary/10 p-6 rounded-[32px] mt-10 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 text-6xl text-primary/10 group-hover:rotate-12 transition-transform duration-700">💡</div>
          <div className="flex gap-4 items-start relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/5">
              <span className="material-symbols-outlined font-black">tips_and_updates</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-on-surface mb-1 uppercase tracking-tight">Hướng dẫn mở khóa</h4>
              <p className="text-xs text-on-surface-variant/80 leading-relaxed font-bold">
                Tưới cây mỗi ngày, hoàn thành task và đạt mục tiêu doanh thu để tích điểm. Streak liên tiếp sẽ giúp bạn mở khóa những huy hiệu cao quý nhất!
              </p>
            </div>
          </div>
        </section>

        <Link href="/forest" className="flex items-center justify-between bg-surface-container-lowest p-6 rounded-[32px] shadow-sm border border-on-surface/5 mt-8 active:scale-[0.98] transition-all group overflow-hidden relative">
          <div className="absolute inset-0 bg-primary/5 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="text-4xl transform group-hover:rotate-12 transition-transform">🌲</div>
            <div>
              <h4 className="font-headline font-black text-on-surface text-base tracking-tight">Khu Rừng Thành Công</h4>
              <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest mt-1">{profile.savedTrees} Cây đã lưu</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform relative z-10 font-black">arrow_forward_ios</span>
        </Link>


      </main>

      <BottomNav active="/awards" />
    </div>
  );
}
