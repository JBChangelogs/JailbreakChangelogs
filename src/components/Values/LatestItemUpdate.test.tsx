import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Item, RecentChange } from "@/types";
import LatestItemUpdate, { getLatestRecordedChange } from "./LatestItemUpdate";

const change = (created_at: number, field = "cash_value"): RecentChange => ({
  changelog_id: 1,
  suggestion_id: 1,
  changed_by: "1",
  created_at,
  field,
  current_value: "1m",
  suggested_value: "1.5m",
});

const item = (overrides: Partial<Item> = {}) =>
  ({
    id: 587,
    name: "Hyper Shift",
    type: "Hyperchrome",
    last_updated: 1_792_123_149,
    ...overrides,
  }) as Item;

test("picks the newest recorded change regardless of API order", () => {
  const latest = getLatestRecordedChange(
    item({
      recent_changes: [
        change(1_792_000_000),
        change(1_792_123_100, "demand"),
        change(1_792_123_120, ""),
      ],
    }),
  );
  expect(latest?.field).toBe("demand");
});

test("skips changes without a field and handles missing history", () => {
  expect(
    getLatestRecordedChange(item({ recent_changes: [change(1, "")] })),
  ).toBeNull();
  expect(getLatestRecordedChange(item({ recent_changes: null }))).toBeNull();
  const html = renderToStaticMarkup(<LatestItemUpdate item={item()} />);
  expect(html).toContain("No value changes recorded yet.");
  expect(html).toContain('href="/item/Hyperchrome/Hyper%20Shift?tab=changes"');
});

test("links the item and its changelog and shows old → new values", () => {
  const html = renderToStaticMarkup(
    <LatestItemUpdate
      item={item({ recent_changes: [change(1_792_123_100)] })}
    />,
  );
  expect(html).toContain('href="/item/Hyperchrome/Hyper%20Shift"');
  expect(html).toContain('href="/items/changelogs/1"');
  expect(html).toContain("Old CASH VALUE");
  expect(html).toContain("New CASH VALUE");
  expect(html).toContain("1,000,000");
  expect(html).toContain("1,500,000");
});
