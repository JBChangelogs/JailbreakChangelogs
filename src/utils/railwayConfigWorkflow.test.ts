import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

test("Railway jobs reference only named secrets and use the production token only for deploy branches", () => {
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
    for (const branch of ["main", "unexpected"]) {
      for (const productionToken of ["production-token", ""]) {
        const secrets = { RAILWAY_TOKEN_PRODUCTION: productionToken };
        const token = runInNewContext(expression, {
          github: { base_ref: branch, ref_name: branch },
          secrets,
        });
        const expected =
          branch === "main" ? secrets.RAILWAY_TOKEN_PRODUCTION : "";
        expect(token).toBe(expected);
      }
    }
  }
});
