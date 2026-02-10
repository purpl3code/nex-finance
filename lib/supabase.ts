import { createClient } from '@supabase/supabase-js';

// Use optional chaining to prevent crashes if import.meta.env is undefined
// @ts-ignore
const envUrl = import.meta.env?.VITE_SUPABASE_URL;
// @ts-ignore
const envKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

const isMissingEnv = !envUrl || !envKey;

// Fallback to a valid-looking URL to prevent createClient from throwing an error.
// This allows the app to render the login screen even without env vars.
const supabaseUrl = envUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = envKey || 'placeholder-key';

if (isMissingEnv) {
  console.warn('Missing Supabase Environment Variables. Check .env file. Using placeholder values.');
}

// Export a flag so other services know if we are in "offline/demo" mode
export const isSupabaseConfigured = !isMissingEnv;

// --- DEMO MODE HELPERS ---
const DEMO_KEY = 'nex_finance_demo_mode';

export const isDemoMode = () => {
  // Demo mode is active if explicitly set OR if Supabase is not configured (forced offline)
  return !isSupabaseConfigured || localStorage.getItem(DEMO_KEY) === 'true';
};

export const enableDemoMode = () => {
  localStorage.setItem(DEMO_KEY, 'true');
};

export const disableDemoMode = () => {
  localStorage.removeItem(DEMO_KEY);
};
// -------------------------

// Custom Storage Adapter to handle "Remember Me" logic
// This allows switching between localStorage and sessionStorage dynamically
const customStorageAdapter = {
  getItem: (key: string) => {
    try {
      // Try local first, then session
      return localStorage.getItem(key) || sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      // Check preference
      const rememberMe = localStorage.getItem('nex_finance_remember_me') === 'true';
      if (rememberMe) {
        localStorage.setItem(key, value);
      } else {
        sessionStorage.setItem(key, value);
      }
    } catch (e) {
      console.error('Error saving auth session', e);
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (e) {
      console.error('Error removing auth session', e);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorageAdapter,
    // Disable background auto-refresh if config is missing to prevent "Failed to fetch" loops
    autoRefreshToken: isSupabaseConfigured,
    persistSession: isSupabaseConfigured,
    detectSessionInUrl: isSupabaseConfigured,
  },
});

export const setRememberMe = (value: boolean) => {
  try {
    localStorage.setItem('nex_finance_remember_me', String(value));
  } catch (e) {
    console.error('Error setting remember me', e);
  }
};