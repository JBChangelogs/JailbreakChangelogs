import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { getDupeComparisonUrl } from "@/utils/dupeComparisonUrl";
import { IMAGE_PLACEHOLDER } from "@/utils/ui/imagePlaceholder";

type Element = {
  type: unknown;
  props: {
    children?: unknown;
    onClick?: (event?: { preventDefault: () => void }) => void;
    className?: string;
    href?: string;
    [key: string]: unknown;
  };
};

test("card actions pass the original owner to the shared check and preserve history/report flows", () => {
  const states: unknown[] = [];
  let stateIndex = 0;
  const exports = {} as { default: (props: unknown) => Element };
  const jsx = (type: unknown, props: Element["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./DupeItemCard.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react")
          return {
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
          };
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "@/utils/dupeComparisonUrl")
          return { getDupeComparisonUrl };
        if (name === "@/utils/ui/imagePlaceholder")
          return { IMAGE_PLACEHOLDER };
        if (name === "@/components/ui/tooltip")
          return {
            Tooltip: "Tooltip",
            TooltipTrigger: "TooltipTrigger",
            TooltipContent: "TooltipContent",
          };
        if (name === "@/app/fonts") return { bangers: { className: "" } };
        if (name === "@/utils/items/season")
          return { hasSeason: () => false, unlockLevel: () => null };
        if (name === "@/utils/items/itemUnlockPresentation")
          return {
            hasUnlockLevel: () => false,
            formatUnlockRequirementsTooltip: () => "",
          };
        if (name === "@/utils/items/categoryIcons")
          return {
            getCategoryColor: () => "#fff",
            getCategoryIcon: () => null,
          };
        if (name === "@/utils/ui/images")
          return {
            isVideoItem: () => false,
            isDriftItem: () => false,
            getItemImagePath: () => "/item.webp",
          };
        if (name === "@/utils/helpers/timestamp")
          return {
            formatMonthDayYear: () => "Oct 12, 2026",
          };
        return {
          default: name,
          Button: "Button",
          Spinner: "Spinner",
          Icon: "Icon",
        };
      },
    },
  );
  const item = {
    id: "instance&1",
    item_id: 49,
    title: "Spinner",
    categoryTitle: "Rim",
    info: [{ title: "Original Owner", value: "123" }],
  };
  const histories: unknown[] = [];
  const reports: unknown[] = [];
  const props = {
    item,
    itemData: {
      id: 49,
      cash_value: "28m",
      duped_value: "14m",
      demand: "High",
      trend: "Rising",
    },
    robloxId: "999",
    getUsername: (id: string) => id,
    getUserAvatar: () => "/avatar.webp",
    onCardClick: (value: unknown) => histories.push(value),
    onReport: (value: unknown) => reports.push(value),
  };
  const flatten = (node: unknown): Element[] => {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(flatten);
    const element = node as Element;
    return [element, ...flatten(element.props?.children)];
  };
  const card = exports.default(props);
  expect(JSON.stringify(card)).not.toContain("h-20");
  expect(JSON.stringify(card)).not.toContain(
    "Run a check or compare ownership histories to review this record.",
  );
  const elements = flatten(card);
  expect(elements.find((element) => element.type === "a")?.props.href).toBe(
    "https://www.roblox.com/users/123/profile",
  );
  const inventoryLink = elements.find(
    (element) => element.props.children === "Check inventory",
  )!;
  expect(inventoryLink.props.href).toBe("/inventories/123");
  expect(inventoryLink.props.prefetch).toBe(false);
  stateIndex = 0;
  expect(
    flatten(exports.default({ ...props, item: { ...item, info: [] } })).find(
      (element) => element.props.children === "Check inventory",
    )?.props.href,
  ).toBe("/inventories/999");
  expect(
    elements.some((element) => element.props.children === "Original owner"),
  ).toBe(true);
  expect(
    elements.find(
      (element) =>
        element.type === "@/components/Inventory/InventoryMarketSummary",
    )?.props.data,
  ).toBe(props.itemData);
  expect(
    elements.find(
      (element) =>
        element.type === "@/components/Inventory/InventoryMarketSummary",
    )?.props.isDuped,
  ).toBe(true);
  const images = elements.filter((element) => element.type === "next/image");
  expect(images).toHaveLength(2);
  for (const image of images) {
    // Next.js warns when images under 40x40 use a placeholder.
    expect(image.props.placeholder).toBe(
      Number(image.props.width) < 40 ? undefined : IMAGE_PLACEHOLDER,
    );
    expect(image.props.onLoad).toBeUndefined();
  }
  expect(elements.some((element) => element.type === "Spinner")).toBe(false);
  const cardActions = elements.find(
    (element) => element.props.className === "mt-auto grid grid-cols-3 gap-2",
  )!;
  expect(
    flatten(cardActions).filter((element) => element.type === "Button"),
  ).toHaveLength(2);
  expect(JSON.stringify(cardActions)).not.toContain("Report false dupe");
  expect(card.props.role).toBeUndefined();
  expect(JSON.stringify(card)).not.toContain("MONTHLY UNIQUE");
  expect(JSON.stringify(card)).not.toContain("MONTHLY TRADED");
  expect(JSON.stringify(card)).not.toContain("DUPED VALUE");
  const button = (label: string) =>
    elements.find(
      (element) =>
        element.type === "Button" && element.props.children === label,
    )!;
  button("History").props.onClick!();

  expect(histories).toEqual([item]);
  expect(reports).toEqual([]);
  const compare = elements.find(
    (element) => element.props.children === "Compare histories",
  )!;
  expect(compare.props.href).toBe(getDupeComparisonUrl(item));
  expect(compare.props.target).toBe("_blank");
  expect(compare.props.rel).toBe("noopener noreferrer");
  const check = elements.find(
    (element) => element.type === "./DupeCheckButton",
  )!;
  expect(check.props.item).toBe(item);
  expect(check.props.originalOwner).toBe("123");
  expect(check.props.ownerName).toBe("123");
  (check.props.onReport as () => void)();
  expect(reports).toEqual([item]);
  const avatar = images.find(
    (image) => image.props.alt === "Original owner avatar",
  )!;
  (avatar.props.onError as () => void)();
  stateIndex = 0;
  expect(
    flatten(exports.default(props)).some(
      (element) => element.props.alt === "Original owner avatar",
    ),
  ).toBe(false);
});
