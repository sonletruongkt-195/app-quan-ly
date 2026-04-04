'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile, DailyEntry } from '@/lib/types';
import { getUserProfile, createUserProfile, getDailyEntry, initializeUserDay } from '@/lib/database';
import { getTodayStr } from '@/lib/gameLogic';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  todayEntry: DailyEntry | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshTodayEntry: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  todayEntry: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
  refreshTodayEntry: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTodayEntry = useCallback(async () => {
    if (!user) return;
    const entry = await getDailyEntry(user.id, getTodayStr());
    setTodayEntry(entry);
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await getUserProfile(user.id);
    if (p) setProfile(p);
  }, [user]);

  useEffect(() => {
    // 1. Get initial session
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleAuthStateChange(session?.user ?? null);
    };

    initAuth();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthStateChange(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthStateChange = async (supabaseUser: User | null) => {
    setLoading(true);
    setError(null);
    
    if (supabaseUser) {
      setUser(supabaseUser);
      try {
        const uid = supabaseUser.id;
        let p = await getUserProfile(uid);
        if (!p) {
          p = await createUserProfile(uid, {
            displayName: supabaseUser.user_metadata.full_name || 'Người dùng',
            email: supabaseUser.email || '',
            photoURL: supabaseUser.user_metadata.avatar_url || '',
          });
        }
        // Process missed days penalty
        const updatedProfile = await initializeUserDay(uid, p);
        setProfile(updatedProfile);

        // Get today's entry
        const entry = await getDailyEntry(uid, getTodayStr());
        setTodayEntry(entry);
      } catch (err: any) {
        console.error("Lỗi lấy dữ liệu User: ", err);
        setError(err.message);
      }
    } else {
      setUser(null);
      setProfile(null);
      setTodayEntry(null);
    }
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Lỗi đăng nhập: ", err);
      setError(err.message || 'Có lỗi xảy ra khi đăng nhập.');
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  // Rendering the Login Screen if unauthenticated
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-6 bg-[url('/plants/seedling.png')] bg-no-repeat bg-center bg-[length:50%]">
        <div className="absolute inset-0 bg-surface/90 backdrop-blur-sm z-0"></div>
        <div className="relative z-10 w-full max-w-sm glass-card p-8 rounded-[2rem] border border-surface-container-highest shadow-xl text-center space-y-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-headline font-extrabold text-primary mb-2">Digital<br/>Greenhouse</h1>
            <p className="text-sm font-body text-on-surface-variant">Gamified habit tracker</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-surface-container-lowest text-on-surface font-bold py-4 px-6 rounded-full border border-surface-container-highest shadow-sm active:scale-95 transition-transform"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" className="w-6 h-6" />
              Đăng nhập bằng Google
            </button>
            {error && <p className="text-sm font-label text-error">{error}</p>}
          </div>

          <p className="text-xs font-label text-on-surface-variant/60 uppercase tracking-widest mt-8">
            Trồng thói quen, hái nỗ lực
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user, profile, todayEntry, loading, error,
      signInWithGoogle, logout, refreshProfile, refreshTodayEntry,
    }}>
      {/* Show full screen loading when auth state is being verified */}
      {loading ? (
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <span className="material-symbols-outlined text-primary text-4xl animate-bounce">eco</span>
            <p className="text-on-surface-variant text-sm font-label mt-4 font-bold tracking-widest uppercase">Đang tải...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
