'use client';

/**
 * DEV ERROR TRIGGERS
 * ----------------------------------------------------------------------------
 * Development-only component for testing error boundaries and error handling.
 *
 * FUNCTIONALITY:
 * - Provides buttons to trigger different types of errors
 * - Only visible in development mode
 * - Tests ErrorBoundary, error logging, and error recovery
 * - Helps verify error handling implementation
 *
 * USAGE:
 * ```tsx
 * import DevErrorTriggers from '@/components/core/dev-error-triggers';
 *
 * // Add to a page in development only
 * {process.env.NODE_ENV === 'development' && <DevErrorTriggers />}
 * ```
 */

import React, { useState } from 'react';
import { AppIcons } from '@/lib/icon-utils';
import { Z_INDEX } from '@/constants/z-index';

export default function DevErrorTriggers() {
  const [shouldThrow, setShouldThrow] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Throw error if triggered
  if (shouldThrow) {
    setShouldThrow(false); // Reset for next test
    throw new Error('Test error from DevErrorTriggers');
  }

  const triggerComponentError = () => {
    setShouldThrow(true);
  };

  const triggerAsyncError = async () => {
    try {
      throw new Error('Test async error');
    } catch (error) {
      console.error('Async error caught:', error);
      throw error;
    }
  };

  const triggerNetworkError = async () => {
    try {
      await fetch('https://invalid-url-that-does-not-exist-12345.com');
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  const triggerUndefinedError = () => {
    const obj: any = null;
    // This will throw "Cannot read property 'foo' of null"
    console.log(obj.foo);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-colors"
        style={{ zIndex: Z_INDEX.TOAST }}
        title="Show Dev Error Triggers"
      >
        <AppIcons.system.debug size={20} />
      </button>
    );
  }

  return (
    <div 
      className="fixed bottom-4 left-4 bg-zinc-900 border border-red-500/50 rounded-lg shadow-2xl p-4 max-w-xs"
      style={{ zIndex: Z_INDEX.TOAST }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AppIcons.system.error className="w-5 h-5 text-red-500" />
          <h3 className="text-sm font-bold text-white">Error Test Panel</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-3">
        Trigger different error types to test error boundaries
      </p>

      <div className="space-y-2">
        <button
          onClick={triggerComponentError}
          className="w-full flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-colors"
        >
          <AppIcons.vitals.stress size={14} />
          Component Error
        </button>

        <button
          onClick={triggerAsyncError}
          className="w-full flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded transition-colors"
        >
          <AppIcons.vitals.stress size={14} />
          Async Error
        </button>

        <button
          onClick={triggerNetworkError}
          className="w-full flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold rounded transition-colors"
        >
          <AppIcons.vitals.stress size={14} />
          Network Error
        </button>

        <button
          onClick={triggerUndefinedError}
          className="w-full flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded transition-colors"
        >
          <AppIcons.vitals.stress size={14} />
          Undefined Error
        </button>
      </div>

      <p className="text-[10px] text-gray-600 mt-3 text-center">
        Dev only - not visible in production
      </p>
    </div>
  );
}
