import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import { QueryClient } from "@tanstack/react-query";
import type { useSettings } from "./useSettings";
import type { UserData } from "@/types/auth";

test("avatar and banner toggles refresh the resolved image URLs from the server", async () => {
  for (const name of ["custom_avatar", "custom_banner"]) {
    for (const value of [false, true]) {
      const client = new QueryClient();
      const key = ["user-settings", "123"];
      client.setQueryData(key, {
        appearance: { settings: [{ name, value: !value }] },
      });
      let refreshes = 0;
      let localWrites = 0;
      const updates: unknown[] = [];
      const exports = {} as { useSettings: typeof useSettings };
      runInNewContext(
        transpileModule(
          readFileSync(new URL("./useSettings.ts", import.meta.url), "utf8"),
          {
            compilerOptions: { module: ModuleKind.CommonJS },
          },
        ).outputText,
        {
          exports,
          window: {},
          require: (id: string) => {
            if (id === "react") return { useCallback: (fn: unknown) => fn };
            if (id === "@tanstack/react-query")
              return {
                useQueryClient: () => client,
                useQuery: () => ({ data: [], isPending: false }),
              };
            if (id === "@/hooks/useUserSettings")
              return {
                useUserSettings: () => ({ data: client.getQueryData(key) }),
              };
            if (id === "@/services/settingsService")
              return {
                updateUserSettings: async (...args: unknown[]) => {
                  updates.push(args);
                },
              };
            if (id === "sonner")
              return {
                toast: { loading: () => 1, success: () => {}, error: () => {} },
              };
            if (id === "@/utils/storage/safeStorage")
              return {
                safeSetJSON: () => {
                  localWrites++;
                },
              };
            if (id === "@/config/settings")
              return { formatSettingName: (name: string) => name };
            throw new Error(`Unexpected import: ${id}`);
          },
        },
      );
      const hook = exports.useSettings(
        { id: "123", premiumtype: 2 } as UserData,
        undefined,
        async () => {
          refreshes++;
        },
      );
      await hook.handleSettingChange(name, value);
      expect(updates).toEqual([[name, value]]);
      expect(refreshes).toBe(1);
      expect(localWrites).toBe(0);
    }
  }
});
