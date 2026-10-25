import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type { GroupAvatar } from "./ConversationSidebar";
import type { MessageUser } from "@/utils/messages/types";

type Node = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

test("group icons use normal member avatars and their fallbacks in the shared sidebar/header component", () => {
  const users: MessageUser[] = [
    { id: "me", username: "Me", avatar: "my-avatar" },
    { id: "none", username: "No picture", avatar: "None" },
    { id: "picture", username: "Picture", avatar: "hash" },
    {
      id: "custom",
      username: "Custom",
      avatar: "",
      custom_avatar: "https://example.test/custom.png",
      settings_v2: { custom_avatar: true },
      premiumtype: 3,
    },
  ];
  const queries: string[][] = [];
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  const exports = {} as { GroupAvatar: typeof GroupAvatar };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./ConversationSidebar.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react")
          return {
            useState: () => ["blob:generated-icon"],
            useEffect: () => {},
          };
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "@tanstack/react-query")
          return {
            useQuery: ({ queryKey }: { queryKey: string[] }) => {
              queries.push(queryKey);
              return {
                data: queryKey[0] === "message-users-batch" ? users : {},
              };
            },
          };
        if (name === "@/lib/utils")
          return {
            cn: (...values: unknown[]) => values.filter(Boolean).join(" "),
          };
        return new Proxy({}, { get: (_, key) => String(key) });
      },
    },
  );
  const render = (memberIds: string[]) =>
    nodes(
      exports.GroupAvatar({
        name: "Test group",
        memberIds,
        className: "h-8 w-8",
      }),
    );
  const avatars = render([...users.map((user) => user.id), "loading"]).filter(
    (node) => node.type === "UserAvatar",
  );
  expect(avatars.map((node) => node.props.userId)).toEqual([
    "me",
    "none",
    "picture",
    "custom",
  ]);
  expect(queries.every((key) => key[0] === "message-users-batch")).toBe(true);
  expect(avatars[0].props.avatarHash).toBe("my-avatar");
  expect(avatars[1].props.avatarHash).toBe("None");
  expect(avatars[2].props.avatarHash).toBe("hash");
  expect(avatars[3].props).toMatchObject({
    custom_avatar: users[3].custom_avatar,
    settings: { custom_avatar: true },
    premiumType: 3,
  });
  expect(
    render(["loading"]).find((node) => node.type === "UserAvatar")!.props
      .avatarHash,
  ).toBe("");
  expect(avatars.every((node) => node.props.showBadge === false)).toBe(true);
  expect(
    avatars.every((node) => String(node.props.className).includes("border-0!")),
  ).toBe(true);
  const single = render(["me"]).find((node) => node.type === "UserAvatar")!;
  expect(single.props.size).toBe(8);
  expect(render([]).some((node) => node.props.children === "TE")).toBe(true);
  expect(
    avatars.every((node) => !String(node.props.className).includes("ring-")),
  ).toBe(true);
  const three = render(["me", "none", "picture"]);
  const tiles = three.filter((node) => node.type === "UserAvatar");
  expect(tiles.map((node) => node.props.size)).toEqual([
    4.46875, 4.46875, 4.46875,
  ]);
  expect(
    three
      .filter(
        (node) => (node.props.style as { left?: string } | undefined)?.left,
      )
      .map((node) => node.props.style),
  ).toEqual([
    { left: "21.875%", top: "0%" },
    { left: "0%", top: "44.140625%" },
    { left: "44.140625%", top: "44.140625%" },
  ]);
  const layers = three.filter(
    (node) => node.props.className === "absolute inset-0",
  );
  const mask = decodeURIComponent(
    String((layers[0].props.style as { maskImage: string }).maskImage),
  );
  expect(mask).toContain(
    '<circle cx="71.5" cy="184.5" r="79.5" fill="black"/>',
  );
  expect(mask).toContain(
    '<circle cx="184.5" cy="184.5" r="79.5" fill="black"/>',
  );
  expect(
    (layers[2].props.style as { maskImage?: string }).maskImage,
  ).toBeUndefined();
  const four = render(users.map((user) => user.id));
  const squareMask = decodeURIComponent(
    String(
      (
        four.find((node) => node.props.className === "absolute inset-0")!.props
          .style as { maskImage: string }
      ).maskImage,
    ),
  );
  expect(squareMask).toContain(
    '<rect x="110" y="110" width="154" height="154" rx="38.5" fill="black"/>',
  );
});
