"use client";

import { useEffect } from "react";
import Script from "next/script";
import { reportAppError } from "@/utils/analytics/reportAppError";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => reportAppError(error, "global"), [error]);

  return (
    <html lang="en">
      <head>
        <title>This page couldn’t load | Jailbreak Changelogs</title>
      </head>
      <body
        style={{
          margin: 0,
          background: "#0a0a0a",
          color: "#ededed",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            alignItems: "center",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            gap: 48,
            maxWidth: 1024,
            margin: "0 auto",
            padding: "24px",
          }}
        >
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 600 }}>
              This page couldn’t load
            </h1>
            <p>Reload to try again, or go back.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                style={{
                  background: "#292929",
                  color: "#ededed",
                  border: 0,
                  borderRadius: 8,
                  padding: "10px 16px",
                  cursor: "pointer",
                }}
                onClick={() => window.location.reload()}
              >
                Reload
              </button>
              <button
                style={{
                  background: "#ededed",
                  color: "#0a0a0a",
                  border: 0,
                  borderRadius: 8,
                  padding: "10px 16px",
                  cursor: "pointer",
                }}
                onClick={() => {
                  if (window.history.length > 1) window.history.back();
                  else window.location.assign("/");
                }}
              >
                Back
              </button>
            </div>
            {error.digest && <p>Error reference: {error.digest}</p>}
          </div>
          <div
            role="img"
            aria-label="Error illustration"
            style={{
              width: "100%",
              aspectRatio: "1500 / 700",
              backgroundColor: "currentColor",
              mask: "url(/assets/images/404.png) center / contain no-repeat",
            }}
          />
        </main>
        {process.env.NODE_ENV === "production" && (
          <Script
            src="/insights/script.js"
            data-site-id="0d25b013fe3a"
            data-cfasync="false"
          />
        )}
      </body>
    </html>
  );
}
