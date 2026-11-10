import { expect, test } from "bun:test";
import {
  dropUnofferedFilters,
  isValidFilterSort,
  keepSingleTypeFilter,
  toggleFilterSort,
} from "./valuesFilterOptions";

test("demand/trend filters stay valid before the API filter list loads", () => {
  for (const value of [
    "demand-very-low",
    "demand-close-to-none",
    "trend-hoarded",
    "name-rims",
    "favorites",
  ])
    expect(isValidFilterSort(value)).toBe(true);
  for (const value of ["", "demand-", "trend-Bad", "name-unknown", "cash-desc"])
    expect(isValidFilterSort(value)).toBe(false);
});

test("single mode limits only the category; other filters stack", () => {
  // Demand, trend and status chips add to the selection in single mode.
  expect(
    toggleFilterSort(["name-rims", "demand-low"], "demand-very-low", "single"),
  ).toEqual(["name-rims", "demand-low", "demand-very-low"]);
  // Picking another category replaces only the category.
  expect(
    toggleFilterSort(["name-rims", "demand-low"], "name-vehicles", "single"),
  ).toEqual(["demand-low", "name-vehicles"]);
  // Deselecting removes just that filter.
  expect(
    toggleFilterSort(["name-rims", "demand-low"], "name-rims", "single"),
  ).toEqual(["demand-low"]);
  expect(toggleFilterSort(["name-rims"], "name-vehicles", "multi")).toEqual([
    "name-rims",
    "name-vehicles",
  ]);
  expect(
    keepSingleTypeFilter([
      "name-rims",
      "trend-hoarded",
      "name-vehicles",
      "name-limited-items",
    ]),
  ).toEqual(["trend-hoarded", "name-vehicles", "name-limited-items"]);
});

test("stale demand/trend keys are dropped once the API list loads", () => {
  const groups = [
    {
      label: "Demand",
      options: [{ value: "demand-low" as const, label: "Low" }],
    },
    {
      label: "Trend",
      options: [{ value: "trend-stable" as const, label: "Stable" }],
    },
  ];
  expect(
    dropUnofferedFilters(
      [
        "name-rims",
        "favorites",
        "demand-low",
        "demand-very-low",
        "trend-stable",
        "trend-hoarded",
      ],
      groups,
    ),
  ).toEqual(["name-rims", "favorites", "demand-low", "trend-stable"]);
});
