import { defineRailway, github, group, preserve, project, service } from "railway/iac";

// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "JailbreakChangelogs-Testing";

export default defineRailway(() => {
  const JailbreakChangelogs_Testing = service("JailbreakChangelogs-Testing", {
    source: github("JBChangelogs/JailbreakChangelogs", { branch: "testing" }),
    build: {
      builder: "RAILPACK",
      buildCommand: "bun run build && cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/",
    },
    start: "HOSTNAME=0.0.0.0 node .next/standalone/server.js",
    healthcheck: "/api/healthcheck",
    healthcheckTimeout: 30,
    deploy: {
      limitOverride: {
        containers: {
          cpu: 8,
          memoryBytes: 8_000_000_000,
        },
      },
    },
    env: {
      BUN_INSTALL_CACHE_DIR: preserve(),
      GEMINI_API_KEY: preserve(),
      GITHUB_API_COMMITS_URL: preserve(),
      GITHUB_TOKEN: preserve(),
      NEXT_PUBLIC_API_URL: preserve(),
      NEXT_PUBLIC_ENABLE_AI_SUMMARY: preserve(),
      NEXT_PUBLIC_ENABLE_DUPE_FINDER: preserve(),
      NEXT_PUBLIC_ENABLE_INVENTORY_CALCULATOR: preserve(),
      NEXT_PUBLIC_ENABLE_OG_FINDER: preserve(),
      NEXT_PUBLIC_ENABLE_REALTIME_NOTIFICATIONS_WS: preserve(),
      NEXT_PUBLIC_ENABLE_WS_SCAN: preserve(),
      NEXT_PUBLIC_INVENTORY_API_ISSUES: preserve(),
      NEXT_PUBLIC_INVENTORY_API_SOURCE_HEADER: preserve(),
      NEXT_PUBLIC_INVENTORY_API_URL: preserve(),
      NEXT_PUBLIC_INVENTORY_WS_URL: preserve(),
      NEXT_PUBLIC_LATEST_SEASON: preserve(),
      NEXT_PUBLIC_ROBBERY_TRACKER_AUTH_REQUIRED: preserve(),
      NEXT_PUBLIC_SCANNING_API_URL: preserve(),
      NEXT_PUBLIC_SHOW_LIVE_EVENT_COUNTDOWN: preserve(),
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: preserve(),
      NEXT_PUBLIC_WS_URL: preserve(),
      NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: preserve(),
      OPEN_ROUTER_API_KEY: preserve(),
      RAILPACK_BUN_VERSION: preserve(),
      RAILWAY_INTERNAL_API_URL: preserve(),
      RAILWAY_TOKEN: preserve(),
      TURNSTILE_SECRET_KEY: preserve(),
      VGY_ME_USERKEY: preserve(),
    },
  });
  return project("Jailbreak Changelogs", {
    resources: group("Frontend", [JailbreakChangelogs_Testing]),
  });
});
