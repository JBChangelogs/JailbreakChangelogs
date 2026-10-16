import { afterEach, expect, test } from "bun:test";
import { buildApiLinkUrl } from "./apiDevToken";

const names = [
  "NEXT_PUBLIC_RAILWAY_ENVIRONMENT_NAME",
  "RAILWAY_ENVIRONMENT_NAME",
  "NEXT_PUBLIC_DEV_TOKEN",
] as const;
const originalEnv = Object.fromEntries(
  names.map((name) => [name, process.env[name]]),
);

afterEach(() => {
  for (const name of names) {
    if (originalEnv[name] === undefined) delete process.env[name];
    else process.env[name] = originalEnv[name];
  }
});

test("linking URLs never include tokens outside local development", () => {
  process.env.NEXT_PUBLIC_DEV_TOKEN = "development-token";
  for (const environment of ["production", "testing"]) {
    process.env.NEXT_PUBLIC_RAILWAY_ENVIRONMENT_NAME = environment;
    for (const path of ["/oauth/roblox", "/email/link"]) {
      const redirect =
        "https://jailbreakchangelogs.com/settings?auth_flow=roblox-link";
      const url = new URL(
        buildApiLinkUrl("https://api.example.com", path, redirect),
      );
      expect(url.pathname).toBe(path);
      expect([...url.searchParams.keys()]).toEqual(["redirect"]);
      expect(url.searchParams.get("redirect")).toBe(redirect);
      expect(url.href).not.toContain("development-token");
    }
  }
});

test("local linking supports a development token without corrupting the redirect", () => {
  process.env.NEXT_PUBLIC_RAILWAY_ENVIRONMENT_NAME = "development";
  process.env.NEXT_PUBLIC_DEV_TOKEN = "local/+&token";
  const redirect = "http://localhost:5500/settings?tab=email&other=1";
  const url = new URL(
    buildApiLinkUrl("https://api.example.com/", "/email/link", redirect),
  );
  expect(url.searchParams.get("owner")).toBe("local/+&token");
  expect(url.searchParams.get("redirect")).toBe(redirect);
  delete process.env.NEXT_PUBLIC_DEV_TOKEN;
  expect(
    new URL(
      buildApiLinkUrl("https://api.example.com", "/email/link", redirect),
    ).searchParams.has("owner"),
  ).toBe(false);
});
