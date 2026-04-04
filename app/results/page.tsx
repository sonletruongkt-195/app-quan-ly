'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import BottomNav from '@/components/BottomNav';
import { getDailyEntry } from '@/lib/database';
import { getTodayStr } from '@/lib/gameLogic';
import { DailyEntry } from '@/lib/types';

// Simple Confetti
function Confetti() {
  const pieces = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    color: ['#4CAF50', '#FFD54F', '#FF7043', '#64B5F6', '#F48FB1', '#81C784'][i % 6],
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    size: 6 + Math.random() * 8,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute opacity-80"
          style={{
            left: `${p.left}%`,
            top: -20,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : 2,
            animation: `fall ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          to { transform: translateY(100vh) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function ResultsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [loadingEntry, setLoadingEntry] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); return; }
    if (user) {
      getDailyEntry(user.id, getTodayStr()).then((e) => {
        setEntry(e);
        setLoadingEntry(false);
      });
    }
  }, [user, loading, router]);

  if (loading || loadingEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!entry || !entry.submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="text-5xl mb-4 opacity-50 grayscale">🌱</div>
          <h2 className="text-xl font-headline font-bold text-on-surface mb-2">Chưa có kết quả</h2>
          <p className="text-on-surface-variant font-body mb-6">Hãy ghi nhận nhiệm vụ và doanh thu hôm nay trước!</p>
          <Link href="/entry" className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold shadow-md hover:opacity-90 transition-opacity">
            ✅ Ghi nhận ngay
          </Link>
        </div>
        <BottomNav active="/stats" />
      </div>
    );
  }

  const isWin = entry.isWin;
  const taskDone = entry.normalTasksDone + entry.hardTasksDone;
  const taskPercent = Math.round(entry.taskPercent);
  const revenuePercent = Math.round(entry.revenuePercent);
  const total = entry.revenuePercent + entry.taskPercent;

  return (
    <div className="pb-32 bg-surface min-h-screen relative">
      {isWin && <Confetti />}

      {/* Hero Section: Glassmorphism Celebration */}
      <section className={`px-6 py-12 pb-10 text-center rounded-b-[48px] shadow-lg relative overflow-hidden ${isWin ? 'bg-primary shadow-primary/20' : 'bg-error shadow-error/20'}`}>
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex flex-col items-center gap-1 mb-6">
            <span className={`text-[10px] font-black tracking-[0.4em] uppercase ${isWin ? 'text-on-primary/60' : 'text-on-error/60'}`}>
              Daily Record • 2026
            </span>
            <div className={`h-1 w-12 rounded-full mt-2 ${isWin ? 'bg-on-primary/30' : 'bg-on-error/30'}`}></div>
          </div>
          
          <h1 className="text-7xl font-headline font-black tracking-tighter mb-4 text-white drop-shadow-sm">
            {isWin ? 'WIN!' : 'TRY'}
          </h1>
          
          <p className={`text-sm font-bold mb-8 px-6 leading-relaxed max-w-xs ${isWin ? 'text-on-primary/90' : 'text-on-error/90'}`}>
            {isWin 
              ? 'Tâm hồn nảy nở! Bạn đã nuôi dưỡng hệ sinh thái của mình một cách xuất sắc.' 
              : 'Một chút tĩnh lặng cho khu rừng. Ngày mai nắng sẽ lại lên thôi!'}
          </p>

          <div className={`inline-flex items-center justify-center px-6 py-3 rounded-2xl font-headline font-black text-base shadow-xl border border-white/10 ${isWin ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-white/10 text-white backdrop-blur-md'}`}>
            ⭐ {Math.round(entry.totalDayScore)} <span className="text-[10px] font-black opacity-60 ml-1.5 uppercase tracking-widest pt-1">Points</span>
            {entry.streakMultiplier > 1 && (
              <span className="ml-3 px-2 py-0.5 bg-tertiary text-on-tertiary text-[10px] rounded-lg animate-bounce">
                ×{entry.streakMultiplier}
              </span>
            )}
          </div>

          <div className="flex gap-4 w-full mt-12">
            {isWin ? (
              <Link href="/" className="flex-1 bg-white text-primary font-black py-4 px-6 rounded-[24px] shadow-xl hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest">
                🌿 Collect Rewards
              </Link>
            ) : (
              <>
                <Link href="/stats" className="flex-1 bg-white/20 border border-white/30 text-white font-black py-4 px-6 rounded-[24px] backdrop-blur-md hover:bg-white/30 transition-all text-xs uppercase tracking-widest">
                  📊 Analysis
                </Link>
                <Link href="/" className="flex-1 bg-white text-error font-black py-4 px-6 rounded-[24px] shadow-xl hover:scale-105 transition-all text-xs uppercase tracking-widest">
                  🌱 Retake
                </Link>
              </>
            )}
          </div>
        </div>
      </section>


      <main className="px-6 py-6 space-y-6">
        {/* Score Breakdown: Premium Cards */}
        <section className="bg-surface-container-lowest rounded-[40px] p-8 shadow-sm border border-on-surface/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <span className="material-symbols-outlined text-6xl">receipt_long</span>
          </div>
          <h3 className="text-[10px] font-label text-on-surface-variant font-black tracking-[0.2em] uppercase mb-8">Phân rã điểm số</h3>
          
          <div className="space-y-5 relative z-10">
            {[
              { label: 'Tưới cây', value: entry.wateringPts, icon: 'water_drop', color: 'text-sky-500' },
              { label: `Nhiệm vụ (${taskDone}/7)`, value: entry.taskPts, icon: 'checklist', color: 'text-primary' },
              { label: `Doanh thu hiệu quả`, value: entry.revenuePts, icon: 'payments', color: 'text-secondary' },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center group/item hover:translate-x-1 transition-transform">
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-lg ${row.color} font-black`}>{row.icon}</span>
                  <span className="text-sm font-black text-on-surface-variant uppercase tracking-tight">{row.label}</span>
                </div>
                <span className={`text-sm font-headline font-black ${row.value > 0 ? 'text-primary' : row.value < 0 ? 'text-error' : 'text-on-surface'}`}>
                  {row.value > 0 ? '+' : ''}{row.value.toFixed(1)}đ
                </span>
              </div>
            ))}
            <div className="pt-6 mt-4 border-t border-on-surface/5 flex justify-between items-center">
              <span className="font-black text-on-surface text-xs uppercase tracking-[0.2em]">KẾT QUẢ CUỐI</span>
              <span className={`text-3xl font-headline font-black tracking-tighter ${isWin ? 'text-primary' : 'text-error'}`}>
                {entry.totalDayScore.toFixed(1)}đ
              </span>
            </div>
          </div>
        </section>


        {/* Win Condition Check: Visual Indicators */}
        <section className="bg-surface-container-lowest rounded-[40px] p-8 shadow-sm border border-on-surface/5">
          <h3 className="text-[10px] font-label text-on-surface-variant font-black tracking-[0.2em] uppercase mb-8">Điều kiện chiến thắng</h3>
          
          <div className="space-y-6">
            {[
              {
                label: 'PHÂN TÍCH TỔNG LỰC',
                detail: '% Task + % Doanh thu > 100%',
                actual: `${taskPercent}% + ${revenuePercent}% = ${Math.round(total)}%`,
                pass: total > 100,
                icon: 'auto_awesome'
              },
              {
                label: 'ĐIỂM SỐ TÍCH LŨY',
                detail: 'Tổng điểm ngày > 5đ',
                actual: `${entry.totalDayScore.toFixed(1)}đ`,
                pass: entry.totalDayScore > 5,
                icon: 'star'
              },
            ].map((cond, i) => (
              <div key={i} className={`flex justify-between items-center p-6 rounded-[32px] border ${cond.pass ? 'bg-primary/5 border-primary/10 text-primary' : 'bg-error/5 border-error/10 text-error'} group active:scale-[0.98] transition-all`}>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="material-symbols-outlined text-[14px] font-black">{cond.icon}</span>
                    <div className="text-[9px] font-black uppercase tracking-[0.1em] opacity-60">{cond.label}</div>
                  </div>
                  <div className="text-sm font-black tracking-tight mb-0.5">{cond.detail}</div>
                  <div className="text-lg font-headline font-black tracking-tighter opacity-80">
                    {cond.actual}
                  </div>
                </div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${cond.pass ? 'bg-white border-primary/20 shadow-lg shadow-primary/10' : 'bg-white border-error/20 shadow-lg shadow-error/10'}`}>
                  <span className="material-symbols-outlined text-2xl font-black">{cond.pass ? 'check_circle' : 'cancel'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* Revenue Detail */}
        <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-container-highest">
          <h3 className="text-xs font-label text-on-surface-variant tracking-widest uppercase mb-4">Chi tiết doanh thu</h3>
          
          <div className="space-y-3">
            {[
              { label: 'Điện lạnh', value: entry.revenue.dienLanh },
              { label: 'Chay', value: entry.revenue.chay },
              { label: 'Lái xe', value: entry.revenue.laiXe },
            ].map((r, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="font-medium text-on-surface-variant font-body">{r.label}</span>
                <span className="font-bold text-on-surface">{r.value}M VND</span>
              </div>
            ))}
            <div className="border-t border-surface-container-high pt-3 mt-1 flex justify-between items-center">
              <span className="font-bold text-on-surface text-sm">Điểm đạt / Mục tiêu</span>
              <span className={`font-bold ${revenuePercent >= 100 ? 'text-primary' : 'text-on-surface'}`}>
                {entry.revenueTotal}M / {entry.revenueTarget}M
              </span>
            </div>
            <div className="flex justify-end">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${revenuePercent >= 100 ? 'bg-primary-container text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                {revenuePercent}%
              </span>
            </div>
          </div>
        </section>
      </main>

      <BottomNav active="/stats" />
    </div>
  );
}
