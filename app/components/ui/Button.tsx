"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/animations";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant of the button
   */
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";

  /**
   * Size of the button
   */
  size?: "sm" | "md" | "lg";

  /**
   * Whether the button is in a loading state
   */
  loading?: boolean;

  /**
   * Icon to display in the button
   */
  icon?: ReactNode;

  /**
   * Position of the icon relative to the text
   */
  iconPosition?: "left" | "right";

  /**
   * Whether the button should take full width
   */
  fullWidth?: boolean;

  /**
   * Button content
   */
  children?: ReactNode;
}

/**
 * Button component with smooth animations
 *
 * Provides a consistent API for all button variants across the application.
 * Uses the existing .btn, .btn-primary, .btn-secondary, etc. classes for styling,
 * enhanced with subtle hover and tap animations.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">
 *   Click me
 * </Button>
 *
 * <Button variant="danger" loading>
 *   Deleting...
 * </Button>
 *
 * <Button variant="outline" icon={<PlusIcon />} iconPosition="left">
 *   Add Item
 * </Button>
 * ```
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  className = "",
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  // Build the class name from existing CSS classes
  const classes = [
    "btn",
    `btn-${variant}`,
    size !== "md" && `btn-${size}`,
    fullWidth && "w-full",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Animation variants
  const buttonVariants = {
    rest: { scale: 1 },
    hover: {
      scale: prefersReducedMotion ? 1 : 1.02,
      transition: { duration: 0.15 },
    },
    tap: {
      scale: prefersReducedMotion ? 1 : 0.98,
      transition: { duration: 0.1 },
    },
  };

  return (
    <motion.button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
      variants={buttonVariants}
      initial="rest"
      whileHover={!disabled && !loading ? "hover" : "rest"}
      whileTap={!disabled && !loading ? "tap" : "rest"}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && icon && iconPosition === "left" && icon}
      {children}
      {!loading && icon && iconPosition === "right" && icon}
    </motion.button>
  );
}
