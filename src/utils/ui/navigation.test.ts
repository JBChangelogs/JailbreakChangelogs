import { expect, test } from "bun:test";
import { getNavigationHref, getNavigationSection } from "./navigation";

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

test("sidebar selects the most specific link in the destination's section", () => {
  for (const [path, href] of [
    ["/values", "/values"],
    ["/values/calculator", "/values/calculator"],
    ["/changelogs/timeline", "/changelogs/timeline"],
    ["/changelogs/123", "/changelogs"],
    ["/seasons/contracts", "/seasons/contracts"],
    ["/seasons/will-i-make-it", "/seasons/will-i-make-it"],
    ["/items/suggestions/123", "/items/suggestions"],
    ["/trading/ad/123", "/trading"],
    ["/inventories/123", "/inventories"],
    ["/", null],
    ["/settings", null],
    ["/values-other", null],
  ] as const) {
    expect(getNavigationHref(path)).toBe(href);
  }
});
