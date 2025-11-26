"use client";

import { useState, useCallback, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui";

export interface ConfirmButtonProps {
  /** Function to execute after confirmation */
  onConfirm: () => Promise<void> | void;
  /** Button text */
  children: ReactNode;
  /** Text for the confirmation toast */
  confirmText: string;
  /** Warning message for the confirmation toast */
  warningDescription?: string;
  /** Button variant */
  variant?: "danger" | "warning" | "primary" | "secondary";
  /** Timeout in milliseconds before resetting confirmation state (default: 5000ms) */
  confirmTimeout?: number;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button is in loading state */
  loading?: boolean;
  /** Icon to display in the button */
  icon?: ReactNode;
  /** Additional className for the button */
  className?: string;
  /** Size of the button */
  size?: "sm" | "md" | "lg";
}

/**
 * ConfirmButton component implements a two-click confirmation pattern.
 * On first click, shows a warning toast. On second click (within timeout), executes the action.
 *
 * @example
 * ```tsx
 * <ConfirmButton
 *   onConfirm={async () => await deleteUser(id)}
 *   confirmText="Delete User?"
 *   warningDescription="This action cannot be undone."
 *   variant="danger"
 * >
 *   Delete
 * </ConfirmButton>
 * ```
 */
export function ConfirmButton({
  onConfirm,
  children,
  confirmText,
  warningDescription,
  variant = "primary",
  confirmTimeout = 5000,
  disabled = false,
  loading = false,
  icon,
  className = "",
  size = "md",
}: ConfirmButtonProps) {
  const [pending, setPending] = useState(false);
  const [executing, setExecuting] = useState(false);

  // Reset pending state after timeout
  useEffect(() => {
    if (pending) {
      const timer = setTimeout(() => {
        setPending(false);
      }, confirmTimeout);
      return () => clearTimeout(timer);
    }
  }, [pending, confirmTimeout]);

  const handleClick = useCallback(async () => {
    // First click: show warning
    if (!pending) {
      setPending(true);

      const toastOptions = {
        description: warningDescription || "Click the button again to confirm.",
        duration: confirmTimeout,
      };

      // Different toast styles based on variant
      if (variant === "danger") {
        toast.error(confirmText, toastOptions);
      } else if (variant === "warning") {
        toast.warning(confirmText, toastOptions);
      } else {
        toast.info(confirmText, toastOptions);
      }

      return;
    }

    // Second click: execute action
    try {
      setExecuting(true);
      await onConfirm();
      setPending(false);
    } catch (error) {
      console.error("ConfirmButton action failed:", error);
      toast.error("Action failed. Please try again.");
    } finally {
      setExecuting(false);
    }
  }, [pending, onConfirm, confirmText, warningDescription, variant, confirmTimeout]);

  // Map our variant to Button variant
  const buttonVariant = variant === "danger" ? "danger" : variant === "warning" ? "primary" : variant;

  return (
    <Button
      onClick={handleClick}
      variant={buttonVariant}
      size={size}
      disabled={disabled || executing}
      loading={executing || loading}
      iconLeft={icon}
      className={className}
    >
      {children}
    </Button>
  );
}
