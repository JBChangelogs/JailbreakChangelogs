import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { hasItemValue } from "@/utils/items/itemValue";
import { formatFullValue } from "@/utils/trading/values";
import { getInventoryDupedValue } from "@/utils/trading/inventoryValues";
import * as imageUtils from "@/utils/ui/images";
import InventoryMarketSummary from "./InventoryMarketSummary";

interface Node {
  type: unknown;
  props: Record<string, unknown>;
}

test("shared inventory appearance retains item links, category styling, media, overlays and signatures", () => {
  const exports = {} as { default: (props: unknown) => Node };
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./InventoryItemAppearance.tsx", import.meta.url),
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
        if (name === "next/image") return { default: "image" };
        if (name === "next/link") return { default: "link" };
        if (name === "@/app/fonts")
          return { bangers: { className: "bangers" } };
        if (name.endsWith("/images")) return imageUtils;
        if (name.endsWith("/imagePlaceholder"))
          return { IMAGE_PLACEHOLDER: "blur" };
        if (name.endsWith("/categoryIcons"))
          return {
            getCategoryColor: () => "#123456",
            getCategoryIcon: () => null,
          };
        if (name.endsWith("/ItemSignatures")) return { default: "signatures" };
        throw new Error(`Unexpected import ${name}`);
      },
    },
  );
  function descendants(value: unknown): Node[] {
    if (Array.isArray(value)) return value.flatMap(descendants);
    if (!value || typeof value !== "object" || !("props" in value)) return [];
    const node = value as Node;
    return [node, ...descendants(node.props.children)];
  }
  for (const [categoryTitle, title] of [
    ["Vehicle", "Roadster"],
    ["HyperChrome", "HyperShift"],
    ["Drift", "Blue Fire"],
  ]) {
    const signs = ["123"];
    const overlay = jsx("overlay", {});
    const view = descendants(
      exports.default({ title, categoryTitle, signs, children: overlay }),
    );
    expect(view.find((node) => node.type === "link")!.props.href).toBe(
      `/item/${encodeURIComponent(categoryTitle)}/${encodeURIComponent(title)}`,
    );
    expect(view.find((node) => node.type === "h2")!.props.className).toContain(
      "bangers",
    );
    expect(view.some((node) => node === overlay)).toBe(true);
    expect(view.find((node) => node.type === "signatures")!.props.signs).toBe(
      signs,
    );
    if (imageUtils.isVideoItem(title)) {
      expect(view.find((node) => node.type === "video")!.props.src).toBe(
        imageUtils.getVideoPath(categoryTitle, title),
      );
    } else {
      const image = view.find((node) => node.type === "image")!;
      expect(image.props.src).toBe(
        imageUtils.getItemImagePath(categoryTitle, title, true),
      );
      expect(image.props.onError).toBe(imageUtils.handleImageError);
    }
  }
});

function mobileValues(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.flatMap(mobileValues);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  if (node.type === InventoryMarketSummary)
    return mobileValues(
      InventoryMarketSummary(
        node.props as Parameters<typeof InventoryMarketSummary>[0],
      ),
    );
  return node.type === "span" && node.props.className === "sm:hidden"
    ? [node.props.children]
    : mobileValues(node.props.children);
}

for (const path of ["../OG/OGItemCard.tsx"]) {
  test(`${path} shows N/A for unavailable mobile values and preserves compact prices`, () => {
    const exports = {} as { default: (props: unknown) => Node };
    const noop = () => null;
    const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
    runInNewContext(
      transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      }).outputText,
      {
        exports,
        require: (name: string) => {
          if (name === "react")
            return { useState: (value: unknown) => [value, noop] };
          if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
          if (name === "@/components/Inventory/InventoryMarketSummary")
            return { default: InventoryMarketSummary };
          if (name === "@/utils/items/itemValue") return { hasItemValue };
          if (name === "@/utils/trading/values") return { formatFullValue };
          if (name === "@/utils/trading/inventoryValues")
            return { getInventoryDupedValue };
          if (name === "@/app/fonts") return { bangers: { className: "" } };
          return new Proxy({}, { get: () => noop });
        },
      },
    );
    const render = (
      cash: string | null | undefined,
      duped = cash,
      isDupedItem = false,
    ) =>
      mobileValues(
        exports.default({
          item: {
            id: "owned",
            title: "Blue Fire",
            categoryTitle: "Drift",
            info: [],
            uniqueCirculation: 1,
            user_id: "123",
            logged_at: 0,
          },
          itemData: { cash_value: cash, duped_value: duped },
          userId: "123",
          isDupedItem,
          getUserAvatar: noop,
          getUsername: noop,
          getUserDisplay: noop,
        }),
      );
    for (const value of [null, undefined, "", " ", "null", "N/A", " N/A "])
      expect(render(value)).toEqual(["N/A", "N/A"]);
    expect(render("28m")).toEqual(["28m", "28m"]);
    expect(render("0")).toEqual(["0", "0"]);
    expect(render("28m", "")).toEqual(["28m", "N/A"]);
  });
}

for (const cardPath of ["./InventoryItemCard.tsx", "../OG/OGItemCard.tsx"]) {
  test(`${cardPath} keeps compact ownership and history actions without oversized stat blocks`, () => {
    const exports = {} as { default: (props: unknown) => Node };
    const noop = () => null;
    const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
    runInNewContext(
      transpileModule(
        readFileSync(new URL(cardPath, import.meta.url), "utf8"),
        {
          compilerOptions: {
            module: ModuleKind.CommonJS,
            jsx: JsxEmit.ReactJSX,
          },
        },
      ).outputText,
      {
        exports,
        require: (name: string) => {
          if (name === "react")
            return { useState: (initial: unknown) => [initial, noop] };
          if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
          if (name === "@/components/ui/button") return { Button: "button" };
          if (name.endsWith("/InventoryMarketSummary"))
            return { default: "market-summary" };
          if (name === "next/image") return { default: "image" };
          if (name === "next/link") return { default: "link" };
          if (name === "@/app/fonts") return { bangers: { className: "" } };
          if (name === "@/utils/helpers/timestamp")
            return { formatMonthDayYear: () => "Oct 31, 2026" };
          return new Proxy({}, { get: () => noop });
        },
      },
    );
    function descendants(value: unknown): Node[] {
      if (Array.isArray(value)) return value.flatMap(descendants);
      if (!value || typeof value !== "object" || !("props" in value)) return [];
      const node = value as Node;
      return [node, ...descendants(node.props.children)];
    }
    const item = {
      id: "copy",
      title: "Roadster",
      categoryTitle: "Vehicle",
      info: [
        { title: "Original Owner", value: "123" },
        { title: "Created At", value: "Oct 31, 2026" },
      ],
      isOriginalOwner: false,
      user_id: "123",
      logged_at: 1793441409,
    };
    const opened: unknown[] = [];
    const props = {
      item,
      userId: "456",
      getUserDisplay: (id: string) => `User ${id}`,
      getUsername: (id: string) => `User ${id}`,
      getUserAvatar: (id: string) => `/avatar/${id}`,
      onCardClick: (selected: unknown) => opened.push(selected),
    };
    let view = descendants(exports.default(props));
    if (cardPath === "./InventoryItemCard.tsx") {
      expect(
        view.find((node) => node.type === "market-summary")!.props.isDuped,
      ).toBe(false);
      const dupedView = descendants(
        exports.default({ ...props, isDupedItem: true }),
      );
      expect(
        dupedView.find((node) => node.type === "market-summary")!.props.isDuped,
      ).toBe(true);
    }
    const inventoryLink = view.find(
      (node) => node.props.children === "Check inventory",
    )!;
    expect(inventoryLink.props.href).toBe("/inventories/123");
    expect(inventoryLink.props.prefetch).toBe(false);
    expect(view.find((node) => node.type === "a")!.props.href).toBe(
      "https://www.roblox.com/users/123/profile",
    );
    expect(
      view.some(
        (node) =>
          node.props.children ===
          (cardPath.includes("OG/") ? "Current owner" : "Original owner"),
      ),
    ).toBe(true);
    expect(view.some((node) => node.props.children === "MONTHLY UNIQUE")).toBe(
      false,
    );
    expect(view.some((node) => node.props.children === "CASH VALUE")).toBe(
      false,
    );
    expect(view.some((node) => node.props.children === "DUPED VALUE")).toBe(
      false,
    );
    const history = view.find((node) => node.type === "button")!;
    expect(history.props.children).toBe("History");
    (history.props.onClick as () => void)();
    expect(opened).toEqual([item]);
    view = descendants(
      exports.default({ ...props, item: { ...item, isOriginalOwner: true } }),
    );
    expect(view.find((node) => node.type === "a")!.props.href).toBe(
      `https://www.roblox.com/users/${cardPath.includes("OG/") ? "123" : "456"}/profile`,
    );
    if (cardPath.includes("OG/")) {
      expect(
        view.find((node) => node.props.children === "Check inventory")!.props
          .href,
      ).toBe("/inventories/123");
    } else {
      expect(
        view.some((node) => node.props.children === "Check inventory"),
      ).toBe(false);
      for (const unknownItem of [
        { ...item, id: "missing-copy" },
        { ...item, info: [] },
      ]) {
        const unknownView = descendants(
          exports.default({ ...props, item: unknownItem }),
        );
        expect(
          unknownView.some((node) => node.props.children === "Check inventory"),
        ).toBe(false);
      }
    }
  });
}
