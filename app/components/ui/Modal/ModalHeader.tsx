import { ReactNode } from "react";

export interface ModalHeaderProps {
  /**
   * Modal title
   */
  title?: string;

  /**
   * Custom header content (overrides title)
   */
  children?: ReactNode;

  /**
   * Callback when close button is clicked
   */
  onClose?: () => void;

  /**
   * Whether to show the close button
   * @default true
   */
  showCloseButton?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ModalHeader component for consistent modal headers
 *
 * @example
 * ```tsx
 * <ModalHeader title="Settings" onClose={handleClose} />
 *
 * // Custom content
 * <ModalHeader onClose={handleClose}>
 *   <div className="flex items-center gap-2">
 *     <Icon />
 *     <span>Custom Header</span>
 *   </div>
 * </ModalHeader>
 * ```
 */
export function ModalHeader({
  title,
  children,
  onClose,
  showCloseButton = true,
  className = "",
}: ModalHeaderProps) {
  return (
    <div
      className={[
        "flex items-center justify-between",
        "border-b border-border px-6 py-4",
        "flex-shrink-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children || (
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      )}

      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="rounded-lg p-2 hover:bg-muted transition-colors"
          aria-label="Close modal"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
