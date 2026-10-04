import { expect, test } from "bun:test";
import { shareTrackerSnapshot } from "./trackerSnapshot";

const previous = [
  {
    id: "bank-a",
    status: 1,
    timestamp: 100,
    server: { players: [{ id: "player" }] },
  },
  { id: "museum-b", status: 1, timestamp: 99, server: { players: [] } },
];
const key = (item: (typeof previous)[number]) => item.id;

test("identical parsed snapshots reuse the array and all records", () => {
  expect(shareTrackerSnapshot(previous, structuredClone(previous), key)).toBe(
    previous,
  );
  expect(shareTrackerSnapshot(previous, structuredClone(previous))).toBe(
    previous,
  );
});

test("reordering snapshots preserves record references by identity", () => {
  const next = shareTrackerSnapshot(
    previous,
    structuredClone([...previous].reverse()),
    key,
  );
  expect(next[0]).toBe(previous[1]);
  expect(next[1]).toBe(previous[0]);
});

test("changed records update while unchanged records and nested data are reused", () => {
  const incoming = structuredClone(previous);
  incoming[0].status = 2;
  incoming[0].timestamp = 101;
  const next = shareTrackerSnapshot(previous, incoming, key);
  expect(next[0]).not.toBe(previous[0]);
  expect(next[0].status).toBe(2);
  expect(next[0].timestamp).toBe(101);
  expect(next[0].server).toBe(previous[0].server);
  expect(next[1]).toBe(previous[1]);
  expect(previous[0].status).toBe(1);
});

test("new records and removed records follow the incoming snapshot", () => {
  const added = { ...previous[0], id: "tomb-c" };
  const next = shareTrackerSnapshot(
    previous,
    [structuredClone(previous[1]), added],
    key,
  );
  expect(next).toEqual([previous[1], added]);
  expect(next[0]).toBe(previous[1]);
  expect(shareTrackerSnapshot(next, [], key)).toEqual([]);
});
