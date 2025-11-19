"use client";

/**
 * Global error boundary for the application
 * This file must be a client component to handle errors during rendering
 * Keep this component minimal and avoid any complex dependencies
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            backgroundColor: '#ffffff',
          }}
        >
          <h2
            style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#000000',
            }}
          >
            Something went wrong!
          </h2>
          <p
            style={{
              marginBottom: '24px',
              color: '#666666',
            }}
          >
            {error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0070f3',
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

