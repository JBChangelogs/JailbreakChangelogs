import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

type Node = { type: string; props: { children?: unknown; href?: string } };
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

test("activity cards distinguish replies, link to the exact comment, and keep message links outside navigation links", () => {
  const exports = {} as { default: (props: unknown) => unknown };
  const jsx = (type: string, props: unknown) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./Comments.tsx", import.meta.url), "utf8"),
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
            useState: (initial: unknown) => [initial, () => {}],
            useEffect: () => {},
          };
        if (name === "next/link") return { default: "Link" };
        if (name === "next/image") return { default: "Image" };
        if (name === "@/utils/items/categoryIcons")
          return { getCategoryColor: () => "#708090" };
        if (name === "@/utils/ui/images")
          return {
            getItemImagePath: () => "/item.webp",
            isVideoItem: () => false,
            IMAGE_PATHS: { PLACEHOLDER: "/placeholder.webp" },
          };
        if (name === "@/services/logger") return { createLogger: () => ({}) };
        if (name === "@/contexts/TwemojiContext")
          return { useTwemoji: () => ({ twemojiEnabled: false }) };
        if (name === "@/utils/helpers/timestamp")
          return {
            formatRelativeDate: () => "1 day ago",
            formatCustomDate: () => "Exact date",
          };
        if (name === "@/utils/ui/urlConverter")
          return {
            convertUrlsToLinks: (text: string) =>
              jsx("MessageLink", { children: text }),
          };
        return {};
      },
    },
  );
  const props = {
    id: 42,
    content: "Message with a link",
    date: "1700000000",
    item_type: "changelog",
    item_id: 5,
    parent_id: null,
    reply_to_id: null,
    changelogDetails: { title: "Update" },
  };
  const normal = nodes(exports.default(props));
  expect(
    normal.some((node) =>
      [node.props.children].flat().includes("Commented on"),
    ),
  ).toBe(true);
  const links = normal.filter((node) => node.type === "Link");
  expect(links).toHaveLength(2);
  for (const link of links) {
    expect(link.props.href).toBe("/changelogs/5#comment-42");
    expect(
      nodes(link.props.children).some((node) => node.type === "MessageLink"),
    ).toBe(false);
  }
  const reply = nodes(
    exports.default({
      ...props,
      parent_id: 10,
      replyToComment: { id: 10, author: "other", content: "Parent message" },
    }),
  );
  expect(
    reply.some((node) => [node.props.children].flat().includes("Replied on")),
  ).toBe(true);
  expect(reply.some((node) => node.type === "blockquote")).toBe(true);
  const unknownParent = nodes(exports.default({ ...props, parent_id: 10 }));
  expect(unknownParent.some((node) => node.type === "blockquote")).toBe(false);
  expect(
    nodes(exports.default({ ...props, item_type: "vehicle", item_id: 7 })).some(
      (node) => node.type === "Link",
    ),
  ).toBe(false);
  for (const [item_type, href] of [
    ["Vehicle", "/item/Vehicle/Torpedo?tab=comments#comment-42"],
    ["inventory", "/inventories/5?tab=comments#comment-42"],
    ["tradev2", "/trading/ad/5?tab=comments#comment-42"],
    ["vsuggestion", "/items/suggestions/5?tab=discussion#comment-42"],
    ["value_suggestion", "/items/suggestions/5?tab=discussion#comment-42"],
    ["season", "/seasons/5#comment-42"],
  ]) {
    const destinations = nodes(
      exports.default({
        ...props,
        item_type,
        itemDetails: { name: "Torpedo" },
      }),
    ).filter((node) => node.type === "Link");
    expect(destinations).toHaveLength(2);
    for (const destination of destinations)
      expect(destination.props.href).toBe(href);
  }
});
