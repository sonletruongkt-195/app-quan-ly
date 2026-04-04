'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Image from 'next/image';

export default function LoginPage() {
  const { user, loading, signInWithGoogle, error } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    setRedirecting(true);
    await signInWithGoogle();
    // signInWithRedirect navigates away, this code won't run
    setRedirecting(false);
  };

  if (loading || redirecting) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-primary/10 to-transparent"></div>
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
        <p className="text-on-surface-variant font-label text-sm font-black uppercase tracking-[0.2em] relative z-10 animate-pulse">
          {redirecting ? 'Redirecting to Google...' : 'Cultivating Environment...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[100px] -z-10"></div>

      <main className="w-full max-w-[400px] flex flex-col items-center text-center">
        {/* Logo & Hero */}
        <div className="mb-12 group">
          <div className="w-24 h-24 bg-surface-container-lowest rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-center text-5xl mb-8 border border-on-surface/5 relative overflow-hidden group-hover:scale-105 transition-transform duration-700">
            <div className="absolute inset-0 bg-primary/5"></div>
            <span className="relative z-10 transform group-hover:rotate-12 transition-transform duration-700">🌱</span>
          </div>
          
          <p className="text-primary font-label text-[10px] uppercase tracking-[0.4em] font-black mb-3">Welcome to</p>
          <h1 className="text-5xl font-headline font-black text-on-surface tracking-tighter leading-[0.9] mb-4">
            Digital<br />Greenhouse
          </h1>
          <p className="text-sm font-bold text-on-surface-variant/80 px-4 leading-relaxed">
            Nuôi dưỡng thói quen, kiến tạo tương lai.<br />
            Hệ sinh thái thói quen của riêng bạn.
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="w-full bg-error/5 border border-error/10 p-4 rounded-3xl mb-8 flex items-center gap-3 animate-fade-in">
            <span className="material-symbols-outlined text-error font-black">error</span>
            <p className="text-xs font-black text-error text-left">{error}</p>
          </div>
        )}

        {/* Action Section */}
        <div className="w-full space-y-4">
          <button 
            className="w-full bg-surface-container-lowest border border-on-surface/10 p-5 rounded-[32px] flex items-center justify-center gap-4 hover:bg-surface-container-high transition-all active:scale-95 shadow-xl shadow-black/5 group"
            onClick={handleSignIn}
            id="google-signin-btn"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-sm font-black text-on-surface uppercase tracking-widest">Đăng nhập với Google</span>
          </button>
        </div>

        {/* Feature Highlights: Bento Style */}
        <div className="grid grid-cols-2 gap-3 mt-12 w-full">
          {[
            { icon: 'water_drop', text: 'Tưới cây', color: 'text-primary' },
            { icon: 'star', text: 'Tích điểm', color: 'text-tertiary' },
            { icon: 'account_tree', text: 'Tiến hóa', color: 'text-secondary' },
            { icon: 'workspace_premium', text: 'Huy hiệu', color: 'text-error' },
          ].map((f, i) => (
            <div key={i} className="bg-surface-container-lowest/50 border border-on-surface/5 p-4 rounded-[28px] flex flex-col items-center text-center backdrop-blur-sm group hover:bg-surface-container-lowest transition-all">
              <span className={`material-symbols-outlined text-2xl mb-2 font-black ${f.color} group-hover:scale-110 transition-transform`}>{f.icon}</span>
              <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-[0.2em]">{f.text}</span>
            </div>
          ))}
        </div>

        <p className="mt-12 text-[9px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] max-w-[240px] leading-relaxed">
          Dữ liệu của bạn được lưu trữ an toàn & đồng bộ hóa thời gian thực
        </p>
      </main>
    </div>
  );
}
