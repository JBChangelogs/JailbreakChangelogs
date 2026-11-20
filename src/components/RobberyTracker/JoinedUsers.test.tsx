import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type JoinedUsers from "./JoinedUsers";
import { cn } from "@/lib/utils";

type Node = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}
function text(value: unknown): string {
  if (Array.isArray(value)) return value.map(text).join("");
  if (value && typeof value === "object" && "props" in value)
    return text((value as Node).props.children);
  return typeof value === "string" ? value : "";
}

test("robbery and bounty joined users show usernames throughout with linked account and ID fallbacks", () => {
  let details: Record<string, object> = {};
  const exports = {} as { default: typeof JoinedUsers };
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./JoinedUsers.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (id: string) => {
        if (id === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (id === "@tanstack/react-query")
          return { useQuery: () => ({ data: details }) };
        if (id === "@/lib/utils") return { cn };
        return new Proxy({}, { get: (_, key) => String(key) });
      },
    },
  );
  const users = [
    { user_id: "1", display_name: "History display", joined_at: 1 },
    { user_id: "2", display_name: "Other display", joined_at: 2 },
  ];
  for (const variant of ["robbery", "bounty"] as const) {
    for (const [account, username, avatar] of [
      [
        { username: "site_user", global_name: "Site display" },
        "site_user",
        undefined,
      ],
      [
        {
          username: "site_user",
          roblox_id: "100",
          roblox_username: "roblox_user",
          roblox_display_name: "Roblox display",
          roblox_avatar: "/roblox.png",
        },
        "roblox_user",
        "/roblox.png",
      ],
      [
        {
          username: "site_user",
          roblox_id: "100",
          roblox_username: "N/A",
          roblox_display_name: "Roblox display",
        },
        "site_user",
        undefined,
      ],
      [undefined, "1", undefined],
    ] as const) {
      details = account ? { "1": account } : {};
      const view = nodes(exports.default({ users: [users[0]], variant }));
      const link = view.find((node) => node.type === "default")!;
      expect(text(link)).toBe(username);
      expect(link.props.href).toBe("/users/1");
      expect(
        view.filter((node) => node.type === "TooltipContent").map(text),
      ).toEqual([`@${username}`, `@${username}`]);
      expect(
        view.find((node) => node.type === "UserAvatar")!.props.forceAvatarUrl,
      ).toBe(avatar);
    }
    details = {
      "1": { username: "first_user", global_name: "First display" },
      "2": { username: "second_user", global_name: "Second display" },
    };
    const view = nodes(exports.default({ users, variant }));
    expect(view.filter((node) => node.type === "default").map(text)).toEqual([
      "first_user",
      "second_user",
    ]);
    expect(text(exports.default({ users, variant }))).not.toContain("display");
    expect(exports.default({ users: [], variant })).toBeNull();
  }
});
