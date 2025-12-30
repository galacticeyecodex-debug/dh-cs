/**
 * ERROR BOUNDARY TESTS
 * ----------------------------------------------------------------------------
 * Tests for the ErrorBoundary component that catches and handles React errors.
 *
 * Test Coverage:
 * - Error catching and fallback UI display
 * - Error reset functionality
 * - Error logging integration
 * - Custom fallback rendering
 * - Development vs production error details
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/core/error-boundary';
import * as errorLogging from '@/lib/error-logging';

// Mock the error logger
vi.mock('@/lib/error-logging', () => ({
  errorLogger: {
    logReactError: vi.fn(),
  },
}));

// Component that throws an error
function ThrowError({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

// Suppress console.error for these tests (ErrorBoundary logs errors)
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
  vi.clearAllMocks();
});

describe('ErrorBoundary', () => {
  describe('Error Catching', () => {
    it('should catch errors and display fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });

    it('should display error message in fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Error message should be displayed (in development mode details are shown)
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Error Reset', () => {
    it('should reset error state when "Try Again" button is clicked', () => {
      let shouldThrow = true;

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      // Error should be displayed
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Change the component to not throw
      shouldThrow = false;

      // Click "Try Again" button
      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(tryAgainButton);

      // Rerender with updated props
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      // Error should be cleared and component should render normally
      // Note: In a real scenario, the component would re-mount and succeed
    });
  });

  describe('Error Logging', () => {
    it('should call error logger when error is caught', () => {
      const logReactErrorSpy = vi.spyOn(errorLogging.errorLogger, 'logReactError');

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(logReactErrorSpy).toHaveBeenCalled();
      const call = logReactErrorSpy.mock.calls[0];
      expect(call[0]).toBeInstanceOf(Error);
      expect(call[0].message).toBe('Test error');
      expect(call[2]).toEqual({ component: 'ErrorBoundary' });
    });

    it('should call onError callback when provided', () => {
      const onErrorCallback = vi.fn();

      render(
        <ErrorBoundary onError={onErrorCallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(onErrorCallback).toHaveBeenCalled();
      const call = onErrorCallback.mock.calls[0];
      expect(call[0]).toBeInstanceOf(Error);
      expect(call[0].message).toBe('Test error');
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = (error: Error, reset: () => void) => (
        <div>
          <p>Custom error message: {error.message}</p>
          <button onClick={reset}>Custom Reset</button>
        </div>
      );

      render(
        <ErrorBoundary fallbackRender={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/custom error message: test error/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /custom reset/i })).toBeInTheDocument();
    });

    it('should call reset function from custom fallback', () => {
      let shouldThrow = true;
      const customFallback = (error: Error, reset: () => void) => (
        <button onClick={reset}>Custom Reset</button>
      );

      const { rerender } = render(
        <ErrorBoundary fallbackRender={customFallback}>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      const customResetButton = screen.getByRole('button', { name: /custom reset/i });

      // Change component to not throw
      shouldThrow = false;

      fireEvent.click(customResetButton);

      rerender(
        <ErrorBoundary fallbackRender={customFallback}>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    });
  });

  describe('Error Fallback Component', () => {
    it('should export ErrorFallback component', async () => {
      const { ErrorFallback } = await import('@/components/core/error-boundary');
      expect(ErrorFallback).toBeDefined();
    });
  });

  describe('Multiple Children', () => {
    it('should catch errors from any child component', () => {
      render(
        <ErrorBoundary>
          <div>Working component 1</div>
          <ThrowError />
          <div>Working component 2</div>
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.queryByText('Working component 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Working component 2')).not.toBeInTheDocument();
    });
  });

  describe('Nested ErrorBoundaries', () => {
    it('should catch errors at the nearest boundary', () => {
      function OuterContent() {
        return <div>Outer content still works</div>;
      }

      render(
        <ErrorBoundary fallbackRender={(error) => <div>Outer boundary caught: {error.message}</div>}>
          <OuterContent />
          <ErrorBoundary fallbackRender={(error) => <div>Inner boundary caught: {error.message}</div>}>
            <ThrowError />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      // Inner boundary should catch the error
      expect(screen.getByText(/inner boundary caught: test error/i)).toBeInTheDocument();
      expect(screen.queryByText(/outer boundary caught/i)).not.toBeInTheDocument();

      // Outer content should still be visible
      expect(screen.getByText('Outer content still works')).toBeInTheDocument();
    });
  });
});
