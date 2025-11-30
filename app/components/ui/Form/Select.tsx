import { SelectHTMLAttributes, forwardRef } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /**
   * Whether the select has an error state
   */
  error?: boolean;
}

/**
 * Select component for dropdown selections
 *
 * Provides consistent styling for select elements across the application.
 * Supports error states and standard HTML select attributes.
 *
 * @example
 * ```tsx
 * <Select error={!!errors.category}>
 *   <option value="">Select a category</option>
 *   <option value="tech">Technology</option>
 *   <option value="science">Science</option>
 * </Select>
 * ```
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error = false, className = "", children, ...props }, ref) => {
    const baseClasses =
      "w-full rounded-lg border px-3 py-2 transition-colors focus:outline-none focus:ring-1";

    const focusClasses = error
      ? "focus:border-red-500 focus:ring-red-500 border-red-500"
      : "focus:border-primary focus:ring-primary border-border";

    const classes = [
      baseClasses,
      focusClasses,
      "bg-background",
      props.disabled && "cursor-not-allowed opacity-50",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <select ref={ref} className={classes} {...props}>
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";
