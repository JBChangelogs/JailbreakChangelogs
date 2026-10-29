import { expect, test } from "bun:test";
import { QueryClient, queryOptions } from "@tanstack/react-query";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";
import { parseJsonWithLargeIds } from "@/utils/api/parseJsonWithLargeIds";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import type { changelogTimelineQueryOptions } from "@/hooks/useChangelogTimeline";

test("profile comments reuse one timeline request for over ten distinct changelogs", async () => {
  const client = new QueryClient();
  const calls: { url: string; options: RequestInit }[] = [];
  const changelogs = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    title: `Update ${i + 1}`,
  }));
  const comments: {
    id: number;
    item_id: number | string;
    item_type: string;
  }[] = changelogs.map(({ id }) => ({
    id,
    item_id: id,
    item_type: "changelog",
  }));
  const queries: {
    queryKey: unknown[];
    enabled?: boolean;
    queryFn: (context?: { signal: AbortSignal }) => Promise<
      {
        comments: { item_id: string }[];
        changelogs: Record<string, unknown>;
      } & Record<string, { username?: string }>
    >;
  }[] = [];
  const timeline = {} as {
    changelogTimelineQueryOptions: typeof changelogTimelineQueryOptions;
  };
  const component = {} as { default: (props: unknown) => unknown };
  const fetch = async (url: string, options: RequestInit) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("/v2/users/batch")) {
      return new Response(
        '[{"id":123456789012345678,"username":"Owner one","avatar":"hash"},{"id":987654321098765432,"username":"Owner two","avatar":null}]',
      );
    }
    if (String(url).includes("/comments?page=")) {
      return new Response(
        '{"items":[{"id":42,"item_type":"user","item_id":123456789012345678,"user":{"id":"author","username":"Author"}}],"total":1,"total_pages":1}',
      );
    }
    expect(String(url)).toBe("https://api.example.com/v2/changelogs");
    return Response.json(changelogs);
  };
  for (const [path, exports] of [
    ["../../hooks/useChangelogTimeline.ts", timeline],
    ["./CommentsTab.tsx", component],
  ] as const) {
    runInNewContext(
      transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          jsx: JsxEmit.ReactJSX,
          target: ScriptTarget.ES2022,
        },
      }).outputText,
      {
        exports,
        fetch,
        URLSearchParams,
        require: (name: string) => {
          if (name === "nuqs")
            return {
              parseAsInteger: {
                withDefault: () => ({ withOptions: () => ({}) }),
              },
              useQueryState: () => [1, () => {}],
            };
          if (name === "react")
            return {
              useState: () => [1, () => {}],
              useCallback: (fn: unknown) => fn,
              useEffect() {},
            };
          if (name === "react/jsx-runtime")
            return { jsx: () => null, jsxs: () => null };
          if (name === "@tanstack/react-query")
            return {
              queryOptions,
              useQueryClient: () => client,
              useQuery: (options: (typeof queries)[number]) => {
                queries.push(options);
                return {
                  data:
                    queries.length === 1
                      ? {
                          comments,
                          totalPages: 1,
                          totalComments: comments.length,
                        }
                      : undefined,
                };
              },
            };
          if (name === "@/utils/api/api")
            return { PUBLIC_API_URL: "https://api.example.com" };
          if (name === "@/utils/api/parseJsonWithLargeIds")
            return { parseJsonWithLargeIds };
          if (name === "@/utils/api/apiDevToken")
            return { buildApiFetchRequest };
          if (name === "@/hooks/useChangelogTimeline") return timeline;
          if (name === "@/app/users/[id]/actions")
            return { fetchCommentDetails: async () => ({}) };
          if (name === "@/services/logger")
            return { createLogger: () => ({ error() {} }) };
          return {};
        },
      },
    );
  }
  try {
    component.default({ userId: "123" });
    expect(queries[1]!.enabled).toBe(false);
    const details = await queries[2]!.queryFn();
    expect(Object.keys(details.changelogs)).toHaveLength(12);
    expect(details.changelogs["12"]).toEqual(changelogs[11]);
    await queries[2]!.queryFn();
    await client.fetchQuery(timeline.changelogTimelineQueryOptions());
    expect(calls).toHaveLength(1);
    expect(calls[0]!.options.credentials).toBe("include");
    expect(calls[0]!.options.signal).toBeInstanceOf(AbortSignal);
    comments.splice(
      0,
      comments.length,
      { id: 1, item_id: "123456789012345678", item_type: "user" },
      { id: 2, item_id: "123456789012345678", item_type: "user" },
      { id: 3, item_id: "987654321098765432", item_type: "user" },
    );
    queries.length = 0;
    component.default({ userId: "123" });
    expect(queries[1]!.enabled).toBe(true);
    const parsedComments = await queries[0]!.queryFn({
      signal: new AbortController().signal,
    });
    expect(parsedComments.comments[0]!.item_id).toBe("123456789012345678");
    const owners = await queries[1]!.queryFn({
      signal: new AbortController().signal,
    });
    expect(owners["123456789012345678"].username).toBe("Owner one");
    expect(owners["987654321098765432"].username).toBe("Owner two");
    const batchCalls = calls.filter((call) =>
      call.url.includes("/v2/users/batch"),
    );
    expect(batchCalls).toHaveLength(1);
    const params = new URL(batchCalls[0]!.url).searchParams;
    expect(params.get("ids")).toBe("123456789012345678,987654321098765432");
    expect(params.get("fields")).toBe(
      "id,username,avatar,custom_avatar,premiumtype,settings_v2",
    );
    expect(batchCalls[0]!.options.credentials).toBe("include");
  } finally {
    client.clear();
  }
});
