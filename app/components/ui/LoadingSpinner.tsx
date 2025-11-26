export interface LoadingSpinnerProps {
  /**
   * Size variant of the spinner
   * @default 'md'
   */
  size?: "xs" | "sm" | "md" | "lg";
  /**
   * Color variant of the spinner
   * @default 'primary'
   */
  color?: "primary" | "secondary" | "white";
  /**
   * Display mode
   * - inline: Displays inline with content
   * - fullscreen: Takes up full screen with backdrop
   * - overlay: Overlays content with semi-transparent backdrop
   * @default 'inline'
   */
  mode?: "inline" | "fullscreen" | "overlay";
  /**
   * Optional text label to display below spinner
   */
  label?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const sizeClasses = {
  xs: "h-4 w-4 border-2",
  sm: "h-6 w-6 border-2",
  md: "h-8 w-8 border-3",
  lg: "h-12 w-12 border-4",
};

const colorClasses = {
  primary: "border-blue-600 border-t-transparent",
  secondary: "border-gray-600 border-t-transparent",
  white: "border-white border-t-transparent",
};

const labelSizeClasses = {
  xs: "text-xs mt-1",
  sm: "text-sm mt-1.5",
  md: "text-base mt-2",
  lg: "text-lg mt-2.5",
};

/**
 * LoadingSpinner component
 *
 * A versatile loading indicator with multiple size, color, and display mode options.
 *
 * @example
 * ```tsx
 * // Inline spinner
 * <LoadingSpinner size="sm" />
 *
 * // With label
 * <LoadingSpinner label="Loading..." />
 *
 * // Fullscreen loading
 * <LoadingSpinner mode="fullscreen" label="Please wait..." />
 *
 * // Overlay mode
 * <LoadingSpinner mode="overlay" label="Saving..." />
 * ```
 */
export function LoadingSpinner({
  size = "md",
  color = "primary",
  mode = "inline",
  label,
  className,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={[
        "flex flex-col items-center justify-center",
        mode !== "inline" && "gap-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          "animate-spin rounded-full",
          sizeClasses[size],
          colorClasses[color],
        ]
          .filter(Boolean)
          .join(" ")}
        role="status"
        aria-label={label || "Loading"}
      />
      {label && (
        <p
          className={[
            "text-gray-700 dark:text-gray-300",
            labelSizeClasses[size],
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {label}
        </p>
      )}
    </div>
  );

  if (mode === "inline") {
    return spinner;
  }

  if (mode === "fullscreen") {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-gray-900">
        {spinner}
      </div>
    );
  }

  if (mode === "overlay") {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
}
