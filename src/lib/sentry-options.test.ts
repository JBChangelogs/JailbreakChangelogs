import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import { sentryOptions } from "./sentry-options";

test("Sentry sends events only in production with a configured DSN", () => {
  const source = transpileModule(
    readFileSync(new URL("./sentry-options.ts", import.meta.url), "utf8"),
    { compilerOptions: { module: ModuleKind.CommonJS } },
  ).outputText;

  for (const mode of ["development", "test", "production"]) {
    for (const dsn of [
      undefined,
      "",
      "https://key@o123.ingest.sentry.io/456",
    ]) {
      const exports = {} as { sentryOptions: { enabled: boolean } };
      runInNewContext(source, {
        exports,
        process: { env: { NODE_ENV: mode, NEXT_PUBLIC_SENTRY_DSN: dsn } },
      });
      expect(exports.sentryOptions.enabled).toBe(
        mode === "production" && Boolean(dsn),
      );
    }
  }
});

test("Sentry reports crashes without forwarding other signals or request secrets", () => {
  expect(sentryOptions).not.toHaveProperty("tracesSampleRate");
  expect(sentryOptions).not.toHaveProperty("replaysSessionSampleRate");
  expect(sentryOptions.beforeSendLog()).toBeNull();
  expect(sentryOptions.beforeSendMetric()).toBeNull();
  expect(sentryOptions.dataCollection).toEqual({
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
  });

  const ignored = (message: string) =>
    sentryOptions.ignoreErrors.some((pattern) => pattern.test(message));
  expect(ignored("BANNED_USER: This user is banned")).toBe(true);
  expect(ignored("NOT_FOUND: User not found")).toBe(true);
  expect(ignored("PRIVATE_PROFILE: This profile is private")).toBe(true);
  expect(ignored("Minified React error #306")).toBe(false);
  expect(ignored("Minified React error #418")).toBe(false);
  expect(ignored("Failed to fetch items page 1 (502)")).toBe(false);
});

test("Sentry initializes before hydration and records navigation without URL parameters", () => {
  const calls: unknown[] = [];
  const exports = {} as {
    onRouterTransitionStart: (url: string, type: string) => void;
  };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("../instrumentation-client.ts", import.meta.url),
        "utf8",
      ),
      { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    {
      exports,
      require: (name: string) =>
        name === "@sentry/nextjs"
          ? {
              init: (options: unknown) => calls.push(options),
              addBreadcrumb: (crumb: unknown) => calls.push(crumb),
            }
          : { sentryOptions },
    },
  );
  expect(calls).toEqual([sentryOptions]);
  exports.onRouterTransitionStart("/inventories/123?token=secret#scan", "push");
  expect(calls[1]).toEqual({
    category: "navigation",
    data: { to: "/inventories/123", navigationType: "push" },
  });
});
