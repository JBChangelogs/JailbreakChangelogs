import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
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
  let selection: unknown = { id: item.id, view: "simplified" };
  const render = load("./DupeComparisonLoader.tsx", {
    react: {
      useState: () => [
        selection,
        (value: unknown) => {
          selection = value;
        },
      ],
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
  expect(
    nodes(render({ id: "different-item" })).find(
      (node) => node.type === "./DupeComparisonHeader",
    )?.props.showOriginalOwner,
  ).toBe(true);
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
  const view = (showOriginalOwner = true) => {
    stateIndex = 0;
    return render({
      ogItem: item,
      duplicateItem: item,
      itemsData: [{ id: 49, name: "Proto-8", season: 8, level: 10 }],
      showOriginalOwner,
    });
  };
  const check = nodes(view()).find(
    (node) => node.type === "./DupeCheckButton",
  )!;
  expect(check.props.item).toBe(item);
  expect(check.props.originalOwner).toBe("123");
  expect(check.props.ownerName).toBe("Original Display");
  expect(check.props.showComparison).toBe(false);
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
