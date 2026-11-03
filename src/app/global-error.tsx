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

  useEffect(() => {
    const buildTime = Number(process.env.NEXT_PUBLIC_BUILD_TIME);
    if (
      process.env.NODE_ENV !== "production" ||
      !Number.isFinite(buildTime) ||
      buildTime <= 0
    )
      return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    const recover = async () => {
      try {
        const response = await fetch("/api/version", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const { date } = await response.json();
        if (
          controller.signal.aborted ||
          typeof date !== "number" ||
          !Number.isFinite(date) ||
          date <= buildTime
        )
          return;

        const key = "global-error-reload-build";
        const lastAttempt = Number(window.sessionStorage.getItem(key)) || 0;
        if (date <= lastAttempt) return;
        window.sessionStorage.setItem(key, String(date));
        window.location.reload();
      } catch {
      } finally {
        window.clearTimeout(timeout);
      }
    };
    void recover();
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <html lang="en">
      <head>
        <title>Site error | Jailbreak Changelogs</title>
        <style>{`
          body {
            margin: 0;
            background: #121317;
            color: #fffffa;
            font-family: system-ui, sans-serif;
            line-height: 1.5;
          }
          .global-error {
            box-sizing: border-box;
            min-height: 100vh;
            min-height: 100svh;
            max-width: 640px;
            margin: 0 auto;
            padding: 48px 24px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: center;
          }
          .global-error p { margin: 0; color: #95a2b2; }
          .global-error .eyebrow { font-size: 14px; font-weight: 500; }
          .global-error h1 { margin: 12px 0 16px; font-size: 24px; line-height: 1.25; font-weight: 600; }
          .global-error .actions { display: flex; justify-content: center; margin-top: 24px; }
          .global-error button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 40px;
            border: 0;
            border-radius: 8px;
            padding: 8px 16px;
            background: hsl(212, 14%, 22%);
            color: #fffffa;
            font: inherit;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          }
          .global-error button:hover { background: hsl(212, 14%, 28%); }
          .global-error button.primary { background: hsl(210, 99%, 35%); }
          .global-error button.primary:hover { background: hsl(210, 99%, 30%); }
          .global-error button:focus-visible { outline: 2px solid #0284fe; outline-offset: 4px; }
          .global-error .support { margin-top: 24px; }
          .global-error a { color: hsl(210, 100%, 70%); text-underline-offset: 4px; }
          .global-error a:hover { color: hsl(210, 100%, 75%); }
          .global-error .reference, .global-error details { margin-top: 24px; font-size: 14px; overflow-wrap: anywhere; }
          .global-error .reference code { background: var(--color-secondary-bg, #17181d); padding: 2px 6px; border-radius: 4px; }
          .global-error summary { cursor: pointer; color: #95a2b2; }
          .global-error pre { white-space: pre-wrap; }
          @media (min-width: 768px) {
            .global-error h1 { font-size: 30px; }
          }
        `}</style>
      </head>
      <body>
        <main className="global-error">
          <div className="content">
            <p className="eyebrow">Site-wide error</p>
            <h1>Something went wrong.</h1>
            <p>Try reloading the page.</p>
            <div className="actions">
              <button
                type="button"
                className="primary"
                onClick={() => window.location.reload()}
              >
                Reload page
              </button>
            </div>
            <p className="support">
              Still having trouble?{" "}
              <a
                href="https://discord.jailbreakchangelogs.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Join our Discord
              </a>{" "}
              and share the page URL
              {error.digest ? " and error reference" : ""}.
            </p>
            {error.digest && (
              <p className="reference">
                Error reference: <code>{error.digest}</code>
              </p>
            )}
            {process.env.NODE_ENV === "development" && (
              <details>
                <summary>Developer error details</summary>
                <pre>{error.stack || error.message}</pre>
              </details>
            )}
          </div>
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
