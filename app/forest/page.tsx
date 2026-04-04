'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import BottomNav from '@/components/BottomNav';

export default function ForestPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center bg-surface"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" /></div>;
  }

  const trees = profile.forestTrees || [];

  return (
    <div className="pb-32 bg-surface min-h-screen relative">
      {/* Header with back button */}
      <header className="w-full top-0 sticky z-50 bg-surface/80 backdrop-blur-xl px-6 py-6 border-b border-on-surface/5">
        <div className="flex gap-5 items-center">
          <button onClick={() => router.back()} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-container-high/50 hover:bg-surface-container-highest transition-all active:scale-90 border border-on-surface/5 shadow-sm group">
            <span className="material-symbols-outlined text-on-surface font-black group-hover:-translate-x-0.5 transition-transform">arrow_back_ios_new</span>
          </button>
          <div>
            <p className="text-primary font-label text-[10px] uppercase tracking-[0.3em] font-black mb-1">Archive</p>
            <h1 className="text-2xl font-headline font-black text-on-surface tracking-tight">Khu rừng thành công</h1>
          </div>
        </div>
      </header>


      <main className="px-6 space-y-6 mt-4">

        {/* Stats Row: Premium bento units */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { icon: '🌳', value: profile.savedTrees, label: 'Cây rừng', color: 'text-primary', bg: 'bg-primary-container/40' },
            { icon: '🍎', value: profile.fruits, label: 'Quả ngọt', color: 'text-error', bg: 'bg-error-container/40' },
            { icon: '🌸', value: profile.flowers, label: 'Hoa đẹp', color: 'text-[#E91E63]', bg: 'bg-[#FCE4EC]' },
          ].map((s, i) => (
            <div key={i} className="bg-surface-container-lowest shadow-sm border border-on-surface/5 rounded-[28px] p-4 flex flex-col items-center text-center">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-2xl mb-2.5 shadow-inner border border-white/10 ${s.bg}`}>{s.icon}</div>
              <div className={`text-2xl font-headline font-black leading-none mb-1.5 ${s.color}`}>{s.value}</div>
              <div className="text-[8px] font-label font-black uppercase tracking-widest text-on-surface-variant/70">{s.label}</div>
            </div>
          ))}
        </section>


        {/* Evolution Path: Gamified visual map */}
        <section className="bg-surface-container-lowest p-6 rounded-[36px] border border-on-surface/5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
            <span className="material-symbols-outlined text-6xl">account_tree</span>
          </div>
          <h3 className="text-[10px] font-label font-black text-on-surface-variant uppercase tracking-[0.2em] mb-8">Hành trình tiến hóa</h3>
          
          <div className="flex items-center justify-between relative px-2">
            {[
              { icon: '💧', label: '7 ngày' },
              { icon: '🌸', label: '1 Hoa' },
              { icon: '🍎', label: '4 Hoa' },
              { icon: '🌳', label: '5 Quả' },
            ].map((step, i, arr) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center text-center z-10">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container-high shadow-inner flex items-center justify-center text-2xl mb-2.5 border border-on-surface/5 transform hover:scale-110 transition-transform">
                    {step.icon}
                  </div>
                  <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-tighter">{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex-1 h-[2px] bg-surface-container-highest mx-1 -mt-6"></div>
                )}
              </div>
            ))}
          </div>
        </section>


        {/* Trees grid: High density cards */}
        {trees.length === 0 ? (
          <section className="bg-surface-container-lowest p-10 rounded-[40px] shadow-sm border border-on-surface/5 text-center">
            <div className="text-6xl mb-6 grayscale opacity-20 transform hover:scale-110 transition-all duration-700">🌱</div>
            <h3 className="text-xl font-headline font-black text-on-surface mb-3 tracking-tight">Khu rừng còn trống</h3>
            <p className="text-xs text-on-surface-variant font-bold leading-relaxed mb-8 px-4 opacity-80 uppercase tracking-wider">
              Tưới cây tích lũy để phủ xanh thành tựu của bạn. Bắt đầu từ 1 bông hoa ngay hôm nay!
            </p>
            <Link href="/" className="inline-flex items-center justify-center gap-3 bg-primary text-on-primary font-black px-8 py-4 rounded-full hover:shadow-[0_8px_30px_rgba(16,185,129,0.3)] transition-all active:scale-95 text-sm uppercase tracking-widest">
              <span className="material-symbols-outlined font-black">water_drop</span>
              Tưới cây ngay
            </Link>
          </section>
        ) : (
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-[10px] font-label text-on-surface-variant uppercase tracking-[0.2em] font-black">
                Rừng hiện tại ({trees.length})
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {trees.map((tree) => (
                <div key={tree.id} className="bg-surface-container-lowest p-5 rounded-[36px] shadow-sm border border-on-surface/5 flex flex-col items-center text-center group active:scale-[0.98] transition-all relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                  <div className="w-24 h-24 relative mb-4 drop-shadow-2xl transform group-hover:rotate-6 group-hover:scale-110 transition-all duration-700 z-10">
                    <Image
                      src="/plants/mature.png"
                      alt={tree.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="text-sm font-headline font-black text-on-surface z-10 tracking-tight">{tree.name}</div>
                  <div className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mt-2 px-3 py-1 bg-surface-container rounded-full z-10 border border-on-surface/5">
                    {tree.savedAt}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}


        {/* Motivational message */}
        <section className="bg-gradient-to-br from-primary to-[#005313] p-6 rounded-3xl text-on-primary shadow-md relative overflow-hidden relative mt-8">
          <div className="absolute -right-6 -bottom-6 text-8xl opacity-10 blur-sm pointer-events-none">🌿</div>
          <div className="relative z-10">
            <span className="material-symbols-outlined text-3xl mb-3">auto_awesome</span>
            <h3 className="text-lg font-headline font-extrabold mb-2">Mỗi cây là một thành tựu</h3>
            <p className="text-xs opacity-90 leading-relaxed font-medium">
              1 cây = 20 ngày tưới cây kiên trì + 4 lần ra hoa + 1 vụ thu hoạch. Bạn đang xây dựng một hệ sinh thái thành công!
            </p>
          </div>
        </section>

      </main>

      <BottomNav active="/" />
    </div>
  );
}
