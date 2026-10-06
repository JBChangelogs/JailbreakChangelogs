import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

test("all overview showcases hide loaded empty data while full sections, loading, and errors remain visible", () => {
  for (const [component, emptyData] of [
    ["FavoritesTab", []],
    ["TradeAdsProfileTab", { items: [], totalPages: 1 }],
    ["CommentsTab", { comments: [], totalPages: 1, totalComments: 0 }],
  ] as const) {
    let result: Record<string, unknown> = {
      data: emptyData,
      isPending: false,
      isError: false,
    };
    const exports = {} as { default: (props: unknown) => unknown };
    const jsx = (type: unknown, props: unknown) => ({ type, props });
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
        process: {
          env: { NEXT_PUBLIC_API_URL: "https://public-api.example.com" },
        },
        require: (name: string) => {
          if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
          if (name === "react")
            return {
              useState: (initial: unknown) => [initial, () => {}],
              useEffect: () => {},
              useCallback: (callback: unknown) => callback,
            };
          if (name === "@tanstack/react-query")
            return { useQuery: () => result, useQueryClient: () => ({}) };
          if (name === "@/services/logger")
            return { createLogger: () => ({ error: () => {} }) };
          return {};
        },
      },
    );
    const props = {
      user: { id: "123", roblox_id: "456" },
      userId: "123",
      currentUserId: "789",
    };
    expect(exports.default({ ...props, preview: true })).toBeNull();
    expect(
      exports.default({
        ...props,
        preview: true,
        currentUserId: "123",
        isOwnProfile: true,
      }),
    ).toBeNull();
    expect(exports.default({ ...props, preview: false })).not.toBeNull();

    result = { isPending: true, isError: false };
    expect(exports.default({ ...props, preview: true })).not.toBeNull();
    result = {
      isPending: false,
      isError: true,
      error: new Error("Request failed"),
    };
    expect(exports.default({ ...props, preview: true })).not.toBeNull();
  }
});
