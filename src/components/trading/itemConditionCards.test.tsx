import { describe, expect, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";

import type { TradeItem } from "@/types/trading";
import { CalculatorItemGrid } from "@/components/Values/Calculator/CalculatorItemGrid";
import { ItemGrid } from "./ItemGrid";

const voidItem: TradeItem = {
  id: 108,
  name: "Void",
  type: "Rim",
  cash_value: "42m",
  duped_value: "33m",
  is_limited: 0,
  is_seasonal: 1,
  tradable: 1,
};

function renderItems(items: TradeItem[], grid: "calculator" | "trading") {
  return renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      {grid === "calculator" ? (
        <CalculatorItemGrid items={items} />
      ) : (
        <ItemGrid
          items={items.map((item) => ({ ...item, instanceId: undefined }))}
          title="Offering"
        />
      )}
    </QueryClientProvider>,
  );
}

for (const grid of ["calculator", "trading"] as const) {
  describe(`${grid} cards by item condition`, () => {
    test("clean, OG, and duped Void each get a separate card", () => {
      const markup = renderItems(
        [
          { ...voidItem, instanceId: "clean", isDuped: false, isOG: false },
          { ...voidItem, instanceId: "og", isDuped: false, isOG: true },
          { ...voidItem, instanceId: "duped", isDuped: true, isOG: false },
        ],
        grid,
      );

      expect(markup.match(/<img[^>]*alt="Void"/g)).toHaveLength(3);
      expect(markup).not.toContain("×2");
      expect(markup.match(/>Clean</g)).toHaveLength(1);
      expect(markup.match(/>OG</g)).toHaveLength(1);
      if (grid === "calculator")
        expect(markup).toMatch(/<button\b[^>]*>OG<\/button>/);
    });

    test("only copies with the same condition share a quantity card", () => {
      const markup = renderItems(
        [
          { ...voidItem, instanceId: "clean-1", isOG: false },
          { ...voidItem, instanceId: "clean-2", isOG: false },
          { ...voidItem, instanceId: "og", isOG: true },
        ],
        grid,
      );

      expect(markup.match(/<img[^>]*alt="Void"/g)).toHaveLength(2);
      expect(markup).toContain("×2");
    });
  });
}
