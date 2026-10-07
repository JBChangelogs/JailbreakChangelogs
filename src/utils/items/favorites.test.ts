import { expect, test } from "bun:test";
import type { FavoriteItem } from "@/types";
import { favoriteCatalogItems, filterFavoriteItems } from "./favorites";

const favorites: FavoriteItem[] = Array.from({ length: 60 }, (_, index) => ({
  created_at: index,
  item: {
    id: index + 1,
    name: `Vehicle ${index + 1}`,
    type: "Vehicle",
    cash_value: `${index + 1}m`,
    duped_value: "2m",
    demand: "High",
    duped_demand: "Low",
    trend: "Stable",
    tradable: 1,
    is_limited: 1,
    season: null,
    level: index === 59 ? 10 : null,
    last_updated: index,
  },
}));

test("favorites render and sort the complete API collection across catalog pages", () => {
  const items = filterFavoriteItems(favorites, "", ["favorites"], "cash-desc");
  expect(items).toHaveLength(60);
  expect(items[0].id).toBe(60);
  expect(items.slice(50).map((item) => item.id)).toEqual([
    10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
  ]);
  expect(favoriteCatalogItems(favorites)[59]).toMatchObject({
    cash_value: "60m",
    duped_demand: "Low",
    is_seasonal: 1,
    tradable: 1,
    is_limited: 1,
    last_updated: 59,
  });
  expect(filterFavoriteItems([], "", [], "cash-desc")).toEqual([]);
});

test("favorites combine search, category, season, demand, trend and range filters", () => {
  const filters = [
    "favorites",
    "name-vehicles",
    "name-seasonal-items",
    "name-limited-items",
    "demand-high",
    "trend-stable",
  ] as const;
  expect(
    filterFavoriteItems(
      favorites,
      "Vehicle 60",
      [...filters],
      "cash-desc",
      55_000_000,
      65_000_000,
    ).map((item) => item.id),
  ).toEqual([60]);
  expect(
    filterFavoriteItems(
      favorites,
      "",
      filters.filter((filter) => filter !== "name-limited-items"),
      "cash-desc",
      undefined,
      50_000_000,
    ),
  ).toEqual([]);
  expect(
    filterFavoriteItems(favorites, "", ["name-rims"], "cash-desc"),
  ).toEqual([]);
  expect(filterFavoriteItems(favorites, "", [], "demand-low")).toEqual([]);
});
