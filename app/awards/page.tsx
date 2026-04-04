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
      {/* Header */}
      <header className="w-full top-0 sticky z-50 bg-gradient-to-b from-surface/90 to-surface/40 flex flex-col justify-end px-6 py-6 pb-4 backdrop-blur-md">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-primary font-label text-xs uppercase tracking-widest leading-none mb-1">Bộ sưu tập</p>
            <h1 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">Huy hiệu</h1>
          </div>
          <div className="text-right pb-1">
            <div className="text-3xl font-headline font-extrabold text-tertiary-fixed-dim leading-none">
              {unlocked.length}/{BADGES.length}
            </div>
            <div className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest font-bold">đã mở khóa</div>
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

        {/* Unlocked Badges */}
        {unlocked.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-lg">verified</span>
              <h3 className="text-xs font-label text-on-surface-variant uppercase tracking-widest font-bold">Đã mở khóa ({unlocked.length})</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {unlocked.map(badge => (
                <div key={badge.id} className="bg-surface-container-lowest border border-primary/20 shadow-sm p-4 rounded-2xl flex flex-col items-center text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <div className="text-sm font-headline font-extrabold text-on-surface mb-1">{badge.name}</div>
                  <div className="text-[10px] text-on-surface-variant mb-2">{badge.desc}</div>
                  <div className="mt-auto px-2 py-0.5 rounded-full bg-primary-container text-primary text-[9px] font-label font-bold uppercase tracking-widest">MỚI</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Locked Badges */}
        {locked.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4 mt-8">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">lock</span>
              <h3 className="text-xs font-label text-on-surface-variant uppercase tracking-widest">Chưa mở khóa ({locked.length})</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 opacity-60">
              {locked.map(badge => (
                <div key={badge.id} className="bg-surface-container p-4 rounded-2xl flex flex-col items-center text-center grayscale filter hover:grayscale-0 transition-all duration-500">
                  <div className="text-3xl mb-2 opacity-70">{badge.icon}</div>
                  <div className="text-sm font-headline font-bold text-on-surface mb-1">{badge.name}</div>
                  <div className="text-[10px] text-on-surface-variant">{badge.desc}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Guide */}
        <section className="bg-tertiary-container/20 border border-tertiary-container/30 p-5 rounded-3xl mt-8">
          <div className="flex gap-4 items-start">
            <span className="material-symbols-outlined text-tertiary-container fill-1 text-2xl mt-1">lightbulb</span>
            <div>
              <h4 className="text-sm font-bold text-on-surface mb-1">Hướng dẫn mở khóa</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Tưới cây mỗi ngày, ghi nhận task và doanh thu để tích điểm và mở khóa huy hiệu. Streak liên tiếp sẽ nhân ×1.2 điểm!
              </p>
            </div>
          </div>
        </section>

        <Link href="/forest" className="flex items-center justify-between bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-surface-container-highest mt-6 active:scale-95 transition-transform">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🌲</div>
            <div>
              <h4 className="font-headline font-extrabold text-on-surface text-sm">Khu Rừng Thành Công</h4>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">{profile.savedTrees} cây đã lưu</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </Link>

      </main>

      <BottomNav active="/awards" />
    </div>
  );
}
