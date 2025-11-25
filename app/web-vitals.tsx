'use client';

import { useReportWebVitals } from 'next/web-vitals';

/**
 * Web Vitals Tracking Component
 *
 * Monitors and reports Core Web Vitals metrics.
 * Add this component to your root layout to enable tracking.
 *
 * Metrics tracked:
 * - CLS (Cumulative Layout Shift)
 * - FID (First Input Delay)
 * - FCP (First Contentful Paint)
 * - LCP (Largest Contentful Paint)
 * - TTFB (Time to First Byte)
 * - INP (Interaction to Next Paint)
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { WebVitals } from './web-vitals';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <WebVitals />
 *         {children}
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log metrics in development
    if (process.env.NODE_ENV === 'development') {
      const { name, value, rating, id } = metric;

      // Format value for readability
      const formattedValue =
        name === 'CLS' ? value.toFixed(3) : Math.round(value);

      // Use emoji based on rating
      const emojiMap: Record<typeof rating, string> = {
        good: '🟢',
        'needs-improvement': '🟡',
        poor: '🔴',
      };
      const emoji = emojiMap[rating];

      console.log(
        `${emoji} ${name}: ${formattedValue}${name === 'CLS' ? '' : 'ms'} (${rating}) [${id}]`
      );
    }

    // Send to analytics service
    // Example: Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        value: Math.round(
          metric.name === 'CLS' ? metric.value * 1000 : metric.value
        ),
        event_label: metric.id,
        non_interaction: true,
      });
    }

    // Example: Custom analytics endpoint
    // fetch('/api/analytics/vitals', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     name: metric.name,
    //     value: metric.value,
    //     rating: metric.rating,
    //     id: metric.id,
    //     timestamp: Date.now(),
    //   }),
    // });
  });

  // This component renders nothing
  return null;
}

/**
 * Type augmentation for gtag
 */
declare global {
  interface Window {
    gtag?: (
      command: string,
      eventName: string,
      params: Record<string, unknown>
    ) => void;
  }
}
