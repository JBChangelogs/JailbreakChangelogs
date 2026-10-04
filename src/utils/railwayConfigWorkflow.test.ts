import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

test("Railway jobs reference only named secrets and select the token for their branch", () => {
  const workflow = readFileSync(
    new URL("../../.github/workflows/railway-config.yml", import.meta.url),
    "utf8",
  );
  expect(workflow).not.toMatch(/secrets\s*\[|toJSON\s*\(\s*secrets\s*\)/i);

  const expressions = [
    ...workflow.matchAll(/(?:railway-token|RAILWAY_TOKEN): \$\{\{ (.+?) \}\}/g),
  ];
  expect(expressions).toHaveLength(2);

  for (const [, expression] of expressions) {
    for (const branch of ["testing", "main", "unexpected"]) {
      for (const missing of [
        undefined,
        "RAILWAY_TOKEN_TESTING",
        "RAILWAY_TOKEN_PRODUCTION",
      ]) {
        const secrets = {
          RAILWAY_TOKEN_TESTING:
            missing === "RAILWAY_TOKEN_TESTING" ? "" : "testing-token",
          RAILWAY_TOKEN_PRODUCTION:
            missing === "RAILWAY_TOKEN_PRODUCTION" ? "" : "production-token",
        };
        const token = runInNewContext(expression, {
          github: { base_ref: branch, ref_name: branch },
          secrets,
        });
        const expected =
          branch === "testing"
            ? secrets.RAILWAY_TOKEN_TESTING
            : branch === "main"
              ? secrets.RAILWAY_TOKEN_PRODUCTION
              : "";
        expect(token).toBe(expected);
      }
    }
  }
});
