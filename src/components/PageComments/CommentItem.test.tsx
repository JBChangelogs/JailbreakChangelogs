import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { isCommentIdentityHidden } from "./commentUtils";

test("reply privacy and copied comment links preserve the target and discussion", async () => {
  const settings = { profile_public: true, show_recent_comments: true };
  const target = {
    id: 2,
    user_id: "target",
    author: "Old target name",
    content: "Target message",
    date: "1700000000",
    edited_at: "1700001000",
  };
  const comment = {
    id: 1,
    user_id: "root",
    content: "Root message",
    replies: [
      { id: 3, user_id: "sender", content: "Reply", reply_to_id: 2 },
      target,
    ],
  };
  const context = {
    userData: {
      root: { username: "Root", settings },
      sender: { username: "Sender", settings },
      target: {
        username: "Target name",
        roblox_display_name: "Roblox target",
        settings: { ...settings } as Partial<typeof settings> | undefined,
      },
    },
    currentUserId: "viewer",
    type: "changelog",
    suggestion: { suggester: "target", upvoterIds: ["target"] },
    isLoggedIn: true,
    replyingToId: 1,
    replyingToReplyId: 2,
    expandedComments: new Set(),
    expandedReplies: new Set([1]),
    emojiStringMap: {},
    availableEmojis: [],
  };
  const jsx = (type: unknown, props: unknown): unknown =>
    typeof type === "function" ? type(props) : { type, props };
  const react = {
    memo: (component: unknown) => component,
    useState: (value: unknown) => [value, () => {}],
    useEffect: () => {},
    useMemo: (callback: () => unknown) => callback(),
    useCallback: (callback: unknown) => callback,
    useRef: () => ({ current: null }),
    Fragment: "Fragment",
  };
  const exports = {} as { CommentItem: (props: unknown) => unknown };
  const copied: string[] = [];
  const notifications: string[] = [];
  const location = {
    href: "https://example.com/changelogs/5?commentsPage=3&commentsSort=oldest#other",
  };
  let clipboardFails = false;
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./CommentItem.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      URL,
      window: { location },
      navigator: {
        clipboard: {
          writeText: async (value: string) => {
            if (clipboardFails) throw new Error("Clipboard unavailable");
            copied.push(value);
          },
        },
      },
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react") return { ...react, default: react };
        if (name === "./CommentsContext")
          return { useCommentsContext: () => context };
        if (name === "./CommentTimestamp")
          return { default: "CommentTimestamp" };
        if (name === "@/contexts/TwemojiContext")
          return { useTwemoji: () => ({ twemojiEnabled: false }) };
        if (name === "./commentUtils")
          return {
            isCommentEditable: () => false,
            convertUrlsToLinksHTML: (value: string) => value,
            processMentions: (value: string) => value,
            sanitizeHTML: (value: string) => value,
            isCommentIdentityHidden,
          };
        if (name === "sonner")
          return {
            toast: {
              success: (value: string) => notifications.push(value),
              error: (value: string) => notifications.push(value),
            },
          };
        if (name === "@/utils/ui/sanitizeText")
          return { sanitizeText: (value: string) => value };
        return new Proxy({}, { get: (_, key) => String(key) });
      },
    },
  );
  const render = () => JSON.stringify(exports.CommentItem({ comment }));
  expect(render()).toContain("/users/target");
  expect(render()).toContain("Target name");

  for (const hiddenSettings of [
    { ...settings, show_recent_comments: false },
    { ...settings, profile_public: false },
    {},
    undefined,
  ]) {
    context.userData.target.settings = hiddenSettings;
    for (const type of ["changelog", "inventory", "tradev2", "vsuggestion"]) {
      context.type = type;
      const output = render();
      expect(output).not.toContain("/users/target");
      expect(output).not.toContain("Target name");
      expect(output).not.toContain("Old target name");
      expect(output).not.toContain("Roblox target");
      expect(output).not.toContain('"children":"OP"');
      expect(output).not.toContain('"children":"Upvoted"');
      expect(output).not.toContain(
        '"user":' + JSON.stringify(context.userData.target),
      );
      expect(output).toContain("Hidden User");
      expect(output).toContain('"icon":"material-symbols:arrow-right"');
      expect(output).toContain(
        '"type":"span","props":{"className":"text-secondary-text text-sm font-semibold","children":"Hidden User"}',
      );
      expect(output).toContain("Target message");
      expect(output).toContain(
        '"type":"CommentTimestamp","props":{"date":"1700000000","editedAt":"1700001000","commentId":2}',
      );
    }
  }
  context.currentUserId = "target";
  expect(render()).toContain("/users/target");
  expect(render()).toContain("Roblox target");

  type Node = { props?: { children?: unknown; onClick?: () => Promise<void> } };
  const copyActions = (value: unknown): Node[] => {
    if (Array.isArray(value)) return value.flatMap(copyActions);
    if (!value || typeof value !== "object") return [];
    const node = value as Node;
    const children = [node.props?.children].flat();
    return [
      ...(children.includes("Copy comment link") ? [node] : []),
      ...copyActions(node.props?.children),
    ];
  };
  for (const type of [
    "changelog",
    "season",
    "item",
    "inventory",
    "tradev2",
    "vsuggestion",
  ]) {
    context.type = type;
    const actions = copyActions(exports.CommentItem({ comment }));
    expect(actions).toHaveLength(6);
    for (const action of actions) await action.props!.onClick!();
    const links = copied.splice(0).map((value) => new URL(value));
    expect(links.map((url) => url.hash).sort()).toEqual([
      "#comment-1",
      "#comment-1",
      "#comment-2",
      "#comment-2",
      "#comment-3",
      "#comment-3",
    ]);
    for (const link of links) {
      expect(link.pathname).toBe("/changelogs/5");
      expect(link.searchParams.has("commentsPage")).toBe(false);
      expect(link.searchParams.has("commentsSort")).toBe(false);
      expect(link.searchParams.get("tab")).toBe(
        type === "vsuggestion"
          ? "discussion"
          : ["item", "inventory", "tradev2"].includes(type)
            ? "comments"
            : null,
      );
    }
  }
  context.isLoggedIn = false;
  const guestActions = copyActions(exports.CommentItem({ comment }));
  expect(guestActions).toHaveLength(3);
  clipboardFails = true;
  await guestActions[0].props!.onClick!();
  await new Promise((resolve) => setImmediate(resolve));
  expect(notifications.at(-1)).toBe("Failed to copy comment link");
});
