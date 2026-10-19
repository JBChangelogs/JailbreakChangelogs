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

test("card actions check the owner and catalog ID, compare the instance, and open separate history/report flows", async () => {
  const states: unknown[] = [];
  let stateIndex = 0;
  const checks: unknown[][] = [];
  let checkFails = false;
  let result = {
    ratio: 0.45,
    check: true,
    is_duped: false,
    dupe_logged_at: 1791835200,
    original_logged_at: 1791748800,
  };
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
        if (name === "@/utils/api/dupeCheck")
          return {
            checkDupe: async (...args: unknown[]) => {
              checks.push(args);
              if (checkFails) throw new Error("Check failed");
              return result;
            },
          };
        if (name === "@/utils/dupeComparisonUrl")
          return { getDupeComparisonUrl };
        if (name === "@/utils/ui/imagePlaceholder")
          return { IMAGE_PLACEHOLDER };
        if (name === "@/components/ui/dialog")
          return {
            Dialog: "Dialog",
            DialogClose: "DialogClose",
            DialogContent: "DialogContent",
            DialogDescription: "DialogDescription",
            DialogFooter: "DialogFooter",
            DialogHeader: "DialogHeader",
            DialogTitle: "DialogTitle",
          };
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
            formatShortDateTime: (timestamp: number) => `Date ${timestamp}`,
            formatRelativeDate: (timestamp: number) => `Relative ${timestamp}`,
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
    itemData: {},
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
  expect(
    flatten(card).find((element) => element.type === "Dialog")?.props.open,
  ).toBe(false);
  expect(JSON.stringify(card)).not.toContain("h-20");
  expect(JSON.stringify(card)).not.toContain(
    "Run a check or compare ownership histories to review this record.",
  );
  const elements = flatten(card);
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
  ).toHaveLength(3);
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
  button("Dupe check").props.onClick!();
  stateIndex = 0;
  const loading = exports.default(props);
  expect(
    flatten(loading).find((element) => element.type === "Dialog")?.props.open,
  ).toBe(true);
  expect(
    flatten(loading).find((element) => element.props["aria-live"] === "polite")
      ?.props["aria-busy"],
  ).toBe(true);
  expect(JSON.stringify(loading)).toContain(
    "Checking the recorded ownership history...",
  );
  expect(JSON.stringify(loading)).not.toContain("Report false dupe");
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(checks).toEqual([["123", 49]]);
  stateIndex = 0;
  const checked = exports.default(props);
  expect(JSON.stringify(checked)).toContain("Not flagged by this check");
  expect(JSON.stringify(checked)).not.toContain("Flagged as duped");
  expect(JSON.stringify(checked)).toContain("Check details");
  expect(
    flatten(checked).find((element) => element.type === "DialogContent")?.props
      .className,
  ).toContain("max-w-3xl");
  expect(
    flatten(checked).filter((element) => element.type === "TooltipContent"),
  ).toHaveLength(0);
  expect(JSON.stringify(checked)).not.toContain(
    "Review the recorded history for this",
  );
  expect(JSON.stringify(checked)).toContain("Checks flagged: 2/3");
  expect(JSON.stringify(checked)).toContain("Relative 1791835200");
  expect(JSON.stringify(checked)).toContain("Relative 1791748800");
  expect(JSON.stringify(checked)).not.toContain("Confidence");
  for (const description of [
    "Whether the history difference exceeds 30%.",
    "Trading patterns associated with duplicated items.",
    "Whether this check flags the item as duplicated.",
  ]) {
    expect(
      flatten(checked).some(
        (element) =>
          element.type === "p" && element.props.children === description,
      ),
    ).toBe(true);
  }
  expect(JSON.stringify(checked)).toContain("Date 1791835200");
  expect(JSON.stringify(checked)).toContain("Date 1791748800");
  const detailRow = (tree: Element, label: string) =>
    flatten(tree).find(
      (element) =>
        element.type === "li" &&
        flatten(element).some((child) => child.props.children === label),
    )!;
  expect(JSON.stringify(detailRow(checked, "History change"))).toContain(
    '"children":"Flagged"',
  );
  expect(JSON.stringify(detailRow(checked, "Pattern analysis"))).toContain(
    '"children":"Flagged"',
  );
  expect(JSON.stringify(detailRow(checked, "Dupe threshold"))).toContain(
    '"children":"Not flagged"',
  );
  result = {
    ratio: 0.3,
    check: false,
    is_duped: true,
    dupe_logged_at: 0,
    original_logged_at: 0,
  };
  expect(JSON.stringify(checked)).not.toContain("Check again");
  expect(JSON.stringify(checked)).not.toContain("Try again");
  button("Dupe check").props.onClick!();
  await new Promise((resolve) => setTimeout(resolve, 0));
  stateIndex = 0;
  const rechecked = exports.default(props);
  expect(JSON.stringify(detailRow(rechecked, "History change"))).toContain(
    '"children":"Not flagged"',
  );
  expect(JSON.stringify(detailRow(rechecked, "Pattern analysis"))).toContain(
    '"children":"Not flagged"',
  );
  expect(JSON.stringify(detailRow(rechecked, "Dupe threshold"))).toContain(
    '"children":"Flagged"',
  );
  expect(JSON.stringify(rechecked)).toContain("Not available");
  expect(JSON.stringify(rechecked)).toContain("Checks flagged: 1/3");
  expect(JSON.stringify(rechecked)).not.toContain("Relative 0");
  expect(JSON.stringify(rechecked)).toContain("Flagged as duped");
  const dialog = flatten(checked).find((element) => element.type === "Dialog")!;
  expect(dialog.props.open).toBe(true);
  expect(
    flatten(checked).find(
      (element) => element.props.children === "Compare histories",
    )?.props.href,
  ).toBe(getDupeComparisonUrl(item));
  const footer = flatten(dialog).find(
    (element) => element.type === "DialogFooter",
  )!;
  expect(footer.props.className).toContain("flex flex-col");
  expect(footer.props.className).toContain("sm:flex-row sm:justify-end");
  expect(
    flatten(footer).filter((element) => element.type === "Button"),
  ).toHaveLength(2);
  expect(
    flatten(footer).some((element) => element.props.children === "Close"),
  ).toBe(false);
  const evidence = flatten(footer).find(
    (element) => element.props.children === "Compare histories",
  )!;
  expect(evidence.props.target).toBe("_blank");
  expect(evidence.props.rel).toBe("noopener noreferrer");
  expect(
    flatten(footer).find(
      (element) =>
        element.type === "Button" && element.props.children === evidence,
    )?.props.variant,
  ).toBeUndefined();
  const report = flatten(dialog).find(
    (element) =>
      element.type === "Button" &&
      element.props.children === "Report false dupe",
  )!;
  expect(report.props.variant).toBe("secondary");
  report.props.onClick!();
  expect(reports).toEqual([item]);
  stateIndex = 0;
  expect(
    flatten(exports.default(props)).find((element) => element.type === "Dialog")
      ?.props.open,
  ).toBe(false);
  for (const flaggedCount of [0, 1, 2, 3]) {
    result = {
      ...result,
      ratio: flaggedCount >= 1 ? 0.45 : 0,
      check: flaggedCount >= 2,
      is_duped: flaggedCount >= 3,
    };
    button("Dupe check").props.onClick!();
    await new Promise((resolve) => setTimeout(resolve, 0));
    stateIndex = 0;
    const scoredCard = exports.default(props);
    const scored = JSON.stringify(scoredCard);
    expect(scored).toContain(`Checks flagged: ${flaggedCount}/3`);
    expect(scored.includes("Report false dupe")).toBe(flaggedCount < 3);
    expect(
      scored.includes("Review the comparison before reporting a false dupe."),
    ).toBe(flaggedCount < 3);
    const scoredFooter = flatten(scoredCard).find(
      (element) => element.type === "DialogFooter",
    )!;
    expect(scoredFooter.props.className).toContain(
      "sm:flex-row sm:justify-end",
    );
    expect(
      flatten(scoredFooter).filter((element) => element.type === "Button"),
    ).toHaveLength(flaggedCount < 3 ? 2 : 1);
    const comparisonButton = flatten(scoredFooter).find(
      (element) => element.type === "Button" && element.props.asChild,
    )!;
    expect(comparisonButton.props.className).toBe("w-full sm:w-auto");
  }
  checkFails = true;
  button("Dupe check").props.onClick!();
  await new Promise((resolve) => setTimeout(resolve, 0));
  stateIndex = 0;
  const failed = exports.default(props);
  const retry = flatten(failed).find(
    (element) =>
      element.type === "Button" && element.props.children === "Try again",
  )!;
  expect(retry).toBeDefined();
  checkFails = false;
  retry.props.onClick!();
  await new Promise((resolve) => setTimeout(resolve, 0));
  stateIndex = 0;
  expect(JSON.stringify(exports.default(props))).not.toContain("Try again");
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
