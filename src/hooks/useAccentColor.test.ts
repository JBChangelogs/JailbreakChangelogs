import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import type { useAccentColor } from "./useAccentColor";
import * as accentUtils from "@/utils/ui/accentColor";

test("reads the current-user accent without a public profile request and refreshes after reset", async () => {
  const user = {
    id: "123",
    accent_color: "13346551" as string | null,
    accent_gradient: 255 as number | null,
    accent_style: "glass",
  };
  const queries: unknown[][] = [];
  const writes: unknown[][] = [];
  const saves: unknown[] = [];
  let refreshes = 0;
  const exports = {} as { useAccentColor: typeof useAccentColor };
  const imports = {
    react: {
      useEffect() {},
      useRef: (current: unknown) => ({ current }),
      useState: () => [null, () => {}],
    },
    "@tanstack/react-query": {
      useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
        queries.push(queryKey);
        return { data: null };
      },
      useQueryClient: () => ({
        setQueryData: (...args: unknown[]) => writes.push(args),
      }),
    },
    sonner: { toast: { success() {}, error() {} } },
    "@/contexts/AuthContext": {
      useAuthContext: () => ({
        user,
        refreshUser: async () => {
          refreshes++;
          user.accent_color = "0";
          user.accent_gradient = null;
          user.accent_style = "solid";
        },
      }),
    },
    "@/hooks/useDebounce": { useDebounce: (value: unknown) => value },
    "@/services/settingsService": {
      fetchAccentColor() {},
      saveAccentColor: async (value: unknown) => {
        saves.push(value);
      },
    },
    "@/utils/ui/accentColor": accentUtils,
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./useAccentColor.ts", import.meta.url), "utf8"),
      { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    {
      exports,
      require: (name: keyof typeof imports) => {
        if (!(name in imports)) throw new Error(`Unexpected import ${name}`);
        return imports[name];
      },
    },
  );
  const result = exports.useAccentColor("123");
  expect(queries).toEqual([["accent-color", "123"]]);
  expect(result.accent).toEqual({
    color: "#cba6f7",
    gradient: "#0000ff",
    style: "glass",
  });
  expect(exports.useAccentColor("456").accent).toBeNull();
  await result.reset();
  expect(saves).toEqual([null]);
  expect(writes).toEqual([[["accent-color", "123"], null]]);
  expect(refreshes).toBe(1);
  expect(exports.useAccentColor("123").accent).toEqual({
    color: "#000000",
    gradient: null,
    style: "solid",
  });
  user.accent_color = null;
  expect(exports.useAccentColor("123").accent).toBeNull();
});
