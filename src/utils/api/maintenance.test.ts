import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";

test("feature maintenance overrides apply only in development and otherwise use Railway flags", async () => {
  const source = transpileModule(
    readFileSync(new URL("./maintenance.ts", import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ModuleKind.CommonJS,
        target: ScriptTarget.ES2022,
      },
    },
  ).outputText;
  for (const [check, field, flag, envKey] of [
    [
      "checkMaintenanceMode",
      "isMaintenanceMode",
      "maintenance-mode",
      "MAINTENANCE_MODE",
    ],
    [
      "checkInventoryMaintenanceMode",
      "isInventoryMaintenanceMode",
      "inventory-maintenance-mode",
      "INVENTORY_MAINTENANCE_MODE",
    ],
    [
      "checkOGFinderMaintenanceMode",
      "isOGFinderMaintenanceMode",
      "og-finder-maintenance-mode",
      "OG_FINDER_MAINTENANCE_MODE",
    ],
    [
      "checkDupeFinderMaintenanceMode",
      "isDupeFinderMaintenanceMode",
      "dupe-finder-maintenance-mode",
      "DUPE_FINDER_MAINTENANCE_MODE",
    ],
  ]) {
    for (const nodeEnv of ["development", "production", "test"]) {
      for (const override of [undefined, "true", "false", "0"]) {
        for (const railwayValue of [false, true]) {
          const exports = {} as Record<
            string,
            () => Promise<Record<string, boolean>>
          >;
          let reads = 0;
          runInNewContext(source, {
            exports,
            process: { env: { NODE_ENV: nodeEnv, [envKey]: override } },
            require: (name: string) => {
              if (name === "@/utils/api/runtimeFlags")
                return {
                  getBooleanFlag: (key: string) => {
                    expect(key).toBe(flag);
                    reads++;
                    return railwayValue;
                  },
                };
              if (name === "@/utils/deployment")
                return { isTestingDeploy: () => false };
              throw new Error(`Unexpected import: ${name}`);
            },
          });
          const usesOverride =
            nodeEnv === "development" && override !== undefined;
          expect(await exports[check]()).toEqual({
            [field]: usesOverride ? override === "true" : railwayValue,
          });
          expect(reads).toBe(usesOverride ? 0 : 1);
        }
      }
    }
  }
});

test("maintenance metadata uses one branded title without inheriting a duplicate suffix", async () => {
  const source = transpileModule(
    readFileSync(new URL("./maintenance.ts", import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ModuleKind.CommonJS,
        target: ScriptTarget.ES2022,
      },
    },
  ).outputText;
  for (const globalEnabled of [false, true]) {
    const exports = {} as Record<
      string,
      () => Promise<import("next").Metadata | null>
    >;
    runInNewContext(source, {
      exports,
      URL,
      process: { env: { NODE_ENV: "production" } },
      require: (name: string) =>
        name === "@/utils/api/runtimeFlags"
          ? {
              getBooleanFlag: (key: string) =>
                key === "maintenance-mode" ? globalEnabled : !globalEnabled,
            }
          : { isTestingDeploy: () => false },
    });
    for (const getter of [
      "getInventoryMaintenanceMetadata",
      "getOGFinderMaintenanceMetadata",
      "getDupeFinderMaintenanceMetadata",
      ...(globalEnabled ? ["getMaintenanceMetadata"] : []),
    ]) {
      const metadata = await exports[getter]();
      const title = "Under Maintenance | Jailbreak Changelogs";
      expect(metadata?.title).toEqual({ absolute: title });
      expect(metadata?.openGraph?.title).toBe(title);
      expect(metadata?.twitter?.title).toBe(title);
      expect(metadata?.robots).toEqual({ index: false, follow: false });
    }
  }
});
