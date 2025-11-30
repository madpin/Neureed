"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect if user prefers reduced motion
 *
 * Respects the prefers-reduced-motion media query for accessibility.
 * When true, animations should be disabled or simplified.
 *
 * @returns boolean indicating if user prefers reduced motion
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const prefersReducedMotion = useReducedMotion();
 *
 *   return (
 *     <motion.div
 *       animate={prefersReducedMotion ? {} : { scale: 1.1 }}
 *     >
 *       Content
 *     </motion.div>
 *   );
 * }
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is defined (SSR safety)
    if (typeof window === "undefined") {
      return;
    }

    // Check initial preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    // Fallback for older browsers using deprecated but still supported methods
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * Get animation props that respect reduced motion preference
 *
 * Returns empty object if reduced motion is preferred, otherwise returns the provided props.
 *
 * @param animationProps - Framer Motion animation props
 * @returns Animation props or empty object
 *
 * @example
 * ```tsx
 * function Component() {
 *   const animationProps = useAnimationProps({
 *     initial: { opacity: 0 },
 *     animate: { opacity: 1 },
 *   });
 *
 *   return <motion.div {...animationProps}>Content</motion.div>;
 * }
 * ```
 */
export function useAnimationProps<T extends Record<string, any>>(
  animationProps: T
): T | Record<string, never> {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? {} : animationProps;
}
