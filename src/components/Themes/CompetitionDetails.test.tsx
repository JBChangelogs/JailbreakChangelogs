import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { competitionStatus } from "@/utils/api/userThemes";

interface Node {
  type: { name?: string } | string;
  props: {
    children?: unknown;
    theme?: { share_code: string };
    disabled?: boolean;
    variant?: string;
    onClick?: () => void;
  };
}

function submissions(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(submissions);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  if (typeof node.type === "function" && node.type.name === "EntryCard")
    return [node.props.theme!.share_code];
  return submissions(node.props.children);
}

test("standings chart ticks use recorded days instead of repeated intraday labels", () => {
  type ChartNode = {
    type: string;
    props: Record<string, unknown> & { children?: unknown };
  };
  const exports = {} as { Standings: (props: object) => ChartNode };
  const jsx = (type: string, props: ChartNode["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./CompetitionDetails.tsx", import.meta.url),
        "utf8",
      ) + "\nexports.Standings = Standings;",
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "@/components/ui/chart")
          return { ChartTooltip: "ChartTooltip" };
        if (name === "recharts")
          return Object.fromEntries(
            ["LineChart", "CartesianGrid", "XAxis", "YAxis", "Line"].map(
              (name) => [name, name],
            ),
          );
        return {};
      },
    },
  );
  const daily = [
    { timestamp: Date.UTC(2026, 10, 4) / 1000, users: { THEME001: 0 } },
    { timestamp: Date.UTC(2026, 10, 5) / 1000, users: { THEME001: 4 } },
  ];
  const tree = exports.Standings({
    status: "running",
    data: {
      daily,
      standings: [
        {
          theme: { share_code: "THEME001", label: "Autumn" },
          rank: 1,
          user_days: 4,
          current_users: 4,
        },
      ],
    },
  });
  function nodes(value: unknown): ChartNode[] {
    if (Array.isArray(value)) return value.flatMap(nodes);
    if (!value || typeof value !== "object" || !("props" in value)) return [];
    const node = value as ChartNode;
    return [node, ...nodes(node.props.children)];
  }
  const chart = nodes(tree);
  const axis = chart.find((node) => node.type === "XAxis")!;
  expect(axis.props.ticks).toEqual(daily.map((day) => day.timestamp * 1000));
  expect(axis.props.scale).toBe("time");
  expect(axis.props.minTickGap).toBe(48);
  expect(chart.find((node) => node.type === "LineChart")!.props.data).toEqual([
    { t: daily[0].timestamp * 1000, THEME001: 0 },
    { t: daily[1].timestamp * 1000, THEME001: 4 },
  ]);
  expect(
    chart.find((node) => node.type === "CartesianGrid")!.props.stroke,
  ).toBe("var(--color-border-card)");
  const tooltip = chart.find((node) => node.type === "ChartTooltip")!.props
    .content as ChartNode;
  const format = tooltip.props.formatter as (
    value: number,
    name: string,
    item: { dataKey: string },
  ) => ChartNode;
  const row = nodes(format(0, "THEME001", { dataKey: "THEME001" }));
  expect(
    row.some(
      (node) =>
        Array.isArray(node.props.children) &&
        node.props.children.includes("Autumn"),
    ),
  ).toBe(true);
  expect(row.some((node) => node.props.children === "0")).toBe(true);
  expect(row.find((node) => node.props.style)!.props.style).toEqual({
    backgroundColor: "var(--color-chart-1)",
  });
});

test("submissions show newest entries first without changing cached order, including appended live entries", () => {
  const initial = {
    id: 7,
    title: "Competition",
    status: "running",
    starts_at: 0,
    ends_at: Date.now() / 1000 + 3600,
    winner: null,
    items: [
      { entered_at: 10, theme: { share_code: "OLDEST01" } },
      { entered_at: 30, theme: { share_code: "NEWEST01" } },
      { entered_at: 20, theme: { share_code: "MIDDLE01" } },
    ],
  };
  const exports = {} as { default: (props: object) => unknown };
  const jsx = (type: Node["type"], props: Node["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./CompetitionDetails.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useSyncExternalStore: () => true,
            useReducer: () => [0, () => {}],
            useEffect: () => {},
          };
        if (name === "@tanstack/react-query")
          return {
            useQueryClient: () => ({}),
            useQuery: () => ({ data: initial }),
          };
        if (name.endsWith("userThemes")) return { competitionStatus };
        return {};
      },
    },
  );
  const render = () =>
    submissions(exports.default({ initial, standings: Promise.resolve(null) }));
  expect(render()).toEqual(["NEWEST01", "MIDDLE01", "OLDEST01"]);
  expect(initial.items.map(({ theme }) => theme.share_code)).toEqual([
    "OLDEST01",
    "NEWEST01",
    "MIDDLE01",
  ]);
  initial.items.push({ entered_at: 40, theme: { share_code: "LIVE0001" } });
  expect(render()).toEqual(["LIVE0001", "NEWEST01", "MIDDLE01", "OLDEST01"]);
});

test("submit and withdraw keep their labels and colors until competition data refreshes", async () => {
  for (const entered of [false, true]) {
    const theme = { share_code: "THEME001", published_at: 1 };
    const entry = { theme: { ...theme, user: { id: "123" } }, entered_at: 1 };
    const competition = {
      id: 7,
      items: entered ? [entry] : [],
      max_entries_per_user: 1,
    };
    let busy: unknown = null;
    let finish!: () => void;
    const refreshing = new Promise<void>((resolve) => {
      finish = resolve;
    });
    let completed!: () => void;
    const idle = new Promise<void>((resolve) => {
      completed = resolve;
    });
    const exports = {} as { EnterPicker: (props: object) => unknown };
    const jsx = (type: Node["type"], props: Node["props"]) => ({ type, props });
    runInNewContext(
      transpileModule(
        readFileSync(
          new URL("./CompetitionDetails.tsx", import.meta.url),
          "utf8",
        ),
        {
          compilerOptions: {
            module: ModuleKind.CommonJS,
            jsx: JsxEmit.ReactJSX,
          },
        },
      ).outputText + "\nexports.EnterPicker = EnterPicker;",
      {
        exports,
        require: (name: string) => {
          if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
          if (name === "react")
            return {
              useState: () => [
                busy,
                (value: unknown) => {
                  busy = value;
                  if (value === null) completed();
                },
              ],
            };
          if (name.endsWith("AuthContext"))
            return {
              useAuthContext: () => ({
                user: { id: "123" },
                isAuthenticated: true,
              }),
            };
          if (name === "@tanstack/react-query")
            return {
              useQuery: () => ({ data: { themes: [theme] } }),
              useQueryClient: () => ({
                invalidateQueries: async () => {
                  competition.items = entered ? [] : [entry];
                  await refreshing;
                },
              }),
            };
          if (name.endsWith("/button")) return { Button: "button" };
          if (name === "sonner")
            return { toast: { success: () => {}, error: () => {} } };
          if (name.endsWith("userThemes"))
            return {
              enterCompetition: async () => {},
              withdrawFromCompetition: async () => {},
            };
          return {};
        },
      },
    );
    function buttons(value: unknown): Node[] {
      if (Array.isArray(value)) return value.flatMap(buttons);
      if (!value || typeof value !== "object" || !("props" in value)) return [];
      const node = value as Node;
      return node.type === "button" ? [node] : buttons(node.props.children);
    }
    const render = () => buttons(exports.EnterPicker({ competition }))[0];
    expect(render().props.variant).toBe(entered ? "secondary" : undefined);
    render().props.onClick!();
    await Promise.resolve();
    expect(render().props.children).toBe(
      entered ? "Withdrawing…" : "Entering…",
    );
    expect(render().props.disabled).toBe(true);
    expect(render().props.variant).toBe(entered ? "secondary" : undefined);
    finish();
    await idle;
    expect(render().props.children).toBe(
      entered ? "Enter competition" : "Withdraw",
    );
    expect(render().props.variant).toBe(entered ? undefined : "secondary");
    expect(render().props.disabled).toBe(false);
  }
});
