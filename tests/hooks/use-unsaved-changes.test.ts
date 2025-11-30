import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUnsavedChanges } from '../../src/hooks/use-unsaved-changes';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
  },
}));

describe('useUnsavedChanges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return false for hasChanges when values are equal', () => {
    const current = { name: 'John', age: 30 };
    const original = { name: 'John', age: 30 };

    const { result } = renderHook(() => useUnsavedChanges(current, original));

    expect(result.current.hasChanges).toBe(false);
  });

  it('should return true for hasChanges when values differ', () => {
    const current = { name: 'John', age: 30 };
    const original = { name: 'Jane', age: 25 };

    const { result } = renderHook(() => useUnsavedChanges(current, original));

    expect(result.current.hasChanges).toBe(true);
  });

  it('should return false when current or original is null', () => {
    const { result: result1 } = renderHook(() => useUnsavedChanges(null, { name: 'John' }));
    expect(result1.current.hasChanges).toBe(false);

    const { result: result2 } = renderHook(() => useUnsavedChanges({ name: 'John' }, null));
    expect(result2.current.hasChanges).toBe(false);

    const { result: result3 } = renderHook(() => useUnsavedChanges(null, null));
    expect(result3.current.hasChanges).toBe(false);
  });

  it('should use custom comparison function when provided', () => {
    const current = { name: 'JOHN', age: 30 };
    const original = { name: 'john', age: 30 };

    // Case-insensitive comparison
    const compareFn = (a: any, b: any) => {
      return a.name.toLowerCase() !== b.name.toLowerCase() || a.age !== b.age;
    };

    const { result } = renderHook(() =>
      useUnsavedChanges(current, original, { compareFn })
    );

    // Should be false because case-insensitive comparison treats them as equal
    expect(result.current.hasChanges).toBe(false);
  });

  it('should call onRevert callback when revert is called', () => {
    const current = { name: 'John', age: 30 };
    const original = { name: 'Jane', age: 25 };
    const onRevert = vi.fn();

    const { result } = renderHook(() =>
      useUnsavedChanges(current, original, { onRevert })
    );

    act(() => {
      result.current.revert();
    });

    expect(onRevert).toHaveBeenCalledWith(original);
  });

  it('should not call onRevert when original is null', () => {
    const current = { name: 'John', age: 30 };
    const onRevert = vi.fn();

    const { result } = renderHook(() =>
      useUnsavedChanges(current, null, { onRevert })
    );

    act(() => {
      result.current.revert();
    });

    expect(onRevert).not.toHaveBeenCalled();
  });

  it('should show toast warning and call onClose when confirmClose is called with changes', async () => {
    const current = { name: 'John', age: 30 };
    const original = { name: 'Jane', age: 25 };
    const onRevert = vi.fn();
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useUnsavedChanges(current, original, { onRevert })
    );

    act(() => {
      result.current.confirmClose(onClose);
    });

    // Toast warning should be shown
    expect(toast.warning).toHaveBeenCalledWith(
      'You have unsaved changes',
      expect.objectContaining({
        description: 'Are you sure you want to close without saving?',
        action: expect.objectContaining({
          label: 'Close anyway',
        }),
        cancel: expect.objectContaining({
          label: 'Keep editing',
        }),
      })
    );

    // Simulate clicking "Close anyway"
    const toastCall = (toast.warning as any).mock.calls[0][1];
    act(() => {
      toastCall.action.onClick();
    });

    // Should revert changes and call onClose
    await waitFor(() => {
      expect(onRevert).toHaveBeenCalledWith(original);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('should call onClose immediately when confirmClose is called without changes', () => {
    const current = { name: 'John', age: 30 };
    const original = { name: 'John', age: 30 };
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useUnsavedChanges(current, original)
    );

    act(() => {
      result.current.confirmClose(onClose);
    });

    // No toast should be shown
    expect(toast.warning).not.toHaveBeenCalled();
    // onClose should be called immediately
    expect(onClose).toHaveBeenCalled();
  });

  it('should not call onClose when "Keep editing" is clicked', () => {
    const current = { name: 'John', age: 30 };
    const original = { name: 'Jane', age: 25 };
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useUnsavedChanges(current, original)
    );

    act(() => {
      result.current.confirmClose(onClose);
    });

    // Simulate clicking "Keep editing"
    const toastCall = (toast.warning as any).mock.calls[0][1];
    act(() => {
      toastCall.cancel.onClick();
    });

    // onClose should NOT be called
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should prevent showing multiple dialogs', () => {
    const current = { name: 'John', age: 30 };
    const original = { name: 'Jane', age: 25 };
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useUnsavedChanges(current, original)
    );

    // Call confirmClose twice rapidly
    act(() => {
      result.current.confirmClose(onClose);
      result.current.confirmClose(onClose);
    });

    // Toast should only be called once
    expect(toast.warning).toHaveBeenCalledTimes(1);
  });

  it('should update hasChanges when values change', () => {
    const { result, rerender } = renderHook(
      ({ current, original }) => useUnsavedChanges(current, original),
      {
        initialProps: {
          current: { name: 'John', age: 30 },
          original: { name: 'John', age: 30 },
        },
      }
    );

    expect(result.current.hasChanges).toBe(false);

    // Update current value
    rerender({
      current: { name: 'Jane', age: 25 },
      original: { name: 'John', age: 30 },
    });

    expect(result.current.hasChanges).toBe(true);
  });
});
