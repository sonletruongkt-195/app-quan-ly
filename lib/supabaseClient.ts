import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Throw error only at runtime if missing, or handle gracefully during build
if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    // During SSR/Build on production, log a warning instead of crashing mid-build
    console.warn('⚠️ Cảnh báo: Thiếu biến môi trường Supabase trong quá trình Build hoặc SSR.');
  } else {
    // In development or in browser, throw to make it obvious
    // Wait, let's just make it a safer export
  }
}

// Ensure values are strings for createBrowserClient, fallback to empty to avoid crash if missing
export const supabase = createBrowserClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
