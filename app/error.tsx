'use client';

/**
 * PAGE-LEVEL ERROR HANDLER
 * ----------------------------------------------------------------------------
 * Next.js App Router error boundary for page-level errors.
 * Catches errors that occur during page rendering or in Server Components.
 *
 * FUNCTIONALITY:
 * - Displays user-friendly error message
 * - Provides "Try Again" button to retry the failed operation
 * - Styled to match the Daggerheart design system
 * - Shows error details in development mode only
 *
 * This file is automatically used by Next.js 15 App Router when an error
 * occurs in a page or layout component.
 */

import { useEffect } from 'react';
import { AlertCircle, RotateCcw, Home } from '@/lib/icon-utils';
import Link from 'next/link';
import { errorLogger } from '@/lib/error-logging';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error logging service
    errorLogger.logError(error, {
      component: 'PageErrorBoundary',
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dagger-dark text-white p-4">
      <div className="max-w-md w-full bg-dagger-panel border border-red-500/30 rounded-xl p-8 space-y-6">
        {/* Icon */}
        <div className="flex items-center justify-center">
          <AlertCircle className="w-20 h-20 text-red-500" />
        </div>

        {/* Title & Message */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold font-serif text-white">
            Something went wrong
          </h1>
          <p className="text-gray-400">
            We encountered an unexpected error while loading this page.
            Please try again or return to the home page.
          </p>
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-black/30 rounded border border-red-500/20 space-y-2">
            <p className="text-xs font-bold text-red-400">Development Info:</p>
            <p className="text-xs font-mono text-red-400 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-gray-500">Error ID: {error.digest}</p>
            )}
            {error.stack && (
              <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                  Stack trace
                </summary>
                <pre className="mt-2 text-[10px] text-gray-600 overflow-x-auto whitespace-pre-wrap">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-dagger-gold text-black font-bold rounded-lg hover:bg-yellow-500 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-colors"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-gray-600 text-center">
        If this problem persists, please contact support.
      </p>
    </div>
  );
}
