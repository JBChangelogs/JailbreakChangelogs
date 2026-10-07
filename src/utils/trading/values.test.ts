import { describe, expect, test } from "bun:test";

import type { Item } from "@/types";
import { filterByTypes } from "./values";

function item(id: number, type: string, demand: string): Item {
  return {
    id,
    name: `Item ${id}`,
    type,
    demand,
    creator: null,
    is_seasonal: 0,
    season: null,
    level: null,
    cash_value: "1M",
    duped_value: null,
    price: "N/A",
    is_limited: 0,
    duped_owners: [],
    notes: null,
    duped_demand: null,
    trend: null,
    description: null,
    health: null,
    tradable: 1,
    last_updated: 0,
  };
}

describe("combined value page filters", () => {
  test("seasonal filtering uses season or level instead of the legacy flag", () => {
    const base = item(1, "Vehicle", "High");
    const filtered = filterByTypes(
      [
        { ...base, id: 1, is_seasonal: 1 },
        { ...base, id: 2, season: 1 },
        { ...base, id: 3, level: "10" },
        { ...base, id: 4, season: 0, level: null },
      ],
      ["name-seasonal-items"],
    );
    expect(filtered.map((entry) => entry.id)).toEqual([2, 3, 4]);
  });

  test("favorites still respect category and demand filters", () => {
    const items = [
      item(1, "Vehicle", "High"),
      item(2, "Vehicle", "High"),
      item(3, "Rim", "High"),
      item(4, "Vehicle", "Low"),
    ];

    const filtered = filterByTypes(
      items,
      ["favorites", "name-vehicles", "demand-high"],
      [{ item_id: "1" }, { item_id: "3" }, { item_id: "4" }],
    );

    expect(filtered.map((entry) => entry.id)).toEqual([1]);
  });

  test("deprecated compound favorite IDs do not match a current item", () => {
    expect(
      filterByTypes(
        [item(1, "Vehicle", "High")],
        ["favorites"],
        [{ item_id: "1-10" }],
      ),
    ).toEqual([]);
  });

  test("includes either selected category but requires the selected demand", () => {
    const items = [
      item(1, "Vehicle", "High"),
      item(2, "Spoiler", "High"),
      item(3, "Vehicle", "Low"),
      item(4, "Spoiler", "Low"),
      item(5, "Rim", "High"),
    ];

    const filtered = filterByTypes(items, [
      "name-vehicles",
      "name-spoilers",
      "demand-high",
    ]);

    expect(filtered.map((entry) => entry.id)).toEqual([1, 2]);
  });
});
