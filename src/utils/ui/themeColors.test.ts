import { expect, test } from "bun:test";
import { groupProblems } from "./themeColors";

test("problems group under the color most of them share", () => {
  const raised = "--color-tertiary-bg";
  const problems = [
    `${raised} is too different from --color-primary-bg.`,
    `--color-primary-text on ${raised} has 1.1:1 contrast, needs 4.5:1.`,
    `--color-card-headline on ${raised} has 1.1:1 contrast, needs 4.5:1.`,
    `--color-link on ${raised} has 2.9:1 contrast, needs 3:1.`,
    "--color-form-button-text on --color-form-button has 2:1 contrast, needs 3:1.",
    "A theme can't be a single color.",
  ];
  const groups = groupProblems(problems);
  expect(groups.map(([key, items]) => [key, items.length])).toEqual([
    [raised, 4],
    ["--color-form-button-text", 1],
    ["", 1],
  ]);
  expect(groups[0][1][1].keys).toEqual(["--color-primary-text", raised]);
});
