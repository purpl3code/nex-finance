import { useEffect, useCallback } from 'react';

type AppTab = 'dashboard' | 'list' | 'accounts' | 'cards' | 'recurring' | 'forecast' | 'budgets' | 'settings' | 'goals' | 'reports' | 'debts';

const TAB_SHORTCUTS: Record<string, AppTab> = {
  '1': 'dashboard',
  '2': 'reports',
  '3': 'list',
  '4': 'accounts',
  '5': 'cards',
  '6': 'goals',
  '7': 'debts',
  '8': 'recurring',
  '9': 'budgets',
};

interface UseKeyboardShortcutsOptions {
  onNewTransaction: () => void;
  onNavigate: (tab: AppTab) => void;
  onCloseModal: () => void;
  isModalOpen: boolean;
}

/**
 * Global keyboard shortcuts for the app.
 * 
 * Shortcuts:
 * - `N`         → Open new transaction modal (only when no modal is open)
 * - `1-9`       → Navigate to tabs (only when no modal is open)
 * - `Escape`    → Close current modal
 * 
 * All shortcuts are disabled when focus is inside an input, textarea, or select.
 */
export const useKeyboardShortcuts = ({
  onNewTransaction,
  onNavigate,
  onCloseModal,
  isModalOpen,
}: UseKeyboardShortcutsOptions) => {

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore when typing in form fields
    const target = e.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable) {
      // Still allow Escape inside forms to close modals
      if (e.key === 'Escape' && isModalOpen) {
        e.preventDefault();
        onCloseModal();
      }
      return;
    }

    // Ignore when modifier keys are pressed (except for special combos)
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    switch (e.key) {
      case 'Escape':
        if (isModalOpen) {
          e.preventDefault();
          onCloseModal();
        }
        break;

      case 'n':
      case 'N':
        if (!isModalOpen) {
          e.preventDefault();
          onNewTransaction();
        }
        break;

      default:
        // Number keys for tab navigation (only when no modal is open)
        if (!isModalOpen && TAB_SHORTCUTS[e.key]) {
          e.preventDefault();
          onNavigate(TAB_SHORTCUTS[e.key]);
        }
        break;
    }
  }, [onNewTransaction, onNavigate, onCloseModal, isModalOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
