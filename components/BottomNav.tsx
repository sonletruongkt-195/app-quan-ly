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
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] h-20 bg-surface-container-lowest/80 backdrop-blur-2xl flex items-center justify-around px-4 pb-safe z-50 border-t border-surface-container-highest shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
      {TABS.map((tab) => {
        const isActive = active === tab.href;
        
        if (tab.isCenter) {
          return (
            <div key={tab.href} className="relative -top-6">
              <Link
                href={tab.href}
                className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_8px_20px_rgba(0,110,28,0.3)] hover:scale-105 active:scale-95 transition-all outline-none"
              >
                <span className="material-symbols-outlined text-3xl font-bold">{tab.icon}</span>
              </Link>
            </div>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}
          >
            <div className={`w-12 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-primary-container/60' : 'bg-transparent hover:bg-surface-container-high'}`}>
              <span className={`material-symbols-outlined text-[24px] ${isActive ? 'fill-1' : ''}`}>{tab.icon}</span>
            </div>
            <span className={`text-[10px] font-label font-bold uppercase tracking-widest ${isActive ? 'text-primary' : 'text-on-surface-variant/80'}`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
