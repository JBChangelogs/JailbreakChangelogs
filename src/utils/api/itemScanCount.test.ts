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
      assert.deepEqual(await fetchItemScanCount(49), { copyCount: 1234, dupedCopyCount: 25, signedCopyCount: null, signedCounts: null });
      response = Response.json({ copy_count: 0, duped_copy_count: 0 });
      assert.deepEqual(await fetchItemScanCount(49), { copyCount: 0, dupedCopyCount: 0, signedCopyCount: null, signedCounts: null });
      response = Response.json({ copy_count: 10 });
      assert.deepEqual(await fetchItemScanCount(49), { copyCount: 10, dupedCopyCount: null, signedCopyCount: null, signedCounts: null });
      for (const value of [-1, "25", null]) {
        response = Response.json({ copy_count: 10, duped_copy_count: value });
        assert.deepEqual(await fetchItemScanCount(49), { copyCount: 10, dupedCopyCount: null, signedCopyCount: null, signedCounts: null });
      }
      response = Response.json({ copy_count: -1, duped_copy_count: 5 });
      assert.deepEqual(await fetchItemScanCount(49), { copyCount: null, dupedCopyCount: 5, signedCopyCount: null, signedCounts: null });
      response = Response.json({ copy_count: 690, duped_copy_count: 507, signed_copy_count: 2,
        signed_counts: [{ sign: "epic_tank", count: 2 }, { sign: "badcc", count: 1 }] });
      assert.deepEqual(await fetchItemScanCount(49), {
        copyCount: 690, dupedCopyCount: 507, signedCopyCount: 2,
        signedCounts: [{ sign: "epic_tank", count: 2 }, { sign: "badcc", count: 1 }],
      });
      response = Response.json({ signed_copy_count: 0, signed_counts: [] });
      assert.deepEqual(await fetchItemScanCount(49), {
        copyCount: null, dupedCopyCount: null, signedCopyCount: 0, signedCounts: [],
      });
      for (const value of [-1, "2", null]) {
        response = Response.json({ signed_copy_count: value, signed_counts: value });
        assert.deepEqual(await fetchItemScanCount(49), {
          copyCount: null, dupedCopyCount: null, signedCopyCount: null, signedCounts: null,
        });
      }
      response = Response.json({ signed_counts: [null, {}, { sign: "", count: 1 },
        { sign: "badcc", count: -1 }, { sign: "asimo3089", count: "2" },
        { sign: "epic_tank", count: 0 }] });
      assert.deepEqual((await fetchItemScanCount(49)).signedCounts, [{ sign: "epic_tank", count: 0 }]);
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
