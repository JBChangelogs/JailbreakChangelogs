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
  test("a favorite variant includes its parent but still respects category and demand", () => {
    const items = [
      item(1, "Vehicle", "High"),
      item(2, "Vehicle", "High"),
      item(3, "Rim", "High"),
      item(4, "Vehicle", "Low"),
    ];

    const filtered = filterByTypes(
      items,
      ["favorites", "name-vehicles", "demand-high"],
      [{ item_id: "1-10" }, { item_id: "3" }, { item_id: "4" }],
    );

    expect(filtered.map((entry) => entry.id)).toEqual([1]);
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
