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
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
          {redirecting ? 'Đang chuyển đến Google...' : 'Đang tải...'}
        </p>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-bg-glow" />

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '2.5rem' }}>🌱</span>
      </div>

      {/* Plant image */}
      <div style={{ position: 'relative', marginBottom: 32 }}>
        <Image
          src="/plants/blooming.png"
          alt="Digital Greenhouse Plant"
          width={200}
          height={200}
          style={{ borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
          priority
        />
      </div>

      {/* Title */}
      <h1 className="login-title">The Digital<br />Greenhouse</h1>
      <p className="login-subtitle">
        Nuôi dưỡng thói quen mỗi ngày.<br />
        Tưới cây, tích điểm, phát triển bản thân.
      </p>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(220,53,69,0.2)',
          border: '1px solid rgba(220,53,69,0.4)',
          borderRadius: 12,
          padding: '12px 20px',
          marginBottom: 24,
          textAlign: 'center',
          color: '#ff8a80',
          fontSize: '0.875rem',
          maxWidth: 320,
        }}>
          {error}
        </div>
      )}

      {/* Google Sign In */}
      <button className="google-btn" onClick={handleSignIn} id="google-signin-btn">
        <svg className="google-icon" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Đăng nhập với Google
      </button>

      <p className="login-disclaimer">
        Dữ liệu của bạn được lưu trữ an toàn<br />
        và đồng bộ trên tất cả thiết bị.
      </p>

      {/* Features */}
      <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        {[
          { icon: '💧', text: 'Tưới cây mỗi ngày để tích điểm' },
          { icon: '✅', text: 'Ghi nhận task và doanh thu' },
          { icon: '🌸', text: 'Tiến hóa cây: Hoa → Quả → Rừng' },
          { icon: '🏆', text: 'Mở khóa huy hiệu thành tích' },
        ].map((f, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: '10px 16px',
          }}>
            <span style={{ fontSize: '1.25rem' }}>{f.icon}</span>
            <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
