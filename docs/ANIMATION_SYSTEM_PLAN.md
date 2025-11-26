# NeuReed Animation System Plan

**Version:** 1.0
**Date:** 2025-11-25
**Status:** Architectural Design Phase

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Audit](#current-state-audit)
3. [Animation Philosophy](#animation-philosophy)
4. [Animation Design Tokens](#animation-design-tokens)
5. [Core Animation Utilities](#core-animation-utilities)
6. [Component Animation Patterns](#component-animation-patterns)
7. [Performance Guidelines](#performance-guidelines)
8. [Accessibility Standards](#accessibility-standards)
9. [Implementation Roadmap](#implementation-roadmap)
10. [References](#references)

---

## Executive Summary

This document outlines a comprehensive animation system for NeuReed's UI component library. The system is designed to provide consistent, performant, and accessible motion throughout the application while maintaining the existing design system's integrity.

**Key Goals:**
- Establish consistent animation patterns across all components
- Improve user experience through meaningful motion
- Maintain 60fps performance on all devices
- Ensure full accessibility compliance (prefers-reduced-motion)
- Create reusable animation utilities and hooks
- Minimize bundle size impact

**Technology Stack:**
- Framer Motion v12.23.24 (already installed)
- React 18+ (Server/Client component support)
- Next.js 16 (App Router)
- Tailwind CSS v4 (utility-first styling)

---

## Current State Audit

### Existing Animation Usage

#### 1. **Framer Motion Integration**
Currently used in **12 files**, primarily in landing page components:
- `HeroSection.tsx` - Staggered text/image animations on page load
- `FeaturesSection.tsx` - Scroll-triggered feature card animations
- `FAQSection.tsx` - Accordion expand/collapse animations
- `ScreenshotsGallery.tsx` - Carousel with embla-carousel-react
- `CTASection.tsx`, `TechnicalSection.tsx`, `ComparisonTable.tsx`, `RSSEducationSection.tsx` - Various scroll animations

**Pattern Observations:**
```typescript
// Common pattern found in landing pages
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: index * 0.1 }}
>
```

**Issues Identified:**
- No standardized animation values (durations, easings, delays)
- Hardcoded animation parameters throughout codebase
- Inconsistent delay multipliers (0.05s, 0.1s, 0.2s)
- No centralized animation configuration
- Missing accessibility considerations (no prefers-reduced-motion checks)

#### 2. **CSS-Based Animations**
Found in Tailwind classes across 20+ components:
- `animate-spin` - Loading spinners (LoadingSpinner.tsx, Button.tsx, NotificationBell.tsx)
- `animate-pulse` - Background blobs, notification badge, loading skeletons
- `animate-bounce` - Notification badge count
- `transition-*` - Hover states, color changes, transforms
- `duration-*` - Custom transition durations (200ms, 300ms)

**Pattern Observations:**
```typescript
// Common CSS transition patterns
className="transition-colors duration-200 hover:bg-primary"
className="transition-all hover:shadow-xl hover:scale-105"
className="transition-opacity duration-200"
```

**Issues Identified:**
- Inconsistent duration values (200ms, 300ms, 500ms, 700ms)
- Some components use `transition-all` (performance concern)
- No standardized easing functions
- Mixed usage of Tailwind utilities and inline styles

#### 3. **Interactive State Animations**
- **Modal backdrop fade** - 200ms opacity transition
- **Tooltip fade-in** - Custom `animate-fade-in` class (not defined in audit)
- **Dropdown menus** - Height-based animations (max-h-0 to max-h-96)
- **Notification bell** - Pulse animation on unread count
- **Card hover effects** - Scale, shadow, gradient opacity changes

#### 4. **Drag-and-Drop Animations**
Using `@dnd-kit/core` in:
- `DraggableOrderEditor.tsx` - Section reordering
- `CategoryList.tsx` - Feed/category management

**Note:** DndKit provides its own animation layer, requires integration consideration.

#### 5. **Missing Animation Opportunities**
Components that would benefit from animations but currently lack them:
- Article card selection/deselection
- Feed list expand/collapse
- Toast notifications (using Sonner library)
- Page transitions between routes
- Search result appearance
- Empty state illustrations
- Error state feedback
- Data loading states (beyond spinners)
- Form validation feedback
- List item additions/removals

---

## Animation Philosophy

### Design Principles

#### 1. **Purposeful Motion**
Every animation must serve one of these purposes:
- **Feedback:** Acknowledge user actions (button clicks, form submissions)
- **Orientation:** Help users understand spatial relationships (modal entry/exit, panel sliding)
- **Context:** Show state changes and relationships (list reordering, data updates)
- **Delight:** Add polish without distraction (subtle micro-interactions)

**Anti-patterns to avoid:**
- Animation for its own sake
- Overly complex or long animations that delay interactions
- Competing animations that create visual chaos
- Animations that distract from content

#### 2. **Performance First**
- Animate only GPU-accelerated properties: `transform` and `opacity`
- Avoid animating `width`, `height`, `top`, `left` (use `scale` and `translate` instead)
- Use `will-change` sparingly and only during active animations
- Prefer CSS transitions for simple state changes
- Use Framer Motion for complex orchestrations and gestures

#### 3. **Consistency & Hierarchy**
- **Fast animations** (150-200ms): Micro-interactions, hovers, focus states
- **Medium animations** (250-350ms): Component state changes, tooltips, dropdowns
- **Slow animations** (400-600ms): Page transitions, modal entry/exit, major layout shifts
- **Stagger delays** should be proportional to animation duration (typically 10-15%)

#### 4. **Accessibility First**
- All animations must respect `prefers-reduced-motion` media query
- Reduced motion mode should disable decorative animations
- Functional animations (e.g., focus indicators) should remain but be instant
- Provide alternative feedback mechanisms (color, text, icons)

### Motion Design Language

**Core Motion Attributes:**

1. **Easing Functions**
   - **Ease-out:** Most common, for entering elements (decelerating)
   - **Ease-in:** For exiting elements (accelerating away)
   - **Ease-in-out:** For elements moving within the viewport
   - **Spring:** For natural, physics-based motion (dragging, interactive elements)

2. **Directionality**
   - **Vertical:** Content flows (articles, feeds, notifications)
   - **Horizontal:** Navigation transitions, carousels
   - **Scale:** Emphasis and de-emphasis (modals, popups)
   - **Fade:** Overlays, tooltips, subtle state changes

3. **Orchestration**
   - **Sequential:** One after another (onboarding, tutorials)
   - **Staggered:** Offset timing (list items, grid cards)
   - **Parallel:** Simultaneous (related elements)

---

## Animation Design Tokens

### Token Structure

Create a centralized animation token system in `/app/styles/animation-tokens.css`:

```css
/* animation-tokens.css */

/* ============================================
   ANIMATION DESIGN TOKENS
   ============================================ */

:root {
  /* === DURATIONS === */

  /* Micro-interactions (instant feedback) */
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-quick: 200ms;

  /* Standard interactions */
  --duration-normal: 300ms;
  --duration-moderate: 400ms;

  /* Complex transitions */
  --duration-slow: 500ms;
  --duration-slower: 700ms;
  --duration-slowest: 1000ms;

  /* === EASING FUNCTIONS === */

  /* Standard easings */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* Custom easings (Material Design inspired) */
  --ease-emphasized: cubic-bezier(0.4, 0, 0.6, 1);
  --ease-emphasized-decelerate: cubic-bezier(0.05, 0.7, 0.1, 1);
  --ease-emphasized-accelerate: cubic-bezier(0.3, 0, 0.8, 0.15);

  /* Bouncy/Spring effects */
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6);

  /* === DELAYS === */

  --delay-none: 0ms;
  --delay-short: 50ms;
  --delay-medium: 100ms;
  --delay-long: 200ms;

  /* Stagger multipliers (for sequential animations) */
  --stagger-small: 50ms;
  --stagger-medium: 100ms;
  --stagger-large: 150ms;

  /* === SPRING PHYSICS (for Framer Motion) === */

  /* Gentle spring (smooth, minimal overshoot) */
  --spring-gentle-stiffness: 200;
  --spring-gentle-damping: 20;
  --spring-gentle-mass: 1;

  /* Standard spring (balanced) */
  --spring-standard-stiffness: 300;
  --spring-standard-damping: 30;
  --spring-standard-mass: 1;

  /* Bouncy spring (playful overshoot) */
  --spring-bouncy-stiffness: 400;
  --spring-bouncy-damping: 15;
  --spring-bouncy-mass: 0.8;

  /* Snappy spring (quick, minimal bounce) */
  --spring-snappy-stiffness: 500;
  --spring-snappy-damping: 40;
  --spring-snappy-mass: 0.5;

  /* === KEYFRAME ANIMATIONS === */

  /* Fade animations */
  --fade-in: fadeIn var(--duration-normal) var(--ease-out);
  --fade-out: fadeOut var(--duration-normal) var(--ease-in);

  /* Slide animations */
  --slide-up: slideUp var(--duration-normal) var(--ease-out);
  --slide-down: slideDown var(--duration-normal) var(--ease-out);
  --slide-left: slideLeft var(--duration-normal) var(--ease-out);
  --slide-right: slideRight var(--duration-normal) var(--ease-out);

  /* Scale animations */
  --scale-in: scaleIn var(--duration-normal) var(--ease-out);
  --scale-out: scaleOut var(--duration-normal) var(--ease-in);

  /* Z-INDEX LAYERS (for stacking context) */
  --z-base: 0;
  --z-dropdown: 1000;
  --z-sticky: 1100;
  --z-modal-backdrop: 1400;
  --z-modal: 1500;
  --z-popover: 1600;
  --z-tooltip: 1700;
  --z-notification: 1800;
}

/* === PREFERS-REDUCED-MOTION === */

@media (prefers-reduced-motion: reduce) {
  :root {
    /* Override all durations to be instant or very fast */
    --duration-instant: 0ms;
    --duration-fast: 0ms;
    --duration-quick: 0ms;
    --duration-normal: 50ms; /* Keep minimal for state changes */
    --duration-moderate: 50ms;
    --duration-slow: 50ms;
    --duration-slower: 50ms;
    --duration-slowest: 50ms;

    /* Disable stagger delays */
    --stagger-small: 0ms;
    --stagger-medium: 0ms;
    --stagger-large: 0ms;
  }

  /* Disable complex animations */
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* === KEYFRAME DEFINITIONS === */

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideLeft {
  from {
    transform: translateX(10px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideRight {
  from {
    transform: translateX(-10px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes scaleOut {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.95);
    opacity: 0;
  }
}

/* Existing Tailwind animations (to be deprecated) */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}
```

### JavaScript/TypeScript Token Access

Create `/app/lib/animation/tokens.ts`:

```typescript
/**
 * Animation Design Tokens
 *
 * Centralized animation values that match animation-tokens.css.
 * Use these constants for Framer Motion and programmatic animations.
 */

export const DURATIONS = {
  instant: 100,
  fast: 150,
  quick: 200,
  normal: 300,
  moderate: 400,
  slow: 500,
  slower: 700,
  slowest: 1000,
} as const;

export const EASINGS = {
  linear: [0, 0, 1, 1],
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  emphasized: [0.4, 0, 0.6, 1],
  emphasizedDecelerate: [0.05, 0.7, 0.1, 1],
  emphasizedAccelerate: [0.3, 0, 0.8, 0.15],
  bounce: [0.68, -0.55, 0.265, 1.55],
  elastic: [0.68, -0.6, 0.32, 1.6],
} as const;

export const DELAYS = {
  none: 0,
  short: 50,
  medium: 100,
  long: 200,
} as const;

export const STAGGER = {
  small: 50,
  medium: 100,
  large: 150,
} as const;

export const SPRING = {
  gentle: { stiffness: 200, damping: 20, mass: 1 },
  standard: { stiffness: 300, damping: 30, mass: 1 },
  bouncy: { stiffness: 400, damping: 15, mass: 0.8 },
  snappy: { stiffness: 500, damping: 40, mass: 0.5 },
} as const;

/**
 * Type-safe animation token access
 */
export type Duration = keyof typeof DURATIONS;
export type Easing = keyof typeof EASINGS;
export type Delay = keyof typeof DELAYS;
export type Stagger = keyof typeof STAGGER;
export type SpringPreset = keyof typeof SPRING;

/**
 * Helper to get duration in ms
 */
export function getDuration(key: Duration): number {
  return DURATIONS[key];
}

/**
 * Helper to get easing as cubic-bezier array
 */
export function getEasing(key: Easing): number[] {
  return EASINGS[key] as unknown as number[];
}

/**
 * Helper to get spring config
 */
export function getSpring(preset: SpringPreset) {
  return SPRING[preset];
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get adjusted duration based on user preference
 */
export function getAccessibleDuration(key: Duration): number {
  if (prefersReducedMotion()) {
    // Return instant for reduced motion
    return key === 'normal' || key === 'moderate' ? 50 : 0;
  }
  return DURATIONS[key];
}
```

---

## Core Animation Utilities

### 1. **Motion Variants Factory**

Create `/app/lib/animation/variants.ts`:

```typescript
/**
 * Motion Variants Factory
 *
 * Pre-configured animation variants for common patterns.
 * Compatible with Framer Motion's variant system.
 */

import { Variants } from 'framer-motion';
import { DURATIONS, EASINGS, getAccessibleDuration, getEasing, prefersReducedMotion } from './tokens';

/**
 * Fade In/Out Variants
 */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: getAccessibleDuration('normal') / 1000,
      ease: getEasing('easeOut'),
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: getAccessibleDuration('normal') / 1000,
      ease: getEasing('easeIn'),
    },
  },
};

/**
 * Slide Up Variants
 */
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: getAccessibleDuration('normal') / 1000,
      ease: getEasing('easeOut'),
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: getAccessibleDuration('normal') / 1000,
      ease: getEasing('easeIn'),
    },
  },
};

/**
 * Scale Variants (for modals, popovers)
 */
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: getAccessibleDuration('normal') / 1000,
      ease: getEasing('emphasizedDecelerate'),
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: getAccessibleDuration('quick') / 1000,
      ease: getEasing('emphasizedAccelerate'),
    },
  },
};

/**
 * List Item Variants (with stagger support)
 */
export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: (custom: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: getAccessibleDuration('normal') / 1000,
      ease: getEasing('easeOut'),
      delay: prefersReducedMotion() ? 0 : custom * 0.05,
    },
  }),
};

/**
 * Container Variants (for stagger children)
 */
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: prefersReducedMotion() ? 0 : 0.1,
      delayChildren: prefersReducedMotion() ? 0 : 0.1,
    },
  },
};

/**
 * Card Hover Variants
 */
export const cardHoverVariants: Variants = {
  rest: { scale: 1, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' },
  hover: {
    scale: prefersReducedMotion() ? 1 : 1.02,
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    transition: {
      duration: getAccessibleDuration('quick') / 1000,
      ease: getEasing('easeOut'),
    },
  },
};

/**
 * Notification Badge Variants (bounce + pulse)
 */
export const badgeVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: prefersReducedMotion() ? 'tween' : 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
};

/**
 * Drawer/Sheet Variants (slide from side)
 */
export function drawerVariants(side: 'left' | 'right' | 'top' | 'bottom' = 'right'): Variants {
  const axis = side === 'left' || side === 'right' ? 'x' : 'y';
  const direction = side === 'right' || side === 'bottom' ? 1 : -1;
  const distance = 100; // percentage

  return {
    hidden: { [axis]: `${direction * distance}%` },
    visible: {
      [axis]: 0,
      transition: {
        duration: getAccessibleDuration('moderate') / 1000,
        ease: getEasing('emphasizedDecelerate'),
      },
    },
    exit: {
      [axis]: `${direction * distance}%`,
      transition: {
        duration: getAccessibleDuration('normal') / 1000,
        ease: getEasing('emphasizedAccelerate'),
      },
    },
  };
}

/**
 * Accordion Variants
 */
export const accordionVariants: Variants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: {
        duration: getAccessibleDuration('normal') / 1000,
        ease: getEasing('easeInOut'),
      },
      opacity: {
        duration: getAccessibleDuration('quick') / 1000,
        ease: getEasing('easeOut'),
      },
    },
  },
};

/**
 * Tooltip Variants
 */
export const tooltipVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 5 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: getAccessibleDuration('fast') / 1000,
      ease: getEasing('easeOut'),
    },
  },
};
```

### 2. **Custom Animation Hooks**

Create `/app/lib/animation/hooks.ts`:

```typescript
/**
 * Custom Animation Hooks
 *
 * Reusable hooks for common animation patterns.
 */

import { useEffect, useState } from 'react';
import { useAnimation, AnimationControls } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { prefersReducedMotion } from './tokens';

/**
 * Animate elements when they enter the viewport
 *
 * @example
 * const controls = useScrollAnimation();
 * <motion.div animate={controls} initial="hidden" variants={slideUpVariants} />
 */
export function useScrollAnimation(threshold = 0.1): AnimationControls {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold, triggerOnce: true });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return controls;
}

/**
 * Stagger animation for list items
 *
 * @example
 * const { ref, itemProps } = useStaggerAnimation();
 * <div ref={ref}>
 *   {items.map((item, i) => <motion.div {...itemProps(i)} />)}
 * </div>
 */
export function useStaggerAnimation(staggerDelay = 0.1) {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const itemProps = (index: number) => ({
    custom: prefersReducedMotion() ? 0 : index,
    initial: 'hidden',
    animate: controls,
  });

  return { ref, controls, itemProps };
}

/**
 * Check if user prefers reduced motion (reactive hook)
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReduced;
}

/**
 * Safe animation controls that respect reduced motion
 */
export function useSafeAnimation() {
  const controls = useAnimation();
  const prefersReduced = usePrefersReducedMotion();

  const safeAnimate = (variant: string) => {
    if (prefersReduced) {
      controls.set(variant);
    } else {
      controls.start(variant);
    }
  };

  return { controls, animate: safeAnimate, prefersReduced };
}

/**
 * Hover animation with safe defaults
 */
export function useHoverAnimation() {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReduced = usePrefersReducedMotion();

  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    animate: prefersReduced ? {} : (isHovered ? 'hover' : 'rest'),
  };

  return { isHovered, hoverProps };
}

/**
 * Mount/unmount animation for conditional rendering
 */
export function useMountAnimation(isVisible: boolean) {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    }
  }, [isVisible]);

  const onAnimationComplete = () => {
    if (!isVisible) {
      setShouldRender(false);
    }
  };

  return { shouldRender, onAnimationComplete };
}
```

### 3. **Animation Higher-Order Component**

Create `/app/lib/animation/AnimatedComponent.tsx`:

```typescript
/**
 * Animated Component Wrapper
 *
 * HOC that adds animation capabilities to any component.
 */

import { motion, MotionProps } from 'framer-motion';
import { ComponentType, forwardRef } from 'react';
import { fadeVariants, slideUpVariants, scaleVariants } from './variants';

type AnimationType = 'fade' | 'slideUp' | 'scale' | 'none';

interface AnimatedComponentProps extends MotionProps {
  animationType?: AnimationType;
  delay?: number;
}

const variantMap = {
  fade: fadeVariants,
  slideUp: slideUpVariants,
  scale: scaleVariants,
  none: {},
};

/**
 * Wrap any component with animation capabilities
 *
 * @example
 * const AnimatedCard = withAnimation(Card, 'fade');
 * <AnimatedCard delay={0.2}>Content</AnimatedCard>
 */
export function withAnimation<P extends object>(
  Component: ComponentType<P>,
  defaultAnimation: AnimationType = 'fade'
) {
  return forwardRef<HTMLElement, P & AnimatedComponentProps>(
    ({ animationType = defaultAnimation, delay = 0, ...props }, ref) => {
      const MotionComponent = motion(Component as any);
      const variants = variantMap[animationType];

      if (animationType === 'none') {
        return <Component {...(props as P)} ref={ref} />;
      }

      return (
        <MotionComponent
          ref={ref}
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ delay }}
          {...props}
        />
      );
    }
  );
}
```

---

## Component Animation Patterns

### Button Component

**Current State:** Basic CSS transitions, loading spinner
**Enhancement Plan:**

```typescript
// app/components/ui/Button.tsx (enhanced)
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/app/lib/animation/hooks';
import { DURATIONS, EASINGS } from '@/app/lib/animation/tokens';

export function Button({ ... }) {
  const prefersReduced = usePrefersReducedMotion();

  const buttonVariants = {
    rest: { scale: 1 },
    hover: {
      scale: prefersReduced ? 1 : 1.02,
      transition: {
        duration: DURATIONS.quick / 1000,
        ease: EASINGS.easeOut,
      }
    },
    tap: {
      scale: prefersReduced ? 1 : 0.98,
      transition: {
        duration: DURATIONS.fast / 1000,
      }
    },
  };

  return (
    <motion.button
      variants={buttonVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {/* Button content */}
    </motion.button>
  );
}
```

**Animation Features:**
- Subtle scale on hover (2% increase)
- Tap feedback (2% decrease)
- Respects reduced motion preference
- Loading state with spinner rotation

---

### Modal Component

**Current State:** Fade-in backdrop, no content animation
**Enhancement Plan:**

```typescript
// app/components/ui/Modal/Modal.tsx (enhanced)
import { motion, AnimatePresence } from 'framer-motion';
import { scaleVariants } from '@/app/lib/animation/variants';
import { getAccessibleDuration } from '@/app/lib/animation/tokens';

export function Modal({ isOpen, onClose, children, ... }) {
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: getAccessibleDuration('normal') / 1000 }
    },
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && createPortal(
        <>
          {/* Animated Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-black/50"
            onClick={handleBackdropClick}
          />

          {/* Animated Modal Content */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              variants={scaleVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        </>,
        document.body
      )}
    </AnimatePresence>
  );
}
```

**Animation Features:**
- Backdrop fade-in/out
- Modal scales from 95% to 100%
- Exit animation before unmounting
- Smooth timing with emphasized easing

---

### Article Card Component

**Current State:** CSS transitions for hover states only
**Enhancement Plan:**

```typescript
// app/components/articles/ArticleCard.tsx (enhanced)
import { motion } from 'framer-motion';
import { cardHoverVariants } from '@/app/lib/animation/variants';
import { usePrefersReducedMotion } from '@/app/lib/animation/hooks';

export const ArticleCard = React.memo(({ article, isSelected, ... }) => {
  const prefersReduced = usePrefersReducedMotion();

  // Selection animation
  const selectionVariants = {
    unselected: {
      borderColor: 'var(--border)',
      borderWidth: '2px',
    },
    selected: {
      borderColor: 'var(--primary)',
      borderWidth: '4px',
      boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.3)',
      transition: {
        duration: prefersReduced ? 0 : 0.2,
        ease: 'easeOut',
      }
    },
  };

  return (
    <motion.article
      variants={cardHoverVariants}
      initial="rest"
      whileHover="hover"
      animate={isSelected ? 'selected' : 'unselected'}
      layout // Enable layout animations for smooth transitions
      className="article-card"
    >
      {/* Card content */}
    </motion.article>
  );
});
```

**Animation Features:**
- Hover effect with subtle scale and shadow
- Selection state with border and ring animation
- Layout animation for position changes (when sorting/filtering)
- Read state opacity transition

---

### Dropdown/Accordion Component

**Current State:** CSS max-height transition
**Enhancement Plan:**

```typescript
// app/components/ui/Dropdown.tsx (new)
import { motion, AnimatePresence } from 'framer-motion';
import { accordionVariants } from '@/app/lib/animation/variants';

export function Dropdown({ isOpen, children, ... }) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          variants={accordionVariants}
          initial="collapsed"
          animate="expanded"
          exit="collapsed"
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Animation Features:**
- Smooth height animation (auto-calculated)
- Synchronized opacity fade
- Proper exit animation
- No content reflow

---

### Notification Toast

**Current State:** Using Sonner library (external)
**Enhancement Plan:**

Configure Sonner with custom animation settings:

```typescript
// app/layout.tsx or provider
import { Toaster } from 'sonner';
import { DURATIONS } from '@/app/lib/animation/tokens';

<Toaster
  position="top-right"
  duration={4000}
  toastOptions={{
    style: {
      animation: `slideLeft ${DURATIONS.normal}ms var(--ease-emphasized-decelerate)`,
    },
  }}
/>
```

**Animation Features:**
- Slide in from right
- Stack animation for multiple toasts
- Auto-dismiss with fade-out
- Progress bar animation

---

### Loading States

**Current State:** Simple spinner with animate-spin
**Enhancement Plan:**

```typescript
// app/components/layout/LoadingSpinner.tsx (enhanced)
import { motion } from 'framer-motion';
import { SPRING } from '@/app/lib/animation/tokens';

export function LoadingSpinner({ size = 'md', text, ... }) {
  const spinTransition = {
    duration: 1,
    ease: 'linear',
    repeat: Infinity,
  };

  const dotVariants = {
    start: { scale: 0.8, opacity: 0.5 },
    end: { scale: 1.2, opacity: 1 },
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Spinner */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={spinTransition}
        className="spinner-ring"
      />

      {/* Optional: Pulsing dots for variety */}
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            variants={dotVariants}
            animate="end"
            initial="start"
            transition={{
              repeat: Infinity,
              repeatType: 'reverse',
              duration: 0.6,
              delay: i * 0.2,
            }}
            className="h-2 w-2 rounded-full bg-primary"
          />
        ))}
      </div>

      {text && <p className="text-sm text-foreground/70">{text}</p>}
    </div>
  );
}
```

**Loading Pattern Options:**
1. **Spinner** - Rotating circle (current)
2. **Pulsing Dots** - Three dots with stagger
3. **Skeleton** - Content placeholder with shimmer
4. **Progress Bar** - For determinate operations

---

### List/Grid Animations

**Enhancement Plan:**

```typescript
// app/components/articles/ArticleList.tsx (enhanced)
import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants, listItemVariants } from '@/app/lib/animation/variants';

export function ArticleList({ articles, ... }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="article-list"
    >
      <AnimatePresence mode="popLayout">
        {articles.map((article, index) => (
          <motion.div
            key={article.id}
            variants={listItemVariants}
            custom={index}
            layout // Smooth reordering
            exit={{ opacity: 0, x: -20 }}
          >
            <ArticleCard article={article} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
```

**Animation Features:**
- Staggered entrance (50ms delay per item)
- Layout animation for reordering/filtering
- Exit animation when items are removed
- Smooth transitions between states

---

### Page Transitions

**Enhancement Plan:**

```typescript
// app/components/layout/PageTransition.tsx (new)
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { fadeVariants } from '@/app/lib/animation/variants';

export function PageTransition({ children }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={fadeVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="page-container"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

**Note:** Next.js App Router requires special handling for page transitions. Use `initial={false}` to prevent animation on first load.

---

### Drag-and-Drop Integration

**Current State:** Using @dnd-kit/core
**Enhancement Plan:**

The existing DndKit library has built-in animations. Ensure consistency:

```typescript
// app/components/preferences/DraggableOrderEditor.tsx (enhanced)
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { motion } from 'framer-motion';

export function DraggableOrderEditor({ ... }) {
  return (
    <DndContext ...>
      {/* Animated drag overlay */}
      <DragOverlay>
        {activeId ? (
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <SortableSectionItem id={activeId} isDragging />
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
```

---

## Performance Guidelines

### 1. **GPU Acceleration**

**Always animate these properties (GPU-accelerated):**
- `transform` (translate, rotate, scale)
- `opacity`
- `filter` (use sparingly)

**Never animate these properties (CPU-bound, causes reflow):**
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `border-width`

**Example - BAD:**
```css
.element {
  transition: width 300ms;
  width: 100px;
}
.element:hover {
  width: 200px; /* Causes reflow! */
}
```

**Example - GOOD:**
```css
.element {
  transition: transform 300ms;
  transform: scaleX(1);
}
.element:hover {
  transform: scaleX(2); /* GPU-accelerated */
}
```

### 2. **Layout Animations**

Framer Motion's `layout` prop is powerful but expensive. Use strategically:

```typescript
// Only use layout when position/size changes
<motion.div layout="position"> {/* Only animate position */}
<motion.div layout="size">     {/* Only animate size */}
<motion.div layout>            {/* Animate both - expensive! */}
```

### 3. **Animation Budget**

Limit simultaneous animations:
- **Max 5-10 elements** animating at once
- **Stagger large lists** instead of animating all items simultaneously
- **Use virtualization** for long lists (react-window + motion)

### 4. **Will-Change Optimization**

```typescript
// Add will-change during animation only
<motion.div
  onAnimationStart={() => element.style.willChange = 'transform, opacity'}
  onAnimationComplete={() => element.style.willChange = 'auto'}
/>
```

### 5. **Bundle Size Management**

Framer Motion tree-shaking strategy:

```typescript
// Import only what you need
import { motion } from 'framer-motion'; // Base
import { AnimatePresence } from 'framer-motion'; // +3KB
import { useAnimation } from 'framer-motion'; // +2KB

// Avoid importing entire library
// import * as motion from 'framer-motion'; // BAD
```

**Current bundle impact:** ~35KB gzipped (framer-motion v12)

### 6. **React Query Integration**

Animate data fetching states:

```typescript
const { data, isLoading, isError } = useArticles();

<AnimatePresence mode="wait">
  {isLoading && <LoadingSpinner key="loading" />}
  {isError && <ErrorState key="error" />}
  {data && <ArticleList key="data" articles={data} />}
</AnimatePresence>
```

### 7. **Memoization**

Prevent unnecessary re-renders:

```typescript
// Memoize animation variants
const variants = useMemo(() => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}), []);

// Memoize animated components
const AnimatedCard = React.memo(motion(Card));
```

---

## Accessibility Standards

### 1. **Prefers-Reduced-Motion**

**Implementation Strategy:**

```typescript
// Global CSS override (animation-tokens.css)
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```typescript
// JavaScript hook (tokens.ts)
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

**Component Usage:**

```typescript
function MyComponent() {
  const prefersReduced = usePrefersReducedMotion();

  return (
    <motion.div
      animate={{
        x: prefersReduced ? 0 : 100, // No movement if reduced
        opacity: 1, // Always animate opacity (acceptable)
      }}
    />
  );
}
```

### 2. **Animation Categories**

**Always animate (even in reduced motion):**
- Focus indicators
- State changes (selected, checked, etc.)
- Error states
- Instantaneous opacity changes

**Disable in reduced motion:**
- Decorative animations (background blobs, particle effects)
- Page transitions
- Parallax effects
- Automatic animations (carousels, slideshows)
- Hover effects (scale, movement)

### 3. **Focus Management**

Ensure focus is visible during animations:

```typescript
<motion.button
  whileFocus={{
    scale: 1.05,
    boxShadow: '0 0 0 3px var(--primary)',
  }}
  transition={{ duration: prefersReduced ? 0 : 0.2 }}
>
```

### 4. **Screen Reader Compatibility**

Animations should not interfere with assistive technology:

```typescript
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  aria-live="polite" // Announce content changes
  aria-busy={isAnimating} // Indicate loading state
>
```

### 5. **Keyboard Navigation**

Animated components must remain keyboard-accessible:

```typescript
<motion.div
  tabIndex={0}
  onKeyDown={handleKeyPress}
  whileFocus={{ scale: 1.05 }}
>
```

### 6. **Testing Checklist**

- [ ] Test with `prefers-reduced-motion: reduce` enabled
- [ ] Verify keyboard navigation works during animations
- [ ] Check screen reader announcements
- [ ] Ensure focus indicators are visible
- [ ] Test on low-end devices (animations should degrade gracefully)
- [ ] Verify no animation blocking user interaction

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goals:** Establish animation system infrastructure

**Tasks:**
1. Create animation token system
   - [ ] Add `/app/styles/animation-tokens.css`
   - [ ] Add `/app/lib/animation/tokens.ts`
   - [ ] Import tokens in `globals.css`
   - [ ] Update existing CSS durations to use tokens

2. Create core utilities
   - [ ] Add `/app/lib/animation/variants.ts`
   - [ ] Add `/app/lib/animation/hooks.ts`
   - [ ] Add `/app/lib/animation/AnimatedComponent.tsx`
   - [ ] Add `/app/lib/animation/index.ts` (barrel export)

3. Implement accessibility
   - [ ] Add global reduced-motion CSS rules
   - [ ] Create `usePrefersReducedMotion()` hook
   - [ ] Test reduced-motion behavior
   - [ ] Document accessibility guidelines

**Deliverables:**
- Complete animation token system
- Reusable animation utilities
- Accessibility compliance

---

### Phase 2: Core Components (Week 3-4)

**Goals:** Enhance existing UI component library

**Priority Components:**
1. **Button** - Hover, tap, loading states
2. **Modal** - Enter/exit animations
3. **Tooltip** - Fade-in with positioning
4. **Dropdown** - Expand/collapse
5. **Loading States** - Spinner, skeleton, progress

**Tasks:**
- [ ] Update Button component with motion
- [ ] Enhance Modal with scale animation
- [ ] Add Tooltip fade/slide animation
- [ ] Create Dropdown accordion animation
- [ ] Enhance LoadingSpinner with variants
- [ ] Create LoadingSkeleton with shimmer effect
- [ ] Update Storybook stories for each component
- [ ] Write animation tests

**Deliverables:**
- 5 animated UI components
- Updated Storybook documentation
- Unit tests for animation behavior

---

### Phase 3: Feature Components (Week 5-6)

**Goals:** Animate application-specific components

**Priority Components:**
1. **ArticleCard** - Hover, selection, layout transitions
2. **ArticleList** - Staggered entrance, exit animations
3. **NotificationBell** - Badge bounce, dropdown slide
4. **FeedList/CategoryList** - Expand/collapse, drag feedback
5. **EmptyState** - Fade-in illustrations

**Tasks:**
- [ ] Enhance ArticleCard with layout animations
- [ ] Add stagger to ArticleList
- [ ] Animate NotificationBell dropdown
- [ ] Add smooth expand/collapse to FeedList
- [ ] Create animated EmptyState component
- [ ] Test performance with large lists
- [ ] Optimize animation performance

**Deliverables:**
- 5 animated feature components
- Performance benchmarks
- Optimization recommendations

---

### Phase 4: Advanced Patterns (Week 7-8)

**Goals:** Implement complex animations and transitions

**Features:**
1. **Page Transitions** - Fade between routes
2. **Drag-and-Drop Feedback** - Visual cues for DndKit
3. **Toast Notifications** - Custom Sonner animations
4. **Search Results** - Staggered appearance
5. **Form Validation** - Error shake, success pulse

**Tasks:**
- [ ] Create PageTransition wrapper
- [ ] Enhance drag-and-drop overlays
- [ ] Configure Sonner with custom animations
- [ ] Add search result animations
- [ ] Create form validation animations
- [ ] Add micro-interactions (button ripple, etc.)
- [ ] Performance audit and optimization

**Deliverables:**
- Complete page transition system
- Enhanced drag-and-drop UX
- Form animation patterns
- Performance report

---

### Phase 5: Polish & Optimization (Week 9-10)

**Goals:** Refine animations and optimize performance

**Tasks:**
1. **Animation Audit**
   - [ ] Review all animations for consistency
   - [ ] Test on various devices/browsers
   - [ ] Measure performance impact
   - [ ] Identify optimization opportunities

2. **Performance Optimization**
   - [ ] Implement lazy loading for heavy animations
   - [ ] Add animation throttling for low-end devices
   - [ ] Optimize bundle size (tree-shaking)
   - [ ] Create performance monitoring

3. **Documentation**
   - [ ] Write animation usage guide
   - [ ] Create animation showcase page
   - [ ] Document best practices
   - [ ] Add migration guide for existing components

4. **Developer Experience**
   - [ ] Create animation linting rules
   - [ ] Add animation debugging tools
   - [ ] Create animation playground (Storybook)
   - [ ] Provide code snippets/templates

**Deliverables:**
- Complete animation system documentation
- Performance optimization report
- Developer tooling
- Migration guide

---

### Success Metrics

**Performance:**
- [ ] 60fps on all animations
- [ ] <50ms TTI (Time to Interactive) impact
- [ ] <10KB bundle size increase
- [ ] No layout thrashing (0 forced reflows)

**Accessibility:**
- [ ] 100% compliance with WCAG 2.1 Level AA
- [ ] Reduced motion support in all components
- [ ] Keyboard navigation maintained
- [ ] Screen reader compatibility

**User Experience:**
- [ ] Consistent animation timing across app
- [ ] Smooth transitions between states
- [ ] Clear feedback for all interactions
- [ ] No jarring or distracting animations

**Developer Experience:**
- [ ] <5 min to add animation to new component
- [ ] Comprehensive documentation
- [ ] Reusable utilities for common patterns
- [ ] Clear error messages for misuse

---

## References

### Official Documentation
- [Framer Motion Documentation](https://motion.dev/)
- [Motion for React - Getting Started](https://motion.dev/docs/react)
- [React Motion Component API](https://www.framer.com/motion/component/)
- [Framer Motion on npm](https://www.npmjs.com/package/framer-motion)

### Best Practices & Guides
- [A Beginner's Guide to Framer Motion in React & Next.js - Medium](https://medium.com/@cirilptomass/a-beginners-guide-to-framer-motion-in-react-next-js-2378c7c1b20d)
- [How to Use Framer Motion for Animations in Next.js - StaticMania](https://staticmania.com/blog/how-to-use-framer-motion-for-animations-in-next-js)
- [Next.js Page Transitions with Framer Motion - DEV Community](https://dev.to/joseph42a/nextjs-page-transition-with-framer-motion-33dg)
- [Animating Next.js page transitions - DEV Community](https://dev.to/jameswallis/animating-next-js-page-transitions-with-framer-motion-1g9j)
- [Next.js: Page Transitions with Framer Motion - Max Schmitt](https://maxschmitt.me/posts/nextjs-page-transitions-framer-motion)
- [Advanced page transitions with Next.js and Framer Motion - LogRocket](https://blog.logrocket.com/advanced-page-transitions-next-js-framer-motion/)

### Additional Resources
- [Web Animation Performance Guide - web.dev](https://web.dev/animations/)
- [prefers-reduced-motion - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Material Design Motion Guidelines](https://m3.material.io/styles/motion/overview)
- [React Spring (alternative library)](https://www.react-spring.dev/)

---

## Appendix

### A. Animation Token Quick Reference

```typescript
// Import tokens
import { DURATIONS, EASINGS, SPRING } from '@/app/lib/animation/tokens';

// Common patterns
const quickFade = {
  duration: DURATIONS.quick / 1000, // 200ms
  ease: EASINGS.easeOut,
};

const modalEntry = {
  duration: DURATIONS.normal / 1000, // 300ms
  ease: EASINGS.emphasizedDecelerate,
};

const springBounce = {
  type: 'spring',
  ...SPRING.bouncy,
};
```

### B. Common Pitfalls

1. **Animating height: auto**
   - Problem: Can't animate from 0 to auto
   - Solution: Use Framer Motion's layout animations or AnimatePresence

2. **Too many simultaneous animations**
   - Problem: Performance degradation
   - Solution: Stagger animations, use virtualization

3. **Forgetting reduced motion**
   - Problem: Accessibility violation
   - Solution: Always check `usePrefersReducedMotion()` hook

4. **Animating on first mount in SSR**
   - Problem: Flash of unstyled content
   - Solution: Use `initial={false}` in Next.js App Router

5. **Not cleaning up animations**
   - Problem: Memory leaks
   - Solution: Use AnimatePresence for mount/unmount

### C. Migration Checklist

When converting existing components to animated versions:

- [ ] Identify all transition/animation CSS
- [ ] Replace with motion component
- [ ] Use animation tokens (no hardcoded values)
- [ ] Add reduced motion support
- [ ] Test keyboard navigation
- [ ] Update Storybook story
- [ ] Add animation tests
- [ ] Update documentation

---

## Conclusion

This animation system plan provides a comprehensive, scalable approach to adding consistent, performant, and accessible animations throughout NeuReed. By following this plan, the application will gain:

1. **Consistency** - Unified motion language across all components
2. **Performance** - GPU-accelerated, optimized animations
3. **Accessibility** - Full compliance with reduced motion preferences
4. **Maintainability** - Centralized tokens and reusable utilities
5. **Developer Experience** - Easy-to-use hooks and patterns

The phased implementation approach allows for iterative development and testing, ensuring quality at each stage. The system is designed to be extensible, allowing future components to easily adopt the established animation patterns.

**Next Steps:**
1. Review and approve this plan with the team
2. Begin Phase 1 implementation
3. Establish animation review process
4. Create animation design review checklist

**Questions or Feedback:**
Please open an issue on GitHub or reach out to the design system team.

---

**Document Metadata:**
- **Author:** Claude Code (Anthropic)
- **Last Updated:** 2025-11-25
- **Version:** 1.0
- **Status:** Pending Approval
