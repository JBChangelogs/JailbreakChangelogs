"use client";

import React, { useState, useEffect, useRef } from "react";
import { CommentReaction } from "@/utils/api/api";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icon } from "@/components/ui/IconWrapper";
import { UserAvatar } from "@/utils/ui/avatar";
import Link from "next/link";
import { useCommentsContext } from "./CommentsContext";
import Twemoji from "react-twemoji";
import { useTwemoji } from "@/contexts/TwemojiContext";

export function ReactionsDialog({
  commentId,
  reactions,
  isRobloxContext,
}: {
  commentId: number;
  reactions: CommentReaction[];
  isRobloxContext: boolean;
}) {
  const {
    handleReact,
    isRateLimited,
    reactionBreakdownOpenId,
    setReactionBreakdownOpenId,
    breakdownTab,
    getStableReactionOrder,
    userData,
    currentUserId,
    isLoggedIn,
  } = useCommentsContext();
  const { twemojiEnabled } = useTwemoji();

  const isOpen = reactionBreakdownOpenId === commentId;
  const sortedRxns = getStableReactionOrder(commentId, reactions);

  const [localTab, setLocalTab] = useState<string>(sortedRxns[0]?.emoji ?? "");

  const breakdownTabRef = useRef(breakdownTab);
  breakdownTabRef.current = breakdownTab;
  const sortedRxnsRef = useRef(sortedRxns);
  sortedRxnsRef.current = sortedRxns;

  useEffect(() => {
    if (isOpen) {
      const tab = breakdownTabRef.current;
      const initial =
        tab === "all" ? (sortedRxnsRef.current[0]?.emoji ?? "") : tab;
      setLocalTab(initial);
    }
  }, [isOpen]);

  const handleUnreact = (emoji: string) => {
    if (isRateLimited) return;
    void handleReact(commentId, emoji);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setReactionBreakdownOpenId(open ? commentId : null);
        if (open && sortedRxns[0]) {
          setLocalTab(sortedRxns[0].emoji);
        }
      }}
    >
      <DialogContent
        className="bg-secondary-bg w-full max-w-md gap-0 overflow-hidden rounded-lg p-0 backdrop-blur-none"
        aria-describedby={undefined}
      >
        {/* Header */}
        <div className="border-border-card flex items-center justify-between border-b px-4 py-3">
          <DialogTitle className="text-base font-semibold">
            Reactions
          </DialogTitle>
          <DialogClose className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg cursor-pointer rounded-md p-1 transition-colors">
            <Icon icon="heroicons:x-mark" className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Body */}
        <div className="flex" style={{ height: "22rem" }}>
          {/* Left: emoji tab list */}
          <div className="border-border-card w-24 shrink-0 space-y-0.5 overflow-y-auto border-r p-1.5">
            {sortedRxns.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => setLocalTab(r.emoji)}
                className={`flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-2 transition-colors ${
                  localTab === r.emoji
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

          {/* Right: all panels pre-rendered, toggled with CSS only */}
          <div className="min-w-0 flex-1 overflow-y-auto p-2">
            {sortedRxns.map((r) => {
              const panelUsers = r.users ?? [];
              const isActive = r.emoji === localTab;
              return (
                <div
                  key={r.emoji}
                  className={isActive ? "block space-y-0.5" : "hidden"}
                >
                  {panelUsers.length === 0 ? (
                    <div className="text-secondary-text flex h-full items-center justify-center text-sm">
                      No reactions yet
                    </div>
                  ) : (
                    panelUsers.map((reactUser, idx) => {
                      const reactorData = userData[reactUser.id];
                      const isUnknownReactor = !reactUser.id;
                      const displayName = isUnknownReactor
                        ? "Unknown User"
                        : isRobloxContext
                          ? reactorData?.roblox_display_name ||
                            reactorData?.roblox_username ||
                            reactorData?.username ||
                            reactUser.username ||
                            "Unknown User"
                          : reactorData?.username ||
                            reactUser.username ||
                            "Unknown User";
                      const isCurrentUser = reactUser.id === currentUserId;

                      return (
                        <div
                          key={reactUser.id ?? `unknown-${idx}`}
                          className="group flex items-center gap-3 rounded-md px-2 py-2"
                        >
                          <div className="shrink-0">
                            <UserAvatar
                              userId={reactUser.id ?? ""}
                              avatarHash={
                                reactorData?.avatar ?? reactUser.avatar ?? null
                              }
                              username={displayName}
                              size={9}
                              cdnSize={128}
                              custom_avatar={
                                reactorData?.custom_avatar ??
                                reactUser.custom_avatar ??
                                undefined
                              }
                              showBadge={false}
                              settings={reactorData?.settings ?? undefined}
                              premiumType={
                                reactorData?.premiumtype ??
                                reactUser.premiumtype
                              }
                              forceAvatarUrl={
                                isRobloxContext
                                  ? reactorData?.roblox_avatar ||
                                    reactUser.roblox_avatar ||
                                    undefined
                                  : undefined
                              }
                            />
                          </div>
                          <div className="min-w-0 flex-1 truncate">
                            {isUnknownReactor ? (
                              <span className="text-primary-text text-sm font-medium">
                                {displayName}
                              </span>
                            ) : (
                              <Link
                                href={`/users/${reactUser.id}`}
                                prefetch={false}
                                onClick={() => setReactionBreakdownOpenId(null)}
                                className="text-primary-text hover:text-link text-sm font-medium transition-colors"
                              >
                                {displayName}
                              </Link>
                            )}
                          </div>
                          {isLoggedIn && isCurrentUser && (
                            <Tooltip delayDuration={500}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => handleUnreact(r.emoji)}
                                  disabled={isRateLimited}
                                  className={`text-secondary-text hover:text-button-danger hover:bg-button-danger/10 shrink-0 rounded p-0.5 opacity-100 transition-colors lg:opacity-0 lg:group-hover:opacity-100 ${isRateLimited ? "cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                  <Icon
                                    icon="heroicons:x-mark"
                                    className="h-4 w-4"
                                  />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Remove reaction</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
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
