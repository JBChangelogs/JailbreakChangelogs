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
    expect(duped).toContain('title="Low"');
    expect(duped).not.toContain('title="High"');
    expect(clean).toContain('title="Rising"');
    expect(duped).toContain('title="Rising"');
  });

  test("unknown top-level fields do not hide known variant demand and trend", () => {
    const variant: TradeItem = {
      ...item,
      isDuped: true,
      duped_demand: "N/A",
      trend: "N/A",
      data: {
        name: "Variant",
        type: "Vehicle",
        creator: null,
        is_seasonal: 0,
        cash_value: "30M",
        duped_value: "20M",
        price: "N/A",
        is_limited: 1,
        duped_owners: "",
        notes: null,
        demand: "High",
        duped_demand: "Decent",
        trend: "Stable",
        description: null,
        health: null,
        tradable: true,
        last_updated: 0,
      },
    };

    const markup = renderToStaticMarkup(
      <TradeItemMarketDetails item={variant} isDuped />,
    );
    expect(markup).toContain('title="Decent"');
    expect(markup).toContain('title="Stable"');
    expect(markup).not.toContain('title="Unknown"');
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
