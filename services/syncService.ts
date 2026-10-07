import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { StorageService } from './storageService';
import { AppData } from '../types';

const SYNC_DEBOUNCE_MS = 2000;
let saveTimeout: any = null;

const PENDING_CLOUD_SYNC_KEY = 'nex-finance-pending-cloud-sync';

interface PendingCloudSync { userId: string; token: string }

const readPendingCloudSync = (): PendingCloudSync | null => {
  try {
    const raw = window.localStorage.getItem(PENDING_CLOUD_SYNC_KEY);
    return raw ? JSON.parse(raw) as PendingCloudSync : null;
  } catch {
    return null;
  }
};

const markPendingCloudSync = (userId: string): string | null => {
  const token = String(Date.now()) + '-' + Math.random().toString(36).slice(2);
  try {
    window.localStorage.setItem(PENDING_CLOUD_SYNC_KEY, JSON.stringify({ userId, token }));
    return token;
  } catch (error) {
    console.warn('Unable to mark pending cloud sync.', error);
    return null;
  }
};

const clearPendingCloudSync = (token: string) => {
  const pending = readPendingCloudSync();
  if (pending?.token !== token) return;
  try {
    window.localStorage.removeItem(PENDING_CLOUD_SYNC_KEY);
  } catch (error) {
    console.warn('Unable to clear pending cloud sync marker.', error);
  }
};

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

    // Record the pending snapshot before debounce so a fast app close is recoverable.
    const pendingToken = markPendingCloudSync(authData.session.user.id);
    saveTimeout = setTimeout(async () => {
      const result = await SyncService.pushToCloud(data, authData.session!.user.id);
      if (result.success && pendingToken) clearPendingCloudSync(pendingToken);
    }, SYNC_DEBOUNCE_MS);
  },

  // Push data to Supabase
  pushToCloud: async (data: AppData, userId: string): Promise<{success: boolean, error?: any}> => {
    try {
      if (!navigator.onLine) return { success: false, error: 'Offline' }; // Skip if offline

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
        return { success: false, error };
      } else {
        console.log('Cloud Sync Success');
        return { success: true };
      }
    } catch (err) {
      console.error('Sync Exception:', err);
      return { success: false, error: err };
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

      const pending = readPendingCloudSync();
      if (pending) {
        // Never move locally pending financial data between different accounts.
        if (pending.userId !== data.session.user.id) return false;
        const localData = StorageService.load();
        const result = await SyncService.pushToCloud(localData, data.session.user.id);
        if (result.success) clearPendingCloudSync(pending.token);
        // Keep local data as the current view; do not replace it with an older remote copy.
        return false;
      }

      const { data: remoteData } = await SyncService.pullFromCloud(data.session.user.id);
      
      if (remoteData) {
        // Simple strategy: Remote acts as source of truth on full reload
        // A more complex strategy would check timestamps/versions
        console.log('Remote data found, updating local cache...');
        StorageService.save(remoteData);
        return true;
      } else {
        // No remote data found (new account).
        // Push current local data to cloud so it's synced immediately.
        console.log('No remote data found. Pushing local data to cloud...');
        const localData = StorageService.load();
        await SyncService.pushToCloud(localData, data.session.user.id);
        return false;
      }
      
    } catch (e) {
      console.warn('Sync initialization failed:', e);
      return false;
    }
  }
};