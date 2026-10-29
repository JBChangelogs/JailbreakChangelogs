import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";

interface Node {
  type: string;
  props: Record<string, unknown> & { children?: unknown };
}

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

test("profile comment preview shows unique recent public commenters and scrolls to comments", () => {
  const comment = (user_id: string, date: string) => ({ user_id, date });
  const state = {
    changelogId: "owner",
    comments: [
      {
        ...comment("old", "1"),
        replies: [comment("new", "5"), comment("owner", "11")],
      },
      comment("owner", "10"),
      comment("new", "4"),
      comment("hidden", "9"),
      comment("other", "3"),
    ],
    userData: Object.fromEntries(
      ["old", "new", "hidden", "other", "owner"].map((id) => [
        id,
        { username: id, settings: { hidden: id === "hidden" } },
      ]),
    ),
    totalComments: 4,
    isRefreshingComments: false,
    profileCommentsDisabled: false,
    isProfileOwner: false,
  };
  let scrolled: unknown;
  let focused = false;
  let reducedMotion = false;
  const exports = {} as { default: () => Node };
  const jsx = (type: string, props: Node["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./ProfileCommentsPreview.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          jsx: JsxEmit.ReactJSX,
          target: ScriptTarget.ESNext,
        },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name.endsWith("CommentsContext"))
          return { useCommentsContext: () => state };
        if (name.endsWith("commentUtils"))
          return {
            isCommentIdentityHidden: (
              _id: string,
              settings: { hidden: boolean },
            ) => settings.hidden,
          };
        if (name.endsWith("avatar")) return { UserAvatar: "UserAvatar" };
        if (name.endsWith("tooltip"))
          return {
            Tooltip: "Tooltip",
            TooltipTrigger: "TooltipTrigger",
            TooltipContent: "TooltipContent",
          };
        return { Icon: "Icon" };
      },
      document: {
        getElementById: (id: string) => {
          expect(id).toBe("comments");
          return {
            focus: () => {
              focused = true;
            },
            scrollIntoView: (options: unknown) => {
              scrolled = options;
            },
          };
        },
      },
      window: { matchMedia: () => ({ matches: reducedMotion }) },
    },
  );
  const rendered = exports.default();
  expect(
    nodes(rendered)
      .filter((node) => node.type === "UserAvatar")
      .map((node) => node.props.userId),
  ).toEqual(["new", "other", "old"]);
  expect(
    nodes(rendered)
      .filter((node) => node.type === "TooltipContent")
      .map((node) => node.props.children),
  ).toEqual(["new", "other", "old"]);
  (rendered.props.onClick as () => void)();
  expect(focused).toBe(true);
  expect(scrolled).toEqual({ behavior: "smooth", block: "start" });
  reducedMotion = true;
  (rendered.props.onClick as () => void)();
  expect(scrolled).toEqual({ behavior: "instant", block: "start" });

  state.comments.push(comment("fourth", "2"), comment("fifth", "0"));
  Object.assign(state.userData, {
    fourth: { username: "fourth", settings: { hidden: false } },
    fifth: { username: "fifth", settings: { hidden: false } },
  });
  expect(
    nodes(exports.default())
      .filter((node) => node.type === "UserAvatar")
      .map((node) => node.props.userId),
  ).toEqual(["new", "other", "fourth", "old"]);

  state.totalComments = 0;
  state.comments = [];
  expect(
    nodes(exports.default()).some(
      (node) => node.props.children === "Be the first to comment",
    ),
  ).toBe(true);
  state.isProfileOwner = true;
  expect(
    nodes(exports.default()).some(
      (node) => node.props.children === "No comments on your profile yet",
    ),
  ).toBe(true);
  expect(
    nodes(exports.default()).some(
      (node) => node.props.children === "Be the first to comment",
    ),
  ).toBe(false);
  state.isProfileOwner = false;
  state.profileCommentsDisabled = true;
  expect(exports.default()).toBeNull();
  state.totalComments = 1;
  expect(exports.default()).not.toBeNull();
  state.totalComments = 0;
  state.isRefreshingComments = true;
  expect(
    nodes(exports.default()).some(
      (node) => node.props.children === "Be the first to comment",
    ),
  ).toBe(false);
});
