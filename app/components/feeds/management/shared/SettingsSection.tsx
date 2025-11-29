'use client';

import { useState, ReactNode } from 'react';
import { Card, CardBody } from '@/app/components/ui';

export interface SettingsSectionProps {
  /**
   * Section title
   */
  title: string;

  /**
   * Optional description shown below the title
   */
  description?: string;

  /**
   * Section content
   */
  children: ReactNode;

  /**
   * Whether the section can be collapsed
   */
  collapsible?: boolean;

  /**
   * Default expanded state (only applies if collapsible is true)
   */
  defaultExpanded?: boolean;

  /**
   * Optional icon element to display next to the title
   */
  icon?: ReactNode;

  /**
   * Optional badge text (e.g., "Required", "Optional", "Pro")
   */
  badge?: string;

  /**
   * Additional CSS classes for the card
   */
  className?: string;
}

/**
 * SettingsSection - Consistent section wrapper for grouped settings
 *
 * Provides a Card-based container with optional collapsible behavior,
 * icons, and badges. Used to organize settings into logical groups.
 *
 * @example
 * ```tsx
 * <SettingsSection
 *   title="Advanced Settings"
 *   description="Configure advanced extraction options"
 *   collapsible={true}
 *   defaultExpanded={false}
 *   badge="Optional"
 * >
 *   <NumberSettingField ... />
 *   <SelectSettingField ... />
 * </SettingsSection>
 * ```
 */
export function SettingsSection({
  title,
  description,
  children,
  collapsible = false,
  defaultExpanded = true,
  icon,
  badge,
  className = '',
}: SettingsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <Card className={`bg-background ${className}`}>
      <CardBody>
        {/* Header */}
        <div
          className={`flex items-start justify-between ${
            collapsible ? 'cursor-pointer' : ''
          } ${description || (!isExpanded && collapsible) ? 'mb-4' : 'mb-6'}`}
          onClick={handleToggle}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {/* Icon */}
              {icon && (
                <span className="text-primary">
                  {icon}
                </span>
              )}

              {/* Title */}
              <h3 className="text-base font-semibold text-foreground">
                {title}
              </h3>

              {/* Badge */}
              {badge && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {badge}
                </span>
              )}

              {/* Collapse Indicator */}
              {collapsible && (
                <svg
                  className={`h-5 w-5 text-foreground/50 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </div>

            {/* Description */}
            {description && isExpanded && (
              <p className="mt-1 text-sm text-foreground/60">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="space-y-4">
            {children}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
