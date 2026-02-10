import { createClient } from '@supabase/supabase-js';

// Use optional chaining to prevent crashes if import.meta.env is undefined
// @ts-ignore
const envUrl = import.meta.env?.VITE_SUPABASE_URL;
// @ts-ignore
const envKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

// Fallback to a valid-looking URL to prevent createClient from throwing an error.
// This allows the app to render the login screen even without env vars.
const supabaseUrl = envUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = envKey || 'placeholder-key';

if (!envUrl || !envKey) {
  console.warn('Missing Supabase Environment Variables. Check .env file. Using placeholder values to prevent crash.');
}

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
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export const setRememberMe = (value: boolean) => {
  try {
    localStorage.setItem('nex_finance_remember_me', String(value));
  } catch (e) {
    console.error('Error setting remember me', e);
  }
};