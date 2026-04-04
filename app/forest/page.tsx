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
      {/* Header */}
      <header className="w-full top-0 sticky z-50 bg-gradient-to-b from-surface/90 to-surface/40 flex flex-col justify-end px-6 py-6 pb-4 backdrop-blur-md">
        <div className="flex gap-4 items-center">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <div>
            <p className="text-primary font-label text-xs uppercase tracking-widest leading-none mb-1">Thành tích</p>
            <h1 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">Khu Rừng Thành Công</h1>
          </div>
        </div>
        <p className="text-xs font-medium text-on-surface-variant mt-3 pl-14">
          Mỗi cây là 5 quả = 20 lần tưới cây kiên trì
        </p>
      </header>

      <main className="px-6 space-y-6 mt-4">

        {/* Stats row */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { icon: '🌳', value: profile.savedTrees, label: 'Cây đã lưu', color: 'text-primary', bg: 'bg-primary-container' },
            { icon: '🍎', value: profile.fruits, label: 'Quả hiện có', color: 'text-error', bg: 'bg-error-container/50' },
            { icon: '🌸', value: profile.flowers, label: 'Hoa hiện có', color: 'text-[#E91E63]', bg: 'bg-[#FCE4EC]' },
          ].map((s, i) => (
            <div key={i} className="bg-surface-container-lowest shadow-sm border border-surface-container-highest rounded-2xl p-4 flex flex-col items-center text-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xl mb-2 ${s.bg}`}>{s.icon}</div>
              <div className={`text-2xl font-headline font-extrabold leading-none mb-1 ${s.color}`}>{s.value}</div>
              <div className="text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant">{s.label}</div>
            </div>
          ))}
        </section>

        {/* Evolution path */}
        <section className="bg-surface-container p-5 rounded-3xl border border-surface-container-highest">
          <h3 className="text-xs font-label text-on-surface-variant uppercase tracking-widest font-bold mb-4">Lộ trình tiến hóa</h3>
          
          <div className="flex items-center justify-between">
            {[
              { icon: '💧', label: '7 ngày' },
              { icon: '🌸', label: '1 Hoa' },
              { icon: '🍎', label: '4×🌸' },
              { icon: '🌳', label: '5×🍎' },
            ].map((step, i, arr) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-xl mb-2 z-10 border border-surface-container-highest">
                    {step.icon}
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant">{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="w-6 h-0.5 bg-surface-container-highest -mt-6"></div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Trees grid */}
        {trees.length === 0 ? (
          <section className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-surface-container-highest text-center">
            <div className="text-5xl mb-4 opacity-50 grayscale">🌱</div>
            <h3 className="text-lg font-headline font-bold text-on-surface mb-2">Chưa có cây nào</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
              Tưới cây mỗi ngày để tích lũy: 7 lần tưới → 🌸 Hoa, 4 hoa → 🍎 Quả, 5 quả → 🌳 Cây rừng!
            </p>
            <Link href="/" className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary font-bold px-6 py-3 rounded-full hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-[18px]">water_drop</span>
              Tưới cây ngay
            </Link>
          </section>
        ) : (
          <section>
            <h3 className="text-xs font-label text-on-surface-variant uppercase tracking-widest font-bold mb-4">
              Rừng của bạn ({trees.length} cây)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {trees.map((tree) => (
                <div key={tree.id} className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-surface-container-highest flex flex-col items-center text-center group transition-transform hover:scale-105 cursor-default relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-20 h-20 relative mb-3 drop-shadow-md">
                    <Image
                      src="/plants/mature.png"
                      alt={tree.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="text-sm font-headline font-bold text-on-surface">{tree.name}</div>
                  <div className="text-[10px] text-on-surface-variant mt-1 px-2 py-0.5 bg-surface-container rounded-full">
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
