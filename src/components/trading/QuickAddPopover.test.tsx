import { expect, spyOn, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { TradeItem } from "@/types/trading";
import { fetchPartialItems } from "@/utils/api/api";
import * as requests from "@/utils/api/apiDevToken";
import { TRADE_ITEM_FIELDS } from "@/utils/api/fetchTradeItemsByIds";
import { TradeItemMarketDetails } from "./TradeItemContext";

test("Quick Add fetches duped market fields for newly added items", async () => {
  const voidRow = {
    id: 108,
    name: "Void",
    type: "Rim",
    cash_value: "42m",
    duped_value: "33m",
    is_limited: 0,
    is_seasonal: 1,
    season: 1,
    level: "9",
    tradable: 1,
    demand: "Low",
    duped_demand: "Very Low",
    trend: "Stable",
  };
  const request = spyOn(requests, "buildApiFetchRequest").mockReturnValue({
    url: "https://api.example.test/v2/items/partial",
    headers: {},
  });
  const fakeFetch = Object.assign(
    async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      expect(url.pathname).toBe("/v2/items/partial");
      const fields = new Set(url.searchParams.get("fields")?.split(","));
      return Response.json([
        Object.fromEntries(
          Object.entries(voidRow).filter(([key]) => fields.has(key)),
        ),
      ]);
    },
    { preconnect: globalThis.fetch.preconnect },
  );
  const fetch = spyOn(globalThis, "fetch").mockImplementation(fakeFetch);

  try {
    const items = await fetchPartialItems<TradeItem>(TRADE_ITEM_FIELDS);
    const selected = { ...items[0], isDuped: true, isOG: false };
    const markup = renderToStaticMarkup(
      <TradeItemMarketDetails item={selected} isDuped />,
    );

    expect(selected.duped_value).toBe("33m");
    expect(markup).toContain('title="Very Low"');
    expect(markup).toContain('title="Stable"');
    expect(markup).not.toContain('title="Unknown"');
  } finally {
    fetch.mockRestore();
    request.mockRestore();
  }
});
