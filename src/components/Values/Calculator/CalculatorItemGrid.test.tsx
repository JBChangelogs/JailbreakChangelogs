import { expect, test } from "bun:test";
import { isValidElement, type ReactNode } from "react";
import type { TradeItem } from "@/types/trading";
import { CalculatorItemGrid } from "./CalculatorItemGrid";
import { ItemGrid } from "@/components/trading/ItemGrid";
import { TradeSideHeading } from "./TradeSideHeading";
import { renderToStaticMarkup } from "react-dom/server";

function buttons(
  node: ReactNode,
): { "aria-label"?: string; onClick?: () => void }[] {
  if (Array.isArray(node)) return node.flatMap(buttons);
  if (
    !isValidElement<{
      children?: ReactNode;
      "aria-label"?: string;
      onClick?: () => void;
    }>(node)
  )
    return [];
  return [
    ...(node.type === "button" ? [node.props] : []),
    ...buttons(node.props.children),
  ];
}

test("visible quantity controls remove one copy or the entire matching condition stack", async () => {
  const item: TradeItem = {
    id: 1,
    name: "Torpedo",
    type: "Vehicle",
    cash_value: "30m",
    duped_value: "20m",
    is_limited: 1,
    is_seasonal: 0,
    tradable: 1,
  };
  const removed: string[] = [];
  const added: TradeItem[] = [];
  const controls = buttons(
    await CalculatorItemGrid({
      items: [
        { ...item, instanceId: "clean-1" },
        { ...item, instanceId: "clean-2" },
        { ...item, instanceId: "duped-1", isDuped: true },
      ],
      onRemove: (id) => removed.push(id),
      onDuplicate: (entry) => added.push(entry),
    }),
  );
  const click = (label: string) => {
    const control = controls.find((entry) => entry["aria-label"] === label);
    expect(control).toBeDefined();
    control?.onClick?.();
  };
  click("Remove one Torpedo");
  expect(removed).toEqual(["clean-2"]);
  removed.length = 0;
  click("Remove all 2 Torpedo");
  expect(removed).toEqual(["clean-1", "clean-2"]);
  click("Add another Torpedo");
  expect(added).toEqual([{ ...item, instanceId: "clean-1" }]);
});

test("trading cards offer separate decrement and remove-stack actions", async () => {
  const item: TradeItem = {
    id: 1,
    name: "Torpedo",
    type: "Vehicle",
    cash_value: "30m",
    duped_value: "20m",
    is_limited: 1,
    is_seasonal: 0,
    tradable: 1,
  };
  const removed: TradeItem[] = [];
  const stacks: TradeItem[] = [];
  const controls = buttons(
    await ItemGrid({
      items: [item, item, { ...item, isDuped: true }],
      title: "You give",
      onRemove: (entry) => removed.push(entry),
      onRemoveAll: (entry) => stacks.push(entry),
    }),
  );
  controls
    .find((entry) => entry["aria-label"] === "Remove one Torpedo")
    ?.onClick?.();
  expect(removed).toHaveLength(1);
  controls
    .find((entry) => entry["aria-label"] === "Remove all 2 Torpedo")
    ?.onClick?.();
  expect(stacks).toHaveLength(1);
  expect(stacks[0].isDuped).toBeUndefined();
  expect(stacks[0]).toHaveProperty("count", 2);
});

test("side headers show direction, item count, and total", () => {
  const give = renderToStaticMarkup(
    <TradeSideHeading side="offering" count={1} total={47_000_000} />,
  );
  const receive = renderToStaticMarkup(
    <TradeSideHeading side="requesting" count={3} total={147_000_000} />,
  );
  expect(give).toContain("You give");
  expect(give).toContain("1 item");
  expect(give).toContain("47,000,000");
  expect(give).toContain("-rotate-45");
  expect(receive).toContain("You receive");
  expect(receive).toContain("3 items");
  expect(receive).toContain("147,000,000");
  expect(receive).toContain("rotate-135");
});
