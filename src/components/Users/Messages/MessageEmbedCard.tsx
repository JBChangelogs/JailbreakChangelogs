"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { fetchMessageServer } from "@/services/messageInvitesService";
import { validatePrivateServerLink } from "@/utils/api/serverValidation";
import {
  formatGiftMessageContent,
  formatMessageText,
} from "@/utils/messages/formatting";
import {
  buildRobloxGameLink,
  JAILBREAK_PLACE_ID,
  KNOWN_ROBLOX_GAMES,
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

/** The game's Roblox icon, or a controller tile while missing. */
function GameIcon({ placeId }: { placeId: string }) {
  const iconsQuery = useQuery({
    queryKey: ["roblox-game-icons"],
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/roblox/game-icons", { signal });
      if (!response.ok) throw new Error("Failed to load game icons");
      return (await response.json()) as Record<string, string>;
    },
    // Finite, so icons Roblox hadn't ready yet turn up later.
    staleTime: 60 * 60_000,
    retry: false,
  });
  const src = iconsQuery.data?.[placeId];
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- Roblox's CDN, already sized.
    <img src={src} alt="" className="size-14 shrink-0 rounded-xl" />
  ) : (
    <span className="bg-tertiary-bg text-tertiary-text flex size-14 shrink-0 items-center justify-center rounded-xl">
      <Icon icon="lucide:gamepad-2" className="h-6 w-6" />
    </span>
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
    <div className="bg-tertiary-bg lg:group-hover/message:bg-secondary-bg relative mt-1 max-w-md overflow-hidden rounded-2xl px-4 py-3 whitespace-normal transition-colors">
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
      {metadata.type === "game_invite" ? (
        <div className="mt-2 flex items-center gap-3">
          <GameIcon placeId={metadata.place_id} />
          <div className="min-w-0 flex-1">
            <p className="text-primary-text text-base font-semibold">
              {KNOWN_ROBLOX_GAMES[metadata.place_id] ?? "Roblox"}
            </p>
            <p
              className={`text-sm wrap-break-word whitespace-pre-wrap ${message.status === "failed" ? "text-form-error" : "text-secondary-text"}`}
            >
              {formatMessageText(description)}
            </p>
          </div>
          {/* Roblox doesn't let anyone join you in Trading directly. */}
          {metadata.place_id === JAILBREAK_PLACE_ID && (
            <Button
              className="shrink-0"
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
              {isJoining ? "Joining..." : "Join"}
            </Button>
          )}
        </div>
      ) : (
        <div
          className={`mt-1 text-sm wrap-break-word whitespace-pre-wrap ${message.status === "failed" ? "text-form-error" : "text-secondary-text"}`}
        >
          {formatMessageText(description)}
        </div>
      )}
      {metadata.type === "vip_server_invite" && (
        <div className="mt-2">
          <VipServerJoinAction serverId={metadata.server_id} />
        </div>
      )}
    </div>
  );
}
