import { expect, test } from "bun:test";

test("public API challenges remain verification requests across catalog, users, and shared errors", () => {
  const result = Bun.spawnSync({
    cmd: [
      process.execPath,
      "--eval",
      `
      import { strict as assert } from "node:assert";
      import {
        fetchPaginatedUsers, searchUsers, fetchUserById,
        fetchUserByIdForMetadata, fetchUserByRobloxId,
        fetchItemsBatch, fetchPartialItems, fetchItemFilterGroups,
        fetchItemSortGroups, fetchItemsClientPage, searchItemsClientPage,
        fetchLatestItem, fetchUserFavorites, getResponseErrorMessage,
        fetchItemClient, fetchSimilarItems, fetchSimilarItemSorts,
      } from "./src/utils/api/api.ts";
      import { VERIFICATION_REQUIRED_MESSAGE } from "./src/utils/api/verificationRequired.ts";
      import { createElement } from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import ProfileTabError from "./src/components/Profile/ProfileTabError.tsx";
      const challenge = () => Response.json(
        { detail: "Too many suspicious requests" },
        { status: 403, headers: { "Ban-Reference": "ref", "Retry-After": "60" } },
      );
      globalThis.fetch = async () => challenge();
      const readers = [
        () => fetchPaginatedUsers(), () => searchUsers("test"),
        () => fetchUserById("123"), () => fetchUserByIdForMetadata("123"),
        () => fetchUserByRobloxId("123"), () => fetchItemsBatch([1]),
        () => fetchPartialItems(["name"]), () => fetchItemFilterGroups(),
        () => fetchItemSortGroups(), () => fetchItemsClientPage(1),
        () => searchItemsClientPage("test", 1), () => fetchLatestItem(),
        () => fetchUserFavorites("123", true),
        () => fetchItemClient("Vehicle", "Test"),
        () => fetchSimilarItems(1, null, 6), () => fetchSimilarItemSorts(),
      ];
      for (const read of readers) {
        await assert.rejects(read(), error => {
          assert.equal(error.message, VERIFICATION_REQUIRED_MESSAGE);
          assert.ok(!error.message.startsWith("BANNED_USER:"));
          return true;
        });
      }
      assert.equal(await getResponseErrorMessage(challenge(), "Failed"), VERIFICATION_REQUIRED_MESSAGE);
      const markup = renderToStaticMarkup(createElement(ProfileTabError, {
        title: "Failed to load", message: VERIFICATION_REQUIRED_MESSAGE, onRetry: () => {},
      }));
      assert.ok(markup.includes("Verification required"));
      assert.ok(!markup.includes("Failed to load"));
      assert.ok(!markup.includes("Try again"));
      globalThis.fetch = async () => Response.json({ detail: "Forbidden" }, { status: 403 });
      await assert.rejects(fetchUserById("123"), /BANNED_USER: Forbidden/);
      assert.equal(await getResponseErrorMessage(await fetch("test"), "Failed"), "Forbidden");
      assert.equal(await getResponseErrorMessage(Response.json({ detail: "Too many requests" }, { status: 429 }), "Failed"), "Too many requests. Please try again shortly.");
    `,
    ],
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: "https://public-api.example.com",
      NEXT_PUBLIC_RAILWAY_ENVIRONMENT_NAME: "development",
    },
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(result.exitCode, result.stderr.toString()).toBe(0);
});
