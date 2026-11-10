import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { TradeItem } from "@/types/trading";
import { TradeItemMarketDetails } from "./TradeItemContext";

const item: TradeItem = {
  id: 1,
  name: "Torpedo",
  type: "Vehicle",
  cash_value: "30M",
  duped_value: "20M",
  is_limited: 1,
  is_seasonal: 0,
  tradable: 1,
  demand: "High",
  duped_demand: "Low",
  trend: "Rising",
};

describe("market badges shared by calculator and trading forms", () => {
  test("switching to duped displays duped demand and retains the shared trend", () => {
    const clean = renderToStaticMarkup(<TradeItemMarketDetails item={item} />);
    const duped = renderToStaticMarkup(
      <TradeItemMarketDetails item={{ ...item, isDuped: true }} />,
    );

    expect(clean).toContain(">High<");
    expect(clean).not.toContain("Duped Demand");
    expect(duped).not.toContain("Duped Demand");
    expect(duped).toContain(">Demand</span>");
    expect(duped).toContain(">Low<");
    expect(duped).not.toContain(">High<");
    expect(clean).toContain(">Rising<");
    expect(duped).toContain(">Rising<");
  });

  test("API duped flag selects duped demand with the compact label", () => {
    const markup = renderToStaticMarkup(
      <TradeItemMarketDetails item={{ ...item, duped: true }} />,
    );
    expect(markup).not.toContain("Duped Demand");
    expect(markup).toContain(">Demand</span>");
    expect(markup).toContain(">Low<");
    expect(markup).not.toContain(">High<");
  });

  test("missing duped demand stays unknown instead of showing clean demand", () => {
    const markup = renderToStaticMarkup(
      <TradeItemMarketDetails
        item={{ ...item, isDuped: true, duped_demand: null }}
        isDuped
      />,
    );

    expect(markup).toContain(">Unknown<");
    expect(markup).not.toContain(">High<");
    expect(markup).toContain(">Rising<");
  });
});
