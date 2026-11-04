import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { competitionStatus } from "@/utils/api/userThemes";

interface Node {
  type: { name?: string } | string;
  props: { children?: unknown; theme?: { share_code: string } };
}

function submissions(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(submissions);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  if (typeof node.type === "function" && node.type.name === "EntryCard")
    return [node.props.theme!.share_code];
  return submissions(node.props.children);
}

test("submissions show newest entries first without changing cached order, including appended live entries", () => {
  const initial = {
    id: 7,
    title: "Competition",
    status: "running",
    starts_at: 0,
    ends_at: Date.now() / 1000 + 3600,
    winner: null,
    items: [
      { entered_at: 10, theme: { share_code: "OLDEST01" } },
      { entered_at: 30, theme: { share_code: "NEWEST01" } },
      { entered_at: 20, theme: { share_code: "MIDDLE01" } },
    ],
  };
  const exports = {} as { default: (props: object) => unknown };
  const jsx = (type: Node["type"], props: Node["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./CompetitionDetails.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useSyncExternalStore: () => true,
            useReducer: () => [0, () => {}],
            useEffect: () => {},
          };
        if (name === "@tanstack/react-query")
          return {
            useQueryClient: () => ({}),
            useQuery: () => ({ data: initial }),
          };
        if (name.endsWith("userThemes")) return { competitionStatus };
        return {};
      },
    },
  );
  const render = () =>
    submissions(exports.default({ initial, standings: Promise.resolve(null) }));
  expect(render()).toEqual(["NEWEST01", "MIDDLE01", "OLDEST01"]);
  expect(initial.items.map(({ theme }) => theme.share_code)).toEqual([
    "OLDEST01",
    "NEWEST01",
    "MIDDLE01",
  ]);
  initial.items.push({ entered_at: 40, theme: { share_code: "LIVE0001" } });
  expect(render()).toEqual(["LIVE0001", "NEWEST01", "MIDDLE01", "OLDEST01"]);
});
