import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { StorageService } from './storageService';
import { AppData } from '../types';

const SYNC_DEBOUNCE_MS = 2000;
let saveTimeout: any = null;

export const SyncService = {
  // Read local data (wrapper around StorageService)
  getLocalData: (): AppData => {
    return StorageService.load();
  },

  // Save data locally and trigger cloud sync
  saveAndSync: async (data: AppData) => {
    // 1. Always save locally first (Offline-first)
    StorageService.save(data);

    // 2. Check if configured
    if (!isSupabaseConfigured) return;

    // 3. Check if user is logged in
    const { data: authData } = await supabase.auth.getSession();
    if (!authData?.session) return;

    // 4. Debounce the cloud save to prevent spamming
    if (saveTimeout) clearTimeout(saveTimeout);
    
    saveTimeout = setTimeout(async () => {
      await SyncService.pushToCloud(data, authData.session!.user.id);
    }, SYNC_DEBOUNCE_MS);
  },

  // Push data to Supabase
  pushToCloud: async (data: AppData, userId: string) => {
    try {
      if (!navigator.onLine) return; // Skip if offline

      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: userId,
          schema_version: data.version,
          data: data,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Cloud Sync Error:', error);
      } else {
        console.log('Cloud Sync Success');
      }
    } catch (err) {
      console.error('Sync Exception:', err);
    }
  },

  // Pull data from Supabase
  pullFromCloud: async (userId: string): Promise<{ data: AppData | null, error: any }> => {
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('data, schema_version')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
        return { data: null, error };
      }

      if (data) {
        return { data: data.data as AppData, error: null };
      }

      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  // Initialize Sync on App Start
  // Returns true if remote data was loaded and local storage updated
  initialize: async (): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session) return false;

      const { data: remoteData } = await SyncService.pullFromCloud(data.session.user.id);
      
      if (remoteData) {
        // Simple strategy: Remote acts as source of truth on full reload
        // A more complex strategy would check timestamps/versions
        console.log('Remote data found, updating local cache...');
        StorageService.save(remoteData);
        return true;
      }
      
      return false;
    } catch (e) {
      console.warn('Sync initialization failed:', e);
      return false;
    }
  }
};