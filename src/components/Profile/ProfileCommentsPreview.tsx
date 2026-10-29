"use client";

import { useCommentsContext } from "@/components/PageComments/CommentsContext";
import { isCommentIdentityHidden } from "@/components/PageComments/commentUtils";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/utils/ui/avatar";

export default function ProfileCommentsPreview() {
  const {
    comments,
    changelogId,
    userData,
    currentUserId,
    totalComments,
    isRefreshingComments,
    profileCommentsDisabled,
    isProfileOwner,
  } = useCommentsContext();
  if (profileCommentsDisabled && totalComments === 0) return null;

  // shortcut: preview uses loaded comments; fetch newest separately if recency across all sorts is needed.
  const recentCommenterIds = [
    ...new Set(
      comments
        .flatMap((comment) => [comment, ...(comment.replies ?? [])])
        .sort((a, b) => Number(b.date) - Number(a.date))
        .filter(
          (comment) =>
            comment.user_id &&
            comment.user_id !== String(changelogId) &&
            !isCommentIdentityHidden(
              comment.user_id,
              userData[comment.user_id]?.settings,
              currentUserId,
            ),
        )
        .map((comment) => comment.user_id),
    ),
  ].slice(0, 4);

  return (
    <button
      type="button"
      onClick={() => {
        const target = document.getElementById("comments");
        target?.focus({ preventScroll: true });
        target?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
          block: "start",
        });
      }}
      className="border-border-card bg-secondary-bg text-primary-text hover:bg-quaternary-bg focus-visible:ring-link flex min-h-16 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none sm:px-6"
    >
      <span className="min-w-0">
        <span className="flex items-center gap-2 font-semibold">
          Profile comments
          {!isRefreshingComments && totalComments > 0 && (
            <span className="text-secondary-text text-sm font-normal">
              {totalComments}
            </span>
          )}
        </span>
        {!isRefreshingComments && totalComments === 0 && (
          <span className="text-secondary-text mt-1 block text-sm">
            {isProfileOwner
              ? "No comments on your profile yet"
              : "Be the first to comment"}
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <span className="flex -space-x-2" aria-label="Recent commenters">
          {recentCommenterIds.map((id) => {
            const user = userData[id];
            return (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <UserAvatar
                      userId={id}
                      username={user?.username ?? ""}
                      avatarHash={user?.avatar ?? null}
                      custom_avatar={user?.custom_avatar}
                      settings={user?.settings}
                      premiumType={user?.premiumtype}
                      size={8}
                      cdnSize={64}
                      showBadge={false}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {user?.username ?? "Unknown User"}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </span>
        <Icon
          icon="heroicons:chevron-down"
          className="text-secondary-text size-4 shrink-0"
        />
      </span>
    </button>
  );
}
