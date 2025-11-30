import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConfirmation } from '../../src/hooks/use-confirmation';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('useConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with isPending false', () => {
    const { result } = renderHook(() => useConfirmation());

    expect(result.current.isPending).toBe(false);
  });

  it('should show warning toast and resolve true when confirmed', async () => {
    const { result } = renderHook(() => useConfirmation());

    let confirmPromise: Promise<boolean>;

    act(() => {
      confirmPromise = result.current.confirm({
        title: 'Delete item?',
        description: 'This action cannot be undone',
      });
    });

    // Should show warning toast
    expect(toast.warning).toHaveBeenCalledWith(
      'Delete item?',
      expect.objectContaining({
        description: 'This action cannot be undone',
        action: expect.objectContaining({
          label: 'Confirm',
        }),
        cancel: expect.objectContaining({
          label: 'Cancel',
        }),
      })
    );

    expect(result.current.isPending).toBe(true);

    // Simulate clicking "Confirm"
    const toastCall = (toast.warning as any).mock.calls[0][1];
    act(() => {
      toastCall.action.onClick();
    });

    // Should resolve to true
    await waitFor(async () => {
      const confirmed = await confirmPromise!;
      expect(confirmed).toBe(true);
    });

    expect(result.current.isPending).toBe(false);
  });

  it('should resolve false when cancelled', async () => {
    const { result } = renderHook(() => useConfirmation());

    let confirmPromise: Promise<boolean>;

    act(() => {
      confirmPromise = result.current.confirm({
        title: 'Delete item?',
        description: 'This action cannot be undone',
      });
    });

    expect(result.current.isPending).toBe(true);

    // Simulate clicking "Cancel"
    const toastCall = (toast.warning as any).mock.calls[0][1];
    act(() => {
      toastCall.cancel.onClick();
    });

    // Should resolve to false
    await waitFor(async () => {
      const confirmed = await confirmPromise!;
      expect(confirmed).toBe(false);
    });

    expect(result.current.isPending).toBe(false);
  });

  it('should resolve false when dismissed', async () => {
    const { result } = renderHook(() => useConfirmation());

    let confirmPromise: Promise<boolean>;

    act(() => {
      confirmPromise = result.current.confirm({
        title: 'Delete item?',
        description: 'This action cannot be undone',
      });
    });

    expect(result.current.isPending).toBe(true);

    // Simulate dismissing the toast
    const toastCall = (toast.warning as any).mock.calls[0][1];
    act(() => {
      toastCall.onDismiss();
    });

    // Should resolve to false
    await waitFor(async () => {
      const confirmed = await confirmPromise!;
      expect(confirmed).toBe(false);
    });

    expect(result.current.isPending).toBe(false);
  });

  it('should use error toast for danger variant', async () => {
    const { result } = renderHook(() => useConfirmation());

    act(() => {
      result.current.confirm({
        title: 'Delete permanently?',
        description: 'This will delete everything',
        variant: 'danger',
      });
    });

    expect(toast.error).toHaveBeenCalledWith(
      'Delete permanently?',
      expect.objectContaining({
        description: 'This will delete everything',
      })
    );
  });

  it('should use info toast for info variant', async () => {
    const { result } = renderHook(() => useConfirmation());

    act(() => {
      result.current.confirm({
        title: 'Continue?',
        description: 'Are you sure?',
        variant: 'info',
      });
    });

    expect(toast.info).toHaveBeenCalledWith(
      'Continue?',
      expect.objectContaining({
        description: 'Are you sure?',
      })
    );
  });

  it('should use custom button labels', async () => {
    const { result } = renderHook(() => useConfirmation());

    act(() => {
      result.current.confirm({
        title: 'Proceed?',
        description: 'Custom confirmation',
        confirmLabel: 'Yes, proceed',
        cancelLabel: 'No, go back',
      });
    });

    const toastCall = (toast.warning as any).mock.calls[0][1];
    expect(toastCall.action.label).toBe('Yes, proceed');
    expect(toastCall.cancel.label).toBe('No, go back');
  });

  it('should prevent duplicate confirmations when pending', async () => {
    const { result } = renderHook(() => useConfirmation());

    let promise1: Promise<boolean>;
    let promise2: Promise<boolean>;

    act(() => {
      promise1 = result.current.confirm({
        title: 'Delete item?',
        description: 'First confirmation',
      });
    });

    expect(result.current.isPending).toBe(true);

    // Try to show another confirmation while pending
    act(() => {
      promise2 = result.current.confirm({
        title: 'Delete another?',
        description: 'Second confirmation',
      });
    });

    // Should only show toast once
    expect(toast.warning).toHaveBeenCalledTimes(1);

    // Confirm the first one
    const toastCall = (toast.warning as any).mock.calls[0][1];
    act(() => {
      toastCall.action.onClick();
    });

    // Both promises should resolve to the same value
    await waitFor(async () => {
      const result1 = await promise1!;
      const result2 = await promise2!;
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    expect(result.current.isPending).toBe(false);
  });

  it('should handle multiple confirmations sequentially', async () => {
    const { result } = renderHook(() => useConfirmation());

    // First confirmation
    let promise1: Promise<boolean>;
    act(() => {
      promise1 = result.current.confirm({
        title: 'First confirmation',
      });
    });

    const toastCall1 = (toast.warning as any).mock.calls[0][1];
    act(() => {
      toastCall1.action.onClick();
    });

    await waitFor(async () => {
      const confirmed = await promise1!;
      expect(confirmed).toBe(true);
    });

    expect(result.current.isPending).toBe(false);

    // Second confirmation (should work now)
    let promise2: Promise<boolean>;
    act(() => {
      promise2 = result.current.confirm({
        title: 'Second confirmation',
      });
    });

    expect(toast.warning).toHaveBeenCalledTimes(2);
    expect(result.current.isPending).toBe(true);

    const toastCall2 = (toast.warning as any).mock.calls[1][1];
    act(() => {
      toastCall2.cancel.onClick();
    });

    await waitFor(async () => {
      const confirmed = await promise2!;
      expect(confirmed).toBe(false);
    });

    expect(result.current.isPending).toBe(false);
  });

  it('should handle onAutoClose callback', async () => {
    const { result } = renderHook(() => useConfirmation());

    let confirmPromise: Promise<boolean>;

    act(() => {
      confirmPromise = result.current.confirm({
        title: 'Delete item?',
      });
    });

    // Simulate auto-close
    const toastCall = (toast.warning as any).mock.calls[0][1];
    act(() => {
      toastCall.onAutoClose();
    });

    // Should resolve to false
    await waitFor(async () => {
      const confirmed = await confirmPromise!;
      expect(confirmed).toBe(false);
    });

    expect(result.current.isPending).toBe(false);
  });

  it('should use default description if not provided', async () => {
    const { result } = renderHook(() => useConfirmation());

    act(() => {
      result.current.confirm({
        title: 'Continue?',
      });
    });

    expect(toast.warning).toHaveBeenCalledWith(
      'Continue?',
      expect.objectContaining({
        description: 'This action requires confirmation.',
      })
    );
  });

  it('should use default button labels if not provided', async () => {
    const { result } = renderHook(() => useConfirmation());

    act(() => {
      result.current.confirm({
        title: 'Continue?',
      });
    });

    const toastCall = (toast.warning as any).mock.calls[0][1];
    expect(toastCall.action.label).toBe('Confirm');
    expect(toastCall.cancel.label).toBe('Cancel');
  });
});
