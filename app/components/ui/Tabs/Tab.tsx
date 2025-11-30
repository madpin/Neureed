"use client";

import { ReactNode, useEffect, useRef, KeyboardEvent, useCallback } from 'react';
import { useTabsContext, TabValue } from './Tabs';

export interface TabProps {
  /**
   * Unique value for this tab
   */
  value: TabValue;

  /**
   * Whether the tab is disabled
   */
  disabled?: boolean;

  /**
   * Icon to display in the tab
   */
  icon?: ReactNode;

  /**
   * Additional className
   */
  className?: string;

  /**
   * Tab label
   */
  children: ReactNode;
}

/**
 * Tab component - Individual tab button
 *
 * @example
 * ```tsx
 * <Tab value="settings" icon={<SettingsIcon />}>
 *   Settings
 * </Tab>
 *
 * <Tab value="profile" disabled>
 *   Profile (Coming Soon)
 * </Tab>
 * ```
 */
export function Tab({ value, disabled = false, icon, className = '', children }: TabProps) {
  const { value: activeValue, onChange, registerTab, unregisterTab, orientation, tabs } = useTabsContext();
  const isActive = activeValue === value;
  const tabRef = useRef<HTMLButtonElement>(null);

  // Register/unregister this tab
  useEffect(() => {
    registerTab(value);
    return () => unregisterTab(value);
  }, [value, registerTab, unregisterTab]);

  const handleClick = () => {
    if (!disabled) {
      onChange(value);
    }
  };

  const getTabElements = useCallback(() => {
    if (!tabRef.current || !tabRef.current.parentElement) return [];
    return Array.from(tabRef.current.parentElement.querySelectorAll('[role="tab"]')) as HTMLButtonElement[];
  }, []);

  const focusAndActivateTab = useCallback((tabElement: HTMLButtonElement) => {
    const tabValue = tabElement.getAttribute('data-value');
    if (tabValue && tabElement.getAttribute('aria-disabled') !== 'true') {
      tabElement.focus();
      onChange(tabValue);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>) => {
    const tabElements = getTabElements();
    const currentIndex = tabElements.findIndex((el) => el === tabRef.current);

    if (currentIndex === -1) return;

    const isHorizontal = orientation === 'horizontal';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

    let targetIndex = -1;

    switch (e.key) {
      case nextKey:
        e.preventDefault();
        // Find next non-disabled tab
        targetIndex = currentIndex;
        do {
          targetIndex = (targetIndex + 1) % tabElements.length;
        } while (
          tabElements[targetIndex]?.getAttribute('aria-disabled') === 'true' &&
          targetIndex !== currentIndex
        );
        break;

      case prevKey:
        e.preventDefault();
        // Find previous non-disabled tab
        targetIndex = currentIndex;
        do {
          targetIndex = (targetIndex - 1 + tabElements.length) % tabElements.length;
        } while (
          tabElements[targetIndex]?.getAttribute('aria-disabled') === 'true' &&
          targetIndex !== currentIndex
        );
        break;

      case 'Home':
        e.preventDefault();
        // Find first non-disabled tab
        targetIndex = 0;
        while (
          targetIndex < tabElements.length &&
          tabElements[targetIndex]?.getAttribute('aria-disabled') === 'true'
        ) {
          targetIndex++;
        }
        break;

      case 'End':
        e.preventDefault();
        // Find last non-disabled tab
        targetIndex = tabElements.length - 1;
        while (
          targetIndex >= 0 &&
          tabElements[targetIndex]?.getAttribute('aria-disabled') === 'true'
        ) {
          targetIndex--;
        }
        break;

      default:
        return;
    }

    const targetElement = tabElements[targetIndex];
    if (targetIndex !== -1 && targetElement) {
      focusAndActivateTab(targetElement);
    }
  }, [getTabElements, focusAndActivateTab, orientation]);

  // Base styles
  const baseStyles = [
    'flex items-center gap-2',
    'px-4 py-2',
    'text-sm font-medium',
    'transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  ];

  // State-dependent styles
  const stateStyles = disabled
    ? [
        'cursor-not-allowed',
        'opacity-50',
        'text-foreground/40',
      ]
    : isActive
    ? [
        'bg-primary text-primary-foreground',
      ]
    : [
        'text-foreground/70',
        'hover:bg-muted hover:text-foreground',
      ];

  // Orientation-specific styles
  const orientationStyles =
    orientation === 'vertical'
      ? ['w-full justify-start rounded-lg']
      : ['rounded-t-lg border-b-2', isActive ? 'border-primary' : 'border-transparent'];

  const allStyles = [...baseStyles, ...stateStyles, ...orientationStyles, className].join(' ');

  return (
    <button
      ref={tabRef}
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled ? 'true' : undefined}
      aria-controls={`tabpanel-${value}`}
      data-value={value}
      tabIndex={isActive ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={allStyles}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
