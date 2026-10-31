import { expect, test } from "bun:test";

test("item scan counts preserve zero and handle missing, invalid, and failed responses", () => {
  const result = Bun.spawnSync({
    cmd: [
      process.execPath,
      "--eval",
      `
      import { strict as assert } from "node:assert";
      import { fetchItemScanCount } from "./src/utils/api/api.ts";
      let response;
      globalThis.fetch = async (url) => {
        assert.equal(url, "https://inventory.example/items/49/scans/count?days=30");
        return response;
      };
      response = Response.json({ copy_count: 1234, duped_copy_count: 25 });
      assert.deepEqual(await fetchItemScanCount(49), { copyCount: 1234, dupedCopyCount: 25 });
      response = Response.json({ copy_count: 0, duped_copy_count: 0 });
      assert.deepEqual(await fetchItemScanCount(49), { copyCount: 0, dupedCopyCount: 0 });
      response = Response.json({ copy_count: 10 });
      assert.deepEqual(await fetchItemScanCount(49), { copyCount: 10, dupedCopyCount: null });
      for (const value of [-1, "25", null]) {
        response = Response.json({ copy_count: 10, duped_copy_count: value });
        assert.deepEqual(await fetchItemScanCount(49), { copyCount: 10, dupedCopyCount: null });
      }
      response = Response.json({ copy_count: -1, duped_copy_count: 5 });
      assert.deepEqual(await fetchItemScanCount(49), { copyCount: null, dupedCopyCount: 5 });
      response = new Response(null, { status: 503 });
      assert.equal(await fetchItemScanCount(49), null);
      globalThis.fetch = async () => { throw new Error("Offline"); };
      assert.equal(await fetchItemScanCount(49), null);
    `,
    ],
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXT_PUBLIC_INVENTORY_API_URL: "https://inventory.example",
    },
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(result.exitCode, result.stderr.toString()).toBe(0);
});
