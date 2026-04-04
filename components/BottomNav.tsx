'use client';
import Link from 'next/link';

const TABS = [
  { href: '/',        icon: 'home', label: 'Dashboard' },
  { href: '/entry',   icon: 'add', label: 'Ghi nhận', isCenter: true },
  { href: '/stats',   icon: 'bar_chart', label: 'Thống kê' },
  { href: '/awards',  icon: 'emoji_events', label: 'Huy hiệu' },
];

export default function BottomNav({ active }: { active: '/' | '/entry' | '/stats' | '/awards' | '/forest' }) {
  return (
    <div className="fixed bottom-4 left-0 right-0 px-4 flex justify-center pointer-events-none z-50">
      <nav className="w-full max-w-[400px] h-16 bg-surface-container-lowest/80 backdrop-blur-2xl flex items-center justify-around px-3 rounded-[32px] pointer-events-auto border border-on-surface/5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] ml-auto mr-auto">
        <div className="grid grid-cols-4 w-full h-full relative">
          {TABS.map((tab) => {
            const isActive = active === tab.href;
            const isCenter = tab.isCenter;
            
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}
              >
                <div className={`w-12 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 
                  ${isCenter ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 scale-110' : 
                    isActive ? 'bg-primary/10' : 'bg-transparent hover:bg-surface-container-high/40'}`}
                >
                  <span 
                    className="material-symbols-outlined text-[24px]"
                    style={{ fontVariationSettings: `'FILL' ${isActive || isCenter ? 1 : 0}, 'wght' 700` }}
                  >
                    {tab.icon}
                  </span>
                </div>
                <span className={`text-[8px] font-black uppercase tracking-[0.15em] ${isActive ? 'text-primary' : isCenter ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
