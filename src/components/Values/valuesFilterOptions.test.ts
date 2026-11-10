import { expect, test } from "bun:test";
import { dropUnofferedFilters, isValidFilterSort } from "./valuesFilterOptions";

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
