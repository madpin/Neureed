'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI.
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<div>Something went wrong</div>}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * @example With custom error handler
 * ```tsx
 * <ErrorBoundary onError={(error, errorInfo) => logError(error, errorInfo)}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // TODO: Send to error tracking service (e.g., Sentry)
    // trackError(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  override render() {
    if (this.state.hasError) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-red-600 dark:text-red-400">
                  Error stack trace
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-red-100 p-2 text-xs text-red-900 dark:bg-red-900 dark:text-red-100">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="mt-4 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-600"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
