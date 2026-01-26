"use client";

import { useEffect } from "react";
import Image from "next/image";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError =
    error.message?.includes("Loading chunk") ||
    error.message?.includes("Failed to fetch dynamically imported module") ||
    error.message?.includes("ChunkLoadError") ||
    error.message?.includes("Loading CSS chunk");

  // Track error with Umami when error page is triggered
  useEffect(() => {
    if (typeof window !== "undefined" && window.umami) {
      window.umami.track("Global Error Page", {
        isChunkError: isChunkError,
        errorDigest: error.digest || "unknown",
        path: window.location.pathname,
      });
    }
  }, [isChunkError, error.digest]);

  const handleRefresh = () => {
    // Track refresh button click with Umami
    if (typeof window !== "undefined" && window.umami) {
      window.umami.track("Error Page - Refresh Clicked", {
        isChunkError: isChunkError,
        errorDigest: error.digest || "unknown",
        path: window.location.pathname,
      });
    }

    if (isChunkError) {
      window.location.reload();
    } else {
      reset();
    }
  };

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
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 2rem;
              }
            `,
          }}
        />
      </head>
      <body>
        <div
          style={{
            maxWidth: "42rem",
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              marginBottom: "2rem",
              width: "100%",
              maxWidth: "300px",
              margin: "0 auto 2rem",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Image
              src="https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Transparent.svg"
              alt="Jailbreak Changelogs"
              width={300}
              height={120}
              style={{
                maxWidth: "100%",
                height: "auto",
              }}
            />
          </div>

          <h1
            style={{
              color: "var(--color-primary-text, hsl(60, 100%, 100%))",
              fontSize: "2rem",
              fontWeight: "bold",
              marginBottom: "1rem",
            }}
          >
            Something went wrong!
          </h1>

          <p
            style={{
              color: "var(--color-secondary-text, hsl(214, 16%, 64%))",
              marginBottom: "2rem",
              lineHeight: "1.6",
              fontSize: "1.125rem",
            }}
          >
            It&apos;s not you, it&apos;s us. We&apos;re sorry for the
            inconvenience.
          </p>

          <button
            onClick={handleRefresh}
            style={{
              background: "var(--color-button-info, hsl(210, 99%, 50%))",
              color: "var(--color-button-text, hsl(60, 100%, 100%))",
              border: "none",
              borderRadius: "8px",
              padding: "0.875rem 2rem",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            Refresh Page
          </button>
        </div>
      </body>
    </html>
  );
}
