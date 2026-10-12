import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { getDupeComparisonUrl } from "@/utils/dupeComparisonUrl";

type Node = {
  type: unknown;
  props: {
    children?: unknown;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
    open?: boolean;
    href?: string;
    item?: {
      id: string;
      item_id?: number;
      title?: string;
      categoryTitle?: string;
    };
    originalOwner?: { id: string; displayName: string };
    onReportResolved?: (status: string) => void;
  };
};
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

function setup(authenticated: boolean) {
  const state: unknown[] = [];
  let index = 0;
  const login: unknown[] = [];
  const exports = {} as { default: (props: unknown) => Node };
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./DupeComparisonNotFound.tsx", import.meta.url),
        "utf8",
      ),
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
              const slot = index++;
              if (!(slot in state)) state[slot] = initial;
              return [
                state[slot],
                (value: unknown) => {
                  state[slot] = value;
                },
              ];
            },
          };
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "next/link") return { default: "Link" };
        if (name === "sonner") return { toast: { info: () => {} } };
        if (name === "@/contexts/AuthContext")
          return {
            useAuthContext: () => ({
              isAuthenticated: authenticated,
              setLoginModal: (value: unknown) => login.push(value),
            }),
          };
        if (name === "@/hooks/useBatchUserData")
          return {
            useBatchUserData: () => ({
              robloxUsers: {
                "235642012": {
                  name: "hamsterskyyy",
                  displayName: "hamsterskyyy",
                },
              },
            }),
          };
        if (name === "@/components/ui/button") return { Button: "Button" };
        if (name === "./ReportFalseDupeModal") return { default: "Modal" };
        throw new Error(`Unexpected import: ${name}`);
      },
    },
  );
  const render = (props: unknown) => {
    index = 0;
    return nodes(exports.default(props));
  };
  return { render, login };
}

test("comparison links preserve symbols and known item details", () => {
  const id = "w4&H<P%N)ra$";
  const params = new URL(
    getDupeComparisonUrl({
      id,
      item_id: 49,
      title: "Laser Cannon",
      categoryTitle: "Rim",
      info: [{ title: "Original Owner", value: "235642012" }],
    }),
    "https://jailbreakchangelogs.com",
  ).searchParams;
  expect(params.get("id")).toBe(id);
  expect(params.get("itemId")).toBe("49");
  expect(params.get("title")).toBe("Laser Cannon");
  expect(params.get("originalOwner")).toBe("235642012");
});

test("missing comparison requires login before opening a report", () => {
  const { render, login } = setup(false);
  let tree = render({
    id: "missing",
    reportItem: { item_id: 49, title: "Laser Cannon" },
  });
  tree
    .find((node) => node.type === "Button" && node.props.onClick)
    ?.props.onClick?.();
  expect(login).toEqual([{ open: true }]);
  tree = render({
    id: "missing",
    reportItem: { item_id: 49, title: "Laser Cannon" },
  });
  expect(tree.find((node) => node.type === "Modal")?.props.open).toBe(false);
});

test("reports preserve the instance, item and resolved owner and acknowledge submission", () => {
  const { render } = setup(true);
  const props = {
    id: "w4&H<P%N)ra$",
    reportItem: { item_id: 49, title: "Laser Cannon", categoryTitle: "Rim" },
    originalOwner: "235642012",
  };
  let tree = render(props);
  const actions = tree.find(
    (node) => node.props.className === "flex flex-wrap items-center gap-2",
  );
  expect(
    nodes(actions?.props.children).filter((node) => node.type === "Button"),
  ).toHaveLength(2);
  tree
    .find((node) => node.type === "Button" && node.props.onClick)
    ?.props.onClick?.();
  tree = render(props);
  const modal = tree.find((node) => node.type === "Modal")!;
  expect(modal.props.open).toBe(true);
  expect(modal.props.item).toEqual({ ...props.reportItem, id: props.id });
  expect(modal.props.originalOwner?.id).toBe(props.originalOwner);
  expect(modal.props.originalOwner?.displayName).toBe("hamsterskyyy");
  modal.props.onReportResolved?.("submitted");
  tree = render(props);
  expect(
    tree.some((node) => node.type === "Button" && node.props.onClick),
  ).toBe(false);
  expect(
    tree.some((node) => node.type === "Link" && node.props.href === "/dupes"),
  ).toBe(true);
  const standalone = setup(true).render({ id: props.id });
  expect(standalone.find((node) => node.type === "Modal")).toBeUndefined();
  expect(
    standalone.find((node) => node.type === "Button" && node.props.onClick)
      ?.props.disabled,
  ).toBe(true);
});
