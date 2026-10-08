import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { isCommentIdentityHidden } from "./commentUtils";

test("report previews use the lock avatar for hidden authors and preserve public avatars", () => {
  const settings = { profile_public: true, show_recent_comments: true };
  const state = {
    filteredComments: [
      {
        id: 1,
        replies: [
          {
            id: 2,
            user_id: "target",
            content: "Reported reply",
            date: "1700000000",
          },
        ],
      },
    ],
    reportingCommentId: 2,
    userData: {
      target: {
        username: "Target",
        avatar: "discord-avatar",
        custom_avatar: "custom-avatar",
        roblox_avatar: "roblox-avatar",
        settings: { ...settings } as Partial<typeof settings> | undefined,
      },
    },
    currentUserId: "viewer",
    type: "changelog",
    isRefreshingComments: true,
    modalState: {},
  };
  type Node = { type: string; props: Record<string, unknown> };
  const jsx = (type: unknown, props: unknown): unknown =>
    typeof type === "function" ? type(props) : { type, props };
  const load = (file: string) => {
    const exports = {} as { default: (props: unknown) => unknown };
    runInNewContext(
      transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      }).outputText,
      {
        exports,
        require: (name: string) => {
          if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
          if (name === "react") return { useState: () => [false, () => {}] };
          if (name === "./commentUtils") return { isCommentIdentityHidden };
          if (name === "./CommentsContext")
            return {
              CommentsContext: { Provider: "Provider" },
              useCommentsContext: () => state,
            };
          if (name === "./useCommentState")
            return { useCommentState: () => state };
          if (name === "./ReportCommentModal")
            return { default: "ReportCommentModal" };
          return new Proxy({}, { get: (_, key) => String(key) });
        },
      },
    );
    return exports.default;
  };
  const layout = load("./ChangelogComments.tsx");
  const modal = load("./ReportCommentModal.tsx");
  const nodes = (value: unknown): Node[] => {
    if (Array.isArray(value)) return value.flatMap(nodes);
    if (!value || typeof value !== "object" || !("props" in value)) return [];
    const node = value as Node;
    return [node, ...nodes(node.props.children)];
  };
  const preview = () => {
    const props = nodes(layout({})).find(
      (node) => node.type === "ReportCommentModal",
    )!.props;
    return { props, nodes: nodes(modal({ ...props, reportReason: "" })) };
  };
  expect(preview().nodes.some((node) => node.type === "UserAvatar")).toBe(true);
  for (const hiddenSettings of [
    { ...settings, show_recent_comments: false },
    { ...settings, profile_public: false },
    {},
    undefined,
  ]) {
    state.userData.target.settings = hiddenSettings;
    for (const type of ["changelog", "inventory", "vsuggestion"]) {
      state.type = type;
      const result = preview();
      expect(result.props.commentOwner).toBe("Hidden User");
      expect(result.nodes.some((node) => node.type === "UserAvatar")).toBe(
        false,
      );
      expect(
        result.nodes.some(
          (node) => node.props.icon === "heroicons:lock-closed",
        ),
      ).toBe(true);
      expect(JSON.stringify(result.nodes)).not.toContain("discord-avatar");
      expect(JSON.stringify(result.nodes)).not.toContain("custom-avatar");
      expect(JSON.stringify(result.nodes)).not.toContain("roblox-avatar");
    }
  }
  state.currentUserId = "target";
  expect(preview().nodes.some((node) => node.type === "UserAvatar")).toBe(true);
});
