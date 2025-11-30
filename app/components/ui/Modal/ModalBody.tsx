import { ReactNode } from "react";

export interface ModalBodyProps {
  /**
   * Body content
   */
  children: ReactNode;

  /**
   * Whether to add padding
   * @default true
   */
  padding?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ModalBody component for scrollable modal content
 *
 * @example
 * ```tsx
 * <ModalBody>
 *   <p>Your content here...</p>
 * </ModalBody>
 *
 * // Without padding
 * <ModalBody padding={false}>
 *   <div className="custom-layout">Content</div>
 * </ModalBody>
 * ```
 */
export function ModalBody({
  children,
  padding = true,
  className = "",
}: ModalBodyProps) {
  return (
    <div
      className={[
        "overflow-y-auto flex-1",
        padding && "p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
