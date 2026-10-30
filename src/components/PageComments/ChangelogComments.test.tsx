import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

interface Node {
  type: unknown;
  props: { children?: unknown };
}

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

function renderComments(state: object) {
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  const exports = {} as { default: (props: object) => Node };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./ChangelogComments.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          jsx: JsxEmit.ReactJSX,
        },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useEffect: () => {},
            useRef: () => ({ current: null }),
            useState: () => [null, () => {}],
          };
        if (name.endsWith("CommentsContext"))
          return {
            CommentsContext: { Provider: "Provider" },
            useCommentsContext: () => state,
          };
        if (name.endsWith("useCommentState"))
          return { useCommentState: () => state };
        if (name.endsWith("commentUtils"))
          return { isCommentIdentityHidden: () => false };
        return { CommentForm: "CommentForm" };
      },
    },
  );
  return () => {
    const provider = exports.default({});
    const layout = (provider.props.children as Node[]).find(
      (child) => child && typeof child.type === "function",
    )!;
    return nodes((layout.type as () => Node)());
  };
}

test("disabled empty profiles explain why comments are unavailable in the empty state", () => {
  const state = {
    type: "user",
    profileCommentsDisabled: true,
    filteredComments: [] as { id: number }[],
    currentComments: [],
    userData: {},
    modalState: {},
  };
  const render = renderComments(state);
  const disabled = render();
  expect(disabled.some((node) => node.type === "CommentForm")).toBe(false);
  expect(
    disabled.some(
      (node) => node.props.children === "Profile comments are disabled",
    ),
  ).toBe(true);
  expect(
    disabled.some(
      (node) =>
        node.props.children ===
        "This user has turned off comments on their profile.",
    ),
  ).toBe(true);
  expect(
    disabled.some((node) => node.props.children === "No comments yet"),
  ).toBe(false);

  state.profileCommentsDisabled = false;
  const enabled = render();
  expect(enabled.some((node) => node.type === "CommentForm")).toBe(true);
  expect(
    enabled.some((node) => node.props.children === "No comments yet"),
  ).toBe(true);

  state.profileCommentsDisabled = true;
  state.filteredComments = [{ id: 1 }];
  const existing = render();
  expect(existing.some((node) => node.type === "CommentForm")).toBe(true);
  expect(
    existing.some(
      (node) => node.props.children === "Profile comments are disabled",
    ),
  ).toBe(false);
});

test("focused threads only offer view all when other comments exist", () => {
  const state = {
    type: "inventory",
    focusedThread: { commentId: 15402, page: 1 } as {
      commentId: number;
      page: number;
    } | null,
    totalComments: 1,
    filteredComments: [{ id: 15402 }],
    currentComments: [],
    userData: {},
    modalState: {},
  };
  const render = renderComments(state);
  const hasViewAll = () =>
    render().some(
      (node) =>
        node.type === "button" &&
        Array.isArray(node.props.children) &&
        node.props.children.includes("View all "),
    );

  expect(hasViewAll()).toBe(false);
  state.totalComments = 2;
  expect(hasViewAll()).toBe(true);
  state.focusedThread = null;
  expect(hasViewAll()).toBe(false);
});
