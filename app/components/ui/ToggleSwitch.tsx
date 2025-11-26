export interface ToggleSwitchProps {
  /**
   * Label text for the toggle
   */
  label: string;

  /**
   * Optional description text shown below the label
   */
  description?: string;

  /**
   * Whether the toggle is checked
   */
  checked: boolean;

  /**
   * Callback when toggle state changes
   */
  onChange: (checked: boolean) => void;

  /**
   * Whether the toggle is disabled
   */
  disabled?: boolean;

  /**
   * Size of the toggle
   */
  size?: "sm" | "md";

  /**
   * HTML name attribute
   */
  name?: string;

  /**
   * HTML id attribute
   */
  id?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ToggleSwitch component for boolean on/off states
 *
 * Provides an accessible switch component with label and optional description.
 * Extracted from PreferencesModal to be reusable across the application.
 *
 * @example
 * ```tsx
 * <ToggleSwitch
 *   label="Enable notifications"
 *   description="Get notified about new articles"
 *   checked={notifications}
 *   onChange={setNotifications}
 * />
 * ```
 */
export function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  size = "md",
  name,
  id,
  className = "",
}: ToggleSwitchProps) {
  // Generate ID from label if not provided
  const buttonId =
    id || name || `toggle-${label.toLowerCase().replace(/\s+/g, "-")}`;

  const sizeClasses = {
    sm: {
      button: "h-5 w-9",
      slider: "h-3 w-3",
      translateChecked: "translate-x-5",
      translateUnchecked: "translate-x-1",
    },
    md: {
      button: "h-6 w-11",
      slider: "h-4 w-4",
      translateChecked: "translate-x-6",
      translateUnchecked: "translate-x-1",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="flex-1">
        <label
          htmlFor={buttonId}
          className="cursor-pointer text-sm font-medium"
        >
          {label}
        </label>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        id={buttonId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex items-center rounded-full transition-colors ${
          sizes.button
        } ${
          checked ? "bg-primary" : "bg-muted"
        } ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
      >
        <span
          className={`inline-block transform rounded-full bg-background transition-transform ${
            sizes.slider
          } ${checked ? sizes.translateChecked : sizes.translateUnchecked}`}
        />
      </button>
    </div>
  );
}
