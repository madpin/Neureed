import { InputHTMLAttributes, ReactNode, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * Visual variant of the input
   */
  variant?: "default" | "filled";

  /**
   * Whether the input has an error state
   */
  error?: boolean;

  /**
   * Icon or element to display on the left side of the input
   */
  leftIcon?: ReactNode;

  /**
   * Icon or element to display on the right side of the input
   */
  rightIcon?: ReactNode;
}

/**
 * Input component for text input fields
 *
 * Provides consistent styling and behavior for text inputs across the application.
 * Supports error states, icons, and different variants.
 *
 * @example
 * ```tsx
 * <Input
 *   type="text"
 *   placeholder="Enter text..."
 *   error={!!errors.field}
 * />
 *
 * <Input
 *   type="search"
 *   placeholder="Search..."
 *   leftIcon={<SearchIcon />}
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = "default",
      error = false,
      leftIcon,
      rightIcon,
      className = "",
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "w-full rounded-lg border px-3 py-2 transition-colors focus:outline-none focus:ring-1";

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
      leftIcon && "pl-10",
      rightIcon && "pr-10",
      props.disabled && "cursor-not-allowed opacity-50",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    if (leftIcon || rightIcon) {
      return (
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50">
              {leftIcon}
            </div>
          )}
          <input ref={ref} className={classes} {...props} />
          {rightIcon && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50">
              {rightIcon}
            </div>
          )}
        </div>
      );
    }

    return <input ref={ref} className={classes} {...props} />;
  }
);

Input.displayName = "Input";
