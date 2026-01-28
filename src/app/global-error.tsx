"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.umami) {
        // Truncate error message to avoid Umami limits (~1000 chars)
        const errorMessage = error.message?.substring(0, 500) || "No message";
        const errorStack = error.stack?.substring(0, 500) || "No stack";

        window.umami.track("Global Error Page", {
          errorDigest: error.digest || "unknown",
          path: window.location.pathname,
          errorMessage: errorMessage,
          errorStack: errorStack,
          errorName: error.name || "Unknown",
        });
      }
    } catch (e) {
      // Silently fail - don't break anything
      console.error("Error logging to Umami:", e);
    }
  }, [error.digest, error.message, error.stack, error.name]);

  return (
    <html lang="en">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: system-ui, -apple-system, sans-serif;
                background: var(--color-primary-bg, #121317);
                color: var(--color-primary-text, hsl(60, 100%, 100%));
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
              }
              .error-container {
                text-align: center;
                max-width: 42rem;
              }
              h2 {
                font-size: 2rem;
                margin-bottom: 1rem;
              }
              button {
                background: var(--color-button-info, hsl(210, 99%, 50%));
                color: var(--color-button-text, hsl(60, 100%, 100%));
                border: none;
                border-radius: 8px;
                padding: 0.875rem 2rem;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: opacity 0.2s;
              }
              button:hover {
                opacity: 0.9;
              }
            `,
          }}
        />
      </head>
      <body>
        <div className="error-container">
          <h2>Something went wrong!</h2>
          <button onClick={() => reset()}>Try again</button>
        </div>
      </body>
    </html>
  );
}
