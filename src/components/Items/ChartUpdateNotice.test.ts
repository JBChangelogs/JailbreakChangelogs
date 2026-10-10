import { expect, test } from "bun:test";
import { itemHistoryStaleTime } from "./ChartUpdateNotice";

const at = (iso: string) =>
  itemHistoryStaleTime({ state: { dataUpdatedAt: Date.parse(iso) } });
const MIN = 60_000;

test("stays fresh only until just after the nightly snapshot", () => {
  expect(at("2026-10-10T22:59:00Z")).toBe(11 * MIN);
  expect(at("2026-10-10T23:11:00Z")).toBe(60 * MIN);
  expect(at("2026-10-10T12:00:00Z")).toBe(60 * MIN);
});
