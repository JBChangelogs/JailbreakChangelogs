"use client";

import React from "react";
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
import { UserAvatar } from "@/utils/ui/avatar";
import Link from "next/link";
import { useCommentsContext } from "./CommentsContext";

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
    availableEmojis,
    isLoggedIn,
    reactionBreakdownOpenId,
    setReactionBreakdownOpenId,
    breakdownTab,
    setBreakdownTab,
    reactionPickerInlineOpenId,
    setReactionPickerInlineOpenId,
    hoverInlinePickerTimer,
    hoverInlinePickerCloseTimer,
    getStableReactionOrder,
    userData,
  } = useCommentsContext();

  if (!reactions || reactions.length === 0) {
    if (!isLoggedIn || availableEmojis.length === 0) return null;
    return null;
  }

  const sortedRxns = getStableReactionOrder(commentId, reactions);
  const top5 = sortedRxns.slice(0, 5);
  const overflow = sortedRxns.slice(5);
  const tabUsers =
    breakdownTab === "all"
      ? sortedRxns.flatMap((r) =>
          (r.users ?? []).map((u) => ({
            user: u,
            emoji: r.emoji,
          })),
        )
      : (sortedRxns.find((r) => r.emoji === breakdownTab)?.users ?? []).map(
          (u) => ({
            user: u,
            emoji: breakdownTab,
          }),
        );

  return (
    <div
      className={
        compact
          ? "mt-1.5 flex flex-wrap items-center gap-1.5"
          : "flex flex-wrap items-center gap-1.5 pb-2"
      }
    >
      {top5.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => void handleReact(commentId, r.emoji)}
          className={`flex items-center gap-1 rounded-full border ${compact ? "px-2 py-0.5" : "px-2 py-1"} text-sm transition-colors ${isRateLimited ? "cursor-not-allowed" : "cursor-pointer"} ${
            r.user_reacted
              ? "border-link/30 bg-link/10 text-link"
              : "border-border-card bg-quaternary-bg text-primary-text hover:border-link/30"
          }`}
        >
          <span>{r.emoji}</span>
          <span className="text-xs font-medium">{r.count}</span>
        </button>
      ))}
      {overflow.length > 0 && (
        <Popover
          open={reactionBreakdownOpenId === commentId}
          onOpenChange={(open) => {
            setReactionBreakdownOpenId(open ? commentId : null);
            if (open) setBreakdownTab("all");
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`border-border-card bg-quaternary-bg text-secondary-text hover:border-link/30 hover:text-primary-text flex cursor-pointer items-center gap-1 rounded-full border ${compact ? "px-2 py-0.5" : "px-2 py-1"} text-xs font-medium transition-colors`}
            >
              +{overflow.length} more
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <div className="border-border-card flex flex-wrap gap-1.5 border-b p-2">
              {overflow.map((r) => (
                <button
                  key={r.emoji}
                  type="button"
                  onClick={() => void handleReact(commentId, r.emoji)}
                  className={`flex items-center gap-1 rounded-full border ${compact ? "px-2 py-0.5" : "px-2 py-1"} text-sm transition-colors ${isRateLimited ? "cursor-not-allowed" : "cursor-pointer"} ${
                    r.user_reacted
                      ? "border-link/30 bg-link/10 text-link"
                      : "border-border-card bg-quaternary-bg text-primary-text hover:border-link/30"
                  }`}
                >
                  <span>{r.emoji}</span>
                  <span className="text-xs font-medium">{r.count}</span>
                </button>
              ))}
            </div>
            <div className="border-border-card flex items-center gap-0.5 overflow-x-auto border-b p-1.5">
              <button
                type="button"
                onClick={() => setBreakdownTab("all")}
                className={`shrink-0 cursor-pointer rounded px-2 py-1 text-xs font-medium transition-colors ${
                  breakdownTab === "all"
                    ? "bg-link/20 text-link"
                    : "text-secondary-text hover:bg-quaternary-bg hover:text-primary-text"
                }`}
              >
                All
              </button>
              {sortedRxns.map((r) => (
                <button
                  key={r.emoji}
                  type="button"
                  onClick={() => setBreakdownTab(r.emoji)}
                  className={`flex shrink-0 cursor-pointer items-center gap-0.5 rounded px-2 py-1 text-xs font-medium transition-colors ${
                    breakdownTab === r.emoji
                      ? "bg-link/20 text-link"
                      : "text-secondary-text hover:bg-quaternary-bg hover:text-primary-text"
                  }`}
                >
                  <span>{r.emoji}</span>
                  <span>{r.count}</span>
                </button>
              ))}
            </div>
            {tabUsers.length > 0 ? (
              <div className="max-h-48 space-y-0.5 overflow-y-auto p-1.5">
                {tabUsers.map((item, idx) => {
                  const reactorData = userData[item.user.id];
                  const displayName = isRobloxContext
                    ? reactorData?.roblox_display_name ||
                      reactorData?.roblox_username ||
                      reactorData?.username ||
                      item.user.username
                    : reactorData?.username || item.user.username;
                  return (
                    <div
                      key={`${item.user.id}-${item.emoji}-${idx}`}
                      className="hover:bg-quaternary-bg flex items-center justify-between gap-2 rounded-md px-2 py-1.5 transition-colors"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="shrink-0">
                          <UserAvatar
                            userId={item.user.id}
                            avatarHash={
                              reactorData?.avatar ?? item.user.avatar ?? null
                            }
                            username={displayName}
                            size={6}
                            cdnSize={64}
                            custom_avatar={
                              reactorData?.custom_avatar ??
                              item.user.custom_avatar ??
                              undefined
                            }
                            showBadge={false}
                            settings={reactorData?.settings ?? undefined}
                            premiumType={
                              reactorData?.premiumtype ?? item.user.premiumtype
                            }
                            forceAvatarUrl={
                              isRobloxContext
                                ? reactorData?.roblox_avatar ||
                                  item.user.roblox_avatar ||
                                  undefined
                                : undefined
                            }
                          />
                        </div>
                        <Link
                          href={`/users/${item.user.id}`}
                          prefetch={false}
                          className="text-primary-text hover:text-link max-w-36 truncate text-sm font-medium transition-colors"
                          onClick={() => setReactionBreakdownOpenId(null)}
                        >
                          {displayName}
                        </Link>
                      </div>
                      <span className="shrink-0 text-base">{item.emoji}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-secondary-text p-3 text-center text-xs">
                No reactions yet
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}
      {isLoggedIn && availableEmojis.length > 0 && (
        <Popover
          open={reactionPickerInlineOpenId === commentId}
          onOpenChange={(open) => {
            if (open && isRateLimited) return;
            setReactionPickerInlineOpenId(open ? commentId : null);
          }}
        >
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  onMouseEnter={() => {
                    if (isRateLimited) return;
                    if (hoverInlinePickerCloseTimer.current) {
                      clearTimeout(hoverInlinePickerCloseTimer.current);
                      hoverInlinePickerCloseTimer.current = null;
                    }
                    hoverInlinePickerTimer.current = setTimeout(
                      () => setReactionPickerInlineOpenId(commentId),
                      0,
                    );
                  }}
                  onMouseLeave={() => {
                    if (hoverInlinePickerTimer.current) {
                      clearTimeout(hoverInlinePickerTimer.current);
                      hoverInlinePickerTimer.current = null;
                    }
                    hoverInlinePickerCloseTimer.current = setTimeout(
                      () =>
                        setReactionPickerInlineOpenId((prev) =>
                          prev === commentId ? null : prev,
                        ),
                      150,
                    );
                  }}
                  className={`border-secondary-text/30 flex ${compact ? "h-6 w-6" : "h-7 w-7"} items-center justify-center rounded-full border border-dashed transition-colors ${
                    isRateLimited
                      ? "text-secondary-text/40 cursor-not-allowed"
                      : "text-secondary-text hover:border-link/50 hover:text-primary-text cursor-pointer"
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
            onMouseEnter={() => {
              if (hoverInlinePickerCloseTimer.current) {
                clearTimeout(hoverInlinePickerCloseTimer.current);
                hoverInlinePickerCloseTimer.current = null;
              }
            }}
            onMouseLeave={() => {
              hoverInlinePickerCloseTimer.current = setTimeout(
                () =>
                  setReactionPickerInlineOpenId((prev) =>
                    prev === commentId ? null : prev,
                  ),
                150,
              );
            }}
          >
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
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
