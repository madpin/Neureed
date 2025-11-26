import { ReactNode } from "react";

export interface ConfigItemCardProps {
  /** Label for the config item */
  label: string;
  /** Value to display (can be a string, number, or React node for complex displays) */
  value: string | number | ReactNode;
  /** Source badge to show where the config value comes from */
  sourceBadge?: "database" | "environment" | "none";
  /** Additional className for the container */
  className?: string;
  /** Whether to truncate long values */
  truncate?: boolean;
  /** Whether to use monospace font for the value */
  monospace?: boolean;
}

/**
 * ConfigItemCard component for displaying configuration key-value pairs.
 * Used in ConfigTab and LLMConfigTab to show system configuration.
 *
 * @example
 * ```tsx
 * <ConfigItemCard
 *   label="Provider"
 *   value="OpenAI"
 *   sourceBadge="environment"
 * />
 * ```
 */
export function ConfigItemCard({
  label,
  value,
  sourceBadge = "none",
  className = "",
  truncate = true,
  monospace = true,
}: ConfigItemCardProps) {
  // Format label: convert camelCase to Title Case
  const formattedLabel = label.replace(/([A-Z])/g, " $1").trim();

  return (
    <div className={`p-3 rounded bg-muted/20 border border-border ${className}`}>
      {/* Label with optional source badge */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-xs text-foreground/50 uppercase">{formattedLabel}</div>
        {sourceBadge === "database" && (
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap">
            [Database]
          </span>
        )}
        {sourceBadge === "environment" && (
          <span className="text-xs text-green-600 dark:text-green-400 font-medium whitespace-nowrap">
            [Environment]
          </span>
        )}
      </div>

      {/* Value */}
      <div
        className={`font-medium text-sm ${monospace ? "font-mono" : ""} ${
          truncate ? "truncate" : "break-all"
        }`}
        title={typeof value === "string" || typeof value === "number" ? String(value) : undefined}
      >
        {value}
      </div>
    </div>
  );
}
