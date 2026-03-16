/**
 * Interface for storage operations.
 * Allows switching between LocalStorage, IndexedDB, or Cloud in the future.
 */
interface IStorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Concrete implementation using Window.localStorage
 */
export const LocalStorageAdapter: IStorageAdapter = {
  getItem: (key: string) => {
    try {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      }
      return null;
    } catch (e) {
      console.error('Error reading from localStorage', e);
      return null;
    }
  },

  setItem: (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.error('Error writing to localStorage', e);
    }
  },

  removeItem: (key: string) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.error('Error removing from localStorage', e);
    }
  }
};
