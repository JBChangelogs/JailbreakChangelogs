import { createLogger } from "@/services/logger";
import React, { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const log = createLogger("UI");
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  formatRelativeDate,
  formatCustomDate,
} from "@/utils/helpers/timestamp";
import Link from "next/link";
import Image from "next/image";
import {
  getItemImagePath,
  isVideoItem,
  handleImageError,
  getVideoPath,
  IMAGE_PATHS,
} from "@/utils/ui/images";
import { getCategoryColor } from "@/utils/items/categoryIcons";
import { ItemDetails } from "@/types";
import { convertUrlsToLinks } from "@/utils/ui/urlConverter";
import { UserAvatar } from "@/utils/ui/avatar";
import { Icon } from "@/components/ui/IconWrapper";
import Twemoji from "react-twemoji";
import { useTwemoji } from "@/contexts/TwemojiContext";
import { TwemojiText } from "@/components/ui/TwemojiText";

interface ReactionUser {
  id: string;
  username: string;
  avatar?: string | null;
  custom_avatar?: string | null;
  premiumtype?: number;
  settings?: { custom_avatar?: boolean } | null;
}

interface CommentReaction {
  emoji: string;
  count: number;
  users?: ReactionUser[];
}

interface CommentProps {
  id: number;
  author: string;
  content: string;
  date: string;
  item_id: number;
  item_type: string;
  user_id: string;
  edited_at: number | null;
  parent_id?: number | null;
  reply_to_id?: number | null;
  reactions?: CommentReaction[];
  replyToComment?: {
    id: number;
    author: string;
    content: string;
  } | null;
  changelogDetails?: unknown;
  itemDetails?: unknown;
  seasonDetails?: unknown;
  tradeDetails?: unknown;
  isLoading?: boolean;
}

interface ChangelogDetails {
  id: number;
  title: string;
}

interface SeasonDetails {
  season: number;
  title: string;
}

function ProfileReactionsDialog({
  reactions,
  open,
  onClose,
  initialEmoji,
}: {
  reactions: CommentReaction[];
  open: boolean;
  onClose: () => void;
  initialEmoji: string;
}) {
  const { twemojiEnabled } = useTwemoji();
  const [activeTab, setActiveTab] = useState(initialEmoji);

  useEffect(() => {
    if (open) {
      setActiveTab(initialEmoji || reactions[0]?.emoji || "");
    }
  }, [open, initialEmoji, reactions]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        className="bg-secondary-bg w-full max-w-md gap-0 overflow-hidden rounded-lg p-0 backdrop-blur-none"
        aria-describedby={undefined}
      >
        <div className="border-border-card flex items-center justify-between border-b px-4 py-3">
          <DialogTitle className="text-base font-semibold">
            Reactions
          </DialogTitle>
          <DialogClose className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg cursor-pointer rounded-md p-1 transition-colors">
            <Icon icon="heroicons:x-mark" className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <div className="flex" style={{ height: "22rem" }}>
          <div className="border-border-card w-24 shrink-0 space-y-0.5 overflow-y-auto border-r p-1.5">
            {reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => setActiveTab(r.emoji)}
                className={`flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-2 transition-colors ${
                  activeTab === r.emoji
                    ? "bg-link/15 text-link"
                    : "text-primary-text hover:bg-quaternary-bg"
                }`}
              >
                {twemojiEnabled ? (
                  <Twemoji tag="span" options={{ className: "twemoji" }}>
                    {r.emoji}
                  </Twemoji>
                ) : (
                  <span className="text-lg leading-none">{r.emoji}</span>
                )}
                <span className="text-sm font-medium">{r.count}</span>
              </button>
            ))}
          </div>

          <div className="min-w-0 flex-1 overflow-y-auto p-2">
            {reactions.map((r) => (
              <div
                key={r.emoji}
                className={
                  r.emoji === activeTab ? "block space-y-0.5" : "hidden"
                }
              >
                {!r.users || r.users.length === 0 ? (
                  <div className="text-secondary-text flex h-full items-center justify-center text-sm">
                    No reactions yet
                  </div>
                ) : (
                  r.users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 rounded-md px-2 py-2"
                    >
                      <div className="shrink-0">
                        <UserAvatar
                          userId={u.id}
                          avatarHash={u.avatar ?? null}
                          username={u.username}
                          size={9}
                          cdnSize={128}
                          custom_avatar={u.custom_avatar ?? undefined}
                          showBadge={false}
                          settings={u.settings ?? undefined}
                          premiumType={u.premiumtype}
                        />
                      </div>
                      <Link
                        href={`/users/${u.id}`}
                        prefetch={false}
                        onClick={() => onClose()}
                        className="text-primary-text hover:text-link min-w-0 flex-1 truncate text-sm font-medium transition-colors"
                      >
                        {u.username}
                      </Link>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-border-card border-t px-4 py-3">
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Comment({
  content,
  date,
  item_type,
  item_id,
  edited_at,
  parent_id,
  reply_to_id: _reply_to_id,
  reactions,
  replyToComment,
  changelogDetails: propChangelogDetails,
  itemDetails: propItemDetails,
  seasonDetails: propSeasonDetails,
  isLoading: propIsLoading,
}: CommentProps) {
  const { twemojiEnabled } = useTwemoji();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEmoji, setDialogEmoji] = useState("");
  const [tooltipResetKey, setTooltipResetKey] = useState(0);

  const itemDetails = (propItemDetails as ItemDetails) || null;
  const changelogDetails = (propChangelogDetails as ChangelogDetails) || null;
  const seasonDetails = (propSeasonDetails as SeasonDetails) || null;
  const isLoading = propIsLoading || false;

  const formattedDate = formatRelativeDate(parseInt(date));
  const contentType =
    item_type.toLowerCase() === "vsuggestion"
      ? "Value Suggestion"
      : item_type.charAt(0).toUpperCase() + item_type.slice(1);

  const hasReactions = reactions && reactions.length > 0;
  const top5 = reactions ? reactions.slice(0, 5) : [];
  const overflow = reactions ? reactions.slice(5) : [];

  const openDialog = (emoji: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDialogEmoji(emoji);
    setDialogOpen(true);
  };

  const formatReactionTooltip = (r: CommentReaction): React.ReactNode => {
    const users = r.users ?? [];
    if (users.length === 0) {
      return (
        <span>
          <TwemojiText tag="span">{r.emoji}</TwemojiText> {r.count} reaction
          {r.count !== 1 ? "s" : ""}
        </span>
      );
    }
    const MAX_NAMES = 3;
    const names = users.slice(0, MAX_NAMES).map((u) => u.username);
    const remaining = r.count - names.length;
    const nameStr =
      names.length === 1
        ? names[0]
        : remaining > 0
          ? names.join(", ")
          : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
    return (
      <span>
        <TwemojiText tag="span">{r.emoji}</TwemojiText> reacted by {nameStr}
        {remaining > 0 && (
          <>
            {" and "}
            <button
              type="button"
              className="text-link cursor-pointer hover:underline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTooltipResetKey((k) => k + 1);
                setDialogEmoji(r.emoji);
                setDialogOpen(true);
              }}
            >
              {remaining} other{remaining !== 1 ? "s" : ""}
            </button>
          </>
        )}
      </span>
    );
  };

  const renderThumbnail = () => {
    if (item_type.toLowerCase() === "changelog") {
      return (
        <div className="relative mr-3 h-16 w-16 shrink-0 overflow-hidden rounded-md md:h-18 md:w-32">
          <Image
            src={`https://assets.jailbreakchangelogs.com/assets/images/changelogs/${item_id}.webp`}
            alt={`Changelog ${item_id}`}
            fill
            className="object-cover"
            onError={handleImageError}
          />
        </div>
      );
    }

    if (item_type.toLowerCase() === "season") {
      return (
        <div className="relative mr-3 h-16 w-16 shrink-0 overflow-hidden rounded-md md:h-18 md:w-32">
          <Image
            src={`https://assets.jailbreakchangelogs.com/assets/images/seasons/${item_id}/10.webp`}
            alt={`Season ${item_id}`}
            fill
            className="object-cover"
            onError={handleImageError}
          />
        </div>
      );
    }

    if (item_type.toLowerCase() === "tradev2") {
      return (
        <div className="relative mr-3 h-16 w-16 shrink-0 overflow-hidden rounded-md md:h-18 md:w-32">
          <Image
            src="https://assets.jailbreakchangelogs.com/assets/logos/collab/JBCL_X_TC_Logo_Long_Light_Background.webp"
            alt="Trade Ad"
            fill
            className="object-cover"
            onError={handleImageError}
          />
        </div>
      );
    }

    if (item_type.toLowerCase() === "inventory") {
      return (
        <div className="relative mr-3 h-16 w-16 shrink-0 overflow-hidden rounded-md md:h-18 md:w-32">
          <Image
            src={`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${item_id}&size=150x150&format=Png&isCircular=false`}
            alt={`User ${item_id}'s inventory`}
            fill
            className="object-cover"
            onError={handleImageError}
          />
        </div>
      );
    }

    if (item_type.toLowerCase() === "vsuggestion") {
      return (
        <div className="relative mr-3 h-16 w-16 shrink-0 overflow-hidden rounded-md md:h-18 md:w-32">
          <Image
            src={IMAGE_PATHS.PLACEHOLDER}
            alt="Value Suggestion"
            fill
            className="object-cover"
            onError={handleImageError}
          />
        </div>
      );
    }

    const itemTypes = [
      "vehicle",
      "spoiler",
      "rim",
      "body color",
      "hyperchrome",
      "texture",
      "tire sticker",
      "tire style",
      "drift",
      "furniture",
      "horn",
      "weapon skin",
    ];

    if (itemTypes.includes(item_type.toLowerCase()) && itemDetails?.name) {
      const imagePath = getItemImagePath(
        itemDetails.type,
        itemDetails.name,
        true,
        false,
      );

      if (isVideoItem(itemDetails.name)) {
        return (
          <div className="relative mr-3 h-16 w-16 shrink-0 overflow-hidden rounded-md md:h-18 md:w-32">
            <video
              src={getVideoPath(itemDetails.type, itemDetails.name)}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
              onError={(e) => {
                log.error(
                  `Failed to load video: ${getVideoPath(itemDetails.type, itemDetails.name)}`,
                );
                const videoEl = e.target as HTMLVideoElement;
                const parentEl = videoEl.parentElement;
                if (parentEl) {
                  const img = document.createElement("img");
                  img.src = "/assets/images/Placeholder.webp";
                  img.className = "object-cover h-full w-full";
                  parentEl.replaceChild(img, videoEl);
                }
              }}
            />
          </div>
        );
      }

      return (
        <div className="relative mr-3 h-16 w-16 shrink-0 overflow-hidden rounded-md md:h-18 md:w-32">
          <Image
            src={imagePath}
            alt={`${item_type} ${itemDetails.name}`}
            fill
            className="object-cover"
            onError={handleImageError}
          />
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="relative mr-3 h-16 w-16 shrink-0 animate-pulse overflow-hidden rounded-md md:h-18 md:w-32"></div>
      );
    }

    return null;
  };

  const getItemName = () => {
    if (item_type.toLowerCase() === "changelog" && changelogDetails?.title) {
      return changelogDetails.title;
    }

    if (item_type.toLowerCase() === "season") {
      if (seasonDetails?.title) {
        return `Season ${item_id} / ${seasonDetails.title}`;
      }
      return `Season ${item_id}`;
    }

    if (item_type.toLowerCase() === "tradev2") {
      return `Trade #${item_id}`;
    }

    if (item_type.toLowerCase() === "inventory") {
      return `Inventory #${item_id}`;
    }

    if (item_type.toLowerCase() === "vsuggestion") {
      return `Value Suggestion #${item_id}`;
    }

    if (itemDetails?.name) {
      return itemDetails.name;
    }

    const itemTypesNeedingDetails = [
      "vehicle",
      "spoiler",
      "rim",
      "body color",
      "hyperchrome",
      "texture",
      "tire sticker",
      "tire style",
      "drift",
      "furniture",
      "horn",
      "weapon skin",
    ];

    if (
      itemTypesNeedingDetails.includes(item_type.toLowerCase()) &&
      isLoading
    ) {
      return null;
    }

    return `${contentType} #${item_id}`;
  };

  return (
    <>
      <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 shadow-sm">
        <Link
          href={
            item_type.toLowerCase() === "changelog"
              ? `/changelogs/${item_id}`
              : item_type.toLowerCase() === "season"
                ? `/seasons/${item_id}`
                : item_type.toLowerCase() === "tradev2"
                  ? `/trading/ad/${item_id}`
                  : item_type.toLowerCase() === "inventory"
                    ? `/inventories/${item_id}`
                    : item_type.toLowerCase() === "vsuggestion"
                      ? `/items/suggestions/${item_id}`
                      : `/item/${encodeURIComponent(item_type)}/${encodeURIComponent(itemDetails?.name || "")}`
          }
          prefetch={false}
          className="group block"
        >
          <div className="mb-2 flex">
            {renderThumbnail()}
            <div className="min-w-0 flex-1">
              {getItemName() ? (
                <p className="text-primary-text group-hover:text-link mb-1 line-clamp-2 max-w-full overflow-hidden font-medium text-ellipsis transition-colors">
                  {getItemName()}
                </p>
              ) : (
                <Skeleton className="mb-1 w-4/5" style={{ height: 20 }} />
              )}

              <div className="mb-2 flex flex-wrap items-center gap-1">
                <span
                  className="text-primary-text bg-tertiary-bg/40 inline-flex h-6 w-fit items-center rounded-lg border px-2.5 text-xs leading-none font-medium backdrop-blur-xl"
                  style={{
                    borderColor: getCategoryColor(item_type),
                  }}
                >
                  {contentType}
                </span>
                {typeof parent_id === "number" && (
                  <span className="text-primary-text bg-tertiary-bg/40 inline-flex h-6 w-fit items-center gap-1 rounded-lg px-2.5 text-xs leading-none font-medium backdrop-blur-xl">
                    <svg
                      className="h-3 w-3 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                      />
                    </svg>
                    {replyToComment
                      ? `Reply to ${replyToComment.author}`
                      : "Reply"}
                  </span>
                )}
              </div>

              {twemojiEnabled ? (
                <Twemoji options={{ className: "twemoji" }}>
                  <p className="text-primary-text line-clamp-4 max-w-full overflow-hidden break-words wrap-break-word text-ellipsis whitespace-pre-wrap">
                    {convertUrlsToLinks(content, true)}
                  </p>
                </Twemoji>
              ) : (
                <p className="text-primary-text line-clamp-4 max-w-full overflow-hidden break-words wrap-break-word text-ellipsis whitespace-pre-wrap">
                  {convertUrlsToLinks(content, true)}
                </p>
              )}
            </div>
          </div>
        </Link>

        {hasReactions && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {top5.map((r) => (
              <Tooltip
                key={`${r.emoji}-${tooltipResetKey}`}
                delayDuration={500}
              >
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => openDialog(r.emoji, e)}
                    className="border-border-card bg-quaternary-bg text-primary-text hover:border-link/30 inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium transition-colors"
                  >
                    {twemojiEnabled ? (
                      <Twemoji tag="span" options={{ className: "twemoji" }}>
                        {r.emoji}
                      </Twemoji>
                    ) : (
                      <span>{r.emoji}</span>
                    )}
                    <span>{r.count}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{formatReactionTooltip(r)}</TooltipContent>
              </Tooltip>
            ))}
            {overflow.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setDialogEmoji(reactions![0].emoji);
                  setDialogOpen(true);
                }}
                className="border-border-card bg-quaternary-bg text-secondary-text hover:border-link/30 hover:text-primary-text inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium transition-colors"
              >
                +{overflow.length} more
              </button>
            )}
          </div>
        )}

        <div className="mt-2 flex items-center justify-start text-xs">
          <div className="flex items-center gap-1">
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <span className="text-secondary-text cursor-help text-xs">
                  Posted {formattedDate}
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-primary-bg text-secondary-text border-none shadow-(--color-card-shadow)"
              >
                <p>
                  {edited_at
                    ? formatCustomDate(edited_at)
                    : formatCustomDate(parseInt(date))}
                </p>
              </TooltipContent>
            </Tooltip>
            {edited_at && (
              <span className="text-secondary-text text-xs">(edited)</span>
            )}
          </div>
        </div>
      </div>

      {hasReactions && (
        <ProfileReactionsDialog
          reactions={reactions!}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          initialEmoji={dialogEmoji}
        />
      )}
    </>
  );
}
