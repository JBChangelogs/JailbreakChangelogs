import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { DuplicatedItem } from "@/utils/api/api";
import MostDuplicatedItems from "./MostDuplicatedItems";

function render(items: DuplicatedItem[]) {
  const client = new QueryClient();
  client.setQueryData(["most-duplicated-items"], items);
  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <MostDuplicatedItems />
    </QueryClientProvider>,
  );
}

test("leaderboard keeps 26 item links and scales counts against the largest", () => {
  const items = Array.from({ length: 28 }, (_, index) => ({
    name: `Item ${index}`,
    type: "Vehicle",
    count: index === 0 ? 1000 : 500,
  }));
  const html = render(items);
  expect(html.match(/<li\b/g)).toHaveLength(26);
  expect(html).toContain('href="/item/Vehicle/Item%200"');
  expect(html).not.toContain("Item 26");
  expect(html).toContain("Item 25");
  expect(html).toContain("Top 26 items");
  expect(html).toContain("1,000");
  expect(html).toContain("width:100%");
  expect(html).toContain("width:50%");
  expect(html).toContain("tracked duplicates");
});

test("empty and zero-count leaderboards render without invalid bar widths", () => {
  expect(render([])).toBe("");
  const html = render([{ name: "Torpedo", type: "Vehicle", count: 0 }]);
  expect(html).toContain("width:0%");
  expect(html).not.toContain("NaN");
});
