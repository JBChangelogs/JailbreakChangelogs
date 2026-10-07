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

    expect(clean).toContain('title="High"');
    expect(clean).not.toContain("Duped Demand");
    expect(duped).toContain("Duped Demand");
    expect(duped).toContain('title="Low"');
    expect(duped).not.toContain('title="High"');
    expect(clean).toContain('title="Rising"');
    expect(duped).toContain('title="Rising"');
  });

  test("API duped flag selects and labels duped demand", () => {
    const markup = renderToStaticMarkup(
      <TradeItemMarketDetails item={{ ...item, duped: true }} />,
    );
    expect(markup).toContain("Duped Demand");
    expect(markup).toContain('title="Low"');
    expect(markup).not.toContain('title="High"');
  });

  test("missing duped demand stays unknown instead of showing clean demand", () => {
    const markup = renderToStaticMarkup(
      <TradeItemMarketDetails
        item={{ ...item, isDuped: true, duped_demand: null }}
        isDuped
      />,
    );

    expect(markup).toContain('title="Unknown"');
    expect(markup).not.toContain('title="High"');
    expect(markup).toContain('title="Rising"');
  });
});
