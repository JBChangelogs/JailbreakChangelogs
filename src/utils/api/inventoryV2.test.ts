import { expect, test } from "bun:test";

test("inventory v2 callers pass usernames directly and preserve errors and batch profiles", () => {
  const result = Bun.spawnSync({
    cmd: [
      process.execPath,
      "--eval",
      `
      import { strict as assert } from "node:assert";
      import {
        inventoryUserPath, fetchInventoryData, fetchUserNetworth,
        fetchUserMoneyHistory, fetchOGSearchData, fetchDupeFinderData,
        fetchRobloxUserProfile, fetchRobloxUsersBatch,
        fetchRobloxUsersBatchLeaderboard,
      } from "./src/utils/api/api.ts";
      import { createElement } from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { InventoryLoadErrorNotice } from "./src/components/Inventory/InventoryLoadErrorNotice.tsx";
      import { QueryClient } from "@tanstack/react-query";
      import { userInventoryQueryOptions, isInventoryNotFound } from "./src/utils/api/userInventoryQuery.ts";
      import { VERIFICATION_REQUIRED_MESSAGE } from "./src/utils/api/verificationRequired.ts";

      const calls = [];
      let body = [];
      let status = 200;
      let responseHeaders = {};
      globalThis.fetch = async (url, options) => {
        calls.push({ url, options });
        return Response.json(body, { status, headers: responseHeaders });
      };
      const base = "https://inventory.example/v2/users/";
      const client = new QueryClient();
      try {
        for (const [input, path] of [["123", "123"], ["v3kmw", "%40v3kmw"], ["@v3kmw", "%40v3kmw"]]) {
          assert.equal(inventoryUserPath(input), path);
          for (const [fn, suffix] of [
            [fetchInventoryData, ""], [fetchUserNetworth, "/networth/history"],
            [fetchUserMoneyHistory, "/money/history"], [fetchOGSearchData, "/original-items"],
            [fetchDupeFinderData, "/duplicates"], [fetchRobloxUserProfile, "/profile"],
          ]) {
            const before = calls.length;
            await fn(input);
            assert.equal(calls.length, before + 1);
            assert.equal(calls.at(-1).url, base + path + suffix);
            assert.equal(calls.at(-1).options.headers.Authorization, "local-test-session");
            assert.equal(calls.at(-1).options.credentials, "include");
            assert.ok(calls.at(-1).options.headers["X-Source"]);
          }
          await client.fetchQuery(userInventoryQueryOptions(input));
          assert.equal(calls.at(-1).url, base + path + "/inventory?nocache=false");
        }
        assert.equal(inventoryUserPath("name/other?x=1"), "%40name%2Fother%3Fx%3D1");

        status = 404;
        body = { detail: { error: "username_not_found", message: "No Roblox user with that username." } };
        assert.equal((await fetchInventoryData("missing")).error, "username_not_found");
        assert.equal((await fetchOGSearchData("missing")).error, "username_not_found");
        assert.match((await fetchDupeFinderData("missing")).error, /Username.*not found/);
        for (const [position, delay, expected] of [
          [0, 0, "Inventory not found. In queue: position 0 (~0 s)"],
          [4, 1.8, "Inventory not found. In queue: position 4 (~1.8 s)"],
          [null, null, "Inventory not found."],
        ]) {
          body = { error: "inventory_not_found", message: "Inventory not found.", user_id: "123", queue_position: position, queue_delay: delay };
          assert.deepEqual(await fetchInventoryData("v3kmw"), { ...body, message: expected });
          const html = renderToStaticMarkup(createElement(InventoryLoadErrorNotice, {
            notFound: true, message: expected, onUseValuesList: () => {},
          }));
          assert.ok(html.includes(expected));
          assert.equal(html.includes("In queue:"), position !== null);
          await assert.rejects(client.fetchQuery(userInventoryQueryOptions("123")), error => {
            assert.equal(isInventoryNotFound(error), true);
            assert.equal(error.message, expected);
            return true;
          });
        }
        body = { error: "user_not_found", message: "User not found." };
        assert.equal((await fetchInventoryData("123")).error, "fetch_error");
        await assert.rejects(client.fetchQuery(userInventoryQueryOptions("123")), error => {
          assert.equal(isInventoryNotFound(error), false);
          return true;
        });
        assert.equal((await fetchDupeFinderData("123")).error, "No recorded dupes found for this user.");
        status = 502;
        body = { detail: { error: "username_lookup_failed" } };
        assert.equal((await fetchOGSearchData("v3kmw")).error, "username_lookup_failed");

        status = 403;
        for (const challenge of [
          { detail: { error: "challenge_required", message: "Confirm you're human." } },
          { message: "Blocked" },
        ]) {
          body = challenge;
          responseHeaders = "detail" in challenge ? {} : { "Ban-Reference": "ref" };
          assert.equal((await fetchInventoryData("123")).message, VERIFICATION_REQUIRED_MESSAGE);
          assert.equal((await fetchOGSearchData("123")).message, VERIFICATION_REQUIRED_MESSAGE);
          assert.equal((await fetchDupeFinderData("123")).error, VERIFICATION_REQUIRED_MESSAGE);
          await assert.rejects(client.fetchQuery(userInventoryQueryOptions("123")), error => {
            assert.equal(error.code, "challenge_required");
            assert.equal(error.message, VERIFICATION_REQUIRED_MESSAGE);
            assert.equal(isInventoryNotFound(error), false);
            return true;
          });
          const html = renderToStaticMarkup(createElement(InventoryLoadErrorNotice, {
            notFound: false, message: VERIFICATION_REQUIRED_MESSAGE,
            onUseValuesList: () => {}, className: "mt-6",
          }));
          assert.ok(html.includes("Verification required"));
          assert.ok(html.includes(VERIFICATION_REQUIRED_MESSAGE));
          assert.ok(html.includes("mt-6"));
          assert.ok(!html.includes("Try again"));
        }
        responseHeaders = {};
        body = { detail: { error: "forbidden" } };
        assert.equal((await fetchInventoryData("123")).error, "fetch_error");
        assert.equal((await fetchOGSearchData("123")).error, "api_error");
        assert.notEqual((await fetchDupeFinderData("123")).error, VERIFICATION_REQUIRED_MESSAGE);
        await assert.rejects(client.fetchQuery(userInventoryQueryOptions("123")), error => {
          assert.notEqual(error.message, VERIFICATION_REQUIRED_MESSAGE);
          return true;
        });

        status = 200;
        body = { id: 123, name: "v3kmw", displayName: "none" };
        const profile = await fetchRobloxUserProfile("v3kmw");
        assert.equal(profile.username, "v3kmw");
        assert.equal(profile.displayName, "v3kmw");
        body = { error: "unavailable" };
        assert.equal(await fetchRobloxUserProfile("v3kmw"), null);

        body = { "123": { id: 123, name: "v3kmw", displayName: "none" } };
        for (const fn of [fetchRobloxUsersBatch, fetchRobloxUsersBatchLeaderboard]) {
          const users = await fn(["123", "invalid", "456"]);
          assert.equal(calls.at(-1).url, base + "batch");
          assert.deepEqual(JSON.parse(calls.at(-1).options.body), { ids: [123, 456] });
          assert.equal(calls.at(-1).options.method, "POST");
          assert.equal(users["123"].displayName, "v3kmw");
          const before = calls.length;
          assert.deepEqual(await fn(["invalid"]), {});
          assert.equal(calls.length, before);
          status = 400;
          assert.deepEqual(await fn(["123"]), {});
          status = 200;
        }
        for (const request of calls)
          assert.equal(new Headers(request.options?.headers).has("User-Agent"), false);
      } finally {
        client.clear();
      }
      `,
    ],
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXT_PUBLIC_INVENTORY_API_URL: "https://inventory.example",
      NEXT_PUBLIC_INVENTORY_API_SOURCE_HEADER: "test-source",
      NEXT_PUBLIC_RAILWAY_ENVIRONMENT_NAME: "development",
      NEXT_PUBLIC_DEV_TOKEN: "local-test-session",
    },
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(result.exitCode, result.stderr.toString()).toBe(0);
});
