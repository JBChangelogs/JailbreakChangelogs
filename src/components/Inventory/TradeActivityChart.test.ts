import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import {
  createSourceFile,
  isFunctionDeclaration,
  ScriptTarget,
  transpileModule,
} from "typescript";

test("activity cells cache UTC labels with one formatter for the entire year", () => {
  const source = createSourceFile(
    "TradeActivityChart.tsx",
    readFileSync(new URL("./TradeActivityChart.tsx", import.meta.url), "utf8"),
    ScriptTarget.Latest,
    true,
  );
  const names = new Set(["DAY_MS", "dayKey", "levelThresholds", "buildWeeks"]);
  const declarations = source.statements
    .filter((statement) =>
      isFunctionDeclaration(statement)
        ? names.has(statement.name?.text ?? "")
        : /^const (DAY_MS|dayKey)\b/.test(statement.getText(source)),
    )
    .map((statement) => statement.getText(source))
    .join("\n");
  let formatters = 0;
  const buildWeeks = runInNewContext(
    transpileModule(`${declarations}\nbuildWeeks;`, {}).outputText,
    {
      Date: class extends Date {
        static now() {
          return Date.UTC(2026, 10, 20);
        }
      },
      Intl: {
        DateTimeFormat: class extends Intl.DateTimeFormat {
          constructor(
            ...args: ConstructorParameters<typeof Intl.DateTimeFormat>
          ) {
            super(...args);
            formatters++;
          }
        },
      },
    },
  ) as (days: Record<string, number>) => {
    weeks: Array<
      Array<{ day: string; count: number; label: string; future: boolean }>
    >;
  };
  const days = { "2026-11-19": 2 };
  const cells = buildWeeks(days).weeks.flat();
  expect(formatters).toBe(1);
  expect(cells.length).toBeGreaterThanOrEqual(365);
  expect(cells.find((cell) => cell.day === "2026-11-19")?.label).toMatch(
    /^2 trades on .*2026 \(UTC\)$/,
  );
  expect(cells.find((cell) => cell.day === "2026-11-20")?.label).toMatch(
    /^No trades on /,
  );
  expect(cells.find((cell) => cell.day === "2026-11-21")?.future).toBe(true);
  expect(days).toEqual({ "2026-11-19": 2 });
});
