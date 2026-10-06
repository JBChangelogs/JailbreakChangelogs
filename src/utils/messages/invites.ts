import type { Message, OutgoingMessageMetadata } from "./types";

export function findLocalMessageConfirmation(
  messages: Message[],
  confirmation: Pick<
    Message,
    "id" | "senderId" | "receiverId" | "parentId" | "content"
  >,
  now = Date.now(),
): Message | undefined {
  return (
    messages.find((message) => message.id === confirmation.id) ??
    messages.find(
      (message) =>
        message.id === message.clientId &&
        message.status !== "failed" &&
        message.senderId === confirmation.senderId &&
        message.receiverId === confirmation.receiverId &&
        (message.parentId ?? null) === (confirmation.parentId ?? null) &&
        message.content === confirmation.content &&
        typeof message.createdAt === "number" &&
        now - message.createdAt <= 30_000,
    )
  );
}

export type MessageEmbedMetadata =
  | OutgoingMessageMetadata
  | { type: "gift_sent"; level: number };

export function isUserMessage(message: Message): boolean {
  return (
    message.type !== "system" || parseMessageEmbed(message.metadata) !== null
  );
}

const JOB_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseMessageEmbed(
  metadata: Record<string, unknown> | null | undefined,
): MessageEmbedMetadata | null {
  if (!metadata) return null;
  if (metadata.type === "game_invite") {
    if (
      typeof metadata.place_id !== "string" ||
      !/^[1-9]\d*$/.test(metadata.place_id)
    )
      return null;
    const jobId = metadata.job_id ?? null;
    if (jobId !== null && (typeof jobId !== "string" || !JOB_ID.test(jobId)))
      return null;
    return { type: "game_invite", place_id: metadata.place_id, job_id: jobId };
  }
  if (
    metadata.type === "vip_server_invite" &&
    typeof metadata.server_id === "number" &&
    Number.isSafeInteger(metadata.server_id) &&
    metadata.server_id > 0
  ) {
    return { type: "vip_server_invite", server_id: metadata.server_id };
  }
  if (
    metadata.type === "gift_sent" &&
    typeof metadata.level === "number" &&
    Number.isSafeInteger(metadata.level) &&
    metadata.level > 0
  ) {
    return { type: "gift_sent", level: metadata.level };
  }
  return null;
}

export function buildRobloxGameLink(
  metadata: Extract<OutgoingMessageMetadata, { type: "game_invite" }>,
): string {
  const params = new URLSearchParams({ placeId: metadata.place_id });
  if (metadata.job_id) params.set("gameInstanceId", metadata.job_id);
  return `roblox://experiences/start?${params}`;
}
