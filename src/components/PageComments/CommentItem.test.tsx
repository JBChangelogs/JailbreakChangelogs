import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

test("comment authors stay visible and copied comment links preserve the target and discussion", async () => {
  const settings = { show_recent_comments: true };
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
    changelogId: "root",
    suggestion: {
      suggester: "target",
      upvoterIds: ["root", "target"],
      downvoterIds: ["sender"],
    },
    isLoggedIn: true,
    canDeleteAnyComment: false,
    replyingToId: 1,
    replyingToReplyId: 2,
    expandedComments: new Set(),
    expandedReplies: new Set([1]),
    toggleReplies: (id: number) => context.expandedReplies.add(id),
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
  const frames: (() => void)[] = [];
  const timers: (() => void)[] = [];
  const scrolls: unknown[] = [];
  const highlights = new Set<string>();
  const targetElement = {
    scrollIntoView: (options: unknown) => scrolls.push(options),
    classList: {
      add: (name: string) => highlights.add(name),
      remove: (name: string) => highlights.delete(name),
    },
  };
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
      requestAnimationFrame: (callback: () => void) => frames.push(callback),
      setTimeout: (callback: () => void) => timers.push(callback),
      document: {
        getElementById: (id: string) => {
          expect(id).toBe("comment-2");
          return context.expandedReplies.has(1) ? targetElement : null;
        },
      },
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

  type PreviewNode = {
    props?: {
      href?: string;
      children?: unknown;
      onClick?: (event: unknown) => void;
    };
  };
  const findPreview = (value: unknown): PreviewNode | undefined => {
    if (Array.isArray(value)) {
      return value.map(findPreview).find(Boolean);
    }
    if (!value || typeof value !== "object") return;
    const node = value as PreviewNode;
    if (node.props?.href === "#comment-2") return node;
    return findPreview(node.props?.children);
  };
  for (const expanded of [true, false]) {
    if (!expanded) context.expandedReplies.clear();
    let prevented = false;
    const preview = findPreview(exports.CommentItem({ comment }));
    preview!.props!.onClick!({
      preventDefault: () => {
        prevented = true;
      },
    });
    expect(prevented).toBe(true);
    expect(context.expandedReplies.has(1)).toBe(true);
    frames.shift()!();
    expect(scrolls.at(-1)).toEqual({ behavior: "smooth", block: "nearest" });
    expect(highlights.has("comment-link-highlight")).toBe(true);
    expect(location.href).toBe(
      "https://example.com/changelogs/5?commentsPage=3&commentsSort=oldest#other",
    );
    timers.shift()!();
    expect(highlights.has("comment-link-highlight")).toBe(false);
  }
  findPreview(exports.CommentItem({ comment }))!.props!.onClick!({
    ctrlKey: true,
    preventDefault: () => {
      throw new Error("Modified clicks should navigate normally");
    },
  });
  expect(frames).toHaveLength(0);

  context.type = "vsuggestion";
  const voteOutput = render();
  expect(
    voteOutput.match(/"aria-label":"Upvoted this suggestion"/g),
  ).toHaveLength(2);
  expect(
    voteOutput.match(/"aria-label":"Downvoted this suggestion"/g),
  ).toHaveLength(1);
  expect(voteOutput).toContain('"Upvoted"');
  expect(voteOutput).toContain('"Downvoted"');
  expect(voteOutput).toContain('"href":"#comment-2"');
  expect(voteOutput).toContain(
    '"aria-label":"Replying to Roblox target: Target message"',
  );
  expect(voteOutput.indexOf('"href":"#comment-2"')).toBeLessThan(
    voteOutput.indexOf('"href":"/users/sender"'),
  );
  expect(voteOutput).not.toContain("↳");
  expect(voteOutput).not.toContain("hidden sm:inline");
  context.suggestion.upvoterIds = [];
  context.suggestion.downvoterIds = [];
  expect(render()).not.toContain("voted this suggestion");
  context.suggestion.upvoterIds = ["root", "target"];
  context.suggestion.downvoterIds = ["sender"];
  context.type = "changelog";
  expect(render()).not.toContain("voted this suggestion");

  for (const targetSettings of [
    { ...settings, show_recent_comments: false },
    undefined,
  ]) {
    context.userData.target.settings = targetSettings;
    for (const type of ["changelog", "inventory", "tradev2", "vsuggestion"]) {
      context.type = type;
      const output = render();
      expect(output).toContain("/users/target");
      expect(output).not.toContain("Hidden User");
      expect(output).toContain("Target message");
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
    "user",
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
        type === "user"
          ? "profile-comments"
          : type === "vsuggestion"
            ? "discussion"
            : ["item", "inventory", "tradev2"].includes(type)
              ? "comments"
              : null,
      );
    }
  }
  context.type = "user";
  expect(render()).toContain('"children":"Profile owner"');
  context.changelogId = "sender";
  expect(render()).toContain('"children":"Profile owner"');
  context.changelogId = "target";
  expect((render().match(/"children":"Profile owner"/g) ?? []).length).toBe(1);
  context.changelogId = "visitor";
  expect(render()).not.toContain('"children":"Profile owner"');
  context.changelogId = "root";
  context.currentUserId = "root";
  context.canDeleteAnyComment = false;
  const ownerMenu = render();
  expect((ownerMenu.match(/Delete Comment/g) ?? []).length).toBe(2);
  expect(ownerMenu).not.toContain("(Moderator)");
  context.canDeleteAnyComment = true;
  const moderatorMenu = render();
  expect(moderatorMenu).toContain("(Moderator)");
  expect((moderatorMenu.match(/Delete Comment/g) ?? []).length).toBeGreaterThan(
    2,
  );
  context.isLoggedIn = false;
  const guestActions = copyActions(exports.CommentItem({ comment }));
  expect(guestActions).toHaveLength(3);
  clipboardFails = true;
  await guestActions[0].props!.onClick!();
  await new Promise((resolve) => setImmediate(resolve));
  expect(notifications.at(-1)).toBe("Failed to copy comment link");
});
