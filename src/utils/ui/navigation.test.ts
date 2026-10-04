import { expect, test } from "bun:test";
import { getNavigationSection } from "./navigation";

test("highlights the section containing a page, including nested routes", () => {
  for (const [path, section] of [
    ["/changelogs/timeline", "updates"],
    ["/dev/changelogs/2026/update", "updates"],
    ["/seasons/30", "seasons"],
    ["/seasons/contracts", "seasons"],
    ["/seasons/will-i-make-it", "trackers"],
    ["/values/calculator", "trading"],
    ["/item/vehicle/Torpedo", "trading"],
    ["/items/suggestions/123", "trading"],
    ["/trading/ad/123", "trading"],
    ["/inventories/123", "trackers"],
    ["/users/123", "community"],
    ["/supporting", "community"],
    ["/", null],
    ["/settings", null],
    ["/values-other", null],
    ["/ogden", null],
  ] as const) {
    expect(getNavigationSection(path)).toBe(section);
  }
});
