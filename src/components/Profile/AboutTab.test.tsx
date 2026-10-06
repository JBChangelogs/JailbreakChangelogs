import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

test("profile refreshes preserve an active bio draft and sync it after editing ends", () => {
  let editing = true;
  let stateIndex = 0;
  const updates: Array<[number, unknown]> = [];
  const exports = {} as { default: (props: unknown) => unknown };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./AboutTab.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react")
          return {
            useState: () => {
              const index = stateIndex++;
              return [
                [false, editing, "Unfinished draft", false][index],
                (value: unknown) => updates.push([index, value]),
              ];
            },
            useEffect: (effect: () => void) => effect(),
          };
        if (name === "react/jsx-runtime")
          return {
            jsx: (type: unknown, props: unknown) => ({ type, props }),
            jsxs: (type: unknown, props: unknown) => ({ type, props }),
          };
        if (name === "@/services/logger") return { createLogger: () => ({}) };
        if (name === "@/contexts/AuthContext")
          return { useAuthContext: () => ({ isAuthenticated: true }) };
        if (name === "@/hooks/useRealTimeRelativeDate")
          return { useRealTimeRelativeDate: () => "Just now" };
        if (name === "@/utils/ui/sanitizeText")
          return { sanitizeText: (text: string) => text };
        if (name === "@/utils/ui/urlConverter")
          return { convertUrlsToLinks: (text: string) => text };
        if (name === "@/utils/helpers/timestamp")
          return { formatProfileDate: () => "Today" };
        return {};
      },
    },
  );
  const props = {
    user: { id: "1", username: "owner", usernumber: 7 },
    currentUserId: "1",
    bio: "Refreshed bio",
    bioLastUpdated: 1,
  };
  exports.default(props);
  expect(updates).toEqual([]);
  editing = false;
  stateIndex = 0;
  exports.default(props);
  expect(updates).toContainEqual([2, "Refreshed bio"]);
});
