import { useState, useEffect, useCallback } from 'react';

export interface UseViewNavigationOptions<T extends string = string> {
  /**
   * Name of the modal (used for browser history state)
   */
  modalName: string;

  /**
   * Default view to show initially
   */
  defaultView: T;

  /**
   * Whether the modal is currently open
   * History management only occurs when the modal is open
   */
  isOpen: boolean;

  /**
   * Optional callback when navigating to a different view
   */
  onNavigate?: (view: T) => void;

  /**
   * Optional callback when closing via browser back button
   */
  onClose?: (skipHistoryPush?: boolean) => void;
}

export interface UseViewNavigationReturn<T extends string = string> {
  /**
   * Current active view
   */
  currentView: T;

  /**
   * Navigate to a different view
   */
  navigateToView: (view: T) => void;
}

/**
 * Hook for managing view navigation with browser history integration.
 * Handles tab/view switching with back/forward button support.
 *
 * @example
 * ```tsx
 * type PreferencesView = 'profile' | 'appearance' | 'search' | 'feeds';
 *
 * const { currentView, navigateToView } = useViewNavigation<PreferencesView>({
 *   modalName: 'preferences',
 *   defaultView: 'profile',
 *   isOpen: isOpen, // Only manage history when modal is open
 *   onNavigate: (view) => console.log('Navigated to:', view),
 *   onClose: () => setIsOpen(false),
 * });
 *
 * return (
 *   <div>
 *     <nav>
 *       <button onClick={() => navigateToView('profile')}>Profile</button>
 *       <button onClick={() => navigateToView('appearance')}>Appearance</button>
 *     </nav>
 *
 *     {currentView === 'profile' && <ProfileView />}
 *     {currentView === 'appearance' && <AppearanceView />}
 *   </div>
 * );
 * ```
 */
export function useViewNavigation<T extends string = string>(
  options: UseViewNavigationOptions<T>
): UseViewNavigationReturn<T> {
  const { modalName, defaultView, isOpen, onNavigate, onClose } = options;

  const [currentView, setCurrentView] = useState<T>(defaultView);

  /**
   * Navigate to a different view and update browser history
   */
  const navigateToView = useCallback(
    (view: T) => {
      setCurrentView(view);

      // Update browser history
      const state = { modal: modalName, view };
      window.history.pushState(state, '', window.location.href);

      // Call navigation callback if provided
      if (onNavigate) {
        onNavigate(view);
      }
    },
    [modalName, onNavigate]
  );

  /**
   * Handle browser back/forward buttons
   * Only manage history when modal is actually open
   */
  useEffect(() => {
    // ONLY push to history if modal is actually open
    if (!isOpen) return;

    const handlePopState = (event: PopStateEvent) => {
      // If the state has our modal name, update the view
      if (event.state?.modal === modalName) {
        const view = event.state.view || defaultView;
        setCurrentView(view);
      } else {
        // User navigated away from the modal (back button)
        if (onClose) {
          onClose(true); // skipHistoryPush = true to avoid pushing again
        }
      }
    };

    // Push initial state to history
    const initialState = { modal: modalName, view: defaultView };
    window.history.pushState(initialState, '', window.location.href);

    // Listen for popstate events
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [modalName, defaultView, onClose, isOpen]);

  return {
    currentView,
    navigateToView,
  };
}
