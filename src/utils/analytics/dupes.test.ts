import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

test("dupe events reach both providers even when either provider fails", () => {
  for (const failing of ["", "web", "rybbit", "both"]) {
    const calls: unknown[] = [];
    const exports = {} as typeof import("./dupes");
    runInNewContext(
      transpileModule(
        readFileSync(new URL("./dupes.ts", import.meta.url), "utf8"),
        {
          compilerOptions: { module: ModuleKind.CommonJS },
        },
      ).outputText,
      {
        exports,
        require: (name: string) => {
          const provider = name === "./web" ? "web" : "rybbit";
          const track = (name: string, props: unknown) => {
            calls.push({ provider, name, props });
            if (failing === provider || failing === "both")
              throw new Error("Blocked");
          };
          return { trackWebEvent: track, trackEvent: track };
        },
      },
    );
    const props = { from: "simplified", to: "copy-tree", source: "summary" };
    expect(() =>
      exports.trackDupeEvent("dupe_comparison_switch", props),
    ).not.toThrow();
    expect(calls).toEqual(
      ["web", "rybbit"].map((provider) => ({
        provider,
        name: "dupe_comparison_switch",
        props,
      })),
    );
  }
});

test("tree history engagement counts opening a history, not closing it", () => {
  type Node = {
    type: unknown;
    props: Record<string, unknown> & { children?: unknown };
  };
  const nodes = (value: unknown): Node[] => {
    if (Array.isArray(value)) return value.flatMap(nodes);
    if (!value || typeof value !== "object" || !("props" in value)) return [];
    const node = value as Node;
    return [node, ...nodes(node.props.children)];
  };
  const events: unknown[] = [];
  const exports = {} as { CopyTree: (props: unknown) => Node };
  const jsx = (type: unknown, props: Node["props"]): Node =>
    typeof type === "function" ? type(props) : { type, props };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("../../components/Dupes/CopyTreeView.tsx", import.meta.url),
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
        if (name === "@/utils/analytics/dupes")
          return {
            trackDupeEvent: (name: string, props: unknown) =>
              events.push({ name, props }),
          };
        if (name === "@/utils/ui/images")
          return { getUserAvatar: () => "/avatar.webp" };
        if (name === "@/utils/helpers/timestamp")
          return { formatShortDateTime: () => "Date" };
        return { default: name, TradeHistoryAvatar: "Avatar" };
      },
    },
  );
  const root = exports.CopyTree({
    users: {},
    tree: {
      copies: 1,
      history_entries: 2,
      splits: 0,
      roots: [
        {
          attached: "direct",
          split: false,
          holder: { user_id: "2", last_seen: 100 },
          hops: [
            { user_id: "1", trade_time: 50 },
            { user_id: "2", trade_time: 100 },
          ],
          children: [],
        },
      ],
    },
  });
  const toggle = nodes(root).find((node) => node.type === "details")!.props
    .onToggle as (event: unknown) => void;
  toggle({ currentTarget: { open: false } });
  expect(events).toEqual([]);
  toggle({ currentTarget: { open: true } });
  expect(events).toEqual([
    { name: "dupe_tree_history_open", props: { owners: 1 } },
  ]);
});
