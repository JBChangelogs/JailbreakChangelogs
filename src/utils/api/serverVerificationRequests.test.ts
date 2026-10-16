import { afterEach, expect, spyOn, test } from "bun:test";
import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import { getHumanVerificationHeaders } from "./verificationHeaders";
import {
  fetchUserByIdForMetadata,
  fetchUserByRobloxId,
  fetchItem,
  fetchItemById,
  fetchChangelog,
  fetchSeason,
} from "./api";
import { fetchTestimonials } from "@/components/Testimonials/testimonialsData";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("server API reads carry the current visitor's verification and preserve public item caching", async () => {
  const fetchMock = spyOn(globalThis, "fetch");
  for (const verification of ["visitor-one", "visitor-two", undefined]) {
    const headers = getHumanVerificationHeaders({
      get: () => (verification ? { value: verification } : undefined),
    });
    const reads = [
      () => fetchUserByIdForMetadata("123", headers),
      () => fetchUserByRobloxId("123", headers),
      () => fetchItem("Vehicle", "Test", headers),
      () => fetchItemById("123", headers),
      () => fetchChangelog("123", headers),
      () => fetchSeason("123", headers),
      () => fetchTestimonials(1, undefined, "https://api.example.com", headers),
    ];
    for (const read of reads) {
      fetchMock.mockResolvedValueOnce(
        Response.json({
          id: 123,
          title: "Test",
          total: 0,
          page: 1,
          size: 10,
          items: [],
        }),
      );
      await read();
      const [url, options] = fetchMock.mock.calls.at(-1)!;
      expect(new Headers(options!.headers).get("Cookie")).toBe(
        verification ? `jbcl_verified_human=${verification}` : null,
      );
      expect(options?.cache).not.toBe("no-store");
      if (String(url).includes("/by-roblox-id/"))
        expect(options?.credentials).toBe("include");
      if (String(url).includes("/v2/items/"))
        expect(options?.next?.revalidate).toBe(300);
    }
  }
});

test("login and account deletion forward verification without replacing their selected session token", async () => {
  for (const [path, method, token] of [
    ["../../app/api/auth/login/route.ts", "POST", "new-session"],
    ["../../app/api/users/delete/route.ts", "DELETE", "existing-session"],
  ] as const) {
    const calls: RequestInit[] = [];
    let upstreamStatus = 200;
    const exports = {} as Record<
      string,
      (request: NextRequest) => Promise<Response>
    >;
    runInNewContext(
      transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
        compilerOptions: { module: ModuleKind.CommonJS },
      }).outputText,
      {
        exports,
        process: { env: { RAILWAY_ENVIRONMENT_NAME: "production" } },
        Response,
        fetch: async (_url: string, options: RequestInit) => {
          calls.push(options);
          return Response.json({ id: "123" }, { status: upstreamStatus });
        },
        require: (name: string) => {
          if (name === "next/server") return { NextResponse };
          if (name === "@/utils/api/api")
            return {
              PUBLIC_API_URL: "https://api.example.com",
              BASE_API_URL: "https://api.example.com",
            };
          if (name === "@/utils/api/verificationHeaders")
            return { getHumanVerificationHeaders };
          if (name === "@/utils/api/routeAuth")
            return { getAuthToken: async () => "existing-session" };
          if (name === "@/services/logger")
            return { createLogger: () => ({ error() {} }) };
          throw new Error(`Unexpected import ${name}`);
        },
      },
    );
    for (const verification of ["visitor-one", "visitor-two", undefined]) {
      const request = () =>
        new NextRequest("https://jailbreakchangelogs.com/api", {
          method,
          headers: {
            Cookie: `jbcl_token=stale-session; analytics=private${verification ? `; jbcl_verified_human=${verification}` : ""}`,
            "Content-Type": "application/json",
          },
          ...(method === "POST" ? { body: JSON.stringify({ token }) } : {}),
        });
      expect((await exports[method]!(request())).status).toBe(200);
      const options = calls.at(-1)!;
      const headers = new Headers(options.headers);
      expect(headers.get("Cookie")).toBe(
        verification ? `jbcl_verified_human=${verification}` : null,
      );
      expect(headers.get("Authorization")).toBe(token);
      expect(options.cache).toBe("no-store");
      upstreamStatus = 401;
      expect((await exports[method]!(request())).status).toBe(401);
      upstreamStatus = 200;
    }
  }
});
