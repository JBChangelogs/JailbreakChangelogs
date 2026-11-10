import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { hasItemValue, itemTrends } from "@/utils/items/itemValue";
import { formatFullValue, getValueChange } from "@/utils/trading/values";
import type { RecentChange } from "@/types";

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

const badges = (value: unknown) =>
  nodes(value)
    .filter(
      (node) =>
        node.type === "span" &&
        String(node.props.className).includes("bg-button-info"),
    )
    .map((node) => node.props.children);

test("item cards preserve prices and support values layout and favorites on item pages", async () => {
  let mobile = true;
  let pathname = "/values";
  let authenticated = false;
  let loginRequests = 0;
  let requestOkay = true;
  const requests: Array<{ url: string; method: string }> = [];
  const favoriteChanges: boolean[] = [];
  let recentChanges: RecentChange[] | undefined;
  const exports = {} as {
    default: (props: unknown) => Node;
  };
  const noop = () => null;
  const react = {
    memo: (component: unknown) => component,
    useEffect: noop,
    useRef: (current: unknown) => ({ current }),
    useState: (initial: unknown) => [initial, noop],
  };
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./ItemCard.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      fetch: async (url: string, options: { method: string }) => {
        requests.push({ url, method: options.method });
        return { ok: requestOkay };
      },
      require: (name: string) => {
        if (name === "react") return { ...react, default: react };
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "@/utils/items/itemValue")
          return { hasItemValue, itemTrends };
        if (name === "@/utils/trading/values")
          return { formatFullValue, getValueChange };
        if (name === "@/hooks/useMediaQuery")
          return { useMediaQuery: () => mobile };
        if (name === "next/navigation") return { usePathname: () => pathname };
        if (name === "@/contexts/AuthContext")
          return {
            useAuthContext: () => ({
              isAuthenticated: authenticated,
              setLoginModal: () => {
                loginRequests++;
              },
            }),
          };
        if (name === "@/utils/api/api")
          return { PUBLIC_API_URL: "https://api.example" };
        if (name === "@/utils/api/apiDevToken")
          return {
            buildApiFetchRequest: (base: string, path: string) => ({
              url: base + path,
              headers: {},
            }),
          };
        if (name === "sonner") return { toast: { error: noop, success: noop } };
        if (name === "@/services/logger")
          return { createLogger: () => ({ error: noop }) };
        return new Proxy({}, { get: () => noop });
      },
    },
  );
  const renderCard = (
    value: string | null | undefined,
    type = "Drift",
    placementLimit?: number | null,
    showValues = false,
    isFavorited = false,
  ) =>
    exports.default({
      item: {
        id: 1,
        name: "Blue Fire",
        type,
        cash_value: value,
        duped_value: value,
        recent_changes: recentChanges,
      },
      isFavorited,
      onFavoriteChange: (next: boolean) => favoriteChanges.push(next),
      placementLimit,
      showValues,
    });
  const render = (value: string | null | undefined) =>
    badges(renderCard(value));

  for (pathname of ["/values", "/other"]) {
    for (const value of [null, undefined, "", " ", "null", "N/A"])
      expect(render(value)).toEqual(["N/A", "N/A"]);
    expect(render("28m")).toEqual(["28m", "28m"]);
    expect(render("0")).toEqual(["0", "0"]);
    mobile = false;
    expect(render(null)).toEqual(["N/A", "N/A"]);
    expect(render("28m")).toEqual(["28,000,000", "28,000,000"]);
    mobile = true;
    for (const type of ["Furniture", "Vehicle"]) {
      for (const limit of [undefined, null, 0, 1]) {
        const tree = JSON.stringify(renderCard("20k", type, limit));
        expect(tree.includes(`"aria-label":"Placement limit: ${limit}"`)).toBe(
          pathname === "/values" && type === "Furniture" && limit != null,
        );
      }
    }
  }
  recentChanges = [
    {
      changelog_id: 1,
      suggestion_id: 1,
      changed_by: "user",
      created_at: Date.now() / 1000,
      field: "cash_value",
      current_value: "1m",
      suggested_value: "2m",
    },
    {
      changelog_id: 1,
      suggestion_id: 1,
      changed_by: "user",
      created_at: Date.now() / 1000 - 6 * 86400,
      field: "duped_value",
      current_value: "500k",
      suggested_value: "250k",
    },
  ];
  const changeLabels = (showValues: boolean) =>
    nodes(renderCard("2m", "Drift", undefined, showValues))
      .filter(
        (node) =>
          node.type === "span" &&
          Array.isArray(node.props.children) &&
          ["+", "-"].includes(node.props.children[0]),
      )
      .map((node) => (node.props.children as string[]).join(""));
  mobile = false;
  pathname = "/values";
  expect(changeLabels(false)).toEqual(["+1,000,000", "-250,000"]);
  pathname = "/item/Furniture/Blue%20Fire";
  expect(changeLabels(true)).toEqual(["+1m", "-250k"]);
  // Changes older than a week no longer show.
  recentChanges = recentChanges.map((change) => ({
    ...change,
    created_at: Date.now() / 1000 - 8 * 86400,
  }));
  expect(changeLabels(true)).toEqual([]);
  recentChanges = undefined;
  mobile = true;
  const sharedCard = renderCard("28m", "Furniture", 1, true);
  expect(JSON.stringify(sharedCard)).toContain(
    '"aria-label":"Placement limit: 1"',
  );
  expect(badges(sharedCard)).toEqual(["28m", "28m"]);
  const clickFavorite = async (isFavorited = false) => {
    const button = nodes(
      renderCard("28m", "Furniture", 1, true, isFavorited),
    ).find(
      (node) =>
        node.type === "button" &&
        String(node.props["aria-label"]).includes("favorites"),
    )!;
    await (button.props.onClick as (event: unknown) => Promise<void>)({
      preventDefault: noop,
      stopPropagation: noop,
    });
  };
  await clickFavorite();
  expect(loginRequests).toBe(1);
  expect(requests).toHaveLength(0);
  authenticated = true;
  await clickFavorite();
  await clickFavorite(true);
  expect(requests).toEqual([
    { url: "https://api.example/v2/users/me/favorites/1", method: "PUT" },
    { url: "https://api.example/v2/users/me/favorites/1", method: "DELETE" },
  ]);
  expect(favoriteChanges).toEqual([true, false]);
  requestOkay = false;
  await clickFavorite();
  expect(favoriteChanges).toEqual([true, false]);
});
