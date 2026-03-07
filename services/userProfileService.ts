import { LocalStorageAdapter } from './storageAdapter';
import { toast } from 'sonner';

export interface UserProfile {
  displayName: string;
  avatarDataUrl: string | null;
  updatedAt: number;
}

const STORAGE_KEY = 'nex-finance-user-profile';
const EVENT_KEY = 'nex-finance-profile-changed';

const DEFAULT_PROFILE: UserProfile = {
  displayName: 'Usuário',
  avatarDataUrl: null,
  updatedAt: Date.now(),
};

export const UserProfileService = {
  getProfile: (): UserProfile => {
    const stored = LocalStorageAdapter.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PROFILE;
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  saveProfile: (updates: Partial<UserProfile>) => {
    const current = UserProfileService.getProfile();
    const updated: UserProfile = {
      ...current,
      ...updates,
      updatedAt: Date.now(),
    };
    
    try {
      LocalStorageAdapter.setItem(STORAGE_KEY, JSON.stringify(updated));
      // Dispatch event for components to react
      window.dispatchEvent(new Event(EVENT_KEY));
    } catch (e) {
      console.error('Failed to save profile (likely quota exceeded)', e);
      toast.error('Erro ao salvar perfil: Espaço insuficiente no navegador. Tente uma foto menor.');
    }
  },

  // Helper to subscribe to changes in hooks
  subscribe: (callback: () => void) => {
    window.addEventListener(EVENT_KEY, callback);
    return () => window.removeEventListener(EVENT_KEY, callback);
  }
};
