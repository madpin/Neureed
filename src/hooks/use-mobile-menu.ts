import { useState, useRef, useEffect, useCallback } from 'react';

export interface UseMobileMenuReturn {
  /**
   * Whether the mobile menu is currently open
   */
  isOpen: boolean;

  /**
   * Ref to attach to the dropdown element for outside click detection
   */
  dropdownRef: React.RefObject<HTMLDivElement | null>;

  /**
   * Open the mobile menu
   */
  open: () => void;

  /**
   * Close the mobile menu
   */
  close: () => void;

  /**
   * Toggle the mobile menu open/closed state
   */
  toggle: () => void;
}

/**
 * Hook for managing mobile dropdown menu state with outside-click detection.
 * Automatically closes the menu when clicking outside the dropdown element.
 *
 * @example
 * ```tsx
 * const { isOpen, dropdownRef, open, close, toggle } = useMobileMenu();
 *
 * return (
 *   <div>
 *     <button onClick={toggle}>Menu</button>
 *     {isOpen && (
 *       <div ref={dropdownRef} className="dropdown">
 *         <button onClick={close}>Close</button>
 *         <a href="/profile">Profile</a>
 *         <a href="/settings">Settings</a>
 *       </div>
 *     )}
 *   </div>
 * );
 * ```
 */
export function useMobileMenu(): UseMobileMenuReturn {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Open the mobile menu
   */
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  /**
   * Close the mobile menu
   */
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Toggle the mobile menu open/closed state
   */
  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  /**
   * Handle clicks outside the dropdown to close the menu
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If no ref assigned yet, close the menu (safe default)
      if (!dropdownRef.current) {
        setIsOpen(false);
        return;
      }

      // Check if click was outside the dropdown
      if (!dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Only add listener when menu is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return {
    isOpen,
    dropdownRef,
    open,
    close,
    toggle,
  };
}
