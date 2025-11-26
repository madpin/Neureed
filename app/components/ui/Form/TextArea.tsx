import { TextareaHTMLAttributes, forwardRef } from "react";

export interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Whether the textarea has an error state
   */
  error?: boolean;

  /**
   * Visual variant of the textarea
   */
  variant?: "default" | "filled";
}

/**
 * TextArea component for multi-line text input
 *
 * Provides consistent styling for textarea elements across the application.
 * Supports error states and different variants.
 *
 * @example
 * ```tsx
 * <TextArea
 *   placeholder="Enter your message..."
 *   rows={5}
 *   error={!!errors.message}
 * />
 * ```
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    { variant = "default", error = false, className = "", ...props },
    ref
  ) => {
    const baseClasses =
      "w-full rounded-lg border px-3 py-2 transition-colors focus:outline-none focus:ring-1 resize-vertical";

    const variantClasses = {
      default: "border-border bg-background",
      filled: "border-border bg-muted",
    };

    const focusClasses = error
      ? "focus:border-red-500 focus:ring-red-500 border-red-500"
      : "focus:border-primary focus:ring-primary";

    const classes = [
      baseClasses,
      variantClasses[variant],
      focusClasses,
      props.disabled && "cursor-not-allowed opacity-50",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return <textarea ref={ref} className={classes} {...props} />;
  }
);

TextArea.displayName = "TextArea";
