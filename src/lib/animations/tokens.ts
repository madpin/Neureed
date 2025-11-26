/**
 * Animation Tokens
 *
 * TypeScript constants derived from design tokens CSS variables.
 * Use these for Framer Motion animations and JavaScript-based animations.
 */

/**
 * Animation durations in milliseconds
 */
export const durations = {
  fast: 150,
  base: 200,
  slow: 300,
  slower: 500,
  slowest: 700,
} as const;

/**
 * Easing functions for animations
 */
export const easings = {
  linear: [0, 0, 1, 1],
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
} as const;

/**
 * Spring configurations for physics-based animations
 */
export const springs = {
  /**
   * Gentle spring - smooth, subtle motion
   */
  gentle: {
    type: "spring" as const,
    stiffness: 120,
    damping: 14,
  },

  /**
   * Default spring - balanced motion
   */
  default: {
    type: "spring" as const,
    stiffness: 180,
    damping: 18,
  },

  /**
   * Bouncy spring - playful, energetic motion
   */
  bouncy: {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
  },

  /**
   * Stiff spring - quick, responsive motion
   */
  stiff: {
    type: "spring" as const,
    stiffness: 400,
    damping: 25,
  },
} as const;

/**
 * Common animation delays in milliseconds
 */
export const delays = {
  none: 0,
  short: 50,
  base: 100,
  long: 200,
} as const;
