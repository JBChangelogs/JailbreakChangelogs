import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { parseAsStringLiteral } from "nuqs";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

type Node = {
  type: unknown;
  key?: string;
  props: Record<string, unknown> & { children?: unknown };
};

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

function load(file: string, dependencies: Record<string, unknown>) {
  const exports = {} as { default: (props: unknown) => Node };
  const jsx = (type: unknown, props: Node["props"], key?: string) => ({
    type,
    props,
    key,
  });
  runInNewContext(
    transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
      compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
    }).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name in dependencies) return dependencies[name];
        return { default: name };
      },
    },
  );
  return exports.default;
}

const item = {
  id: "%0LryE]iP54H",
  item_id: 49,
  title: "Proto-8",
  categoryTitle: "Vehicle",
  user_id: "456",
  history: [{ UserId: 123, TradeTime: 1678375861 }],
  info: [{ title: "Original Owner", value: "123" }],
};

test("renders one shared header outside both tab panels with distinct sibling keys", () => {
  let selection: string | null = null;
  const render = load("./DupeComparisonLoader.tsx", {
    nuqs: {
      parseAsStringLiteral,
      useQueryState: (
        key: string,
        parser: {
          parse: (value: string) => string | null;
          defaultValue: string;
          history: string;
          shallow: boolean;
        },
      ) => {
        expect(key).toBe("view");
        expect(parser.history).toBe("push");
        expect(parser.shallow).toBe(true);
        return [
          selection
            ? (parser.parse(selection) ?? parser.defaultValue)
            : parser.defaultValue,
          (value: string) => {
            selection = value;
          },
        ];
      },
    },
    "@tanstack/react-query": {
      useQuery: () => ({
        data: { og: item, duplicate: item },
        isSuccess: true,
      }),
    },
    "@/hooks/useBatchItems": {
      useBatchItems: () => ({ data: [{ id: 49, name: "Proto-8" }] }),
    },
    "@/services/logger": { createLogger: () => ({}) },
    "@/components/ui/tabs": {
      Tabs: "Tabs",
      TabsList: "TabsList",
      TabsTrigger: "TabsTrigger",
      TabsContent: "TabsContent",
    },
  });
  const root = render({ id: item.id });
  const children = root.props.children as Node[];
  const header = children[0];
  const tabs = children[1];
  expect(header.type).toBe("./DupeComparisonHeader");
  expect(tabs.type).toBe("Tabs");
  expect(header.key).not.toBe(tabs.key);
  expect(header.key).toContain(item.id);
  expect(tabs.key).toContain(item.id);
  expect(
    nodes(tabs).some((node) => node.type === "./DupeComparisonHeader"),
  ).toBe(false);
  expect(
    nodes(root).filter((node) => node.type === "./DupeComparisonHeader"),
  ).toHaveLength(1);
  expect(
    nodes(tabs).filter((node) => node.type === "TabsContent"),
  ).toHaveLength(2);
  expect(header.props.showOriginalOwner).toBe(true);
  (tabs.props.onValueChange as (value: string) => void)("copy-tree");
  expect(
    nodes(render({ id: item.id })).find(
      (node) => node.type === "./DupeComparisonHeader",
    )?.props.showOriginalOwner,
  ).toBe(false);
  selection = null;
  expect(
    nodes(render({ id: "different-item" })).find(
      (node) => node.type === "./DupeComparisonHeader",
    )?.props.showOriginalOwner,
  ).toBe(true);
  selection = "invalid";
  expect(
    nodes(render({ id: item.id })).find((node) => node.type === "Tabs")?.props
      .value,
  ).toBe("simplified");
  const simplified = nodes(render({ id: item.id })).find(
    (node) => node.type === "./DupeComparisonClient",
  )!;
  (simplified.props.onExploreTree as () => void)();
  expect(
    nodes(render({ id: item.id })).find((node) => node.type === "Tabs")?.props
      .value,
  ).toBe("copy-tree");
  (tabs.props.onValueChange as (value: string) => void)("simplified");
  expect(
    nodes(render({ id: item.id })).find(
      (node) => node.type === "./DupeComparisonHeader",
    )?.props.showOriginalOwner,
  ).toBe(true);
});

test("shared header preserves the original owner, login guard, report payload, and acknowledgement", () => {
  const states: unknown[] = [];
  let stateIndex = 0;
  let authenticated = false;
  const login: unknown[] = [];
  const render = load("./DupeComparisonHeader.tsx", {
    react: {
      useState: (initial: unknown) => {
        const index = stateIndex++;
        if (!(index in states)) states[index] = initial;
        return [
          states[index],
          (value: unknown) => {
            states[index] = value;
          },
        ];
      },
    },
    "@/hooks/useBatchUserData": {
      useBatchUserData: () => ({
        robloxUsers: {
          "123": { name: "original_username", displayName: "Original Display" },
        },
      }),
    },
    "@/contexts/AuthContext": {
      useAuthContext: () => ({
        isAuthenticated: authenticated,
        setLoginModal: (value: unknown) => login.push(value),
      }),
    },
    sonner: { toast: { info: () => {} } },
    "@/utils/items/categoryIcons": {
      getCategoryColor: () => "#ffffff",
      getCategoryIcon: () => null,
    },
    "@/utils/ui/images": {
      getItemImagePath: () => "/item.webp",
      isVideoItem: () => false,
      isDriftItem: () => false,
    },
    "./TradeHistoryList": { OriginalOwnerCard: "OriginalOwnerCard" },
    "@/components/Items/ItemUnlockBadges": {
      ItemUnlockBadges: "ItemUnlockBadges",
    },
    "@/components/ui/button": { Button: "Button" },
    "@/components/ui/IconWrapper": { Icon: "Icon" },
  });
  let treeViews = 0;
  const view = (showOriginalOwner = true) => {
    stateIndex = 0;
    return render({
      ogItem: item,
      duplicateItem: item,
      itemsData: [{ id: 49, name: "Proto-8", season: 8, level: 10 }],
      showOriginalOwner,
      onExploreTree: () => treeViews++,
    });
  };
  const check = nodes(view()).find(
    (node) => node.type === "./DupeCheckButton",
  )!;
  (check.props.onViewTree as () => void)();
  expect(treeViews).toBe(1);
  expect(check.props.item).toBe(item);
  expect(check.props.originalOwner).toBe("123");
  expect(check.props.ownerName).toBe("Original Display");
  (check.props.onReport as () => void)();
  expect(login).toEqual([{ open: true }]);
  login.length = 0;
  const reportButton = () =>
    nodes(view()).find(
      (node) =>
        node.type === "Button" && node.props.children === "Report False Dupe",
    )!;
  expect(
    nodes(view()).find((node) => node.type === "OriginalOwnerCard")?.props
      .entry,
  ).toEqual(item.history[0]);
  expect(
    nodes(view(false)).some((node) => node.type === "OriginalOwnerCard"),
  ).toBe(false);
  const badges = nodes(view()).find(
    (node) => node.type === "ItemUnlockBadges",
  )!;
  expect(badges.props.season).toBe(8);
  expect(badges.props.level).toBe(10);
  expect(badges.props.className).toBe("");
  expect(
    nodes(view()).some(
      (node) =>
        node.props.className === "flex flex-wrap items-center gap-2" &&
        nodes(node).some((child) => child.type === "ItemUnlockBadges") &&
        nodes(node).some(
          (child) =>
            Array.isArray(child.props.children) &&
            child.props.children.includes("Vehicle"),
        ),
    ),
  ).toBe(true);
  expect(
    nodes(view()).find((node) => node.props.href === "/dupes/123"),
  ).toBeDefined();
  (reportButton().props.onClick as () => void)();
  expect(login).toEqual([{ open: true }]);
  expect(states[0]).toBe(false);
  authenticated = true;
  (reportButton().props.onClick as () => void)();
  const modal = nodes(view()).find(
    (node) => node.type === "./ReportFalseDupeModal",
  )!;
  expect(modal.props.open).toBe(true);
  expect(modal.props.item).toEqual({
    id: item.id,
    item_id: 49,
    title: "Proto-8",
    categoryTitle: "Vehicle",
  });
  expect(modal.props.originalOwner).toEqual({
    id: "123",
    displayName: "Original Display",
  });
  (modal.props.onReportResolved as (status: string) => void)("submitted");
  expect(JSON.stringify(view())).toContain("False dupe report received");
  expect(reportButton()).toBeUndefined();
});

test("simplified summaries promote the tree without changing recorded history", () => {
  const render = load("./DupeComparisonClient.tsx", {
    "@/hooks/useBatchUserData": {
      useBatchUserData: () => ({ robloxUsers: {} }),
    },
    "@/components/ui/button": { Button: "Button" },
    "@/components/ui/IconWrapper": { Icon: "Icon" },
  });
  const origin = { UserId: 123, TradeTime: 100 };
  const shared = { UserId: 456, TradeTime: 200 };
  for (const scenario of ["shared", "immediate", "no-overlap", "capped"]) {
    const history =
      scenario === "capped"
        ? [
            origin,
            ...Array.from({ length: 49 }, (_, i) => ({
              UserId: i + 1000,
              TradeTime: i + 1000,
            })),
          ]
        : scenario === "shared"
          ? [origin, shared, { UserId: 789, TradeTime: 300 }]
          : [origin];
    const otherHistory =
      scenario === "shared"
        ? [origin, shared, { UserId: 999, TradeTime: 400 }]
        : scenario === "immediate"
          ? [origin]
          : [{ UserId: 123, TradeTime: 999 }];
    let explored = 0;
    const root = render({
      ogItem: { ...item, history: otherHistory },
      duplicateItem: { ...item, history },
      onExploreTree: () => explored++,
    });
    const button = nodes(root).find(
      (node) =>
        node.type === "Button" &&
        node.props.children === "Explore recorded copies",
    )!;
    (button.props.onClick as () => void)();
    expect(explored).toBe(1);
    const text = JSON.stringify(root);
    expect(
      text.includes("These two histories don't show the connection."),
    ).toBe(scenario === "no-overlap" || scenario === "capped");
    expect(nodes(root).some((node) => node.type === "details")).toBe(
      scenario === "shared",
    );
    if (scenario === "capped")
      expect(text).toContain("only keeps the latest 49");
  }
});
