import { expect, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import BadgesSection from "./BadgesSection";

test("badge numbers appear only on earned badges with a number", () => {
  for (const [earned, number, holders, label, exact] of [
    [true, 51, 120, "#51 of 120", "#51 of 120"],
    [true, 1234, 5678, "#1.2K of 5.7K", "#1,234 of 5,678"],
    [true, 1000000, 1000000, "#1M of 1M", "#1,000,000 of 1,000,000"],
    [true, null, 120, null, null],
    [false, null, 120, null, null],
    [false, 51, 120, null, null],
  ] as const) {
    const client = new QueryClient();
    client.setQueryData(
      ["user-badges", "123"],
      [
        {
          id: "power_user",
          name: "Power User",
          category: "website",
          description: "Use the website",
          earned,
          earned_at: earned ? 1762790400 : null,
          number,
          holders,
          current: 1,
          target: 1,
        },
      ],
    );
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <BadgesSection userId="123" />
      </QueryClientProvider>,
    );
    if (label) {
      expect(markup).toContain(`>${label}</span>`);
      expect(markup).toContain(`aria-label="${exact}"`);
    } else {
      expect(markup).not.toContain("#");
    }
    expect(markup).not.toContain("#null");
    client.clear();
  }
});

test("new badges have icons and unknown trading badges use the category icon", () => {
  const icons = [
    ["cash_5m", "cash", "banknotes"],
    ["on_the_grind", "cash", "bolt"],
    ["money_to_spare", "cash", "banknotes"],
    ["offshore_grinding", "cash", "globe-alt"],
    ["no_life", "cash", "fire"],
    ["true_dedication", "collector", "heart"],
    ["dealer", "trading", "currency-dollar"],
    ["businessman", "trading", "briefcase"],
    ["art_of_the_deal", "trading", "document-check"],
    ["con_artist", "trading", "face-smile"],
    ["gifter", "website", "gift"],
    ["local_celebrity", "website", "megaphone"],
    ["unanimous", "website", "hand-thumb-up"],
    ["unknown_trading_badge", "trading", "arrows-right-left"],
  ];
  for (const [id, category, icon] of icons) {
    const client = new QueryClient();
    client.setQueryData(
      ["user-badges", "123"],
      [
        {
          id,
          category,
          name: id,
          description: "Badge description",
          earned: true,
          earned_at: null,
          number: 1,
          holders: 1,
          current: 1,
          target: 1,
        },
      ],
    );
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <BadgesSection userId="123" />
      </QueryClientProvider>,
    );
    expect(markup).toContain(`data-icon="heroicons:${icon}"`);
    expect(markup).toContain("<svg");
    if (id === "cash_5m") expect(markup).toContain(">5M</span>");
    client.clear();
  }
});
