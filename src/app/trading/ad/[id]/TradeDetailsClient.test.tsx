import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { createElement, type ReactNode } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type { TradeItem } from "@/types/trading";
import {
  parseValueString,
  formatTradeValue,
} from "@/components/Values/Calculator/calculatorUtils";
import {
  getTradeItemDetailHref,
  getTradeItemImagePath,
  isCustomTradeItem,
} from "@/utils/trading/tradeItems";
import { TradeItemMarketDetails } from "@/components/trading/TradeItemContext";
import { DupedBadge } from "@/components/trading/DupedBadge";
import { OgBadge } from "@/components/trading/OgBadge";
import { hasItemValue } from "@/utils/items/itemValue";

const source = readFileSync(
  new URL("./TradeDetailsClient.tsx", import.meta.url),
  "utf8",
);
const previewSource =
  source.slice(
    source.indexOf("const groupTradeItems"),
    source.indexOf("const getOfferStatusLabel"),
  ) +
  source.slice(
    source.indexOf("const TradeSidePreview"),
    source.indexOf("const normalizeOfferItems"),
  );
const exports = {} as {
  Preview: (props: {
    title: "Offering" | "Requesting";
    items: TradeItem[];
  }) => ReactNode;
};
const passthrough = ({ children }: { children: ReactNode }) => children;
runInNewContext(
  transpileModule(previewSource + "\nexports.Preview = TradeSidePreview;", {
    compilerOptions: { jsx: JsxEmit.ReactJSX, module: ModuleKind.CommonJS },
  }).outputText,
  {
    exports,
    require: () => jsxRuntime,
    parseValueString,
    formatTradeValue,
    getTradeItemDetailHref,
    getTradeItemImagePath,
    isCustomTradeItem,
    hasItemValue,
    TradeItemMarketDetails,
    DupedBadge,
    OgBadge,
    Tooltip: passthrough,
    TooltipTrigger: passthrough,
    TradeItemHoverTooltip: () => null,
    Icon: ({ className }: { className: string }) =>
      createElement("svg", { className }),
    Image: ({
      src,
      alt,
      className,
    }: {
      src: string;
      alt: string;
      className: string;
    }) => createElement("img", { src, alt, className }),
    Link: ({
      href,
      children,
      className,
    }: {
      href: string;
      children: ReactNode;
      className: string;
    }) => createElement("a", { href, className }, children),
    getCategoryColor: () => "#777777",
    getCategoryIcon: () => null,
    IMAGE_PLACEHOLDER: "empty",
    handleImageError: () => {},
  },
);

const item: TradeItem = {
  id: 1,
  name: "Torpedo",
  type: "Vehicle",
  cash_value: "30M",
  duped_value: "20M",
  is_limited: 1,
  tradable: 1,
  demand: "High",
  duped_demand: "Low",
  trend: "Stable",
};
const render = (
  items: TradeItem[],
  title: "Offering" | "Requesting" = "Offering",
) => renderToStaticMarkup(createElement(exports.Preview, { title, items }));

test("one item uses a horizontal card with visible market details and its listing link", () => {
  const markup = render([item]);
  expect(markup).toContain("ml-3 w-2/5");
  expect(markup).toContain("w-full max-w-md");
  expect(markup).toContain("Listed total");
  expect(markup).toContain("30,000,000");
  expect(markup).toContain('title="High"');
  expect(markup).toContain('title="Stable"');
  expect(markup).toContain('href="/item/Vehicle/Torpedo"');
  expect(markup).toContain("group/item-card");
  expect(markup).toContain("group-hover/item-card:text-link-hover");
  expect(markup).toContain("group-focus-visible/item-card:text-link-hover");
});

test("two grouped cards share the panel width and totals retain condition and quantity", () => {
  const markup = render(
    [item, { ...item, isDuped: true }, { ...item, isDuped: true }],
    "Requesting",
  );
  expect(markup).toContain("flex flex-wrap items-start gap-3");
  expect(markup).toContain("min-w-0 flex-1");
  expect(markup).not.toContain("w-44");
  expect(markup).toContain("max-h-32 w-full");
  expect(markup).toContain('class="object-contain"');
  expect(markup).not.toContain("ml-3 w-2/5");
  expect(markup).toContain("70,000,000");
  expect(markup).toContain("Duped: 40,000,000");
  expect(markup).toContain('title="Low"');
  expect(markup).toContain("×2");
  expect(markup).toContain("rotate-180");
});

test("custom tags and empty sides do not display invented values or market details", () => {
  const custom = render([
    { ...item, id: -1, instanceId: "adds", type: "Custom", name: "Adds" },
  ]);
  expect(custom).toContain("Listed total");
  expect(custom).toContain(">N/A</p>");
  expect(custom).not.toContain("Demand");
  expect(custom).not.toContain("Cash value");
  expect(custom).toContain("object-contain p-2");
  expect(custom).not.toContain("hidden h-6");
  expect(render([])).toContain("No items listed");
});

test("multiple cards keep compact widths and wrap within the panel", () => {
  const markup = render([item, { ...item, id: 2 }, { ...item, id: 3 }]);
  expect(markup).toContain("flex flex-wrap items-start gap-3");
  expect(markup).toContain("w-44");
});

test("zero value breakdowns are omitted while nonzero cash and duped totals remain", () => {
  const clean = render([item]);
  expect(clean).toContain("Cash: 30,000,000");
  expect(clean).not.toContain("Duped:");
  const duped = render([{ ...item, isDuped: true }]);
  expect(duped).toContain("Duped: 20,000,000");
  expect(duped).not.toContain("Cash:");
});

test("unvalued sides keep their total label without inventing a zero total", () => {
  for (const value of [null, "N/A", "", "null"]) {
    const markup = render([{ ...item, cash_value: value }]);
    expect(markup).toContain("Listed total");
    expect(markup).toContain(">N/A</p>");
    expect(markup).not.toContain(" (partial)");
  }
  expect(render([])).toContain(">N/A</p>");
  expect(render([{ ...item, cash_value: "0" }])).toContain(">0</p>");
  expect(render([{ ...item, isDuped: true, duped_value: null }])).toContain(
    ">N/A</p>",
  );
});

test("mixed valued and unvalued items identify the total as partial", () => {
  const markup = render([item, { ...item, id: 2, cash_value: null }]);
  expect(markup).toContain("Listed total (partial)");
  expect(markup).toContain("30,000,000");
});
