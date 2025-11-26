"use client";

import { createContext, useContext, ReactNode } from "react";

/**
 * Context for tracking modal nesting level
 *
 * This allows nested modals to automatically adjust their z-index
 * to appear above parent modals.
 */
const ModalLevelContext = createContext<number>(0);

export interface ModalLevelProviderProps {
  children: ReactNode;
  level?: number;
}

/**
 * Provider for modal nesting level
 *
 * Wrap nested modals with this provider to increment the level.
 *
 * @example
 * ```tsx
 * <Modal isOpen={parentOpen} onClose={closeParent}>
 *   <ModalLevelProvider>
 *     <Modal isOpen={childOpen} onClose={closeChild}>
 *       // This modal will be above the parent
 *     </Modal>
 *   </ModalLevelProvider>
 * </Modal>
 * ```
 */
export function ModalLevelProvider({
  children,
  level,
}: ModalLevelProviderProps) {
  const currentLevel = useContext(ModalLevelContext);
  const nextLevel = level ?? currentLevel + 1;

  return (
    <ModalLevelContext.Provider value={nextLevel}>
      {children}
    </ModalLevelContext.Provider>
  );
}

/**
 * Hook to get the current modal nesting level
 *
 * Used internally by Modal component to calculate z-index.
 * Each level increments z-index by 10.
 *
 * @returns Current nesting level (0 for top-level modals)
 */
export function useModalLevel(): number {
  return useContext(ModalLevelContext);
}
