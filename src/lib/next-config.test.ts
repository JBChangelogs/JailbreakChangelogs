import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

test("deployment protection uses the commit SHA when Railway has no deployment ID", () => {
  const source = transpileModule(
    readFileSync(new URL("../../next.config.js", import.meta.url), "utf8"),
    { compilerOptions: { module: ModuleKind.CommonJS } },
  ).outputText;

  for (const [deploymentId, commitSha, expected] of [
    ["deployment-123", "commit-456", "deployment-123"],
    [undefined, "commit-456", "commit-456"],
    ["", "commit-456", "commit-456"],
    [undefined, undefined, undefined],
  ]) {
    const exports = {} as { default: { deploymentId?: string } };
    runInNewContext(source, {
      exports,
      process: {
        env: {
          RAILWAY_DEPLOYMENT_ID: deploymentId,
          RAILWAY_GIT_COMMIT_SHA: commitSha,
        },
      },
      require: () => ({ withSentryConfig: (config: unknown) => config }),
    });
    expect(exports.default.deploymentId).toBe(expected);
  }
});
