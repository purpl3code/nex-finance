import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session with safe error handling
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.warn("Auth check failed:", error.message);
      }
      setSession(data?.session || null);
      setLoading(false);
    }).catch(err => {
      console.warn("Auth initialization error (likely missing env vars):", err);
      setSession(null);
      setLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
};