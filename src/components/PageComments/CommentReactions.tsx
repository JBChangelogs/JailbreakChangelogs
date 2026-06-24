"use client";

import React, { useEffect, useRef, useState } from "react";
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
import { TwemojiText } from "@/components/ui/TwemojiText";

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

  const isReactionBlocked = isRateLimited;
  const [tooltipResetKey, setTooltipResetKey] = useState(0);
  const shiftPressedRef = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") shiftPressedRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") shiftPressedRef.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const isPickerOpen = reactionPickerInlineOpenId === commentId;

  if ((!reactions || reactions.length === 0) && !isPickerOpen) {
    if (!isLoggedIn || availableEmojis.length === 0) return null;
    return null;
  }

  const sortedRxns = getStableReactionOrder(commentId, reactions ?? []);
  const top5 = sortedRxns.slice(0, 5);
  const overflow = sortedRxns.slice(5);

  const openDialog = (firstEmoji?: string) => {
    setReactionBreakdownOpenId(commentId);
    setBreakdownTab(firstEmoji ?? sortedRxns[0]?.emoji ?? "all");
  };

  const formatReactionTooltip = (r: (typeof top5)[number]): React.ReactNode => {
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
    const names = users
      .slice(0, MAX_NAMES)
      .map((u) =>
        isRobloxContext
          ? u.roblox_display_name ||
            u.roblox_username ||
            u.username ||
            "Unknown User"
          : (u.username ?? "Unknown User"),
      );
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
                onClick={
                  reactionBan
                    ? undefined
                    : () => void handleReact(commentId, r.emoji)
                }
                className={`flex items-center gap-1 rounded-lg border ${compact ? "px-2 py-0.5" : "px-2 py-1"} text-sm transition-colors ${isReactionBlocked ? "cursor-not-allowed" : reactionBan ? "cursor-default" : "cursor-pointer"} ${
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

        {isLoggedIn && availableEmojis.length > 0 && !reactionBan && (
          <Popover
            open={reactionPickerInlineOpenId === commentId}
            onOpenChange={(open) => {
              if (open && isReactionBlocked) return;
              if (!open && shiftPressedRef.current) return;
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
            <PopoverContent
              className="w-auto p-2"
              align="start"
              onFocusOutside={(e) => {
                if (shiftPressedRef.current) e.preventDefault();
              }}
              onInteractOutside={(e) => {
                if (shiftPressedRef.current) e.preventDefault();
              }}
            >
              <div className="grid grid-cols-5 gap-1">
                {availableEmojis.map((emoji) => (
                  <Tooltip key={emoji} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => {
                          void handleReact(commentId, emoji);
                          if (!e.shiftKey) {
                            setReactionPickerInlineOpenId(null);
                          }
                        }}
                        className="hover:bg-quaternary-bg flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-lg transition-colors"
                      >
                        {twemojiEnabled ? (
                          <Twemoji
                            tag="span"
                            options={{
                              className: "twemoji pointer-events-none",
                            }}
                          >
                            {emoji}
                          </Twemoji>
                        ) : (
                          <span className="pointer-events-none">{emoji}</span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <TwemojiText>{emoji}</TwemojiText>
                    </TooltipContent>
                  </Tooltip>
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
