import { expect, test } from "bun:test";
import type {
  MarketplaceTheme,
  MarketplaceThemesPage,
} from "@/utils/api/userThemes";
import {
  applyMarketplaceEvent,
  marketplaceMatchesSearch,
  ownMarketplacePage,
  parseMarketplaceEvent,
  type MarketplaceEvent,
} from "./marketplaceRealtime";

const theme: MarketplaceTheme = {
  share_code: "ABCDEFGH",
  label: "Midnight",
  description: "Soft purple accents",
  scheme: "dark",
  vars: {},
  logo_filter: null,
  published_at: 123,
  user: { id: "1", username: "builder", global_name: "Jalen" },
};
const other = { ...theme, share_code: "K4SZ865G", label: "Sunrise" };
const page = (items = [theme]): MarketplaceThemesPage => ({
  items,
  total: items.length,
  page: 1,
  size: 24,
  total_pages: 1,
});

test("live search matches names, descriptions, authors, and exact share codes", () => {
  for (const query of [
    "midnight",
    " PURPLE ",
    "BUILDER",
    "Jalen",
    "id: abcdefgh",
    "",
  ])
    expect(marketplaceMatchesSearch(theme, query)).toBe(true);
  for (const query of ["Sunrise", "id:ABCDEFG", "id:K4SZ865G"])
    expect(marketplaceMatchesSearch(theme, query)).toBe(false);
});

test("live payloads are validated and theme colors and previews are sanitized", () => {
  const event = parseMarketplaceEvent({
    action: "marketplace_theme_published",
    data: {
      ...theme,
      vars: { "--color-link": "url(https://evil.example/x)" },
      previews: [
        { id: "x", kind: "desktop", url: "https://evil.example/image.png" },
      ],
    },
  });
  expect(event?.data).toMatchObject({
    vars: {},
    previews: [],
    description: theme.description,
  });
  for (const value of [
    null,
    {},
    { action: "other", data: theme },
    {
      action: "marketplace_theme_updated",
      data: { share_code: theme.share_code },
    },
    {
      action: "marketplace_theme_updated",
      data: { ...theme, description: {} },
    },
  ])
    expect(parseMarketplaceEvent(value)).toBeNull();
});

test("new matching themes prepend, keep page size and counts, and do not duplicate", () => {
  const previous = { ...page(), size: 1 };
  const event: MarketplaceEvent = {
    action: "marketplace_theme_published",
    data: other,
  };
  const next = applyMarketplaceEvent(previous, event, "purple", "newest")!;
  expect(next.items).toEqual([other]);
  expect(next.total).toBe(2);
  expect(next.total_pages).toBe(2);
  expect(previous.items).toEqual([theme]);
  expect(applyMarketplaceEvent(next, event, "purple", "newest")!.total).toBe(2);
  expect(applyMarketplaceEvent(previous, event, "no match", "newest")).toBe(
    previous,
  );
  expect(applyMarketplaceEvent(previous, event, "", "oldest")).toBe(previous);
  const later = { ...previous, page: 2 };
  expect(applyMarketplaceEvent(later, event, "", "newest")).toBe(later);
  expect(applyMarketplaceEvent(undefined, event, "", "newest")).toBeUndefined();
});

test("updates replace in place, remove themes that stop matching, and removals are idempotent", () => {
  const previous = page([theme, other]);
  const edited = { ...other, description: "Fresh blue accents" };
  const updated = applyMarketplaceEvent(
    previous,
    { action: "marketplace_theme_updated", data: edited },
    "",
    "newest",
  )!;
  expect(updated.items).toEqual([theme, edited]);
  expect(updated.total).toBe(2);
  const filtered = applyMarketplaceEvent(
    previous,
    { action: "marketplace_theme_updated", data: edited },
    "purple",
    "newest",
  )!;
  expect(filtered.items).toEqual([theme]);
  const removal: MarketplaceEvent = {
    action: "marketplace_theme_removed",
    data: { share_code: theme.share_code },
  };
  const removed = applyMarketplaceEvent(previous, removal, "", "newest")!;
  expect(removed.items).toEqual([other]);
  expect(removed.total).toBe(1);
  expect(applyMarketplaceEvent(removed, removal, "", "newest")).toBe(removed);
});

test("your themes tab lists published themes only, searched, sorted and paged", () => {
  const me = { id: "1", username: "builder" };
  const mine = [
    { ...theme, share_code: "AAAAAAAA", label: "Old", published_at: 1 },
    { ...theme, share_code: "BBBBBBBB", label: "New", published_at: 3 },
    { ...theme, share_code: "CCCCCCCC", label: "Draft", published_at: null },
  ];
  const newest = ownMarketplacePage(mine, me, "", "newest", 1);
  expect(newest.items.map((t) => t.label)).toEqual(["New", "Old"]);
  expect(newest.items[0].user).toEqual(me);
  expect(newest.total).toBe(2);
  expect(
    ownMarketplacePage(mine, me, "", "oldest", 1).items.map((t) => t.label),
  ).toEqual(["Old", "New"]);
  expect(ownMarketplacePage(mine, me, "new", "newest", 1).total).toBe(1);
  const paged = ownMarketplacePage(mine, me, "", "newest", 5, 1);
  expect([paged.page, paged.total_pages, paged.items[0].label]).toEqual([
    2,
    2,
    "Old",
  ]);
});
