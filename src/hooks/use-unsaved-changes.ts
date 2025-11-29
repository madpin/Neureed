import { useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface UseUnsavedChangesOptions<T> {
  /**
   * Custom comparison function to determine if values have changed.
   * Returns true if values are different, false if equal.
   * Default: JSON.stringify comparison
   */
  compareFn?: (current: T, original: T) => boolean;

  /**
   * Callback function called when changes are reverted.
   * Receives the original value.
   */
  onRevert?: (original: T) => void;
}

export interface UseUnsavedChangesReturn {
  /**
   * Boolean indicating if there are unsaved changes
   */
  hasChanges: boolean;

  /**
   * Revert current value to original and trigger onRevert callback
   */
  revert: () => void;

  /**
   * Confirm close action with unsaved changes warning.
   * Shows toast if changes exist, calls onClose directly otherwise.
   */
  confirmClose: (onClose: () => void) => void;
}

/**
 * Hook for managing unsaved changes detection and warning dialogs.
 *
 * @example
 * ```tsx
 * const { hasChanges, revert, confirmClose } = useUnsavedChanges(
 *   currentPreferences,
 *   originalPreferences,
 *   {
 *     onRevert: (original) => {
 *       // Revert theme/fontSize changes
 *       window.dispatchEvent(new CustomEvent('preferencesUpdated', {
 *         detail: { theme: original.theme }
 *       }));
 *       setLocalPreferences(original);
 *     }
 *   }
 * );
 *
 * // In your close handler
 * const handleClose = () => confirmClose(onClose);
 * ```
 */
export function useUnsavedChanges<T>(
  current: T | null,
  original: T | null,
  options?: UseUnsavedChangesOptions<T>
): UseUnsavedChangesReturn {
  const { compareFn, onRevert } = options || {};

  // Track if dialog is currently showing to prevent duplicates
  const isShowingDialog = useRef(false);

  /**
   * Determine if values have changed using custom or default comparison
   */
  const hasChanges = useMemo(() => {
    if (!current || !original) return false;

    if (compareFn) {
      return compareFn(current, original);
    }

    // Default: JSON stringify comparison
    return JSON.stringify(current) !== JSON.stringify(original);
  }, [current, original, compareFn]);

  /**
   * Revert to original value and trigger callback
   */
  const revert = useCallback(() => {
    if (!original) return;

    if (onRevert) {
      onRevert(original);
    }
  }, [original, onRevert]);

  /**
   * Confirm close with unsaved changes warning
   */
  const confirmClose = useCallback((onClose: () => void) => {
    // No changes - close immediately
    if (!hasChanges) {
      onClose();
      return;
    }

    // Already showing dialog - prevent duplicates
    if (isShowingDialog.current) {
      return;
    }

    isShowingDialog.current = true;

    toast.warning('You have unsaved changes', {
      description: 'Are you sure you want to close without saving?',
      action: {
        label: 'Close anyway',
        onClick: () => {
          isShowingDialog.current = false;
          revert();
          onClose();
        },
      },
      cancel: {
        label: 'Keep editing',
        onClick: () => {
          isShowingDialog.current = false;
        },
      },
      onDismiss: () => {
        isShowingDialog.current = false;
      },
      onAutoClose: () => {
        isShowingDialog.current = false;
      },
    });
  }, [hasChanges, revert]);

  return {
    hasChanges,
    revert,
    confirmClose,
  };
}
