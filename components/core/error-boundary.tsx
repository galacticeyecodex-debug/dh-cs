'use client';

/**
 * ERROR BOUNDARY COMPONENT
 * ----------------------------------------------------------------------------
 * React Error Boundary that catches component render errors and displays
 * a graceful fallback UI instead of crashing the entire application.
 *
 * FUNCTIONALITY:
 * - Catches all React render errors in child components
 * - Displays user-friendly fallback UI with error message
 * - Provides "Try Again" button to reset error state
 * - Shows detailed error information in development mode only
 * - Integrates with error logging infrastructure
 * - Uses existing design system (dagger-gold, Lucide icons)
 *
 * USAGE:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 *
 * // With custom fallback
 * <ErrorBoundary fallbackRender={(error, reset) => <CustomFallback error={error} onReset={reset} />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */

import React from 'react';
import { AppIcons } from '@/lib/icon-utils';
import { errorLogger } from '@/lib/error-logging';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackRender?: (error: Error, reset: () => void) => React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error logging service
    errorLogger.logReactError(error, errorInfo, {
      component: 'ErrorBoundary',
    });

    // Call optional error logging callback
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallbackRender) {
        return this.props.fallbackRender(this.state.error, this.resetError);
      }

      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-dagger-dark">
          <div className="max-w-md w-full bg-dagger-panel border border-red-500/30 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-center">
              <AppIcons.system.error className="w-16 h-16 text-red-500" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
              <p className="text-gray-400 text-sm">
                We encountered an unexpected error. Please try again.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-black/30 rounded border border-red-500/20">
                <p className="text-xs font-mono text-red-400 break-all">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                      Stack trace
                    </summary>
                    <pre className="mt-2 text-[10px] text-gray-600 overflow-x-auto">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <button
              onClick={this.resetError}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-dagger-gold text-black font-bold rounded-lg hover:bg-yellow-500 transition-colors"
            >
              <AppIcons.ui.reset className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component for use in custom scenarios
 */
export function ErrorFallback({
  error,
  onReset
}: {
  error: Error;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-dagger-dark text-white p-4">
      <AppIcons.system.error className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-gray-400 mb-6 text-center max-w-md">
        {error.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={onReset}
        className="flex items-center gap-2 px-6 py-3 bg-dagger-gold text-black font-bold rounded-full hover:scale-105 transition-transform"
      >
        <AppIcons.ui.reset className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}
