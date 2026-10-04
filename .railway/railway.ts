import { defineRailway, github, group, preserve, project, service } from "railway/iac";

// This partial owns only this repository's frontend service in each environment.
export const partial = "FrontEnd";

const sharedEnv = {
  GITHUB_API_COMMITS_URL: preserve(),
  GITHUB_TOKEN: preserve(),
  NEXT_PUBLIC_API_URL: preserve(),
  NEXT_PUBLIC_ENABLE_AI_SUMMARY: preserve(),
  NEXT_PUBLIC_ENABLE_DUPE_FINDER: preserve(),
  NEXT_PUBLIC_ENABLE_INVENTORY_CALCULATOR: preserve(),
  NEXT_PUBLIC_ENABLE_OG_FINDER: preserve(),
  NEXT_PUBLIC_ENABLE_REALTIME_NOTIFICATIONS_WS: preserve(),
  NEXT_PUBLIC_ENABLE_WS_SCAN: preserve(),
  NEXT_PUBLIC_INVENTORY_API_SOURCE_HEADER: preserve(),
  NEXT_PUBLIC_INVENTORY_API_URL: preserve(),
  NEXT_PUBLIC_INVENTORY_WS_URL: preserve(),
  NEXT_PUBLIC_LATEST_SEASON: preserve(),
  NEXT_PUBLIC_ROBBERY_TRACKER_AUTH_REQUIRED: preserve(),
  NEXT_PUBLIC_SCANNING_API_URL: preserve(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: preserve(),
  NEXT_PUBLIC_WS_URL: preserve(),
  NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: preserve(),
  RAILWAY_INTERNAL_API_URL: preserve(),
  RAILWAY_TOKEN: preserve(),
  TURNSTILE_SECRET_KEY: preserve(),
  VGY_ME_USERKEY: preserve(),
};

export default defineRailway((ctx) => {
  const testing = ctx.environment === "testing";
  if (!testing && ctx.environment !== "production") {
    throw new Error(`No frontend Railway configuration for environment: ${ctx.environment}`);
  }

  const frontend = service(testing ? "JailbreakChangelogs-Testing" : "FrontEnd", {
    source: github("JBChangelogs/JailbreakChangelogs", {
      branch: testing ? "testing" : "main",
      checkSuites: true,
    }),
    build: {
      builder: "RAILPACK",
      buildCommand: "bun run build && cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/",
    },
    start: "HOSTNAME=:: node .next/standalone/server.js",
    healthcheck: "/api/healthcheck",
    healthcheckTimeout: 30,
    deploy: {
      ...(!testing && { drainingSeconds: 20, overlapSeconds: 30 }),
      limitOverride: {
        containers: {
          cpu: testing ? 8 : 16,
          memoryBytes: testing ? 8_000_000_000 : 16_000_000_000,
        },
      },
    },
    env: {
      ...sharedEnv,
      ...(testing
        ? {
            BUN_INSTALL_CACHE_DIR: preserve(),
            GEMINI_API_KEY: preserve(),
            GITHUB_API_RELEASES_URL: preserve(),
            NEXT_PUBLIC_INVENTORY_API_ISSUES: preserve(),
            NEXT_PUBLIC_SHOW_LIVE_EVENT_COUNTDOWN: preserve(),
            NEXT_TELEMETRY_DISABLED: preserve(),
            OPEN_ROUTER_API_KEY: preserve(),
          }
        : {
            GITHUB_API_RELEASES_URL: preserve(),
            NEXT_PUBLIC_SUBMISSIONS_URL: preserve(),
          }),
    },
  });

  return project("Jailbreak Changelogs", {
    resources: group("Frontend", [frontend]),
  });
});
