import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { competitionStatus } from "@/utils/api/userThemes";

test("the banner respects the preference even when current competition data is cached", () => {
  let enabled = true;
  let queryEnabled: boolean | undefined;
  const exports = {} as { default: () => unknown };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./CompetitionBanner.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") {
          const jsx = (type: unknown, props: unknown) => ({ type, props });
          return { jsx, jsxs: jsx };
        }
        if (name === "react")
          return {
            useSyncExternalStore: () => enabled,
            useReducer: () => [0, () => {}],
            useEffect: () => {},
          };
        if (name === "@tanstack/react-query")
          return {
            useQueryClient: () => ({}),
            useQuery: (options: { enabled: boolean }) => {
              queryEnabled = options.enabled;
              return {
                data: {
                  id: 7,
                  title: "Fall Competition",
                  starts_at: 0,
                  ends_at: Date.now() / 1000 + 3600,
                },
              };
            },
          };
        if (name.endsWith("userThemes")) return { competitionStatus };
        return {};
      },
    },
  );
  expect(exports.default()).not.toBeNull();
  expect(queryEnabled).toBe(true);
  enabled = false;
  expect(exports.default()).toBeNull();
  expect(queryEnabled).toBe(false);
  enabled = true;
  expect(exports.default()).not.toBeNull();
});
