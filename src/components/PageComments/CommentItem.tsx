"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CommentData } from "@/utils/api/api";
import { Icon } from "../ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { UserAvatar } from "@/utils/ui/avatar";
import Link from "next/link";
import { UserDetailsTooltip } from "@/components/ui/UserDetailsTooltip";
import type { UserData } from "@/types/auth";
import CommentTimestamp from "./CommentTimestamp";
import { CommentReactions } from "./CommentReactions";
import {
  isCommentEditable,
  convertUrlsToLinksHTML,
  processMentions,
  sanitizeHTML,
} from "./commentUtils";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import { useCommentsContext } from "./CommentsContext";
import Twemoji from "react-twemoji";
import { useTwemoji } from "@/contexts/TwemojiContext";
import { toast } from "sonner";
import { CommentTextarea } from "./CommentTextarea";

function CommentAuthorName({
  userId,
  name,
  user,
  className,
}: {
  userId: string;
  name: string;
  user?: UserData;
  className: string;
}) {
  const link = (
    <Link href={`/users/${userId}`} prefetch={false} className={className}>
      {name}
    </Link>
  );

  if (!user) return link;

  return (
    <Tooltip delayDuration={500}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent className="max-w-sm min-w-75 p-0">
        <UserDetailsTooltip user={user} />
      </TooltipContent>
    </Tooltip>
  );
}

function CommentItemInner({ comment }: { comment: CommentData }) {
  const {
    userData,
    currentUserId,
    isLoggedIn,
    isClient,
    type,
    trade,
    suggestion,
    editingCommentId,
    setEditingCommentId,
    updatingCommentId,
    replyingToId,
    setReplyingToId,
    replyingToReplyId,
    setReplyingToReplyId,
    expandedComments,
    expandedReplies,
    isSubmittingComment,
    isBlocked,
    isRateLimited,
    reactionBan,
    availableEmojis,
    emojiStringMap,
    reactionPickerHoverOpenId,
    setReactionPickerHoverOpenId,
    handleReact,
    handleEditComment,
    handleDeleteComment,
    handleSubmitReply,
    handleEditClick,
    handleReportClick,
    toggleReplies,
    toggleCommentExpand,
    setReactionBreakdownOpenId,
    setBreakdownTab,
    getStableReactionOrder,
    isTester,
  } = useCommentsContext();
  const { twemojiEnabled } = useTwemoji();

  const isReplying = replyingToId === comment.id;
  const [replyDraft, setReplyDraft] = useState("");
  const [editDraft, setEditDraft] = useState("");
  const [replyEmojiOpen, setReplyEmojiOpen] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const replyCursorPosRef = useRef<number | null>(null);

  const emojiEntries = useMemo(
    () => Object.entries(emojiStringMap).slice(0, 120),
    [emojiStringMap],
  );

  const insertReplyEmoji = useCallback(
    (emoji: string, keepOpen = false) => {
      const cursor = replyCursorPosRef.current ?? replyDraft.length;
      const next =
        replyDraft.slice(0, cursor) + emoji + replyDraft.slice(cursor);
      setReplyDraft(next);
      replyCursorPosRef.current = cursor + emoji.length;
      if (!keepOpen) {
        setReplyEmojiOpen(false);
        requestAnimationFrame(() => {
          const el = replyTextareaRef.current;
          if (!el) return;
          el.focus();
          const pos = replyCursorPosRef.current ?? next.length;
          el.setSelectionRange(pos, pos);
        });
      }
    },
    [replyDraft],
  );

  useEffect(() => {
    if (!isReplying) {
      setReplyDraft("");
    }
  }, [isReplying]);

  useEffect(() => {
    if (editingCommentId === comment.id) {
      setEditDraft(sanitizeText(comment.content || ""));
      return;
    }
    const reply = comment.replies?.find((r) => r.id === editingCommentId);
    if (reply) {
      setEditDraft(sanitizeText(reply.content || ""));
    }
  }, [editingCommentId, comment.id, comment.content, comment.replies]);

  const commentAuthorSettings = userData[comment.user_id]?.settings;

  // For trade/inventory contexts, prefer Roblox identity
  const isRobloxContext = type === "tradev2" || type === "inventory";
  const robloxAvatarUrl =
    isRobloxContext && userData[comment.user_id]?.roblox_avatar
      ? userData[comment.user_id].roblox_avatar
      : undefined;
  const isUnknownUser = !comment.user_id;
  const displayName = isUnknownUser
    ? "Unknown User"
    : isRobloxContext
      ? userData[comment.user_id]?.roblox_display_name ||
        userData[comment.user_id]?.roblox_username ||
        userData[comment.user_id]?.username ||
        comment.author ||
        "Unknown User"
      : userData[comment.user_id]?.username || comment.author || "Unknown User";

  // Hide identity if show_recent_comments or profile_public is falsy
  // and the viewer is not the comment author
  const hideRecent =
    !isUnknownUser &&
    (!commentAuthorSettings?.show_recent_comments ||
      !commentAuthorSettings?.profile_public) &&
    currentUserId !== comment.user_id;

  // Truncation logic for long comments
  const isExpanded = expandedComments.has(comment.id);
  const MAX_VISIBLE_LINES = 5;
  const MAX_VISIBLE_CHARS = 500;
  const commentContent = sanitizeText(comment.content || "");
  const lines = commentContent.split(/\r?\n/);
  const isLongLine = commentContent.length > MAX_VISIBLE_CHARS;
  const shouldTruncate = lines.length > MAX_VISIBLE_LINES || isLongLine;

  let visibleContent: string;
  if (shouldTruncate && !isExpanded) {
    if (lines.length > MAX_VISIBLE_LINES) {
      visibleContent = lines.slice(0, MAX_VISIBLE_LINES).join("\n");
    } else {
      visibleContent = commentContent.slice(0, MAX_VISIBLE_CHARS) + "...";
    }
  } else {
    visibleContent = commentContent;
  }

  const replyCount = comment.replies?.length ?? 0;

  // For reply-to-reply attribution: find the target reply and its display name
  const replyTarget =
    replyingToId === comment.id && replyingToReplyId
      ? (comment.replies?.find((r) => r.id === replyingToReplyId) ?? null)
      : null;
  const replyTargetName = replyTarget
    ? isRobloxContext
      ? userData[replyTarget.user_id]?.roblox_display_name ||
        userData[replyTarget.user_id]?.roblox_username ||
        userData[replyTarget.user_id]?.username ||
        replyTarget.author
      : userData[replyTarget.user_id]?.username || replyTarget.author
    : null;

  const replyForm =
    isLoggedIn && replyingToId === comment.id ? (
      <div className="border-border-card bg-tertiary-bg focus-within:border-button-info rounded-lg border transition-colors">
        {replyTargetName && (
          <div className="text-secondary-text flex items-center gap-1 px-3 pt-2.5 text-xs">
            <span>Replying to</span>
            <span className="text-primary-text font-medium">
              {replyTargetName}
            </span>
          </div>
        )}
        <CommentTextarea
          ref={replyTextareaRef}
          value={replyDraft}
          onChange={setReplyDraft}
          emojiMap={emojiStringMap}
          id={`reply-textarea-${comment.id}`}
          rows={2}
          disabled={isBlocked}
          className="text-primary-text placeholder-secondary-text w-full resize-none bg-transparent p-3 text-sm focus:outline-none disabled:opacity-60"
          placeholder="Write a reply..."
          autoCorrect="off"
          autoComplete="off"
          spellCheck="false"
          autoCapitalize="off"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setReplyingToId(null);
              setReplyingToReplyId(null);
              setReplyDraft("");
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (replyDraft.trim() && !isSubmittingComment && !isBlocked) {
                void handleSubmitReply(comment.id, replyDraft).then((ok) => {
                  if (ok) setReplyDraft("");
                });
              }
            }
          }}
        />
        <div className="border-border-card flex items-center justify-between gap-2 border-t px-3 py-2">
          <Popover open={replyEmojiOpen} onOpenChange={setReplyEmojiOpen}>
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-secondary-text hover:text-primary-text h-7 w-7 p-0"
                    disabled={isBlocked}
                    onPointerDown={() => {
                      replyCursorPosRef.current =
                        replyTextareaRef.current?.selectionStart ?? null;
                    }}
                  >
                    <Icon icon="heroicons:face-smile" className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Add an emoji</TooltipContent>
            </Tooltip>
            <PopoverContent
              align="start"
              side="bottom"
              sideOffset={8}
              className="w-72 p-0"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="grid max-h-56 grid-cols-8 gap-px overflow-y-auto p-1.5">
                {emojiEntries.map(([name, emoji]) => (
                  <Tooltip key={name} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => insertReplyEmoji(emoji, e.shiftKey)}
                        className="hover:bg-quaternary-bg flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-transparent text-lg transition-colors"
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
                    <TooltipContent>:{name}:</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-2 lg:hidden">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setReplyingToId(null);
                setReplyingToReplyId(null);
                setReplyDraft("");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!replyDraft.trim() || isSubmittingComment || isBlocked}
              onClick={() => {
                void handleSubmitReply(comment.id, replyDraft).then((ok) => {
                  if (ok) setReplyDraft("");
                });
              }}
            >
              {isSubmittingComment ? (
                <>
                  <Spinner className="h-3.5 w-3.5" />
                  Posting...
                </>
              ) : (
                <>
                  <Icon
                    icon="streamline-plump:mail-send-email-message-solid"
                    inline={true}
                  />
                  Reply
                </>
              )}
            </Button>
          </div>
          <div className="text-secondary-text hidden items-center gap-1.5 text-[11px] lg:flex">
            {isSubmittingComment ? (
              <>
                <Spinner className="h-3 w-3" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <span>Esc to </span>
                <button
                  type="button"
                  className="text-link cursor-pointer hover:underline"
                  onClick={() => {
                    setReplyingToId(null);
                    setReplyingToReplyId(null);
                    setReplyDraft("");
                  }}
                >
                  cancel
                </button>
                <span> • Enter to </span>
                <button
                  type="button"
                  className="text-link cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={
                    !replyDraft.trim() || isSubmittingComment || isBlocked
                  }
                  onClick={() => {
                    void handleSubmitReply(comment.id, replyDraft).then(
                      (ok) => {
                        if (ok) setReplyDraft("");
                      },
                    );
                  }}
                >
                  reply
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div
      id={`comment-${comment.id}`}
      key={comment.id}
      className="relative transition-all duration-200"
    >
      <div className="flex gap-2 sm:gap-3">
        <div className="flex w-10 shrink-0 items-start pt-1.5">
          {hideRecent ? (
            <div className="ring-tertiary-text/20 border-border-card bg-primary-bg flex h-10 w-10 items-center justify-center rounded-full border ring-2">
              <svg
                className="text-secondary-text h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          ) : (
            <div
              className={`${
                userData[comment.user_id]?.premiumtype === 3
                  ? "rounded-sm"
                  : "rounded-full"
              }`}
            >
              <UserAvatar
                userId={comment.user_id}
                avatarHash={userData[comment.user_id]?.avatar}
                username={displayName}
                forceAvatarUrl={robloxAvatarUrl}
                size={10}
                cdnSize={512}
                custom_avatar={userData[comment.user_id]?.custom_avatar}
                showBadge={false}
                settings={userData[comment.user_id]?.settings}
                premiumType={userData[comment.user_id]?.premiumtype}
              />
            </div>
          )}
        </div>

        {/*
           Content Area
           Right side of the comment containing author info, timestamp, and text.
        */}
        <div className="min-w-0 flex-1">
          {/* Header Section (Author, Badge, timestamp, and actions) */}
          <div className="flex items-start justify-between gap-2 pt-1.5 pb-1.5">
            <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-3">
              <div className="flex min-w-0 flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  {hideRecent ? (
                    <span className="text-primary-text text-sm font-semibold">
                      Hidden User
                    </span>
                  ) : (
                    <>
                      <CommentAuthorName
                        userId={comment.user_id}
                        name={displayName}
                        user={userData[comment.user_id]}
                        className="text-primary-text hover:text-link block max-w-30 truncate text-sm font-semibold transition-colors duration-200 sm:max-w-50 sm:text-base"
                      />

                      {userData[comment.user_id]?.premiumtype >= 1 &&
                        userData[comment.user_id]?.premiumtype <= 3 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Image
                                src={`https://assets.jailbreakchangelogs.com/assets/website_icons/jbcl_supporter_${userData[comment.user_id].premiumtype}.svg`}
                                alt={`Supporter Type ${userData[comment.user_id].premiumtype}`}
                                width={16}
                                height={16}
                                className="shrink-0 cursor-pointer"
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              Supporter Type{" "}
                              {userData[comment.user_id].premiumtype}
                            </TooltipContent>
                          </Tooltip>
                        )}

                      {/* OP badge for trade ad authors and value suggestion submitters */}
                      {type === "tradev2" &&
                        trade &&
                        comment.user_id === trade.author && (
                          <span className="from-button-info to-button-info-hover text-card-tag-text rounded-full bg-linear-to-r px-2 py-0.5 text-xs font-medium">
                            OP
                          </span>
                        )}
                      {type === "vsuggestion" &&
                        suggestion &&
                        comment.user_id === suggestion.suggester && (
                          <span className="from-button-info to-button-info-hover text-card-tag-text border-button-info/30 inline-flex items-center rounded-lg border bg-linear-to-r px-1.5 py-0.5 text-[10px] leading-none font-medium">
                            OP
                          </span>
                        )}
                      {type === "vsuggestion" &&
                        suggestion?.upvoterIds?.includes(comment.user_id) && (
                          <span className="text-button-success inline-flex items-center gap-0.5 text-[10px] leading-none font-medium">
                            <Icon
                              icon="material-symbols:thumb-up-rounded"
                              className="h-3 w-3"
                            />
                            <span className="hidden sm:inline">Upvoted</span>
                          </span>
                        )}
                      {type === "vsuggestion" &&
                        suggestion?.downvoterIds?.includes(comment.user_id) && (
                          <span className="text-button-danger inline-flex items-center gap-0.5 text-[10px] leading-none font-medium">
                            <Icon
                              icon="material-symbols:thumb-down-rounded"
                              className="h-3 w-3"
                            />
                            <span className="hidden sm:inline">Downvoted</span>
                          </span>
                        )}
                    </>
                  )}
                </div>

                <CommentTimestamp
                  date={comment.date}
                  editedAt={comment.edited_at}
                  commentId={comment.id}
                />
              </div>
            </div>

            {/* Action Menu Dropdown (Edit, Delete, Report) */}
            <div className="flex items-center gap-1">
              {isLoggedIn && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg h-8 w-8 rounded-lg p-0 opacity-100 transition-all duration-200"
                      onClick={() => {
                        if (replyingToId === comment.id) {
                          setReplyingToId(null);
                          setReplyingToReplyId(null);
                          setReplyDraft("");
                        } else {
                          setEditingCommentId(null);
                          setEditDraft("");
                          setReplyingToId(comment.id);
                          setReplyingToReplyId(null);
                          setReplyDraft("");
                        }
                      }}
                    >
                      <Icon
                        icon="heroicons-outline:chat-bubble-left-right"
                        className="h-4 w-4"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reply</TooltipContent>
                </Tooltip>
              )}
              {isLoggedIn && availableEmojis.length > 0 && (
                <Popover
                  open={reactionPickerHoverOpenId === comment.id}
                  onOpenChange={(open) => {
                    if (open && (isRateLimited || !!reactionBan)) return;
                    setReactionPickerHoverOpenId(open ? comment.id : null);
                  }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`text-secondary-text hover:text-primary-text hover:bg-quaternary-bg h-8 w-8 rounded-lg p-0 opacity-100 transition-all duration-200 ${isRateLimited || !!reactionBan ? "cursor-not-allowed" : ""}`}
                        >
                          <Icon
                            icon="fluent:emoji-add-16-regular"
                            className="h-4 w-4"
                          />
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Add a reaction</TooltipContent>
                  </Tooltip>
                  <PopoverContent className="w-auto p-2" align="end">
                    <div className="grid grid-cols-5 gap-1">
                      {availableEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            void handleReact(comment.id, emoji);
                            setReactionPickerHoverOpenId(null);
                          }}
                          className="hover:bg-quaternary-bg flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-lg transition-colors"
                        >
                          {twemojiEnabled ? (
                            <Twemoji
                              tag="span"
                              options={{ className: "twemoji" }}
                            >
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
              {isLoggedIn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary-text hover:bg-quaternary-bg h-8 w-8 rounded-lg p-0 opacity-100 transition-all duration-200"
                    >
                      <Icon
                        icon="heroicons:ellipsis-horizontal"
                        className="h-4 w-4"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    onCloseAutoFocus={(e) => {
                      if (editingCommentId !== null) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {comment.reactions && comment.reactions.length > 0 && (
                      <DropdownMenuItem
                        onClick={() => {
                          const sorted = getStableReactionOrder(
                            comment.id,
                            comment.reactions!,
                          );
                          setReactionBreakdownOpenId(comment.id);
                          setBreakdownTab(sorted[0]?.emoji ?? "all");
                        }}
                      >
                        <Icon
                          icon="heroicons-outline:face-smile"
                          className="mr-2 h-4 w-4"
                        />
                        View Reactions
                      </DropdownMenuItem>
                    )}
                    {isTester && (
                      <DropdownMenuItem
                        onClick={() => {
                          void navigator.clipboard
                            .writeText(String(comment.id))
                            .then(() => {
                              toast.success(`Comment ID ${comment.id} copied`);
                            });
                        }}
                      >
                        <Icon
                          icon="heroicons-outline:clipboard"
                          className="mr-2 h-4 w-4"
                        />
                        Copy Comment ID
                      </DropdownMenuItem>
                    )}
                    {currentUserId === comment.user_id ? (
                      <>
                        {/* Check if comment is still editable (within 1 hour) */}
                        {isCommentEditable(comment.date) && (
                          <DropdownMenuItem
                            onClick={() => handleEditClick(comment.id)}
                          >
                            <Icon
                              icon="heroicons-outline:pencil"
                              className="mr-2 h-4 w-4"
                            />
                            Edit Comment
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-button-danger focus:text-button-danger focus:bg-button-danger/10"
                        >
                          <Icon
                            icon="heroicons-outline:trash"
                            className="mr-2 h-4 w-4"
                          />
                          Delete Comment
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => handleReportClick(comment.id)}
                        className="text-button-danger hover:bg-button-danger/10 focus:bg-button-danger/10 focus:text-button-danger"
                      >
                        <Icon
                          icon="heroicons-outline:flag"
                          className="mr-2 h-4 w-4"
                        />
                        Report Comment
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="pb-2">
            {editingCommentId === comment.id ? (
              <div className="border-border-card bg-tertiary-bg focus-within:border-button-info -ml-12 rounded-lg border transition-colors sm:-ml-[3.25rem] lg:ml-0">
                <CommentTextarea
                  value={editDraft}
                  onChange={setEditDraft}
                  emojiMap={emojiStringMap}
                  disabled={updatingCommentId === comment.id}
                  id={`edit-textarea-${comment.id}`}
                  rows={3}
                  className="text-primary-text placeholder-secondary-text w-full resize-none bg-transparent p-3 text-sm focus:outline-none disabled:opacity-50"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck="false"
                  autoCapitalize="off"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setEditingCommentId(null);
                      setEditDraft("");
                    }
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (
                        editDraft.trim() &&
                        updatingCommentId !== comment.id
                      ) {
                        void handleEditComment(comment.id, editDraft).then(
                          (ok) => {
                            if (ok) setEditDraft("");
                          },
                        );
                      }
                    }
                  }}
                />
                <div className="border-border-card flex items-center justify-end gap-2 border-t px-3 py-2">
                  {/* Mobile: buttons */}
                  <div className="flex items-center gap-2 lg:hidden">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={updatingCommentId === comment.id}
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditDraft("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        void handleEditComment(comment.id, editDraft).then(
                          (ok) => {
                            if (ok) setEditDraft("");
                          },
                        );
                      }}
                      disabled={
                        !editDraft.trim() || updatingCommentId === comment.id
                      }
                    >
                      {updatingCommentId === comment.id ? (
                        <>
                          <Spinner className="h-3.5 w-3.5" />
                          Updating...
                        </>
                      ) : (
                        "Update"
                      )}
                    </Button>
                  </div>
                  {/* Desktop: keyboard hints */}
                  <div className="text-secondary-text hidden items-center gap-1.5 text-[11px] lg:flex">
                    {updatingCommentId === comment.id ? (
                      <>
                        <Spinner className="h-3 w-3" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <span>Esc to </span>
                        <button
                          type="button"
                          className="text-link cursor-pointer hover:underline"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditDraft("");
                          }}
                        >
                          cancel
                        </button>
                        <span> • Enter to </span>
                        <button
                          type="button"
                          className="text-link cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={
                            !editDraft.trim() ||
                            updatingCommentId === comment.id
                          }
                          onClick={() => {
                            void handleEditComment(comment.id, editDraft).then(
                              (ok) => {
                                if (ok) setEditDraft("");
                              },
                            );
                          }}
                        >
                          save
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <>
                  {false && (
                    <div className="hidden">
                      <span></span>
                    </div>
                  )}
                  <div className="prose prose-sm max-w-none">
                    {isClient ? (
                      twemojiEnabled ? (
                        <Twemoji options={{ className: "twemoji" }}>
                          <p
                            className="text-primary-text text-sm leading-relaxed wrap-break-word whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{
                              __html: convertUrlsToLinksHTML(
                                processMentions(sanitizeHTML(visibleContent)),
                              ),
                            }}
                          />
                        </Twemoji>
                      ) : (
                        <p
                          className="text-primary-text text-sm leading-relaxed wrap-break-word whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{
                            __html: convertUrlsToLinksHTML(
                              processMentions(sanitizeHTML(visibleContent)),
                            ),
                          }}
                        />
                      )
                    ) : (
                      <p className="text-primary-text text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
                        {visibleContent}
                      </p>
                    )}

                    {shouldTruncate && (
                      <Button
                        variant="link"
                        onClick={() => toggleCommentExpand(comment.id)}
                        className="mt-2 h-auto p-0 font-medium"
                      >
                        {isExpanded ? (
                          <>
                            <Icon
                              icon="mdi:chevron-up"
                              className="h-4 w-4"
                              inline={true}
                            />
                            Show less
                          </>
                        ) : (
                          <>
                            <Icon
                              icon="mdi:chevron-down"
                              className="h-4 w-4"
                              inline={true}
                            />
                            Read more
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </>
              </div>
            )}
          </div>

          {/* Reactions */}
          <CommentReactions
            commentId={comment.id}
            reactions={comment.reactions}
            isRobloxContext={isRobloxContext}
          />
        </div>
      </div>

      <div className="ml-12 sm:ml-[3.25rem]">
        {replyCount > 0 && comment.replies && (
          <>
            <div className="border-border-card mt-3 space-y-3 border-l-2 pl-3 sm:pl-4">
              {(expandedReplies.has(comment.id)
                ? comment.replies
                : comment.replies.slice(0, 1)
              ).map((reply) => {
                const replyUser = userData[reply.user_id];
                const isUnknownReplyUser = !reply.user_id;
                const replyHideRecent =
                  !isUnknownReplyUser &&
                  (!replyUser?.settings?.show_recent_comments ||
                    !replyUser?.settings?.profile_public) &&
                  currentUserId !== reply.user_id;
                const replyDisplayName = isUnknownReplyUser
                  ? "Unknown User"
                  : isRobloxContext
                    ? replyUser?.roblox_display_name ||
                      replyUser?.roblox_username ||
                      replyUser?.username ||
                      reply.author ||
                      "Unknown User"
                    : replyUser?.username || reply.author || "Unknown User";
                const replyRobloxAvatarUrl =
                  isRobloxContext && replyUser?.roblox_avatar
                    ? replyUser.roblox_avatar
                    : undefined;

                const replyToTargetId = reply.reply_to_id ?? null;
                const replyToTarget = replyToTargetId
                  ? (comment.replies?.find((r) => r.id === replyToTargetId) ??
                    null)
                  : null;
                const replyToTargetName = replyToTarget
                  ? isRobloxContext
                    ? userData[replyToTarget.user_id]?.roblox_display_name ||
                      userData[replyToTarget.user_id]?.roblox_username ||
                      userData[replyToTarget.user_id]?.username ||
                      replyToTarget.author
                    : userData[replyToTarget.user_id]?.username ||
                      replyToTarget.author
                  : null;

                return (
                  <React.Fragment key={reply.id}>
                    <div
                      id={`comment-${reply.id}`}
                      className="flex gap-2 sm:gap-3"
                    >
                      {/* Reply avatar */}
                      <div className="flex w-8 shrink-0 items-start pt-1">
                        {replyHideRecent ? (
                          <div className="ring-tertiary-text/20 border-border-card bg-primary-bg flex h-8 w-8 items-center justify-center rounded-full border ring-1">
                            <svg
                              className="text-secondary-text h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                          </div>
                        ) : (
                          <div
                            className={
                              replyUser?.premiumtype === 3
                                ? "rounded-sm"
                                : "rounded-full"
                            }
                          >
                            <UserAvatar
                              userId={reply.user_id}
                              avatarHash={replyUser?.avatar ?? null}
                              username={replyDisplayName}
                              forceAvatarUrl={replyRobloxAvatarUrl}
                              size={8}
                              cdnSize={256}
                              custom_avatar={replyUser?.custom_avatar}
                              showBadge={false}
                              settings={replyUser?.settings}
                              premiumType={replyUser?.premiumtype}
                            />
                          </div>
                        )}
                      </div>

                      {/* Reply content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2 pb-1">
                          <div className="flex min-w-0 flex-col">
                            {replyHideRecent ? (
                              <span className="text-primary-text text-sm font-semibold">
                                Hidden User
                              </span>
                            ) : (
                              <>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <div className="flex items-center gap-1">
                                    <CommentAuthorName
                                      userId={reply.user_id}
                                      name={replyDisplayName}
                                      user={replyUser}
                                      className="text-primary-text hover:text-link max-w-30 truncate text-sm font-semibold transition-colors sm:max-w-50"
                                    />
                                    {replyToTargetName && replyToTarget && (
                                      <>
                                        <Icon
                                          icon="material-symbols:arrow-right"
                                          className="text-secondary-text h-4 w-4 shrink-0"
                                        />
                                        <CommentAuthorName
                                          userId={replyToTarget.user_id}
                                          name={replyToTargetName}
                                          user={userData[replyToTarget.user_id]}
                                          className="text-secondary-text hover:text-link max-w-30 truncate text-sm font-semibold transition-colors sm:max-w-50"
                                        />
                                      </>
                                    )}
                                  </div>
                                  {type === "vsuggestion" &&
                                    suggestion?.upvoterIds?.includes(
                                      reply.user_id,
                                    ) && (
                                      <span className="text-button-success inline-flex items-center gap-0.5 text-[10px] leading-none font-medium">
                                        <Icon
                                          icon="material-symbols:thumb-up-rounded"
                                          className="h-3 w-3"
                                        />
                                        <span className="hidden sm:inline">
                                          Upvoted
                                        </span>
                                      </span>
                                    )}
                                  {type === "vsuggestion" &&
                                    suggestion?.downvoterIds?.includes(
                                      reply.user_id,
                                    ) && (
                                      <span className="text-button-danger inline-flex items-center gap-0.5 text-[10px] leading-none font-medium">
                                        <Icon
                                          icon="material-symbols:thumb-down-rounded"
                                          className="h-3 w-3"
                                        />
                                        <span className="hidden sm:inline">
                                          Downvoted
                                        </span>
                                      </span>
                                    )}
                                </div>
                                <CommentTimestamp
                                  date={reply.date}
                                  editedAt={reply.edited_at}
                                  commentId={reply.id}
                                />
                              </>
                            )}
                          </div>

                          {/* Reply action menu */}
                          {isLoggedIn && (
                            <div className="flex items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg h-7 w-7 rounded-lg p-0 opacity-100 transition-all duration-200"
                                    onClick={() => {
                                      if (
                                        replyingToId === comment.id &&
                                        replyingToReplyId === reply.id
                                      ) {
                                        setReplyingToId(null);
                                        setReplyingToReplyId(null);
                                        setReplyDraft("");
                                      } else {
                                        setEditingCommentId(null);
                                        setEditDraft("");
                                        setReplyingToId(comment.id);
                                        setReplyingToReplyId(reply.id);
                                        setReplyDraft("");
                                      }
                                    }}
                                  >
                                    <Icon
                                      icon="heroicons-outline:chat-bubble-left-right"
                                      className="h-3.5 w-3.5"
                                    />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Reply</TooltipContent>
                              </Tooltip>
                              {availableEmojis.length > 0 && (
                                <Popover
                                  open={reactionPickerHoverOpenId === reply.id}
                                  onOpenChange={(open) => {
                                    if (
                                      open &&
                                      (isRateLimited || !!reactionBan)
                                    )
                                      return;
                                    setReactionPickerHoverOpenId(
                                      open ? reply.id : null,
                                    );
                                  }}
                                >
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className={`text-secondary-text hover:text-primary-text hover:bg-quaternary-bg h-7 w-7 rounded-lg p-0 opacity-100 transition-all duration-200 ${isRateLimited || !!reactionBan ? "cursor-not-allowed" : ""}`}
                                        >
                                          <Icon
                                            icon="fluent:emoji-add-16-regular"
                                            className="h-3.5 w-3.5"
                                          />
                                        </Button>
                                      </PopoverTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Add a reaction
                                    </TooltipContent>
                                  </Tooltip>
                                  <PopoverContent
                                    className="w-auto p-2"
                                    align="end"
                                  >
                                    <div className="grid grid-cols-5 gap-1">
                                      {availableEmojis.map((emoji) => (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={() => {
                                            void handleReact(reply.id, emoji);
                                            setReactionPickerHoverOpenId(null);
                                          }}
                                          className="hover:bg-quaternary-bg flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-lg transition-colors"
                                        >
                                          {twemojiEnabled ? (
                                            <Twemoji
                                              tag="span"
                                              options={{ className: "twemoji" }}
                                            >
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
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary-text hover:bg-quaternary-bg h-7 w-7 rounded-lg p-0 opacity-100 transition-all duration-200"
                                  >
                                    <Icon
                                      icon="heroicons:ellipsis-horizontal"
                                      className="h-4 w-4"
                                    />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {reply.reactions &&
                                    reply.reactions.length > 0 && (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          const sorted = getStableReactionOrder(
                                            reply.id,
                                            reply.reactions!,
                                          );
                                          setReactionBreakdownOpenId(reply.id);
                                          setBreakdownTab(
                                            sorted[0]?.emoji ?? "all",
                                          );
                                        }}
                                      >
                                        <Icon
                                          icon="heroicons-outline:face-smile"
                                          className="mr-2 h-4 w-4"
                                        />
                                        View Reactions
                                      </DropdownMenuItem>
                                    )}
                                  {isTester && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        void navigator.clipboard
                                          .writeText(String(reply.id))
                                          .then(() => {
                                            toast.success(
                                              `Comment ID ${reply.id} copied`,
                                            );
                                          });
                                      }}
                                    >
                                      <Icon
                                        icon="heroicons-outline:clipboard"
                                        className="mr-2 h-4 w-4"
                                      />
                                      Copy Comment ID
                                    </DropdownMenuItem>
                                  )}
                                  {currentUserId === reply.user_id ? (
                                    <>
                                      {isCommentEditable(reply.date) && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleEditClick(reply.id)
                                          }
                                        >
                                          <Icon
                                            icon="heroicons-outline:pencil"
                                            className="mr-2 h-4 w-4"
                                          />
                                          Edit
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleDeleteComment(reply.id)
                                        }
                                        className="text-button-danger focus:text-button-danger focus:bg-button-danger/10"
                                      >
                                        <Icon
                                          icon="heroicons-outline:trash"
                                          className="mr-2 h-4 w-4"
                                        />
                                        Delete
                                      </DropdownMenuItem>
                                    </>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleReportClick(reply.id)
                                      }
                                      className="text-button-danger hover:bg-button-danger/10 focus:bg-button-danger/10 focus:text-button-danger"
                                    >
                                      <Icon
                                        icon="heroicons-outline:flag"
                                        className="mr-2 h-4 w-4"
                                      />
                                      Report Comment
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>

                        {/* Reply body or edit form */}
                        {editingCommentId === reply.id ? (
                          <div className="border-border-card bg-form-input focus-within:border-button-info rounded-lg border transition-colors">
                            <CommentTextarea
                              value={editDraft}
                              onChange={setEditDraft}
                              emojiMap={emojiStringMap}
                              disabled={updatingCommentId === reply.id}
                              id={`edit-textarea-${reply.id}`}
                              rows={3}
                              className="text-primary-text placeholder-secondary-text w-full resize-none bg-transparent p-3 text-sm focus:outline-none disabled:opacity-50"
                              autoCorrect="off"
                              autoComplete="off"
                              spellCheck="false"
                              autoCapitalize="off"
                              onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                  setEditingCommentId(null);
                                  setEditDraft("");
                                }
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  if (
                                    editDraft.trim() &&
                                    updatingCommentId !== reply.id
                                  )
                                    void handleEditComment(
                                      reply.id,
                                      editDraft,
                                    ).then((ok) => {
                                      if (ok) setEditDraft("");
                                    });
                                }
                              }}
                            />
                            <div className="border-border-card flex items-center justify-end gap-2 border-t px-3 py-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={updatingCommentId === reply.id}
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditDraft("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  void handleEditComment(
                                    reply.id,
                                    editDraft,
                                  ).then((ok) => {
                                    if (ok) setEditDraft("");
                                  });
                                }}
                                disabled={
                                  !editDraft.trim() ||
                                  updatingCommentId === reply.id
                                }
                              >
                                {updatingCommentId === reply.id ? (
                                  <>
                                    <Spinner className="h-3.5 w-3.5" />{" "}
                                    Updating...
                                  </>
                                ) : (
                                  "Update"
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : isClient ? (
                          twemojiEnabled ? (
                            <Twemoji options={{ className: "twemoji" }}>
                              <p
                                className="text-primary-text text-sm leading-relaxed wrap-break-word whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{
                                  __html: convertUrlsToLinksHTML(
                                    processMentions(
                                      sanitizeHTML(
                                        sanitizeText(reply.content || ""),
                                      ),
                                    ),
                                  ),
                                }}
                              />
                            </Twemoji>
                          ) : (
                            <p
                              className="text-primary-text text-sm leading-relaxed wrap-break-word whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{
                                __html: convertUrlsToLinksHTML(
                                  processMentions(
                                    sanitizeHTML(
                                      sanitizeText(reply.content || ""),
                                    ),
                                  ),
                                ),
                              }}
                            />
                          )
                        ) : (
                          <p className="text-primary-text text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
                            {sanitizeText(reply.content || "")}
                          </p>
                        )}

                        {/* Reply Reactions */}
                        <CommentReactions
                          commentId={reply.id}
                          reactions={reply.reactions}
                          isRobloxContext={isRobloxContext}
                          compact
                        />
                      </div>
                    </div>
                    {replyingToReplyId === reply.id && replyForm}
                  </React.Fragment>
                );
              })}
            </div>

            {replyCount > 1 && (
              <button
                type="button"
                className="text-link hover:text-link-hover mt-2 flex cursor-pointer items-center gap-1 text-xs font-medium transition-colors"
                onClick={() => toggleReplies(comment.id)}
              >
                <Icon
                  icon={
                    expandedReplies.has(comment.id)
                      ? "heroicons:chevron-up"
                      : "heroicons:chevron-down"
                  }
                  className="h-3.5 w-3.5"
                  inline={true}
                />
                {expandedReplies.has(comment.id)
                  ? "Hide replies"
                  : `View ${replyCount - 1} more ${replyCount - 1 === 1 ? "reply" : "replies"}`}
              </button>
            )}
          </>
        )}

        {/* Reply form for root-level replies (no specific reply targeted) */}
        {replyingToReplyId === null && replyForm && (
          <div className="mt-3">{replyForm}</div>
        )}
      </div>
    </div>
  );
}

export const CommentItem = React.memo(CommentItemInner);
