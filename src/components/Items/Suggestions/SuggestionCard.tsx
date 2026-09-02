"use client";

import type { MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/utils/ui/avatar";
import { formatMessageDate } from "@/utils/helpers/timestamp";
import {
  getItemImagePath,
  getVideoPath,
  handleImageError,
  isVideoItem,
} from "@/utils/ui/images";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { formatFullValue } from "@/utils/trading/values";
import {
  badgeBase,
  fieldLabel,
  statusColors,
  stripHtml,
} from "@/components/Items/Suggestions/shared";
import type { Suggestion } from "@/components/Items/Suggestions/types";
import { VoteRateLimitBanner } from "@/components/Items/Suggestions/VoteRateLimitBanner";

interface SuggestionCardProps {
  suggestion: Suggestion;
  userId?: string;
  isVoting: boolean;
  votingType?: "upvote" | "downvote";
  voteRateLimitUntil?: number;
  canEdit: boolean;
  onVote: (type: "upvote" | "downvote", event: MouseEvent) => void;
  onOpenVoters: (tab: "up" | "down", event: MouseEvent) => void;
  onOpenEdit: (event: MouseEvent) => void;
}

export function SuggestionCard({
  suggestion,
  userId,
  isVoting,
  votingType,
  voteRateLimitUntil,
  canEdit,
  onVote,
  onOpenVoters,
  onOpenEdit,
}: SuggestionCardProps) {
  const item = suggestion.item;
  const categoryIcon = item ? getCategoryIcon(item.type) : null;

  return (
    <div
      key={suggestion.id}
      className="border-border-card bg-secondary-bg group hover:border-border-card/80 relative flex flex-col overflow-hidden rounded-xl border transition-colors"
    >
      {/* Full-card link overlay — sits behind all interactive children */}
      <Link
        href={`/items/suggestions/${suggestion.id}`}
        prefetch={false}
        className="absolute inset-0 z-0"
        aria-label={`View suggestion #${suggestion.id}`}
      />

      {/* Image */}
      <Link
        href={`/items/suggestions/${suggestion.id}`}
        prefetch={false}
        className="bg-tertiary-bg relative block w-full overflow-hidden"
        style={{ aspectRatio: "16/9" }}
        tabIndex={-1}
        aria-hidden="true"
      >
        {item && isVideoItem(item.name) ? (
          <video
            src={getVideoPath(item.type, item.name)}
            className="h-full w-full object-cover"
            muted
            loop
          />
        ) : (
          <Image
            src={
              item
                ? getItemImagePath(item.type, item.name, true)
                : "/placeholder.png"
            }
            alt={item?.name ?? `Item #${suggestion.item_id}`}
            fill
            className="object-cover"
            onError={handleImageError}
          />
        )}
      </Link>

      {/* Votes */}
      {(() => {
        const userUpvoted = suggestion.votes.upvotes.some(
          (v) => v.user.id === userId,
        );
        const userDownvoted = suggestion.votes.downvotes.some(
          (v) => v.user.id === userId,
        );
        const cardVotingType = votingType;
        const hasVoters =
          suggestion.votes.upvotes.length > 0 ||
          suggestion.votes.downvotes.length > 0;
        return (
          <div className="border-border-card relative z-10 flex flex-col border-t">
            <div className="flex items-stretch">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(event) => onVote("upvote", event)}
                    disabled={isVoting}
                    className="bg-button-success/10 hover:bg-button-success/20 flex flex-1 cursor-pointer items-center justify-center gap-1.5 py-2.5 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cardVotingType === "upvote" ? (
                      <Spinner className="text-button-success h-4 w-4" />
                    ) : (
                      <Icon
                        icon={
                          userUpvoted
                            ? "material-symbols:thumb-up-rounded"
                            : "material-symbols:thumb-up-outline-rounded"
                        }
                        className="text-button-success h-4 w-4"
                        inline
                      />
                    )}
                    <span className="text-button-success font-bold">
                      {suggestion.upvotes}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {userUpvoted ? "Remove upvote" : "Upvote"}
                </TooltipContent>
              </Tooltip>
              <div className="border-border-card border-l" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(event) => onVote("downvote", event)}
                    disabled={isVoting}
                    className="bg-button-danger/10 hover:bg-button-danger/20 flex flex-1 cursor-pointer items-center justify-center gap-1.5 py-2.5 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cardVotingType === "downvote" ? (
                      <Spinner className="text-button-danger h-4 w-4" />
                    ) : (
                      <Icon
                        icon={
                          userDownvoted
                            ? "material-symbols:thumb-down-rounded"
                            : "material-symbols:thumb-down-outline-rounded"
                        }
                        className="text-button-danger h-4 w-4"
                        inline
                      />
                    )}
                    <span className="text-button-danger font-bold">
                      {suggestion.downvotes}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {userDownvoted ? "Remove downvote" : "Downvote"}
                </TooltipContent>
              </Tooltip>
            </div>
            {voteRateLimitUntil !== undefined && (
              <VoteRateLimitBanner until={voteRateLimitUntil!} />
            )}
            {hasVoters && (
              <button
                type="button"
                onClick={(event) => onOpenVoters("up", event)}
                className="border-border-card bg-tertiary-bg text-secondary-text hover:bg-quaternary-bg hover:text-primary-text flex w-full cursor-pointer items-center justify-center gap-1.5 border-t py-1.5 text-xs transition-colors focus:outline-none"
              >
                <Icon
                  icon="material-symbols:group-outline-rounded"
                  className="h-3.5 w-3.5"
                  inline
                />
                View voters
              </button>
            )}
          </div>
        );
      })()}

      {/* Card content */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        {/* Item name + badges */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="relative z-10 min-w-0">
            <div className="mb-0.5 flex items-center gap-1.5">
              <p className="text-secondary-text text-xs font-medium">
                #{suggestion.id}
              </p>
              {suggestion.is_vt === 1 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Image
                      src="https://assets.jailbreakchangelogs.com/assets/website_icons/jbcl_vt.svg"
                      alt="Value Team"
                      width={20}
                      height={20}
                      className="shrink-0"
                    />
                  </TooltipTrigger>
                  <TooltipContent>Value Team Suggestion</TooltipContent>
                </Tooltip>
              )}
            </div>
            {item ? (
              <Link
                href={`/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}?tab=suggestions`}
                prefetch={false}
                className="text-primary-text hover:text-link text-base font-bold wrap-break-word whitespace-normal transition-colors"
              >
                {item.name}
              </Link>
            ) : (
              <span className="text-primary-text text-base font-bold">
                Item #{suggestion.item_id}
              </span>
            )}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {item && (
                <span
                  className={`${badgeBase} bg-tertiary-bg/40 text-primary-text`}
                  style={{
                    borderColor: getCategoryColor(item.type),
                    backgroundColor: `${getCategoryColor(item.type)}22`,
                  }}
                >
                  {categoryIcon && (
                    <categoryIcon.Icon
                      className="mr-1.5 h-3 w-3"
                      style={{
                        color: getCategoryColor(item.type),
                      }}
                    />
                  )}
                  {item.type}
                </span>
              )}
              <span
                className={`${badgeBase} border-border-card bg-tertiary-bg text-primary-text`}
              >
                {fieldLabel(suggestion.field)}
              </span>
              <span
                className={`${badgeBase} capitalize ${
                  statusColors[suggestion.status] ??
                  "border-border-card bg-tertiary-bg/40 text-secondary-text"
                }`}
              >
                {suggestion.status}
              </span>
            </div>
          </div>
          <Icon
            icon="material-symbols:arrow-forward-rounded"
            className="text-tertiary-text group-hover:text-link relative z-10 mt-0.5 h-4 w-4 shrink-0 transition-colors"
            inline
          />
        </div>

        {/* Value comparison */}
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0 px-3 pt-3">
            <div className="text-button-danger mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
              <Icon icon="mdi:minus-circle" className="h-3.5 w-3.5" inline />
              {`Old ${fieldLabel(suggestion.field).toUpperCase()}`}
            </div>
            <div
              className="text-secondary-text line-clamp-2 text-lg font-bold line-through"
              style={{
                wordBreak: "normal",
                overflowWrap: "anywhere",
              }}
            >
              {formatFullValue(stripHtml(suggestion.current_value || "N/A"))}
            </div>
          </div>
          <div className="min-w-0 px-3 pt-3">
            <div className="text-button-success mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
              <Icon icon="mdi:plus-circle" className="h-3.5 w-3.5" inline />
              {`New ${fieldLabel(suggestion.field).toUpperCase()}`}
            </div>
            <div
              className="text-primary-text line-clamp-2 text-lg font-bold"
              style={{
                wordBreak: "normal",
                overflowWrap: "anywhere",
              }}
            >
              {formatFullValue(stripHtml(suggestion.suggested_value))}
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="text-secondary-text line-clamp-4 text-sm leading-relaxed break-words">
          {suggestion.reason?.trim() ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-primary-text text-sm font-bold">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-primary-text text-sm font-bold">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-primary-text text-sm font-semibold">
                    {children}
                  </h3>
                ),
                p: ({ children }) => <p>{children}</p>,
                ul: ({ children }) => (
                  <ul className="list-inside list-disc">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-inside list-decimal">{children}</ol>
                ),
                em: (props) => <em className="italic" {...props} />,
                strong: (props) => (
                  <b className="text-primary-text font-semibold" {...props} />
                ),
              }}
            >
              {(() => {
                const withBold = suggestion.reason.replace(
                  /(Common Trades?:?)/gi,
                  "**$1**",
                );
                return withBold
                  .split(/\n\n+/)
                  .map((part) => part.replace(/\n/g, "\n\n"))
                  .join("\n\n");
              })()}
            </ReactMarkdown>
          ) : (
            <span>No reason provided.</span>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-auto pt-1">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-secondary-text text-xs font-semibold tracking-wide uppercase">
              Suggested by
            </p>
            {canEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onOpenEdit}
                    className="text-secondary-text hover:text-primary-text shrink-0 cursor-pointer rounded p-1 transition-colors"
                  >
                    <Icon
                      icon="material-symbols:edit-outline-rounded"
                      className="h-4 w-4"
                      inline
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Update reason</TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex items-start gap-2">
            <UserAvatar
              userId={suggestion.user.id}
              avatarHash={null}
              username={
                suggestion.user.roblox_username ??
                suggestion.user.username ??
                ""
              }
              forceAvatarUrl={suggestion.user.roblox_avatar ?? undefined}
              premiumType={suggestion.user.premiumtype ?? 0}
              size={6}
              showBadge={false}
              bgClassName="bg-tertiary-bg"
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/users/${suggestion.user.id}`}
                prefetch={false}
                className="text-link hover:text-link-hover inline-block max-w-full truncate text-sm font-medium transition-colors"
              >
                {suggestion.user.roblox_display_name ||
                  suggestion.user.roblox_username ||
                  `User #${suggestion.user.id}`}
              </Link>
              <p className="text-secondary-text text-xs">
                Posted on {formatMessageDate(suggestion.created_at)}
                {suggestion.updated_at !== suggestion.created_at
                  ? " (Updated)"
                  : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Discussion strip */}
      <Link
        href={`/items/suggestions/${suggestion.id}`}
        prefetch={false}
        onClick={(e) => e.stopPropagation()}
        className="border-border-card bg-tertiary-bg text-secondary-text hover:bg-quaternary-bg hover:text-primary-text relative z-10 flex w-full items-center justify-center gap-1.5 border-t py-2 text-xs transition-colors"
      >
        <Icon
          icon="material-symbols:chat-bubble-outline-rounded"
          className="h-3.5 w-3.5"
          inline
        />
        Discussion
      </Link>
    </div>
  );
}
