import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";
import {
  buildRobloxGameLink,
  type MessageEmbedMetadata,
} from "@/utils/messages/invites";
import { validatePrivateServerLink } from "@/utils/api/serverValidation";
import { SUPPORTER_CONFETTI_COLORS } from "@/utils/ui/supporterCelebration";
import { formatGiftMessageContent } from "@/utils/messages/formatting";
import type { Message } from "@/utils/messages/types";

type Node = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

test("received cards join valid games and VIP servers, handle missing servers, and use each gift tier's badge and confetti color", () => {
  let server: { link: string } | null = {
    link: "https://www.roblox.com/share?code=owned-server&type=Server",
  };
  let error: Error | null = null;
  const exports = {} as { MessageEmbedCard: (props: unknown) => Node };
  const jsx = (type: unknown, props: Record<string, unknown>): Node =>
    typeof type === "function" ? type(props) : { type, props };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./MessageEmbedCard.tsx", import.meta.url), "utf8"),
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
        if (name === "@tanstack/react-query")
          return {
            useQuery: () => ({
              data: server,
              error,
              isPending: false,
              refetch: () => {},
            }),
          };
        if (name === "next/image")
          return { default: "image", __esModule: true };
        if (name === "@/utils/messages/invites") return { buildRobloxGameLink };
        if (name === "@/utils/api/serverValidation")
          return { validatePrivateServerLink };
        if (name === "@/utils/ui/supporterCelebration")
          return { SUPPORTER_CONFETTI_COLORS };
        if (name === "@/utils/messages/formatting")
          return {
            formatGiftMessageContent,
            formatMessageText: (text: string) => text,
          };
        return { Button: "button", Icon: "icon", ChatEventTime: "time" };
      },
    },
  );
  const render = (
    metadata: MessageEmbedMetadata,
    isMine = false,
    status?: Message["status"],
    content = "Join me!",
  ) =>
    nodes(
      exports.MessageEmbedCard({
        message: { content, createdAt: 1, status },
        metadata,
        isMine,
        senderLabel: "Sender",
      }),
    );
  const game = {
    type: "game_invite" as const,
    place_id: "606849621",
    job_id: "12345678-1234-1234-1234-123456789abc",
  };
  expect(render(game).find((node) => node.type === "a")?.props.href).toBe(
    buildRobloxGameLink(game),
  );
  const vip = { type: "vip_server_invite" as const, server_id: 7 };
  expect(
    render(vip, false, undefined, "Be kind").some(
      (node) => node.props.children === "Server rules",
    ),
  ).toBe(true);
  expect(
    render(vip, false, undefined, "Here's my VIP server.").some(
      (node) => node.props.children === "Server rules",
    ),
  ).toBe(false);
  expect(
    render(vip, false, undefined, "").some(
      (node) => node.props.children === "Server rules",
    ),
  ).toBe(false);
  expect(
    render(game).some((node) => node.props.children === "Server rules"),
  ).toBe(false);
  expect(render(vip).find((node) => node.type === "a")?.props.href).toBe(
    server!.link,
  );
  server = null;
  expect(
    render(vip).some(
      (node) => node.props.children === "This invite is no longer valid.",
    ),
  ).toBe(true);
  server = { link: "javascript:alert(1)" };
  expect(render(vip).some((node) => node.type === "a")).toBe(false);
  error = new Error("Could not load server");
  expect(
    render(vip).some(
      (node) => node.type === "button" && node.props.children === "Retry",
    ),
  ).toBe(true);
  for (const level of [1, 2, 3]) {
    const card = render({ type: "gift_sent", level });
    expect(card.find((node) => node.type === "image")?.props.src).toContain(
      `jbcl_supporter_${level}.svg`,
    );
    expect(card.find((node) => node.type === "span")?.props.style).toEqual({
      backgroundColor: SUPPORTER_CONFETTI_COLORS[level][1],
    });
    expect(
      card.some(
        (node) =>
          node.props.children === `Sender sent you a Supporter ${level} gift!`,
      ),
    ).toBe(true);
    expect(card.some((node) => node.type === "a")).toBe(false);
    expect(
      render({ type: "gift_sent", level }, true).some(
        (node) => node.props.children === `Sent a Supporter ${level} gift!`,
      ),
    ).toBe(true);
    const pending = render({ type: "gift_sent", level }, true, "pending");
    expect(
      pending.some(
        (node) => node.props.children === `Sending a Supporter ${level} gift…`,
      ),
    ).toBe(true);
    const failed = render({ type: "gift_sent", level }, true, "failed");
    expect(
      failed.some((node) => node.props.children === "Gift was not sent."),
    ).toBe(true);
    expect(
      failed.some(
        (node) => node.props.children === `Sent a Supporter ${level} gift!`,
      ),
    ).toBe(false);
  }
});
