import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

type Element = {
  type: unknown;
  props: { children?: unknown; [key: string]: unknown };
};

function render(wide: boolean, search = "", length = 5) {
  const exports = {} as {
    default: (props: { initialLeaderboard: unknown[] }) => Element;
  };
  const jsx = (type: unknown, props: Element["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./MostScannedLeaderboardClient.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      process: { env: {} },
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useState: () => [search, () => {}],
            useRef: () => ({ current: null }),
            useEffect: () => {},
          };
        if (name === "@/hooks/useMediaQuery")
          return { useMediaQuery: () => wide };
        if (name === "@/hooks/useDebounce")
          return { useDebounce: (value: string) => value };
        if (name === "@tanstack/react-query")
          return {
            useQuery: () => ({
              data: {
                userData: {
                  "2": { name: "SecondPlayer", displayName: "Second" },
                },
              },
            }),
          };
        if (name === "@tanstack/react-virtual")
          return {
            useVirtualizer: ({ count }: { count: number }) => ({
              getTotalSize: () => count * 80,
              getVirtualItems: () =>
                Array.from({ length: count }, (_, index) => ({
                  key: index,
                  index,
                  start: index * 80,
                })),
              measureElement: () => {},
            }),
          };
        return { default: name, Icon: "icon" };
      },
    },
  );
  return exports.default({
    initialLeaderboard: Array.from({ length }, (_, index) => ({
      user_id: String(index + 1),
      upsert_count: 1000 - index,
    })),
  });
}

function nodes(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object") return [];
  const node = value as Element;
  return [node, ...nodes(node.props?.children)];
}

const inventoryLinks = (tree: unknown) =>
  nodes(tree)
    .map((node) => node.props?.href)
    .filter(
      (href): href is string =>
        typeof href === "string" && href.startsWith("/inventories/"),
    );

test("responsive rows preserve rank order and the final player for odd totals", () => {
  for (const wide of [false, true]) {
    const rows = nodes(render(wide)).filter(
      (node) => typeof node.props?.["data-index"] === "number",
    );
    expect(rows.map((row) => inventoryLinks(row))).toEqual(
      wide
        ? [
            ["/inventories/1", "/inventories/2"],
            ["/inventories/3", "/inventories/4"],
            ["/inventories/5"],
          ]
        : [
            ["/inventories/1"],
            ["/inventories/2"],
            ["/inventories/3"],
            ["/inventories/4"],
            ["/inventories/5"],
          ],
    );
  }
});

test("search keeps username, display name, ID and empty-result behavior", () => {
  for (const wide of [false, true]) {
    for (const search of ["secondplayer", "SECOND", "2"]) {
      expect(inventoryLinks(render(wide, search))).toEqual(["/inventories/2"]);
    }
    expect(inventoryLinks(render(wide, "missing"))).toEqual([]);
    expect(JSON.stringify(render(wide, "missing"))).toContain(
      "No users found matching",
    );
    expect(inventoryLinks(render(wide, "", 0))).toEqual([]);
    expect(JSON.stringify(render(wide, "", 0))).toContain(
      "Leaderboard Unavailable",
    );
  }
});

test("search preserves original ranks and only medals the original top three", () => {
  for (const wide of [false, true]) {
    const tree = render(wide, "12", 15);
    expect(inventoryLinks(tree)).toEqual(["/inventories/12"]);
    const badge = nodes(tree).find((node) => {
      const children = node.props?.children;
      return (
        Array.isArray(children) &&
        (children[0] as Element)?.props?.children === "Rank "
      );
    });
    expect(badge?.props.children).toEqual([expect.anything(), 12]);
    expect(badge?.props.className).toContain("text-secondary-text");
    expect(badge?.props.className).not.toContain("text-amber-400");
  }
});

test("each entire player row links to inventory without nested profile links", () => {
  const tree = nodes(render(true));
  const row = tree.find((node) => node.props?.href === "/inventories/2");
  expect(row?.props["aria-label"]).toBe("View SecondPlayer's inventory");
  expect(row?.props.prefetch).toBe(false);
  expect(nodes(row).some((node) => node.props?.children === "Second")).toBe(
    true,
  );
  expect(JSON.stringify(row)).toContain("SecondPlayer");
  expect(JSON.stringify(row)).toContain("@");
  expect(JSON.stringify(row)).toContain("999");
  expect(nodes(row).filter((node) => node.props?.href)).toHaveLength(1);
  expect(
    tree.some((node) => String(node.props?.href).includes("roblox.com")),
  ).toBe(false);
});
