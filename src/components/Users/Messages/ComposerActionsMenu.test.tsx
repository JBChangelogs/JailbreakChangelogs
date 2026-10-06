import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";
import type { SupporterGift } from "@/types/auth";
import type { OwnedPrivateServer } from "@/services/messageInvitesService";
import type { OutgoingMessageMetadata } from "@/utils/messages/types";

type Node = {
  type: unknown;
  props: { children?: unknown; [key: string]: unknown };
};
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}
function label(value: unknown): string {
  if (Array.isArray(value)) return value.map(label).join("");
  if (value && typeof value === "object" && "props" in value)
    return label((value as Node).props.children);
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

test("composer lists owned inventory, sends server metadata, and confirms gifts once to the conversation recipient", async () => {
  const slots: unknown[] = [];
  let cursor = 0;
  let servers: OwnedPrivateServer[] = [];
  let gifts: SupporterGift[] = [];
  const queryOptions: { queryKey: string[]; enabled: boolean }[] = [];
  const invalidations: unknown[] = [];
  const sent: { content: string; metadata?: OutgoingMessageMetadata }[] = [];
  const redeemed: string[][] = [];
  let finishGift: () => void = () => {};
  const exports = {} as { ComposerActionsMenu: (props: unknown) => Node };
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./ComposerActionsMenu.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          jsx: JsxEmit.ReactJSX,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useState: (initial: unknown) => {
              const index = cursor++;
              if (!(index in slots)) slots[index] = initial;
              return [
                slots[index],
                (value: unknown) => {
                  slots[index] =
                    typeof value === "function" ? value(slots[index]) : value;
                },
              ];
            },
            useRef: (initial: unknown) => {
              const index = cursor++;
              if (!(index in slots)) slots[index] = { current: initial };
              return slots[index];
            },
          };
        if (name === "@tanstack/react-query")
          return {
            useQuery: (options: (typeof queryOptions)[number]) => {
              queryOptions.push(options);
              return {
                data:
                  options.queryKey[0] === "supporter-gifts" ? gifts : servers,
              };
            },
            useQueryClient: () => ({
              setQueryData: (
                _key: unknown,
                updater: (value: SupporterGift[]) => SupporterGift[],
              ) => {
                gifts = updater(gifts);
              },
              invalidateQueries: (options: unknown) => {
                invalidations.push(options);
                return Promise.resolve();
              },
            }),
            useMutation: (options: {
              mutationFn: (gift: SupporterGift) => Promise<unknown>;
              onSuccess: (result: unknown, gift: SupporterGift) => void;
            }) => ({
              isPending: false,
              mutateAsync: async (gift: SupporterGift) => {
                const result = await options.mutationFn(gift);
                options.onSuccess(result, gift);
                return result;
              },
            }),
          };
        if (name === "@/services/settingsService")
          return { fetchSupporterGifts: async () => gifts };
        if (name === "sonner")
          return { toast: { success: () => {}, error: () => {} } };
        return {
          Button: "Button",
          Popover: "Popover",
          PopoverTrigger: "PopoverTrigger",
          PopoverContent: "PopoverContent",
          ChatToolbarButton: "ChatToolbarButton",
        };
      },
    },
  );
  const render = () => {
    cursor = 0;
    return exports.ComposerActionsMenu({
      userId: "owner",
      recipientId: "recipient",
      recipientLabel: "Recipient",
      disabled: false,
      onSendGift: async (gift: SupporterGift) => {
        redeemed.push([gift.share_id, "recipient"]);
        await new Promise<void>((resolve) => {
          finishGift = resolve;
        });
      },
      onSend: (content: string, metadata?: OutgoingMessageMetadata) =>
        sent.push({ content, metadata }),
    });
  };
  const click = (tree: Node, text: string) => {
    const button = nodes(tree).find(
      (node) =>
        (node.type === "button" || node.type === "Button") &&
        label(node) === text,
    );
    if (!button)
      throw new Error(
        `Missing ${text}; buttons: ${nodes(tree)
          .filter((node) => node.type === "button" || node.type === "Button")
          .map(label)
          .join(", ")}`,
      );
    return (button!.props.onClick as () => void | Promise<void>)();
  };
  let tree = render();
  expect(label(tree)).not.toContain("Invite to Game");
  expect(queryOptions.every((query) => !query.enabled)).toBe(true);
  (tree.props.onOpenChange as (open: boolean) => void)(true);
  click(render(), "Send VIP Server");
  tree = render();
  expect(label(tree)).toContain("You don't own any VIP servers to send");
  expect(queryOptions.at(-2)?.queryKey).toEqual([
    "own-private-servers",
    "owner",
  ]);
  expect(queryOptions.at(-1)?.queryKey).toEqual(["supporter-gifts", "owner"]);
  servers = [
    {
      id: 7,
      link: "https://www.roblox.com/share?code=secret",
      rules: "Be kind",
      expires: "",
      created_at: 1,
    },
  ];
  click(render(), "Server #7Be kind");
  expect(sent).toEqual([
    {
      content: "Be kind",
      metadata: { type: "vip_server_invite", server_id: 7 },
    },
  ]);
  (render().props.onOpenChange as (open: boolean) => void)(true);
  click(render(), "Send Gift");
  expect(label(render())).toContain(
    "You don't have any unredeemed supporter gifts",
  );
  gifts = [
    {
      id: 1,
      share_id: "owned-gift",
      user: "owner",
      level: 2,
      purchase_id: "purchase",
      sku_id: "sku",
      created_at: 1,
    },
  ];
  click(render(), "Supporter 2 Gift×1");
  tree = render();
  expect(label(tree)).toContain("Send a Supporter 2 gift to Recipient?");
  expect(redeemed).toEqual([]);
  const firstSend = click(tree, "Confirm Gift");
  await click(tree, "Confirm Gift");
  expect(redeemed).toEqual([["owned-gift", "recipient"]]);
  finishGift();
  await firstSend;
  expect(gifts).toEqual([]);
  expect(invalidations).toEqual([{ queryKey: ["supporter-gifts", "owner"] }]);
  expect(sent).toHaveLength(1);
});
