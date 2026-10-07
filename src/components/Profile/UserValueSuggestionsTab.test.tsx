import { expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
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
function text(value: unknown): string {
  if (Array.isArray(value)) return value.map(text).join("");
  if (value && typeof value === "object" && "props" in value)
    return text((value as Element).props.children);
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

test("profile and changelog voters follow refreshed data while preserving open modal and selected tab", async () => {
  for (const profile of [true, false]) {
    const client = new QueryClient();
    const key = ["profile-value-suggestions", "author", 1];
    const oldVoter = { created_at: 1, user: { id: "old", username: "Old" } };
    const newVoter = { created_at: 2, user: { id: "new", username: "New" } };
    const suggestion = {
      id: 1,
      item_id: 1,
      field: "cash_value",
      current_value: "1m",
      suggested_value: "2m",
      reason: "",
      status: "pending",
      upvotes: 1,
      downvotes: 0,
      is_vt: 0,
      created_at: 1,
      updated_at: 1,
      user: { id: "author" },
      votes: { upvotes: [oldVoter], downvotes: [] },
    };
    let refreshed = false;
    const response = () => ({
      items: [
        {
          ...suggestion,
          upvotes: refreshed ? 2 : 1,
          votes: {
            upvotes: refreshed ? [oldVoter, newVoter] : [oldVoter],
            downvotes: [],
          },
        },
      ],
      total: 1,
      total_pages: 1,
    });
    client.setQueryData(key, response());
    const slots: unknown[] = [];
    let cursor = 0;
    let queryOptions:
      | { queryKey: unknown[]; queryFn: () => Promise<unknown> }
      | undefined;
    const exports = {} as { default: (props: unknown) => Element };
    const jsx = (type: unknown, props: Element["props"]): Element => ({
      type,
      props,
    });
    runInNewContext(
      transpileModule(
        readFileSync(
          new URL(
            profile
              ? "./UserValueSuggestionsTab.tsx"
              : "../Values/ChangelogDetailsClient.tsx",
            import.meta.url,
          ),
          "utf8",
        ),
        {
          compilerOptions: {
            module: ModuleKind.CommonJS,
            jsx: JsxEmit.ReactJSX,
          },
        },
      ).outputText,
      {
        exports,
        fetch: async () => Response.json(response()),
        require: (name: string) => {
          if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
          if (name === "react")
            return {
              useState: (initial: unknown) => {
                const index = cursor++;
                if (!(index in slots)) slots[index] = initial;
                return [
                  slots[index],
                  (update: unknown) => {
                    slots[index] =
                      typeof update === "function"
                        ? update(slots[index])
                        : update;
                  },
                ];
              },
              useRef: (current: unknown) => {
                const index = cursor++;
                if (!(index in slots)) slots[index] = { current };
                return slots[index];
              },
              useMemo: (callback: () => unknown) => callback(),
              useEffect: () => {},
            };
          if (name === "@tanstack/react-query")
            return {
              useQuery: (options: typeof queryOptions) => {
                if (options?.queryKey[0] === "profile-value-suggestions") {
                  queryOptions = options;
                  return { data: client.getQueryData(key) };
                }
                return {};
              },
            };
          if (name === "@/services/logger") return { createLogger: () => ({}) };
          if (name === "@/utils/api/apiDevToken")
            return {
              buildApiFetchRequest: () => ({
                url: "/suggestions",
                headers: {},
              }),
            };
          if (name === "@/utils/items/categoryIcons")
            return {
              getCategoryIcon: () => null,
              getCategoryColor: () => "#fff",
            };
          if (name === "@/utils/ui/images")
            return {
              getItemImagePath: () => "/item",
              isVideoItem: () => false,
            };
          if (name === "@/utils/helpers/timestamp")
            return {
              formatMessageDate: () => "Date",
              formatShortDateTime: () => "Date",
              formatCustomDate: () => "Date",
            };
          if (name === "@/utils/trading/values")
            return { formatFullValue: String, formatPrice: String };
          if (name === "@/components/ui/dialog") return { Dialog: "Dialog" };
          if (name === "@/components/ui/tabs")
            return { Tabs: "Tabs", TabsTrigger: "TabsTrigger" };
          return { default: name };
        },
      },
    );
    const render = () => {
      cursor = 0;
      return exports.default(
        profile
          ? { userId: "author" }
          : {
              userData: {},
              changelog: {
                id: 1,
                change_count: 1,
                created_at: 1,
                change_data: [
                  {
                    change_id: 1,
                    id: 1,
                    item: { id: 1, name: "Car", type: "Vehicle" },
                    changed_by: "Author",
                    reason: null,
                    changes: {
                      old: { cash_value: "1m" },
                      new: { cash_value: "2m" },
                    },
                    created_at: 1,
                    suggestion: {
                      id: 1,
                      user_id: "author",
                      suggestor_name: "Author",
                      data: { reason: "" },
                      vote_data: {
                        upvotes: refreshed ? 2 : 1,
                        downvotes: 0,
                        voters: (refreshed
                          ? [oldVoter, newVoter]
                          : [oldVoter]
                        ).map((vote) => ({
                          id: vote.user.id,
                          name: vote.user.username,
                          avatar: "",
                          vote_type: "upvote",
                          timestamp: vote.created_at,
                        })),
                      },
                    },
                  },
                ],
              },
            },
      );
    };
    const event = { preventDefault: () => {}, stopPropagation: () => {} };
    const button = elements(render()).find(
      (element) =>
        element.props["aria-label"] ===
        (profile ? "View upvoters" : "View voters"),
    );
    (button?.props.onClick as (event: unknown) => void)(event);
    const getDialog = () =>
      elements(render()).find((element) => element.type === "Dialog")!;
    expect(getDialog().props.open).toBe(true);
    refreshed = true;
    if (profile) await client.fetchQuery({ ...queryOptions!, staleTime: 0 });
    const dialog = getDialog();
    expect(dialog.props.open).toBe(true);
    expect(
      elements(dialog).find((element) => element.type === "Tabs")?.props.value,
    ).toBe("up");
    expect(
      text(
        elements(dialog).find(
          (element) =>
            element.type === "TabsTrigger" && element.props.value === "up",
        ),
      ),
    ).toContain("(2)");
    expect(
      elements(dialog).some((element) => element.props.href === "/users/new"),
    ).toBe(true);
    (dialog.props.onOpenChange as (open: boolean) => void)(false);
    expect(getDialog().props.open).toBe(false);
    client.clear();
  }
});
