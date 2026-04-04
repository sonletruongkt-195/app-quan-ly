'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getAllEntries } from '@/lib/database';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';

interface BadgeCondition {
  totalPts: number;
  maxStreak: number;
  flowers: number;
  fruits: number;
  trees: number;
  totalRevenue: number;
  totalTasks: number;
  totalWaterings: number;
  totalDiamonds: number;
}

interface Badge {
  id: string;
  icon: string;
  name: string;
  desc: string;
  category: 'Doanh thu' | 'Năng suất' | 'Kiên trì' | 'Khu rừng';
  condition: (c: BadgeCondition) => boolean;
}

const BADGES: Badge[] = [
  // 💰 DOANH THU
  { id: 'rev_100', icon: '💰', name: 'Triệu Phú Tập Sự', desc: 'Đạt 100M doanh thu', category: 'Doanh thu', condition: (c) => c.totalRevenue >= 100 },
  { id: 'rev_500', icon: '🏦', name: 'Thần Tài Gõ Cửa', desc: 'Đạt 500M doanh thu', category: 'Doanh thu', condition: (c) => c.totalRevenue >= 500 },
  { id: 'rev_1b', icon: '👑', name: 'Vua Doanh Thu', desc: 'Đạt 1000M doanh thu', category: 'Doanh thu', condition: (c) => c.totalRevenue >= 1000 },
  
  // ✍️ NĂNG SUẤT
  { id: 'task_100', icon: '🐝', name: 'Ong Chăm Chỉ', desc: 'Hoàn thành 100 task', category: 'Năng suất', condition: (c) => c.totalTasks >= 100 },
  { id: 'task_500', icon: '⚔️', name: 'Chiến Thần Công Việc', desc: 'Hoàn thành 500 task', category: 'Năng suất', condition: (c) => c.totalTasks >= 500 },
  { id: 'task_1k', icon: '🎓', name: 'Bậc Thầy Hiệu Suất', desc: 'Hoàn thành 1000 task', category: 'Năng suất', condition: (c) => c.totalTasks >= 1000 },

  // 🔥 KIÊN TRÌ
  { id: 'streak_3', icon: '🔥', name: 'Bộ Ba Chiến Thắng', desc: 'Win streak 3 ngày', category: 'Kiên trì', condition: (c) => c.maxStreak >= 3 },
  { id: 'streak_7', icon: '⚡', name: 'Siêu Streak', desc: 'Win streak 7 ngày', category: 'Kiên trì', condition: (c) => c.maxStreak >= 7 },
  { id: 'streak_30', icon: '🛡️', name: 'Kỷ Luật Thép', desc: 'Win streak 30 ngày', category: 'Kiên trì', condition: (c) => c.maxStreak >= 30 },
  { id: 'water_30', icon: '💧', name: 'Người Bạn Của Cây', desc: 'Đạt 30 lần tưới cây', category: 'Kiên trì', condition: (c) => c.totalWaterings >= 30 },
  { id: 'water_100', icon: '🏺', name: 'Vệ Sĩ Môi Trường', desc: 'Đạt 100 lần tưới cây', category: 'Kiên trì', condition: (c) => c.totalWaterings >= 100 },
  { id: 'diamond_10', icon: '💎', name: 'Thợ Săn Kim Cương', desc: 'Thu thập 10 viên kim cương', category: 'Doanh thu', condition: (c) => c.totalDiamonds >= 10 },

  // 🌲 KHU RỪNG
  { id: 'first_flower', icon: '🌸', name: 'Người Trồng Hoa', desc: 'Ra được hoa đầu tiên', category: 'Khu rừng', condition: (c) => c.flowers >= 1 || c.fruits >= 1 || c.trees >= 1 },
  { id: 'first_fruit', icon: '🍎', name: 'Người Thu Hoạch', desc: 'Hái được quả đầu tiên 🍎', category: 'Khu rừng', condition: (c) => c.fruits >= 1 || c.trees >= 1 },
  { id: 'first_tree', icon: '🌳', name: 'Người Trồng Rừng', desc: 'Lưu được cây đầu tiên', category: 'Khu rừng', condition: (c) => c.trees >= 1 },
  { id: 'forest_3', icon: '🌲', name: 'Người Rừng', desc: 'Lưu được 3 cây rừng', category: 'Khu rừng', condition: (c) => c.trees >= 3 },
];

export default function AwardsPage() {
  const { user, profile, loading, logout } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (user) {
      getAllEntries(user.id).then(e => {
        setEntries(e);
        setFetching(false);
      });
    }
  }, [user, loading, router]);

  if (loading || !profile || fetching) {
    return <div className="min-h-screen flex items-center justify-center bg-surface"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" /></div>;
  }

  // Calculate aggregates for badge logic
  const submittedEntries = entries.filter(e => e.submitted);
  const condition: BadgeCondition = {
    totalPts: profile.totalGamePoints,
    maxStreak: profile.longestWinStreak,
    flowers: profile.flowers,
    fruits: profile.fruits,
    trees: profile.savedTrees,
    totalRevenue: submittedEntries.reduce((sum, e) => sum + (e.revenueTotal || 0), 0),
    totalTasks: submittedEntries.reduce((sum, e) => sum + (e.normalTasksDone + e.hardTasksDone), 0),
    totalWaterings: entries.filter(e => e.wateredToday).length,
    totalDiamonds: profile.totalDiamonds || 0,
  };

  const unlockedCount = BADGES.filter(b => b.condition(condition)).length;
  const categories = ['Doanh thu', 'Năng suất', 'Kiên trì', 'Khu rừng'] as const;

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
              {unlockedCount}<span className="text-on-surface-variant/30 font-light mx-1">/</span>{BADGES.length}
            </div>
            <div className="text-[10px] font-label text-on-surface-variant font-black uppercase tracking-widest mt-1">unlocked</div>
          </div>
        </div>
      </header>

      <main className="px-6 space-y-6 mt-4">

        {/* Diamond Counter: Treasure Box Style */}
        <section className="bg-surface-container-lowest p-8 rounded-[40px] shadow-sm border border-on-surface/5 flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="relative z-10">
            <div className="text-6xl mb-4 animate-bounce hover:scale-125 transition-transform duration-500 [animation-duration:3s]">💎</div>
            <h3 className="text-[10px] font-label text-on-surface-variant uppercase tracking-[0.3em] font-black mb-2 px-4 py-1.5 rounded-full bg-on-surface/[0.03] inline-block">Kho Báu Kim Cương</h3>
            <div className="flex items-baseline gap-1 mt-1 justify-center">
              <span className="text-5xl font-headline font-black text-on-surface tracking-tighter">{profile.totalDiamonds || 0}</span>
              <span className="text-sm font-label text-on-surface-variant uppercase tracking-widest font-black">Viên</span>
            </div>
            <p className="text-[9px] text-on-surface-variant/60 font-bold uppercase tracking-widest mt-4">Mỗi viên đại diện cho một ngày đạt mục tiêu doanh thu</p>
          </div>
        </section>

        {/* Progress Card */}
        <section className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container-highest">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-label text-on-surface-variant uppercase tracking-widest">Tiến độ thu thập</h3>
            <span className="text-sm font-bold text-primary">{Math.round((unlockedCount / BADGES.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-tertiary-fixed-dim to-[#FFE082] transition-all duration-1000" style={{ width: `${(unlockedCount / BADGES.length) * 100}%` }}></div>
          </div>
        </section>

        {/* Hall of Fame: Show all achieved badges right after progress */}
        {unlockedCount > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-2 mb-4 px-1">
              <span className="material-symbols-outlined text-primary text-xl font-bold">military_tech</span>
              <h3 className="text-[10px] font-label text-on-surface-variant uppercase tracking-[0.2em] font-black">Thành tích đã đạt</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3.5">
              {BADGES.filter(b => b.condition(condition)).map(badge => (
                <div 
                  key={badge.id} 
                  className="bg-surface-container-lowest p-5 rounded-[32px] flex flex-col items-center text-center relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-primary/5 active:scale-95 transition-all"
                >
                  <div className="absolute inset-0 bg-primary/[0.03]"></div>
                  <div className="text-4xl mb-3 drop-shadow-sm">{badge.icon}</div>
                  <div className="text-[13px] font-headline font-black text-on-surface mb-1 leading-tight">{badge.name}</div>
                  <div className="text-[9px] text-on-surface-variant/80 font-bold leading-relaxed px-2">{badge.desc}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Categorized Badge Grid */}
        {categories.map(cat => {
          const catBadges = BADGES.filter(b => b.category === cat);
          return (
            <section key={cat} className="space-y-4">
              <div className="flex items-center gap-2 mt-4 px-1">
                <div className="w-1.5 h-4 rounded-full bg-primary/40"></div>
                <h3 className="text-[10px] font-label text-on-surface-variant uppercase tracking-[0.2em] font-black">{cat}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3.5">
                {catBadges.map(badge => {
                  const isUnlocked = badge.condition(condition);
                  return (
                    <div 
                      key={badge.id} 
                      className={`p-5 rounded-[32px] flex flex-col items-center text-center relative overflow-hidden transition-all duration-500 border ${
                        isUnlocked 
                          ? 'bg-surface-container-lowest border-on-surface/5 shadow-sm' 
                          : 'bg-surface-container border-on-surface/[0.02] opacity-50 grayscale'
                      }`}
                    >
                      {isUnlocked && <div className="absolute inset-0 bg-primary/[0.02]"></div>}
                      
                      <div className={`text-4xl mb-3 ${isUnlocked ? 'drop-shadow-md' : 'opacity-30'}`}>
                        {badge.icon}
                      </div>
                      <div className={`text-[13px] font-headline font-black mb-1 leading-tight ${isUnlocked ? 'text-on-surface' : 'text-on-surface/60'}`}>
                        {badge.name}
                      </div>
                      <div className={`text-[9px] font-bold leading-relaxed px-2 ${isUnlocked ? 'text-on-surface-variant/80' : 'text-on-surface-variant/40'}`}>
                        {badge.desc}
                      </div>
                      
                      {isUnlocked ? (
                        <div className="mt-4 px-3 py-1 rounded-full bg-primary-container/40 text-primary text-[8px] font-label font-black uppercase tracking-widest border border-primary/5">
                          Đã đạt
                        </div>
                      ) : (
                        <div className="mt-4 px-3 py-1 rounded-full bg-on-surface/5 text-on-surface-variant/40 text-[8px] font-label font-black uppercase tracking-widest border border-transparent">
                          Chưa có
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

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
        
        {/* Logout Button */}
        <button 
          onClick={async () => {
            await logout();
            router.replace('/login');
          }}
          className="w-full flex items-center justify-center gap-3 bg-error/5 text-error font-black py-5 px-8 rounded-[32px] border border-error/10 mt-12 mb-8 active:scale-95 transition-all group"
        >
          <span className="material-symbols-outlined font-black group-hover:rotate-180 transition-transform duration-500">logout</span>
          Đăng xuất khỏi Greenhouse
        </button>
      </main>

      <BottomNav active="/awards" />
    </div>
  );
}
