import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMobileMenu } from '../../src/hooks/use-mobile-menu';

describe('useMobileMenu', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useMobileMenu());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.dropdownRef.current).toBeNull();
  });

  it('should open menu', () => {
    const { result } = renderHook(() => useMobileMenu());

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('should close menu', () => {
    const { result } = renderHook(() => useMobileMenu());

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should toggle menu state', () => {
    const { result } = renderHook(() => useMobileMenu());

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should close menu when clicking outside', () => {
    const { result } = renderHook(() => useMobileMenu());

    // Create a mock dropdown element
    const dropdownElement = document.createElement('div');
    document.body.appendChild(dropdownElement);

    // Assign to ref
    Object.defineProperty(result.current.dropdownRef, 'current', {
      writable: true,
      value: dropdownElement,
    });

    // Open menu
    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);

    // Click outside
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    act(() => {
      outsideElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(result.current.isOpen).toBe(false);

    // Cleanup
    document.body.removeChild(dropdownElement);
    document.body.removeChild(outsideElement);
  });

  it('should not close menu when clicking inside', () => {
    const { result } = renderHook(() => useMobileMenu());

    // Create a mock dropdown element
    const dropdownElement = document.createElement('div');
    document.body.appendChild(dropdownElement);

    // Assign to ref
    Object.defineProperty(result.current.dropdownRef, 'current', {
      writable: true,
      value: dropdownElement,
    });

    // Open menu
    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);

    // Click inside
    act(() => {
      dropdownElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(result.current.isOpen).toBe(true);

    // Cleanup
    document.body.removeChild(dropdownElement);
  });

  it('should clean up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useMobileMenu());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
  });

  it('should not throw error when clicking outside before ref is assigned', () => {
    const { result } = renderHook(() => useMobileMenu());

    act(() => {
      result.current.open();
    });

    // Click outside without ref assigned
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    expect(() => {
      act(() => {
        outsideElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      });
    }).not.toThrow();

    // Should still close
    expect(result.current.isOpen).toBe(false);

    // Cleanup
    document.body.removeChild(outsideElement);
  });
});
