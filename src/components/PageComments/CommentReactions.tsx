"use client";

import React, { useState } from "react";
import { Icon } from "../ui/IconWrapper";
import { CommentReaction } from "@/utils/api/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCommentsContext } from "./CommentsContext";
import { ReactionsDialog } from "./ReactionsDialog";
import Twemoji from "react-twemoji";
import { useTwemoji } from "@/contexts/TwemojiContext";

export function CommentReactions({
  commentId,
  reactions,
  isRobloxContext,
  compact = false,
}: {
  commentId: number;
  reactions: CommentReaction[] | undefined;
  isRobloxContext: boolean;
  compact?: boolean;
}) {
  const {
    handleReact,
    isRateLimited,
    reactionBan,
    availableEmojis,
    isLoggedIn,
    setReactionBreakdownOpenId,
    setBreakdownTab,
    reactionPickerInlineOpenId,
    setReactionPickerInlineOpenId,
    getStableReactionOrder,
  } = useCommentsContext();
  const { twemojiEnabled } = useTwemoji();

  const isReactionBlocked = isRateLimited || !!reactionBan;
  const [tooltipResetKey, setTooltipResetKey] = useState(0);

  if (!reactions || reactions.length === 0) {
    if (!isLoggedIn || availableEmojis.length === 0) return null;
    return null;
  }

  const sortedRxns = getStableReactionOrder(commentId, reactions);
  const top5 = sortedRxns.slice(0, 5);
  const overflow = sortedRxns.slice(5);

  const openDialog = (firstEmoji?: string) => {
    setReactionBreakdownOpenId(commentId);
    setBreakdownTab(firstEmoji ?? sortedRxns[0]?.emoji ?? "all");
  };

  const formatReactionTooltip = (r: (typeof top5)[number]): React.ReactNode => {
    const users = r.users ?? [];
    if (users.length === 0)
      return `${r.emoji} ${r.count} reaction${r.count !== 1 ? "s" : ""}`;
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
        {r.emoji} reacted by {nameStr}
        {remaining > 0 && (
          <>
            {" and "}
            <button
              type="button"
              className="text-link cursor-pointer hover:underline"
              onClick={() => {
                setTooltipResetKey((k) => k + 1);
                openDialog(r.emoji);
              }}
            >
              {remaining} other{remaining !== 1 ? "s" : ""}
            </button>
          </>
        )}
      </span>
    );
  };

  return (
    <>
      <div
        className={
          compact
            ? "mt-1.5 flex flex-wrap items-center gap-1.5"
            : "flex flex-wrap items-center gap-1.5 pb-2"
        }
      >
        {top5.map((r) => (
          <Tooltip key={`${r.emoji}-${tooltipResetKey}`} delayDuration={500}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => void handleReact(commentId, r.emoji)}
                className={`flex items-center gap-1 rounded-lg border ${compact ? "px-2 py-0.5" : "px-2 py-1"} text-sm transition-colors ${isReactionBlocked ? "cursor-not-allowed" : "cursor-pointer"} ${
                  r.user_reacted
                    ? "border-link/30 bg-link/10 text-link"
                    : "border-border-card bg-quaternary-bg text-primary-text hover:border-link/30"
                }`}
              >
                {twemojiEnabled ? (
                  <Twemoji tag="span" options={{ className: "twemoji" }}>
                    {r.emoji}
                  </Twemoji>
                ) : (
                  <span>{r.emoji}</span>
                )}
                <span className="text-xs font-medium">{r.count}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>{formatReactionTooltip(r)}</TooltipContent>
          </Tooltip>
        ))}

        {overflow.length > 0 && (
          <button
            type="button"
            onClick={() => openDialog()}
            className={`border-border-card bg-quaternary-bg text-secondary-text hover:border-link/30 hover:text-primary-text flex cursor-pointer items-center gap-1 rounded-lg border ${compact ? "px-2 py-0.5" : "px-2 py-1"} text-sm font-medium transition-colors`}
          >
            +{overflow.length} more
          </button>
        )}

        {isLoggedIn && availableEmojis.length > 0 && (
          <Popover
            open={reactionPickerInlineOpenId === commentId}
            onOpenChange={(open) => {
              if (open && isReactionBlocked) return;
              setReactionPickerInlineOpenId(open ? commentId : null);
            }}
          >
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`flex ${compact ? "h-6 w-6" : "h-7 w-7"} bg-quaternary-bg text-primary-text items-center justify-center rounded-lg transition-colors ${
                      isReactionBlocked
                        ? "cursor-not-allowed"
                        : "cursor-pointer hover:brightness-110"
                    }`}
                  >
                    <Icon
                      icon="fluent:emoji-add-16-regular"
                      className={compact ? "h-3 w-3" : "h-3.5 w-3.5"}
                    />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Add a reaction</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="grid grid-cols-5 gap-1">
                {availableEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      void handleReact(commentId, emoji);
                      setReactionPickerInlineOpenId(null);
                    }}
                    className="hover:bg-quaternary-bg flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-lg transition-colors"
                  >
                    {twemojiEnabled ? (
                      <Twemoji tag="span" options={{ className: "twemoji" }}>
                        {emoji}
                      </Twemoji>
                    ) : (
                      emoji
                    )}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <ReactionsDialog
        commentId={commentId}
        reactions={sortedRxns}
        isRobloxContext={isRobloxContext}
      />
    </>
  );
}
