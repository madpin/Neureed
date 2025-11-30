import { ReactNode } from "react";

export interface ModalFooterProps {
  /**
   * Footer content (typically buttons)
   */
  children: ReactNode;

  /**
   * Alignment of footer content
   * @default "right"
   */
  align?: "left" | "center" | "right" | "between";

  /**
   * Additional CSS classes
   */
  className?: string;
}

const alignClasses = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
  between: "justify-between",
};

/**
 * ModalFooter component for action buttons
 *
 * @example
 * ```tsx
 * <ModalFooter>
 *   <Button variant="outline" onClick={onClose}>Cancel</Button>
 *   <Button variant="primary" onClick={onSave}>Save</Button>
 * </ModalFooter>
 *
 * // Space between
 * <ModalFooter align="between">
 *   <Button variant="ghost">Delete</Button>
 *   <div className="flex gap-3">
 *     <Button variant="outline">Cancel</Button>
 *     <Button variant="primary">Save</Button>
 *   </div>
 * </ModalFooter>
 * ```
 */
export function ModalFooter({
  children,
  align = "right",
  className = "",
}: ModalFooterProps) {
  return (
    <div
      className={[
        "flex items-center gap-3",
        "border-t border-border px-6 py-4",
        "flex-shrink-0",
        alignClasses[align],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
