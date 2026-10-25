import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";

test("account settings query is disabled for guests and shares a user-scoped cache", () => {
  type Options = {
    enabled: boolean;
    queryKey: unknown[];
    queryFn: () => unknown;
    gcTime: number;
  };
  const fetchUserSettings = () => ({ fromBackend: true });
  const exports = {} as { useUserSettings: (id?: string) => Options };
  const imports = {
    "@tanstack/react-query": { useQuery: (options: Options) => options },
    "@/services/settingsService": { fetchUserSettings },
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./useUserSettings.ts", import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    { exports, require: (id: keyof typeof imports) => imports[id] },
  );
  const guest = exports.useUserSettings();
  expect(guest.enabled).toBe(false);
  const user = exports.useUserSettings("123");
  expect(user.enabled).toBe(true);
  expect(user.queryKey).toEqual(["user-settings", "123"]);
  expect(user.queryFn).toBe(fetchUserSettings);
  expect(user.gcTime).toBe(5 * 60_000);
  expect(exports.useUserSettings("456").queryKey).toEqual([
    "user-settings",
    "456",
  ]);
});
