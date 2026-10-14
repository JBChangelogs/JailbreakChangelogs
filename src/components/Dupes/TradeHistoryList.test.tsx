import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

type Element = {
  type: unknown;
  props: { children?: unknown; [key: string]: unknown };
};

function loadComponent(file: string) {
  const exports = {} as { default: (props: unknown) => Element };
  const jsx = (type: unknown, props: Element["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
      compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
    }).outputText,
    {
      exports,
      process: { env: {} },
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useMemo: (fn: () => unknown) => fn(),
            useState: (initial: unknown) => [initial, () => {}],
          };
        if (name === "@/hooks/useBatchUserData")
          return { useBatchUserData: () => ({ robloxUsers: {} }) };
        if (name === "@/contexts/AuthContext")
          return { useAuthContext: () => ({ isAuthenticated: false }) };
        if (name === "@/utils/helpers/timestamp")
          return {
            formatShortDateTime: (value: number) => `Date ${value}`,
            formatProfileDate: (value: number) => `Recorded ${value}`,
            formatMonthDayYear: (value: number) => `Day ${value}`,
          };
        if (name === "@/utils/ui/images")
          return {
            getUserAvatar: () => "/avatar.webp",
            getItemImagePath: () => "/item.webp",
            isVideoItem: () => false,
            isDriftItem: () => false,
          };
        if (name === "@/utils/items/categoryIcons")
          return {
            getCategoryColor: () => "#fff",
            getCategoryIcon: () => null,
          };
        return {
          default: name,
          Button: "button",
          Icon: "icon",
        };
      },
    },
  );
  return exports.default;
}

function nodes(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object") return [];
  const node = value as Element;
  if (typeof node.type === "function") return nodes(node.type(node.props));
  return [node, ...nodes(node.props?.children)];
}

const list = loadComponent("./TradeHistoryList.tsx");
const compare = loadComponent("./DupeComparisonClient.tsx");
const history = (length: number, offset = 0) =>
  Array.from({ length }, (_, index) => ({
    UserId: index === 0 ? 1 : index + offset + 1,
    TradeTime: index === 0 ? 100 : index + offset + 100,
  }));

test("short and capped histories separate the original-owner date from trade dates", () => {
  for (const length of [1, 23, 49, 50]) {
    const tree = nodes(list({ history: history(length), usersData: {} }));
    const text = JSON.stringify(tree);
    expect(text).toContain("Original owner since");
    expect(text).toContain("Date 100");
    const scrollRegion = tree.find((node) => node.props.role === "region");
    expect(scrollRegion).toBeDefined();
    expect(JSON.stringify(nodes(scrollRegion))).not.toContain(
      "Original owner since",
    );
    expect(
      tree.filter((node) => node.props.children === "Traded on"),
    ).toHaveLength(length === 50 ? 48 : length - 1);
    expect(text.includes("Earlier trades may be missing")).toBe(length === 50);
    expect(text.includes("First recorded trade:")).toBe(
      length > 1 && length < 50,
    );
    if (length === 1) expect(text).toContain("No trades are recorded");
    if (length > 1) {
      expect(text).toContain(`Date ${length + 99}`);
      if (length < 50) expect(text).toContain("Date 101");
    }
  }
  expect(JSON.stringify(nodes(list({ history: [], usersData: {} })))).toContain(
    "No trade history is available",
  );
});

test("missing capped trades do not produce a divergence marker from the original owner alone", () => {
  const item = {
    item_id: 1,
    info: [],
    logged_at: 500,
    title: "Drip",
    categoryTitle: "Texture",
  };
  const render = (
    left: ReturnType<typeof history>,
    right: ReturnType<typeof history>,
  ) =>
    nodes(
      compare({
        ogItem: { ...item, history: right },
        duplicateItem: { ...item, history: left },
        itemsData: [{ id: 1, name: "Drip" }],
      }),
    );
  const missing = render(history(23), history(50, 1000));
  const columns = missing.filter((node) => node.type === "./TradeHistoryList");
  expect(columns.map((node) => node.props.splitIndex)).toEqual([-1, -1]);
  expect(JSON.stringify(missing)).toContain("Last recorded owner");
  expect(JSON.stringify(missing)).toContain("Trade history");
  expect(JSON.stringify(missing)).toContain("don't overlap");

  const shared = history(3);
  const differing = [...shared.slice(0, 2), { UserId: 999, TradeTime: 102 }];
  const lists = render(shared, differing).filter(
    (node) => node.type === "./TradeHistoryList",
  );
  expect(
    lists.map((node) => [node.props.startIndex, node.props.endIndex]),
  ).toEqual([
    [undefined, 1],
    [1, undefined],
    [1, undefined],
  ]);
  expect(JSON.stringify(render(shared, differing))).toContain(
    "1 shared trade, then split at 2",
  );
  const differentDate = [{ UserId: 1, TradeTime: 200 }, ...shared.slice(1)];
  expect(JSON.stringify(render(shared, differentDate))).not.toContain(
    "Original owner of both copies",
  );
});

test("the split notice stays before the first different transfer", () => {
  const tree = nodes(
    list({ history: history(3), usersData: {}, splitIndex: 2 }),
  );
  const notice = tree.findIndex(
    (node) => node.props.children === "Split starts here",
  );
  const date = tree.findIndex(
    (node) =>
      Array.isArray(node.props.children) &&
      node.props.children.includes("Date 102"),
  );
  expect(notice).toBeGreaterThan(-1);
  expect(notice).toBeLessThan(date);
});

test("startIndex and endIndex limit the rendered transfers", () => {
  const cards = (props: object) =>
    nodes(list({ history: history(5), usersData: {}, ...props })).filter(
      (node) => node.props.children === "Traded on",
    ).length;
  expect(cards({})).toBe(4);
  expect(cards({ endIndex: 2 })).toBe(2);
  expect(cards({ startIndex: 2 })).toBe(2);
  expect(
    nodes(list({ history: history(50), usersData: {}, endIndex: 3 })).filter(
      (node) => node.props.children === "Traded on",
    ),
  ).toHaveLength(2);
});

test("a list that starts at the split still marks it", () => {
  const tree = nodes(
    list({ history: history(4), usersData: {}, splitIndex: 2, startIndex: 1 }),
  );
  expect(
    tree.filter((node) => node.props.children === "Split starts here"),
  ).toHaveLength(1);
});
