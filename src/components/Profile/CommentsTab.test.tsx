import { expect, test } from "bun:test";
import { QueryClient, queryOptions } from "@tanstack/react-query";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import type { changelogTimelineQueryOptions } from "@/hooks/useChangelogTimeline";

test("profile comments reuse one timeline request for over ten distinct changelogs", async () => {
  const client = new QueryClient();
  const calls: { url: string; options: RequestInit }[] = [];
  const changelogs = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    title: `Update ${i + 1}`,
  }));
  const comments = changelogs.map(({ id }) => ({
    id,
    item_id: id,
    item_type: "changelog",
  }));
  const queries: {
    queryFn: () => Promise<{ changelogs: Record<string, unknown> }>;
  }[] = [];
  const timeline = {} as {
    changelogTimelineQueryOptions: typeof changelogTimelineQueryOptions;
  };
  const component = {} as { default: (props: unknown) => unknown };
  const fetch = async (url: string, options: RequestInit) => {
    calls.push({ url: String(url), options });
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
    const details = await queries[1]!.queryFn();
    expect(Object.keys(details.changelogs)).toHaveLength(12);
    expect(details.changelogs["12"]).toEqual(changelogs[11]);
    await queries[1]!.queryFn();
    await client.fetchQuery(timeline.changelogTimelineQueryOptions());
    expect(calls).toHaveLength(1);
    expect(calls[0]!.options.credentials).toBe("include");
    expect(calls[0]!.options.signal).toBeInstanceOf(AbortSignal);
  } finally {
    client.clear();
  }
});
