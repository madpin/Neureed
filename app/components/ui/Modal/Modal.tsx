"use client";

import {
  ReactNode,
  useEffect,
  useRef,
  MouseEvent,
  KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useModalLevel } from "./useModalLevel";
import { backdropFade, scale, useReducedMotion } from "@/lib/animations";

export interface ModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Callback when the modal should close
   */
  onClose: () => void;

  /**
   * Modal content
   */
  children: ReactNode;

  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg" | "xl" | "full";

  /**
   * Whether clicking outside closes the modal
   * @default true
   */
  closeOnOutsideClick?: boolean;

  /**
   * Whether pressing Escape closes the modal
   * @default true
   */
  closeOnEscape?: boolean;

  /**
   * Additional CSS classes for the modal container
   */
  className?: string;

  /**
   * Whether to show close button in header
   * @default true
   */
  showCloseButton?: boolean;

  /**
   * Custom z-index (for nested modals)
   */
  zIndex?: number;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw]",
};

/**
 * Modal component with backdrop and portal rendering
 *
 * Provides a flexible modal dialog with customizable size, close behavior,
 * and support for nested modals via z-index management.
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
 *   <ModalHeader title="Confirm Action" />
 *   <ModalBody>
 *     <p>Are you sure you want to proceed?</p>
 *   </ModalBody>
 *   <ModalFooter>
 *     <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
 *     <Button variant="primary">Confirm</Button>
 *   </ModalFooter>
 * </Modal>
 * ```
 */
export function Modal({
  isOpen,
  onClose,
  children,
  size = "md",
  closeOnOutsideClick = true,
  closeOnEscape = true,
  className = "",
  zIndex,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const level = useModalLevel();
  const modalZIndex = zIndex ?? 1400 + level * 10;
  const backdropZIndex = modalZIndex - 1;
  const prefersReducedMotion = useReducedMotion();

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle click outside
  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50"
            style={{ zIndex: backdropZIndex }}
            onClick={handleBackdropClick}
            aria-hidden="true"
            {...(prefersReducedMotion ? {} : backdropFade)}
          />

          {/* Modal Container */}
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: modalZIndex }}
            onClick={handleBackdropClick}
          >
            <motion.div
              ref={modalRef}
              className={[
                "relative w-full max-h-[90vh] min-h-[60vh] overflow-hidden",
                "rounded-lg border border-border bg-background shadow-xl",
                "flex flex-col",
                sizeClasses[size],
                className,
              ]
                .filter(Boolean)
                .join(" ")}
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              {...(prefersReducedMotion ? {} : scale)}
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Render in portal for proper stacking
  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return null;
}
