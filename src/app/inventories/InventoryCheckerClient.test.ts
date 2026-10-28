import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { createSerializer, parseAsString } from "nuqs";
import {
  createSourceFile,
  forEachChild,
  isVariableDeclaration,
  ScriptTarget,
  transpileModule,
  type Node,
} from "typescript";

test("inventory tab changes clear comment parameters only outside Comments", () => {
  const source = createSourceFile(
    "InventoryCheckerClient.tsx",
    readFileSync(
      new URL("./InventoryCheckerClient.tsx", import.meta.url),
      "utf8",
    ),
    ScriptTarget.Latest,
    true,
  );
  let handler = "";
  const visit = (node: Node) => {
    if (
      isVariableDeclaration(node) &&
      node.name.getText(source) === "handleTabChange"
    ) {
      handler = node.initializer!.getText(source);
    }
    forEachChild(node, visit);
  };
  visit(source);
  expect(handler).not.toBe("");

  const serialize = createSerializer({
    tab: parseAsString.withDefault(""),
    commentsSort: parseAsString,
  });
  const initial = "?tab=comments&commentsSort=newest&other=keep";
  let result = initial;
  const changeTab = runInNewContext(
    transpileModule(`(${handler})`, {
      compilerOptions: { target: ScriptTarget.ES2022 },
    }).outputText,
    {
      tabIndex: {
        trades: 1,
        breakdown: 2,
        copies: 3,
        dupes: 4,
        graphs: 5,
        comments: 6,
      },
      setMountedTabs: () => {},
      setTabParams: (values: Parameters<typeof serialize>[1]) => {
        result = serialize(initial, values);
      },
    },
  ) as (event: null, index: number) => void;

  for (const [index, tab] of [
    "",
    "trades",
    "breakdown",
    "copies",
    "dupes",
    "graphs",
  ].entries()) {
    changeTab(null, index);
    const params = new URLSearchParams(result);
    expect(params.get("tab")).toBe(tab || null);
    expect(params.has("commentsSort")).toBe(false);
    expect(params.get("other")).toBe("keep");
  }

  changeTab(null, 6);
  expect(result).toBe(initial);
});
