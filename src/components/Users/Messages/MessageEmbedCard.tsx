"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { ChatEventTime } from "@/components/chat/chat-event";
import { fetchMessageServer } from "@/services/messageInvitesService";
import { validatePrivateServerLink } from "@/utils/api/serverValidation";
import {
  formatGiftMessageContent,
  formatMessageText,
} from "@/utils/messages/formatting";
import {
  buildRobloxGameLink,
  type MessageEmbedMetadata,
} from "@/utils/messages/invites";
import type { Message } from "@/utils/messages/types";
import { SUPPORTER_CONFETTI_COLORS } from "@/utils/ui/supporterCelebration";

function VipServerJoinAction({ serverId }: { serverId: number }) {
  const serverQuery = useQuery({
    queryKey: ["private-server", serverId],
    queryFn: ({ signal }) => fetchMessageServer(serverId, signal),
    staleTime: 60_000,
    retry: false,
  });
  const server = serverQuery.data;
  const error = serverQuery.error?.message;
  const link =
    server && validatePrivateServerLink(server.link).isValid
      ? server.link
      : null;
  if (error)
    return (
      <div className="text-secondary-text text-xs">
        <p className="text-form-error">{error}</p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void serverQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  if (serverQuery.isPending)
    return <p className="text-secondary-text text-xs">Loading server…</p>;
  if (link === null)
    return (
      <p className="text-secondary-text text-xs italic">
        This invite is no longer valid.
      </p>
    );
  return (
    <Button asChild size="sm">
      <a href={link} target="_blank" rel="noopener noreferrer">
        <Icon icon="heroicons:arrow-top-right-on-square" className="h-4 w-4" />
        Join Server
      </a>
    </Button>
  );
}

export function MessageEmbedCard({
  message,
  metadata,
  isMine,
  senderLabel,
}: {
  message: Message;
  metadata: MessageEmbedMetadata;
  isMine: boolean;
  senderLabel: string;
}) {
  const [isJoining, setIsJoining] = useState(false);
  const joinTimeoutRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (joinTimeoutRef.current !== null)
        window.clearTimeout(joinTimeoutRef.current);
    },
    [],
  );
  const isGift = metadata.type === "gift_sent";
  const giftColor =
    metadata.type === "gift_sent"
      ? (SUPPORTER_CONFETTI_COLORS[metadata.level]?.[1] ?? "#4ECDC4")
      : undefined;
  const title =
    metadata.type === "game_invite"
      ? "Game Invite"
      : metadata.type === "vip_server_invite"
        ? "VIP Server Invite"
        : `Supporter ${metadata.level} Gift`;
  const description =
    metadata.type === "gift_sent"
      ? formatGiftMessageContent(message, metadata.level, isMine, senderLabel)
      : message.content;
  return (
    <div className="bg-tertiary-bg relative mt-1 max-w-md overflow-hidden rounded-2xl px-4 py-3 whitespace-normal transition-colors group-hover:bg-[color-mix(in_srgb,var(--color-tertiary-bg),white_5%)]">
      <span
        className={`absolute inset-y-0 left-0 w-1 ${isGift ? "" : "bg-link"}`}
        style={isGift ? { backgroundColor: giftColor } : undefined}
      />
      <p
        className={`flex items-center gap-1.5 text-sm font-semibold ${isGift ? "text-primary-text" : "text-link"}`}
      >
        {metadata.type === "gift_sent" ? (
          <Image
            src={`https://assets.jailbreakchangelogs.com/assets/website_icons/jbcl_supporter_${metadata.level}.svg`}
            alt=""
            width={24}
            height={24}
            className="shrink-0 object-contain"
          />
        ) : (
          <Icon
            icon={
              metadata.type === "game_invite"
                ? "lucide:gamepad-2"
                : "lucide:server"
            }
            className="h-4 w-4"
          />
        )}
        {title}
      </p>
      {metadata.type === "vip_server_invite" &&
        description.trim() &&
        description.trim() !== "Here's my VIP server." && (
          <p className="text-secondary-text/70 mt-2 text-xs font-medium">
            Server rules
          </p>
        )}
      <div
        className={`mt-1 text-sm wrap-break-word whitespace-pre-wrap ${message.status === "failed" ? "text-form-error" : "text-secondary-text"}`}
      >
        {formatMessageText(description)}
      </div>
      {metadata.type === "game_invite" && (
        <div className="mt-2">
          <Button
            size="sm"
            disabled={isJoining}
            onClick={() => {
              if (joinTimeoutRef.current !== null) return;
              setIsJoining(true);
              joinTimeoutRef.current = window.setTimeout(() => {
                joinTimeoutRef.current = null;
                setIsJoining(false);
              }, 5000);
              window.location.assign(buildRobloxGameLink(metadata));
            }}
          >
            <Icon
              icon="heroicons:arrow-top-right-on-square"
              className="h-4 w-4"
            />
            {isJoining ? "Joining..." : "Join Game"}
          </Button>
        </div>
      )}
      {metadata.type === "vip_server_invite" && (
        <div className="mt-2">
          <VipServerJoinAction serverId={metadata.server_id} />
        </div>
      )}
      {typeof message.createdAt === "number" && (
        <ChatEventTime
          timestamp={message.createdAt}
          format="discord"
          className="text-secondary-text mt-2 block text-[10px]"
        />
      )}
    </div>
  );
}
