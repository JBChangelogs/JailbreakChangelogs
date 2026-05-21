"use client";

import React from "react";
import { CommentData } from "@/utils/api/api";
import { Icon } from "../ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
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
import { UserBadges } from "@/components/Profile/UserBadges";
import { UserDetailsTooltip } from "@/components/ui/UserDetailsTooltip";
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

export function CommentItem({ comment }: { comment: CommentData }) {
  const {
    userData,
    currentUserId,
    isLoggedIn,
    isClient,
    type,
    trade,
    editingCommentId,
    setEditingCommentId,
    editContent,
    setEditContent,
    updatingCommentId,
    replyingToId,
    setReplyingToId,
    replyContent,
    setReplyContent,
    expandedComments,
    expandedReplies,
    isSubmittingComment,
    isBlocked,
    isRateLimited,
    availableEmojis,
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
  } = useCommentsContext();

  const commentAuthorSettings = userData[comment.user_id]?.settings;

  // For trade/inventory contexts, prefer Roblox identity
  const isRobloxContext = type === "tradev2" || type === "inventory";
  const robloxAvatarUrl =
    isRobloxContext && userData[comment.user_id]?.roblox_avatar
      ? userData[comment.user_id].roblox_avatar
      : undefined;
  const displayName = isRobloxContext
    ? userData[comment.user_id]?.roblox_display_name ||
      userData[comment.user_id]?.roblox_username ||
      userData[comment.user_id]?.username ||
      comment.author
    : userData[comment.user_id]?.username || comment.author;

  // Hide identity if show_recent_comments or profile_public is falsy
  // and the viewer is not the comment author
  const hideRecent =
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

  return (
    <div
      id={`comment-${comment.id}`}
      key={comment.id}
      className="group relative py-2 transition-all duration-200"
    >
      <div className="flex gap-2 sm:gap-3">
        {/*
           Avatar Gutter
           Left side of the comment containing the user's avatar.
        */}
        <div className="flex w-10 shrink-0 items-start pt-1.5">
          {hideRecent ? (
            <div className="ring-tertiary-text/20 border-border-card bg-primary-bg flex h-10 w-10 items-center justify-center rounded-full border ring-2">
              {/* Lock icon for hidden users */}
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
                      {/* Author Name and Hover Profile Tooltip */}
                      <div className="flex min-w-0 items-center gap-2">
                        <Tooltip delayDuration={500}>
                          <TooltipTrigger asChild>
                            <Link
                              href={`/users/${comment.user_id}`}
                              prefetch={false}
                              className="text-primary-text hover:text-link block max-w-30 truncate text-sm font-semibold transition-colors duration-200 sm:max-w-50 sm:text-base"
                            >
                              {displayName}
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm min-w-75 p-0">
                            {userData[comment.user_id] && (
                              <UserDetailsTooltip
                                user={userData[comment.user_id]}
                              />
                            )}
                          </TooltipContent>
                        </Tooltip>

                        {userData[comment.user_id] && (
                          <UserBadges
                            usernumber={userData[comment.user_id].usernumber}
                            premiumType={userData[comment.user_id].premiumtype}
                            flags={[]}
                            primary_guild={undefined}
                            size="sm"
                            customBgClass="bg-primary-bg/50"
                            noContainer={true}
                          />
                        )}
                      </div>

                      {/* Special OP badge for trade ad authors */}
                      {type === "tradev2" &&
                        trade &&
                        comment.user_id === trade.author && (
                          <span className="from-button-info to-button-info-hover text-card-tag-text rounded-full bg-linear-to-r px-2 py-0.5 text-xs font-medium">
                            OP
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
                      className={`text-secondary-text hover:text-primary-text hover:bg-quaternary-bg h-8 w-8 rounded-lg p-0 opacity-100 transition-all duration-200 ${reactionPickerHoverOpenId === comment.id ? "lg:opacity-100" : "lg:opacity-0 lg:group-hover:opacity-100"}`}
                      onClick={() => {
                        if (replyingToId === comment.id) {
                          setReplyingToId(null);
                          setReplyContent("");
                        } else {
                          setEditingCommentId(null);
                          setEditContent("");
                          setReplyingToId(comment.id);
                          setReplyContent("");
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
                    if (open && isRateLimited) return;
                    setReactionPickerHoverOpenId(open ? comment.id : null);
                  }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`text-secondary-text hover:text-primary-text hover:bg-quaternary-bg h-8 w-8 rounded-lg p-0 opacity-100 transition-all duration-200 ${reactionPickerHoverOpenId === comment.id ? "lg:opacity-100" : "lg:opacity-0 lg:group-hover:opacity-100"} ${isRateLimited ? "cursor-not-allowed" : ""}`}
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
                          {emoji}
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
                      className={`text-primary-text hover:bg-quaternary-bg h-8 w-8 rounded-lg p-0 opacity-100 transition-all duration-200 data-[state=open]:opacity-100 ${reactionPickerHoverOpenId === comment.id ? "lg:opacity-100" : "lg:opacity-0 lg:group-hover:opacity-100"}`}
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
              <div className="border-border-card bg-tertiary-bg focus-within:border-button-info -ml-12 overflow-hidden rounded-lg border transition-colors sm:-ml-[3.25rem] lg:ml-0">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
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
                      setEditContent("");
                    }
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (
                        editContent.trim() &&
                        updatingCommentId !== comment.id
                      ) {
                        void handleEditComment(comment.id);
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
                        setEditContent("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleEditComment(comment.id)}
                      disabled={
                        !editContent.trim() || updatingCommentId === comment.id
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
                            setEditContent("");
                          }}
                        >
                          cancel
                        </button>
                        <span> • Enter to </span>
                        <button
                          type="button"
                          className="text-link cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={
                            !editContent.trim() ||
                            updatingCommentId === comment.id
                          }
                          onClick={() => void handleEditComment(comment.id)}
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
                      <p
                        className="text-primary-text text-sm leading-relaxed wrap-break-word whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: convertUrlsToLinksHTML(
                            processMentions(sanitizeHTML(visibleContent)),
                          ),
                        }}
                      />
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

          {/* Inline Reply Form */}
          {isLoggedIn && replyingToId === comment.id && (
            <div className="border-border-card bg-tertiary-bg focus-within:border-button-info mt-3 -ml-12 overflow-hidden rounded-lg border transition-colors sm:-ml-[3.25rem] lg:ml-0">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
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
                    setReplyContent("");
                  }
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (
                      replyContent.trim() &&
                      !isSubmittingComment &&
                      !isBlocked
                    ) {
                      void handleSubmitReply(comment.id);
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
                    onClick={() => {
                      setReplyingToId(null);
                      setReplyContent("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={
                      !replyContent.trim() || isSubmittingComment || isBlocked
                    }
                    onClick={() => handleSubmitReply(comment.id)}
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
                {/* Desktop: keyboard hints */}
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
                          setReplyContent("");
                        }}
                      >
                        cancel
                      </button>
                      <span> • Enter to </span>
                      <button
                        type="button"
                        className="text-link cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={
                          !replyContent.trim() ||
                          isSubmittingComment ||
                          isBlocked
                        }
                        onClick={() => void handleSubmitReply(comment.id)}
                      >
                        reply
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reddit-style replies */}
          {replyCount > 0 && (
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
                : `${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
            </button>
          )}

          {expandedReplies.has(comment.id) &&
            comment.replies &&
            comment.replies.length > 0 && (
              <div className="border-border-card mt-3 space-y-3 border-l-2 pl-3 sm:pl-4">
                {comment.replies.map((reply) => {
                  const replyUser = userData[reply.user_id];
                  const replyHideRecent =
                    (!replyUser?.settings?.show_recent_comments ||
                      !replyUser?.settings?.profile_public) &&
                    currentUserId !== reply.user_id;
                  const replyDisplayName = isRobloxContext
                    ? replyUser?.roblox_display_name ||
                      replyUser?.roblox_username ||
                      replyUser?.username ||
                      reply.author
                    : replyUser?.username || reply.author;
                  const replyRobloxAvatarUrl =
                    isRobloxContext && replyUser?.roblox_avatar
                      ? replyUser.roblox_avatar
                      : undefined;

                  return (
                    <div
                      id={`comment-${reply.id}`}
                      key={reply.id}
                      className="group flex gap-2 sm:gap-3"
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
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Link
                                  href={`/users/${reply.user_id}`}
                                  prefetch={false}
                                  className="text-primary-text hover:text-link max-w-30 truncate text-sm font-semibold transition-colors sm:max-w-50"
                                >
                                  {replyDisplayName}
                                </Link>
                                {replyUser && (
                                  <UserBadges
                                    usernumber={replyUser.usernumber}
                                    premiumType={replyUser.premiumtype}
                                    flags={[]}
                                    primary_guild={undefined}
                                    size="sm"
                                    customBgClass="bg-primary-bg/50"
                                    noContainer={true}
                                  />
                                )}
                              </div>
                            )}
                            <CommentTimestamp
                              date={reply.date}
                              editedAt={reply.edited_at}
                              commentId={reply.id}
                            />
                          </div>

                          {/* Reply action menu */}
                          {isLoggedIn && (
                            <div className="flex items-center gap-1">
                              {availableEmojis.length > 0 && (
                                <Popover
                                  open={reactionPickerHoverOpenId === reply.id}
                                  onOpenChange={(open) => {
                                    if (open && isRateLimited) return;
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
                                          className={`text-secondary-text hover:text-primary-text hover:bg-quaternary-bg h-7 w-7 rounded-lg p-0 opacity-100 transition-all duration-200 ${reactionPickerHoverOpenId === reply.id ? "lg:opacity-100" : "lg:opacity-0 lg:group-hover:opacity-100"} ${isRateLimited ? "cursor-not-allowed" : ""}`}
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
                                          {emoji}
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
                                    className={`text-primary-text hover:bg-quaternary-bg h-7 w-7 rounded-lg p-0 opacity-100 transition-all duration-200 data-[state=open]:opacity-100 ${reactionPickerHoverOpenId === reply.id ? "lg:opacity-100" : "lg:opacity-0 lg:group-hover:opacity-100"}`}
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
                                    >
                                      <Icon
                                        icon="heroicons-outline:flag"
                                        className="mr-2 h-4 w-4"
                                      />
                                      Report
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>

                        {/* Reply body or edit form */}
                        {editingCommentId === reply.id ? (
                          <div className="border-border-card bg-form-input focus-within:border-button-info overflow-hidden rounded-lg border transition-colors">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
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
                                  setEditContent("");
                                }
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  if (
                                    editContent.trim() &&
                                    updatingCommentId !== reply.id
                                  )
                                    void handleEditComment(reply.id);
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
                                  setEditContent("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleEditComment(reply.id)}
                                disabled={
                                  !editContent.trim() ||
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
                        ) : (
                          <p
                            className="text-primary-text text-sm leading-relaxed wrap-break-word whitespace-pre-wrap"
                            dangerouslySetInnerHTML={
                              isClient
                                ? {
                                    __html: convertUrlsToLinksHTML(
                                      processMentions(
                                        sanitizeHTML(
                                          sanitizeText(reply.content || ""),
                                        ),
                                      ),
                                    ),
                                  }
                                : undefined
                            }
                          >
                            {!isClient
                              ? sanitizeText(reply.content || "")
                              : undefined}
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
                  );
                })}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
