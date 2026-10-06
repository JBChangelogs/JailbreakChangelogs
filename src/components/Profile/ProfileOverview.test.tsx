import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

interface Node {
  type: string;
  key?: string;
  props: Record<string, unknown> & { children?: unknown };
}

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

test("overview previews and legacy section links preserve account and owner restrictions", async () => {
  let section = "";
  let selected: string | null = null;
  let menuOpen = false;
  const exports = {} as { default: (props: unknown) => unknown };
  const jsx = (type: string, props: Node["props"], key?: string) => {
    const siblings = [props.children]
      .flat(Infinity)
      .filter((child): child is Node =>
        Boolean(child && typeof child === "object" && "props" in child),
      );
    const keys = siblings
      .map((child) => child.key)
      .filter((childKey) => childKey !== undefined);
    expect(new Set(keys).size).toBe(keys.length);
    return { type, props, key };
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./ProfileOverview.tsx", import.meta.url), "utf8"),
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
            useRef: () => ({ current: null }),
            useState: () => [
              menuOpen,
              (update: boolean | ((open: boolean) => boolean)) => {
                menuOpen =
                  typeof update === "function" ? update(menuOpen) : update;
              },
            ],
          };
        if (name === "nuqs")
          return {
            useQueryState: () => [
              section,
              async (id: string | null) => {
                selected = id;
              },
            ],
          };
        if (name === "@/components/ui/IconWrapper") return { Icon: "Icon" };
        if (name === "@/components/ui/button") return { Button: "Button" };
        if (name === "@/utils/helpers/timestamp")
          return { formatProfileDate: () => "Today" };
        return { default: name.slice(2) };
      },
    },
  );
  const user = { id: "123", usernumber: 2, roblox_id: "456", flags: [] };
  const render = (overrides = {}) =>
    nodes(exports.default({ user, currentUserId: "789", ...overrides }));
  const overview = render();
  const menuButton = overview.find(
    (node) => node.props["aria-controls"] === "profile-section-links",
  );
  expect(menuButton?.props["aria-expanded"]).toBe(false);
  (menuButton?.props.onClick as () => void)();
  expect(
    render().find(
      (node) => node.props["aria-controls"] === "profile-section-links",
    )?.props["aria-expanded"],
  ).toBe(true);
  expect(overview.filter((node) => node.type === "AboutTab")).toHaveLength(1);
  for (const type of ["FavoritesTab", "TradeAdsProfileTab", "CommentsTab"])
    expect(overview.find((node) => node.type === type)?.props.preview).toBe(
      true,
    );
  expect(
    overview.find((node) => node.type === "ProfileInventoryTab")?.props.active,
  ).toBe(false);
  expect(overview.some((node) => node.props.children === "Bans")).toBe(false);
  await (
    overview.find((node) => node.type === "FavoritesTab")?.props
      .onViewAll as () => Promise<void>
  )();
  expect(String(selected)).toBe("favorites");
  expect(menuOpen).toBe(false);

  section = "inventory";
  expect(
    render().find((node) => node.type === "ProfileInventoryTab")?.props.active,
  ).toBe(true);
  section = "roblox";
  expect(
    render().find((node) => node.type === "TradeAdsProfileTab")?.props.preview,
  ).toBe(false);
  section = "favorites";
  expect(
    render().find((node) => node.type === "FavoritesTab")?.props.preview,
  ).toBe(false);
  section = "bans";
  expect(render().some((node) => node.type === "UserBansTab")).toBe(false);
  const ownerBans = render({ isSiteOwner: true }).find(
    (node) => node.type === "UserBansTab",
  );
  expect(ownerBans?.props.userId).toBe(user.id);
  expect(render().some((node) => node.type === "AboutTab")).toBe(true);
  expect(
    render({ currentUserId: user.id }).some(
      (node) => node.type === "UserBansTab",
    ),
  ).toBe(true);

  section = "inventory";
  const restricted = render({
    user: {
      ...user,
      roblox_id: null,
      flags: [{ flag: "is_vt", enabled: true }],
    },
  });
  expect(restricted.some((node) => node.type === "ProfileInventoryTab")).toBe(
    false,
  );
  expect(
    restricted.some((node) => node.props.children === "Item suggestions"),
  ).toBe(false);
  expect(restricted.some((node) => node.type === "AboutTab")).toBe(true);
  section = "suggestions";
  const vtUser = { ...user, flags: [{ flag: "is_vtm", enabled: true }] };
  expect(
    render({ user: vtUser }).some(
      (node) => node.type === "UserValueSuggestionsTab",
    ),
  ).toBe(false);
  expect(
    render({ user: vtUser, isSiteOwner: true }).some(
      (node) => node.type === "UserValueSuggestionsTab",
    ),
  ).toBe(true);
  expect(
    render({ user: vtUser, currentUserId: user.id }).some(
      (node) => node.type === "UserValueSuggestionsTab",
    ),
  ).toBe(true);
  expect(exports.default({ user: null })).toBeNull();
});
