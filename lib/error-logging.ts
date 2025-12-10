/**
 * ERROR LOGGING INFRASTRUCTURE
 * ----------------------------------------------------------------------------
 * Centralized error logging system for the application.
 *
 * FUNCTIONALITY:
 * - Provides a consistent interface for logging errors throughout the app
 * - Logs to console in development
 * - Ready for integration with error tracking services (Sentry, LogRocket, etc.) in production
 * - Captures error context (component name, user info, error details)
 * - Respects user privacy (no sensitive data)
 *
 * USAGE:
 * ```tsx
 * import { errorLogger } from '@/lib/error-logging';
 *
 * // Log a component error
 * errorLogger.logError(error, {
 *   component: 'CharacterView',
 *   action: 'fetchCharacter',
 *   userId: user?.id
 * });
 *
 * // Log a React error with errorInfo
 * errorLogger.logReactError(error, errorInfo, {
 *   component: 'ErrorBoundary',
 *   characterId: character?.id
 * });
 * ```
 */

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  characterId?: string;
  [key: string]: any;
}

interface ErrorLogger {
  logError(error: Error, context?: ErrorContext): void;
  logReactError(error: Error, errorInfo: React.ErrorInfo, context?: ErrorContext): void;
}

class ErrorLoggingService implements ErrorLogger {
  /**
   * Log a general error
   */
  logError(error: Error, context?: ErrorContext): void {
    // Always log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Error Logger]', {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
      });
    }

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTracking(error, context);
    }
  }

  /**
   * Log a React component error (from ErrorBoundary)
   */
  logReactError(error: Error, errorInfo: React.ErrorInfo, context?: ErrorContext): void {
    const enhancedContext = {
      ...context,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    };

    // Always log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[React Error]', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        context: enhancedContext,
        timestamp: new Date().toISOString(),
      });
    }

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTracking(error, enhancedContext);
    }
  }

  /**
   * Send error to external tracking service (Sentry, LogRocket, etc.)
   * This is a placeholder for future integration
   */
  private sendToErrorTracking(error: Error, context?: ErrorContext): void {
    // TODO: Integrate with error tracking service
    // Example with Sentry:
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     contexts: {
    //       app: context,
    //     },
    //     tags: {
    //       component: context?.component,
    //       action: context?.action,
    //     },
    //   });
    // }

    // For now, just log to console with a note that this would go to a service
    console.error('[Production Error - Would send to tracking service]', {
      error: error.message,
      context,
    });
  }
}

// Export singleton instance
export const errorLogger = new ErrorLoggingService();

/**
 * Helper function to extract safe error info from unknown error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Helper function to check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('NetworkError') ||
      error.message.includes('Failed to fetch')
    );
  }
  return false;
}

/**
 * Helper function to check if an error is a database error
 */
export function isDatabaseError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    // Supabase/PostgreSQL error codes
    return typeof (error as any).code === 'string';
  }
  return false;
}
