import { Variants } from "framer-motion";
import { durations, easings, springs } from "./tokens";

/**
 * Fade in animation variant
 */
export const fadeIn: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: durations.fast / 1000,
      ease: easings.easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: durations.fast / 1000,
      ease: easings.easeIn,
    },
  },
};

/**
 * Slide up animation variant
 */
export const slideUp: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springs.default,
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: {
      duration: durations.fast / 1000,
      ease: easings.easeIn,
    },
  },
};

/**
 * Slide down animation variant
 */
export const slideDown: Variants = {
  initial: {
    opacity: 0,
    y: -10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springs.default,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: durations.fast / 1000,
      ease: easings.easeIn,
    },
  },
};

/**
 * Scale animation variant (good for modals, tooltips)
 */
export const scale: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: durations.fast / 1000,
      ease: easings.easeIn,
    },
  },
};

/**
 * Slide in from left
 */
export const slideInLeft: Variants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: springs.default,
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: durations.fast / 1000,
      ease: easings.easeIn,
    },
  },
};

/**
 * Slide in from right
 */
export const slideInRight: Variants = {
  initial: {
    opacity: 0,
    x: 20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: springs.default,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: durations.fast / 1000,
      ease: easings.easeIn,
    },
  },
};

/**
 * Backdrop fade animation (for modal backdrops)
 */
export const backdropFade: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: durations.base / 1000,
      ease: easings.easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: durations.base / 1000,
      ease: easings.easeIn,
    },
  },
};

/**
 * Pop animation (bouncy scale)
 */
export const pop: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springs.bouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: durations.fast / 1000,
      ease: easings.easeIn,
    },
  },
};

/**
 * Staggered children animation
 * Use with staggerChildren property
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

/**
 * Child item for stagger animations
 */
export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    y: 10,
  },
};
