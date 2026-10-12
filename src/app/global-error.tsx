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
            placeContent: "center",
            padding: "0 24px",
          }}
        >
          <h1>This page couldn’t load</h1>
          <p>Reload to try again, or go back.</p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => window.location.reload()}>Reload</button>
            <button
              onClick={() => {
                if (window.history.length > 1) window.history.back();
                else window.location.assign("/");
              }}
            >
              Back
            </button>
          </div>
          {error.digest && <p>Error reference: {error.digest}</p>}
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
