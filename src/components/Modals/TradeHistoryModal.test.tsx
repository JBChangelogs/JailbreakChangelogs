import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";

interface Node {
  type: unknown;
  props: Record<string, unknown>;
}

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

function text(value: unknown): string {
  if (Array.isArray(value)) return value.map(text).join("");
  if (value && typeof value === "object" && "props" in value)
    return text((value as Node).props.children);
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

test("history modal batches transfer participants and preserves gaps, unknown senders and latest history", () => {
  const exports = {} as { default: (props: unknown) => Node };
  const batches: string[][] = [];
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  const noop = () => null;
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./TradeHistoryModal.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          jsx: JsxEmit.ReactJSX,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useState: (initial: unknown) => [initial, noop],
            useMemo: (fn: () => unknown) => fn(),
          };
        if (name === "next/navigation")
          return { usePathname: () => "/inventories/123" };
        if (name.endsWith("/useBatchUserData"))
          return {
            useBatchUserData: (ids: string[]) => {
              batches.push(ids);
              return {
                robloxUsers: {
                  "111": { name: "Alice" },
                  "222": { name: "Bob" },
                  "333": { name: "Charlie" },
                },
              };
            },
          };
        if (name.endsWith("/dialog"))
          return Object.fromEntries(
            [
              "Dialog",
              "DialogContent",
              "DialogHeader",
              "DialogTitle",
              "DialogFooter",
              "DialogClose",
            ].map((key) => [key, key]),
          );
        if (name.endsWith("/button")) return { Button: "button" };
        if (name.endsWith("/categoryIcons"))
          return {
            getCategoryIcon: () => null,
            getCategoryColor: () => "#123456",
          };
        if (name.endsWith("/timestamp"))
          return { formatShortDateTime: (time: number) => `time-${time}` };
        return new Proxy({}, { get: () => noop });
      },
    },
  );
  const props = {
    isOpen: true,
    onClose: noop,
    item: { title: "Roadster", categoryTitle: "Vehicle" },
  };
  const view = exports.default({
    ...props,
    historyDate: "2026-10-31",
    transfers: [
      { from_user_id: "111", to_user_id: "222", trade_time: 100, gap: false },
      { from_user_id: null, to_user_id: "333", trade_time: 200, gap: true },
    ],
    children: jsx("owner-content", {}),
  });
  expect(batches[0]).toEqual(["111", "222", "333"]);
  expect(text(view)).toContain("Trade history through 2026-10-31 (UTC)");
  expect(text(view)).toContain("Alice");
  expect(text(view)).toContain("Bob");
  expect(text(view)).toContain("Charlie");
  expect(text(view)).toContain("Unknown");
  expect(text(view)).toContain("Gap in recorded history");
  expect(text(view)).toContain("time-200");
  expect(nodes(view).some((node) => node.type === "owner-content")).toBe(true);
  const header = nodes(view).find((node) => node.type === "DialogHeader")!;
  expect(nodes(header).some((node) => node.type === "owner-content")).toBe(
    true,
  );
  expect(
    nodes(view).filter((node) => node.type === "owner-content"),
  ).toHaveLength(1);
  expect(text(exports.default({ ...props, transfers: [] }))).toContain(
    "No recorded trades through this date.",
  );
  const latest = exports.default({
    ...props,
    item: {
      ...props.item,
      history: [
        { UserId: 111, TradeTime: 100 },
        { UserId: 222, TradeTime: 200 },
      ],
    },
  });
  expect(text(latest)).toContain("Trade #1");
  expect(text(latest)).toContain("Alice");
  expect(text(latest)).toContain("Bob");
});
