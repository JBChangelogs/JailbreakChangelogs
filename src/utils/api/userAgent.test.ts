import { expect, test } from "bun:test";

test("browser API requests omit custom user agents while server requests retain theirs", () => {
  const result = Bun.spawnSync({
    cmd: [
      process.execPath,
      "--eval",
      `
      import { strict as assert } from "node:assert";
      import * as api from "./src/utils/api/api.ts";
      import { fetchTradeOffers } from "./src/utils/trading/core.ts";
      const requests = [];
      globalThis.fetch = async (url, options) => {
        requests.push({ url, headers: new Headers(options?.headers) });
        return Response.json({});
      };
      await api.fetchUserById("123");
      assert.equal(requests.pop().headers.get("User-Agent"), "JailbreakChangelogs-UserProfile/1.0");
      await api.fetchHomepageStats();
      assert.equal(requests.pop().headers.get("User-Agent"), "JailbreakChangelogs-HomepageStats/1.0");

      globalThis.window = {};
      const calls = [
        () => api.fetchUserById("123"),
        () => api.fetchUserByRobloxId("123", { "X-Verification": "keep" }),
        () => api.searchDupeOwners("name"),
        () => api.searchDupeItemsByOwner("123", "car"),
        () => api.fetchInventoryData("@name"),
        () => api.fetchDupeFinderData("@name"),
        () => api.fetchOGSearchData("@name"),
        () => api.fetchRobloxUsersBatch(["123"]),
        () => api.fetchRobloxUsersBatchLeaderboard(["123"]),
        () => api.fetchUserNetworth("@name"),
        () => api.fetchUserMoneyHistory("@name"),
        () => api.fetchDuplicatesCount(),
        () => api.fetchTotalRobberiesLogged(),
        () => api.fetchRobberyServerRegionStats(),
        () => api.fetchMostDuplicatedItems(),
        () => api.fetchItemCountStats(),
        () => api.fetchTradeCountStats(),
        () => api.fetchUserScansLeaderboard(),
        () => api.fetchConnectedBots(),
        () => api.fetchQueueInfo(),
        () => api.fetchNetworthCapHistory(),
        () => api.fetchNetworthCap(),
        () => api.fetchHomepageImpactStats(),
        () => fetchTradeOffers(123),
      ];
      for (const call of calls) {
        const before = requests.length;
        await call();
        assert.ok(requests.length > before, "expected a browser request");
      }
      for (const request of requests)
        assert.equal(request.headers.has("User-Agent"), false, request.url);
      assert.equal(requests[1].headers.get("X-Verification"), "keep");
      assert.equal(requests[2].headers.get("X-Source"), "test-source");
      `,
    ],
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: "https://api.example",
      NEXT_PUBLIC_INVENTORY_API_URL: "https://inventory.example",
      NEXT_PUBLIC_INVENTORY_API_SOURCE_HEADER: "test-source",
    },
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(result.exitCode, result.stderr.toString()).toBe(0);
});
