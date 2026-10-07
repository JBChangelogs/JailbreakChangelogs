import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

type Element = { type: unknown; props: Record<string, unknown> };
function elements(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(elements);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const element = value as Element;
  return [element, ...elements(element.props.children)];
}

for (const component of ["ItemSuggestionsTab", "ItemChangelogsTab"]) {
  test(`${component} refreshes an open voters modal from query data`, () => {
    const states: unknown[] = [];
    let stateIndex = 0;
    const entry = {
      id: 7,
      field: "cash_value",
      current_value: "1",
      suggested_value: "2",
      reason: "",
      status: "pending",
      created_at: 1,
      updated_at: 1,
      user: { id: "submitter" },
      upvotes: 0,
      downvotes: 1,
      votes: {
        upvotes: [],
        downvotes: [{ created_at: 1, user: { id: "old-voter" } }],
      },
    };
    let data = { items: [entry], total: 1, total_pages: 1 };
    const exports = {} as { default: (props: unknown) => Element };
    const jsx = (type: unknown, props: Element["props"]): Element => ({
      type,
      props,
    });
    runInNewContext(
      transpileModule(
        readFileSync(new URL(`./${component}.tsx`, import.meta.url), "utf8"),
        {
          compilerOptions: {
            module: ModuleKind.CommonJS,
            jsx: JsxEmit.ReactJSX,
          },
        },
      ).outputText,
      {
        exports,
        Map,
        Set,
        require: (name: string) => {
          if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
          if (name === "react")
            return {
              useState: (initial: unknown) => {
                const index = stateIndex++;
                if (!(index in states)) states[index] = initial;
                return [
                  states[index],
                  (update: unknown) => {
                    states[index] = update;
                  },
                ];
              },
              useRef: (current: unknown) => ({ current }),
              useEffect: () => {},
            };
          if (name === "@tanstack/react-query")
            return { useQuery: () => ({ data, isPending: false }) };
          if (name === "@/services/logger") return { createLogger: () => ({}) };
          if (name === "@/utils/helpers/timestamp")
            return {
              formatMessageDate: () => "date",
              formatShortDateTime: () => "date",
            };
          if (name === "@/utils/trading/values")
            return { formatFullValue: (value: string) => value };
          if (name === "@/components/ui/tabs")
            return {
              Tabs: "Tabs",
              TabsTrigger: "TabsTrigger",
              TabsList: "TabsList",
              TabsContent: "TabsContent",
            };
          return { default: name };
        },
      },
    );
    const render = () => {
      stateIndex = 0;
      return exports.default({ itemId: 1 });
    };
    const open = elements(render()).find(
      (element) => element.props["aria-label"] === "View downvoters",
    )!.props.onClick as (event: unknown) => void;
    open({ stopPropagation: () => {}, preventDefault: () => {} });
    const initialModal = elements(render()).find(
      (element) => element.props.open === true,
    )!;
    expect(
      elements(initialModal).some(
        (element) => element.props.href === "/users/old-voter",
      ),
    ).toBe(true);
    data = {
      ...data,
      items: [
        {
          ...entry,
          downvotes: 2,
          votes: {
            upvotes: [],
            downvotes: [{ created_at: 2, user: { id: "new-voter" } }],
          },
        },
      ],
    };
    const refreshedModal = elements(render()).find(
      (element) => element.props.open === true,
    )!;
    const descendants = elements(refreshedModal);
    expect(
      descendants.some((element) => element.props.href === "/users/old-voter"),
    ).toBe(false);
    expect(
      descendants.some((element) => element.props.href === "/users/new-voter"),
    ).toBe(true);
    expect(
      descendants.find((element) => element.type === "Tabs")?.props.value,
    ).toBe("down");
    const downTab = descendants.find(
      (element) =>
        element.type === "TabsTrigger" && element.props.value === "down",
    )!;
    const count = elements(downTab).find(
      (element) =>
        typeof element.props.className === "string" &&
        element.props.className.includes("opacity-80"),
    );
    expect(count?.props.children).toEqual(["(", 2, ")"]);
  });
}
