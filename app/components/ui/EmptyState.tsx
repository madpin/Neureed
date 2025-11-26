"use client";

import { Button } from "./Button";
import { motion } from "framer-motion";
import { fadeIn, useReducedMotion } from "@/lib/animations";

export interface EmptyStateProps {
  /**
   * Icon component to display (from lucide-react or custom)
   */
  icon?: React.ComponentType<{ className?: string }>;
  /**
   * Main title text (required)
   */
  title: string;
  /**
   * Optional description text
   */
  description?: string;
  /**
   * Optional action button configuration
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "outline";
  };
  /**
   * Custom illustration/image slot (alternative to icon)
   */
  illustration?: React.ReactNode;
  /**
   * Size variant
   * @default 'md'
   */
  size?: "sm" | "md" | "lg";
  /**
   * Additional CSS classes
   */
  className?: string;
}

const sizeClasses = {
  sm: {
    container: "py-6 px-4",
    icon: "h-10 w-10",
    title: "text-base",
    description: "text-sm",
    spacing: "gap-3",
  },
  md: {
    container: "py-12 px-6",
    icon: "h-14 w-14",
    title: "text-lg",
    description: "text-base",
    spacing: "gap-4",
  },
  lg: {
    container: "py-16 px-8",
    icon: "h-20 w-20",
    title: "text-xl",
    description: "text-lg",
    spacing: "gap-6",
  },
};

/**
 * EmptyState component
 *
 * A standardized component for displaying empty states when no data is available.
 * Provides a consistent UX with icon, title, description, and optional action button.
 *
 * @example
 * ```tsx
 * // Basic empty state
 * <EmptyState
 *   icon={Inbox}
 *   title="No messages"
 *   description="When you receive messages, they'll appear here."
 * />
 *
 * // With action button
 * <EmptyState
 *   icon={Plus}
 *   title="No feeds yet"
 *   description="Get started by adding your first RSS feed."
 *   action={{
 *     label: "Add Feed",
 *     onClick: () => openAddFeedModal()
 *   }}
 * />
 *
 * // With custom illustration
 * <EmptyState
 *   illustration={<img src="/empty-illustration.svg" alt="" />}
 *   title="No results found"
 *   description="Try adjusting your search or filters."
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  illustration,
  size = "md",
  className,
}: EmptyStateProps) {
  const classes = sizeClasses[size];
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={[
        "flex flex-col items-center justify-center text-center",
        classes.container,
        classes.spacing,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...(prefersReducedMotion ? {} : fadeIn)}
    >
      {/* Icon or Illustration */}
      {illustration ? (
        <div className="mb-2">{illustration}</div>
      ) : Icon ? (
        <div
          className={[
            "mb-2 rounded-full bg-gray-100 p-4 dark:bg-gray-800",
            "text-gray-400 dark:text-gray-500",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Icon className={classes.icon} />
        </div>
      ) : null}

      {/* Title */}
      <h3
        className={[
          "font-semibold text-gray-900 dark:text-gray-100",
          classes.title,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={[
            "max-w-md text-gray-600 dark:text-gray-400",
            classes.description,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <Button
          variant={action.variant || "primary"}
          onClick={action.onClick}
          className="mt-2"
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
