import { useState, useCallback } from "react";

export interface UseModalReturn {
  /**
   * Whether the modal is currently open
   */
  isOpen: boolean;

  /**
   * Open the modal
   */
  open: () => void;

  /**
   * Close the modal
   */
  close: () => void;

  /**
   * Toggle the modal open/closed
   */
  toggle: () => void;
}

/**
 * Hook for managing modal state
 *
 * Provides convenient open/close/toggle functions for controlling a modal.
 *
 * @param defaultOpen - Initial open state (default: false)
 * @returns Modal state and control functions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const modal = useModal();
 *
 *   return (
 *     <>
 *       <Button onClick={modal.open}>Open Modal</Button>
 *       <Modal isOpen={modal.isOpen} onClose={modal.close}>
 *         <ModalHeader title="My Modal" onClose={modal.close} />
 *         <ModalBody>Content here</ModalBody>
 *       </Modal>
 *     </>
 *   );
 * }
 * ```
 */
export function useModal(defaultOpen = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
