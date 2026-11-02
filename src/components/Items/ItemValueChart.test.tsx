import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import ItemValueChart, { type ValueHistory } from "./ItemValueChart";
import {
  SUGGESTION_CHART_METRICS,
  SUGGESTION_FIELDS,
} from "./Suggestions/shared";

const history: ValueHistory[] = [
  {
    id: "1",
    name: "Torpedo",
    type: "Vehicle",
    date: "1793505600",
    cash_value: "40m",
    duped_value: "37m",
    metadata: {
      ItemId: 1,
      Type: "Vehicle",
      Name: "Torpedo",
      TimesTraded: 100,
      UniqueCirculation: 50,
      TimesScanned: 150,
      DemandMultiple: 2,
      LastUpdated: 1793505600,
    },
  },
];

function selectedCard(props: Parameters<typeof ItemValueChart>[0]) {
  const markup = renderToStaticMarkup(<ItemValueChart {...props} />);
  return markup.match(
    /<button[^>]*aria-pressed="true"[^>]*>[\s\S]*?<\/button>/,
  )?.[0];
}

test("market suggestion fields open the relevant available chart metric; notes have no chart", () => {
  const labels: Record<string, string> = {
    cash_value: "Cash Value",
    duped_value: "Duped Value",
    demand: "Times Traded",
    duped_demand: "Times Traded",
    trend: "Cash Value",
  };
  expect(Object.keys(SUGGESTION_CHART_METRICS).sort()).toEqual(
    SUGGESTION_FIELDS.filter((field) => field !== "notes").sort(),
  );
  expect(SUGGESTION_CHART_METRICS.notes).toBeUndefined();
  expect(SUGGESTION_CHART_METRICS.unknown).toBeUndefined();
  for (const [field, label] of Object.entries(labels)) {
    expect(
      selectedCard({
        historyData: history,
        defaultMetric: SUGGESTION_CHART_METRICS[field],
      }),
    ).toContain(label);
  }
});

test("charts fall back to cash when the requested trading metric is hidden or unavailable", () => {
  expect(selectedCard({ historyData: history })).toContain("Cash Value");
  expect(
    selectedCard({
      historyData: history,
      defaultMetric: "traded",
      hideTradingMetrics: true,
    }),
  ).toContain("Cash Value");
  expect(
    selectedCard({
      historyData: history.map((entry) => ({ ...entry, metadata: null })),
      defaultMetric: "traded",
    }),
  ).toContain("Cash Value");
  expect(
    renderToStaticMarkup(
      <ItemValueChart historyData={[]} defaultMetric="traded" />,
    ),
  ).toContain("No Data Available");
});
