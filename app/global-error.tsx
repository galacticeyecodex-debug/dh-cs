'use client';

/**
 * GLOBAL ERROR HANDLER (Root-Level)
 * ----------------------------------------------------------------------------
 * Next.js App Router global error boundary - the last line of defense.
 * This catches errors that occur in the root layout or aren't caught by
 * page-level error boundaries.
 *
 * IMPORTANT: This component MUST be minimal and not rely on any imports
 * that could themselves fail. It replaces the entire application UI,
 * including <html> and <body> tags.
 *
 * This file is automatically used by Next.js 15 App Router for root-level errors.
 */

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console
    console.error('Global error:', error);

    // TODO: Log to error tracking service in production
    // if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    //   // Use bare fetch or similar to avoid dependencies
    //   fetch('/api/log-error', {
    //     method: 'POST',
    //     body: JSON.stringify({ error: error.message, stack: error.stack })
    //   }).catch(() => {});
    // }
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#0a0a0a',
            color: '#ffffff',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: '500px',
              width: '100%',
              backgroundColor: '#1a1a1a',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '40px 24px',
            }}
          >
            {/* Error Icon (Unicode) */}
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>

            {/* Title */}
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                marginBottom: '16px',
                color: '#ffffff',
              }}
            >
              Critical Error
            </h1>

            {/* Message */}
            <p
              style={{
                fontSize: '16px',
                color: '#9ca3af',
                marginBottom: '24px',
                lineHeight: '1.5',
              }}
            >
              The application encountered a critical error and needs to restart.
              Please try again.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '24px',
                  textAlign: 'left',
                }}
              >
                <p
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#ef4444',
                    marginBottom: '8px',
                  }}
                >
                  Development Info:
                </p>
                <p
                  style={{
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#ef4444',
                    wordBreak: 'break-all',
                    margin: 0,
                  }}
                >
                  {error.message}
                </p>
                {error.digest && (
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      marginTop: '8px',
                    }}
                  >
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={reset}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  backgroundColor: '#eab308',
                  color: '#000000',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#facc15';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#eab308';
                }}
              >
                🔄 Try Again
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                🏠 Return Home
              </button>
            </div>
          </div>

          {/* Footer */}
          <p style={{ marginTop: '32px', fontSize: '12px', color: '#4b5563' }}>
            If this problem persists, please contact support.
          </p>
        </div>
      </body>
    </html>
  );
}
