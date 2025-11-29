import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface ConfirmationOptions {
  /**
   * Title/message for the confirmation
   */
  title: string;

  /**
   * Optional description providing more context
   */
  description?: string;

  /**
   * Variant/severity of the confirmation
   */
  variant?: 'danger' | 'warning' | 'info';

  /**
   * Label for the confirm button
   */
  confirmLabel?: string;

  /**
   * Label for the cancel button
   */
  cancelLabel?: string;
}

export interface UseConfirmationReturn {
  /**
   * Whether a confirmation is currently pending
   */
  isPending: boolean;

  /**
   * Show a confirmation dialog and return a promise that resolves to true if confirmed, false if cancelled
   */
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
}

/**
 * Hook for programmatic confirmation dialogs using toast notifications.
 * Replaces window.confirm() with a more user-friendly toast-based approach.
 *
 * @example
 * ```tsx
 * const { confirm, isPending } = useConfirmation();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete item?',
 *     description: 'This action cannot be undone',
 *     variant: 'danger',
 *     confirmLabel: 'Delete',
 *     cancelLabel: 'Keep',
 *   });
 *
 *   if (confirmed) {
 *     await deleteItem();
 *   }
 * };
 *
 * return (
 *   <button onClick={handleDelete} disabled={isPending}>
 *     Delete
 *   </button>
 * );
 * ```
 *
 * @example
 * ```tsx
 * // Replace window.confirm()
 * // Before:
 * if (window.confirm('Delete this item?')) {
 *   deleteItem();
 * }
 *
 * // After:
 * if (await confirm({ title: 'Delete this item?' })) {
 *   deleteItem();
 * }
 * ```
 */
export function useConfirmation(): UseConfirmationReturn {
  const [isPending, setIsPending] = useState(false);
  const pendingResolversRef = useRef<Array<(value: boolean) => void>>([]);

  /**
   * Show a confirmation dialog
   */
  const confirm = useCallback(
    (options: ConfirmationOptions): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        // If already pending, queue this resolve function
        if (isPending) {
          pendingResolversRef.current.push(resolve);
          return;
        }

        // First confirmation - set up the dialog
        setIsPending(true);
        pendingResolversRef.current = [resolve];

        const {
          title,
          description = 'This action requires confirmation.',
          variant = 'warning',
          confirmLabel = 'Confirm',
          cancelLabel = 'Cancel',
        } = options;

        // Handler for confirmation
        const handleConfirm = () => {
          setIsPending(false);
          // Resolve all pending promises with true
          const resolvers = pendingResolversRef.current;
          pendingResolversRef.current = [];
          resolvers.forEach((r) => r(true));
        };

        // Handler for cancellation
        const handleCancel = () => {
          setIsPending(false);
          // Resolve all pending promises with false
          const resolvers = pendingResolversRef.current;
          pendingResolversRef.current = [];
          resolvers.forEach((r) => r(false));
        };

        // Show toast based on variant
        const toastOptions = {
          description,
          action: {
            label: confirmLabel,
            onClick: handleConfirm,
          },
          cancel: {
            label: cancelLabel,
            onClick: handleCancel,
          },
          onDismiss: handleCancel,
          onAutoClose: handleCancel,
        };

        if (variant === 'danger') {
          toast.error(title, toastOptions);
        } else if (variant === 'info') {
          toast.info(title, toastOptions);
        } else {
          toast.warning(title, toastOptions);
        }
      });
    },
    [isPending]
  );

  return {
    isPending,
    confirm,
  };
}
