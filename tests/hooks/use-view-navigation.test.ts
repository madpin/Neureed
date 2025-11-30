import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewNavigation } from '../../src/hooks/use-view-navigation';

describe('useViewNavigation', () => {
  beforeEach(() => {
    // Clear history state before each test
    window.history.replaceState(null, '', '/');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default view', () => {
    const { result } = renderHook(() =>
      useViewNavigation({
        modalName: 'preferences',
        defaultView: 'profile',
      })
    );

    expect(result.current.currentView).toBe('profile');
  });

  it('should navigate to a different view', () => {
    const { result } = renderHook(() =>
      useViewNavigation({
        modalName: 'preferences',
        defaultView: 'profile',
      })
    );

    expect(result.current.currentView).toBe('profile');

    act(() => {
      result.current.navigateToView('appearance');
    });

    expect(result.current.currentView).toBe('appearance');
  });

  it('should push state to history when navigating', () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');

    const { result } = renderHook(() =>
      useViewNavigation({
        modalName: 'preferences',
        defaultView: 'profile',
      })
    );

    act(() => {
      result.current.navigateToView('appearance');
    });

    // Should be called twice: once for initial state, once for navigation
    expect(pushStateSpy).toHaveBeenCalledWith(
      { modal: 'preferences', view: 'appearance' },
      '',
      window.location.href
    );
  });

  it('should call onNavigate callback when provided', () => {
    const onNavigate = vi.fn();

    const { result } = renderHook(() =>
      useViewNavigation({
        modalName: 'preferences',
        defaultView: 'profile',
        onNavigate,
      })
    );

    act(() => {
      result.current.navigateToView('appearance');
    });

    expect(onNavigate).toHaveBeenCalledWith('appearance');
  });

  it('should handle browser back button', () => {
    const { result } = renderHook(() =>
      useViewNavigation({
        modalName: 'preferences',
        defaultView: 'profile',
      })
    );

    // Navigate to a different view
    act(() => {
      result.current.navigateToView('appearance');
    });

    expect(result.current.currentView).toBe('appearance');

    // Simulate browser back button
    act(() => {
      window.history.pushState(
        { modal: 'preferences', view: 'profile' },
        '',
        window.location.href
      );
      window.dispatchEvent(
        new PopStateEvent('popstate', {
          state: { modal: 'preferences', view: 'profile' },
        })
      );
    });

    expect(result.current.currentView).toBe('profile');
  });

  it('should handle browser forward button', () => {
    const { result } = renderHook(() =>
      useViewNavigation({
        modalName: 'preferences',
        defaultView: 'profile',
      })
    );

    // Navigate through views
    act(() => {
      result.current.navigateToView('appearance');
    });

    act(() => {
      result.current.navigateToView('search');
    });

    expect(result.current.currentView).toBe('search');

    // Simulate going back
    act(() => {
      window.history.pushState(
        { modal: 'preferences', view: 'appearance' },
        '',
        window.location.href
      );
      window.dispatchEvent(
        new PopStateEvent('popstate', {
          state: { modal: 'preferences', view: 'appearance' },
        })
      );
    });

    expect(result.current.currentView).toBe('appearance');
  });

  it('should call onClose when navigating away from modal via back button', () => {
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useViewNavigation({
        modalName: 'preferences',
        defaultView: 'profile',
        onClose,
      })
    );

    // Simulate navigating away (back button with no modal state)
    act(() => {
      window.dispatchEvent(
        new PopStateEvent('popstate', {
          state: null,
        })
      );
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose with skipHistoryPush when modal is different', () => {
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useViewNavigation({
        modalName: 'preferences',
        defaultView: 'profile',
        onClose,
      })
    );

    // Simulate navigating to a different modal
    act(() => {
      window.dispatchEvent(
        new PopStateEvent('popstate', {
          state: { modal: 'other-modal', view: 'some-view' },
        })
      );
    });

    expect(onClose).toHaveBeenCalledWith(true);
  });

  it('should fallback to default view when popstate has no view', () => {
    const { result } = renderHook(() =>
      useViewNavigation({
        modalName: 'preferences',
        defaultView: 'profile',
      })
    );

    act(() => {
      result.current.navigateToView('appearance');
    });

    expect(result.current.currentView).toBe('appearance');

    // Simulate popstate with modal but no view
    act(() => {
      window.dispatchEvent(
        new PopStateEvent('popstate', {
          state: { modal: 'preferences' },
        })
      );
    });

    expect(result.current.currentView).toBe('profile');
  });

  it('should clean up popstate listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useViewNavigation({
        modalName: 'preferences',
        defaultView: 'profile',
      })
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
  });

  it('should support multiple view types', () => {
    const { result } = renderHook(() =>
      useViewNavigation<'view1' | 'view2' | 'view3'>({
        modalName: 'test-modal',
        defaultView: 'view1',
      })
    );

    expect(result.current.currentView).toBe('view1');

    act(() => {
      result.current.navigateToView('view2');
    });

    expect(result.current.currentView).toBe('view2');

    act(() => {
      result.current.navigateToView('view3');
    });

    expect(result.current.currentView).toBe('view3');
  });

  it('should handle rapid view changes', () => {
    const onNavigate = vi.fn();

    const { result } = renderHook(() =>
      useViewNavigation({
        modalName: 'preferences',
        defaultView: 'profile',
        onNavigate,
      })
    );

    act(() => {
      result.current.navigateToView('appearance');
      result.current.navigateToView('search');
      result.current.navigateToView('profile');
    });

    expect(result.current.currentView).toBe('profile');
    expect(onNavigate).toHaveBeenCalledTimes(3);
  });
});
