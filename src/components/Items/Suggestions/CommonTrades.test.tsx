import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CommonTradesDisplay } from "./CommonTrades";
import type { CommonTrade } from "./types";
import { getDemandColor, getTrendColor } from "@/utils/items/badgeColors";

const trades: CommonTrade[] = [
  {
    offering: [
      {
        id: 1,
        name: "Torpedo",
        type: "Vehicle",
        amount: 2,
        duped: true,
        cash_value: "30m",
        duped_value: "20m",
        demand: "High",
        duped_demand: "Low",
        trend: "Rising",
      },
    ],
    requesting: [{ id: 2, name: "Pixel", type: "Texture" }],
  },
];

test("detail common trades show values and use duped demand while unresolved items load", () => {
  const markup = renderToStaticMarkup(
    <CommonTradesDisplay trades={trades} appearance="detail" />,
  );
  for (const text of [
    "Cash Value",
    "30,000,000",
    "Duped Value",
    "20,000,000",
    "Duped Demand",
    "Low",
    "Rising",
    "×2",
    "Loading…",
  ]) {
    expect(markup).toContain(text);
  }
  expect(markup).not.toContain("High");
  expect(markup).toContain("bg-button-info text-form-button-text");
  expect(markup).toContain(getDemandColor("Low"));
  expect(markup).toContain(getTrendColor("Rising"));
  expect(markup).toContain("col-span-2 grid max-w-md grid-cols-2");
  expect(markup).not.toContain('rounded-lg border p-2"><dt');
  expect(markup).not.toContain("shadow-lg");
});

test("compact common trades omit market details", () => {
  const markup = renderToStaticMarkup(<CommonTradesDisplay trades={trades} />);
  expect(markup).toContain("Torpedo");
  expect(markup).not.toContain("Cash Value");
  expect(markup).not.toContain("Duped Demand");
  expect(markup).not.toContain("Based on current listed values");
});

test("comparison accounts for quantity and duped value in both directions", () => {
  const offering = trades[0].offering;
  const requesting = [
    { id: 2, name: "Pixel", type: "Texture", cash_value: "39m" },
  ];
  const render = (trade: CommonTrade) =>
    renderToStaticMarkup(
      <CommonTradesDisplay
        trades={[trade]}
        appearance="detail"
        showItemTypes
      />,
    );
  const markup = render({ offering, requesting });
  expect(markup).toContain("40M");
  expect(markup).toContain("39M");
  expect(markup).toContain(
    'Offering <span class="text-secondary-text normal-case">(2)</span>',
  );
  expect(markup).toContain(
    'Requesting <span class="text-secondary-text normal-case">(1)</span>',
  );
  expect(markup).toContain("Offering is 1M higher");
  expect(markup).toContain(
    'border-border-card bg-tertiary-bg text-primary-text col-span-2 row-start-1 rounded-lg border px-3 py-1.5 text-center text-sm leading-tight font-bold tabular-nums lg:col-span-1 lg:col-start-2 lg:row-start-1">Offering is 1M higher',
  );
  expect(markup).toContain("Based on current listed values");
  expect(markup).toContain("mr-1 h-3 w-3 shrink-0");
  expect(render({ offering: requesting, requesting: offering })).toContain(
    "Requesting is 1M higher",
  );
  expect(render({ offering, requesting: offering })).toContain(
    "Equal listed value",
  );
});

test("unknown values never count as zero or fall back to clean value for duped items", () => {
  for (const duped_value of [undefined, null, "N/A", "invalid"]) {
    const markup = renderToStaticMarkup(
      <CommonTradesDisplay
        trades={[
          {
            offering: [{ ...trades[0].offering[0], duped_value }],
            requesting: [{ id: 2, cash_value: "0" }],
          },
        ]}
        appearance="detail"
      />,
    );
    expect(markup).toContain("Comparison unavailable");
    expect(markup).not.toContain("Equal listed value");
    expect(markup).not.toContain(" higher");
  }
});
