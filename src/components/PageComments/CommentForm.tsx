"use client";

import { Icon } from "../ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "../ui/button";
import { useCommentsContext } from "./CommentsContext";

export function CommentForm() {
  const {
    isLoggedIn,
    isBlocked,
    isCommentFormExpanded,
    setIsCommentFormExpanded,
    newComment,
    setNewComment,
    isSubmittingComment,
    handleSubmitComment,
    type,
    changelogId,
    setLoginModal,
  } = useCommentsContext();

  return (
    <form id="new-comment-form" onSubmit={handleSubmitComment}>
      {!isCommentFormExpanded ? (
        /* Collapsed trigger */
        <button
          type="button"
          disabled={isBlocked}
          className="border-border-card bg-tertiary-bg text-secondary-text hover:border-button-info w-full cursor-text rounded-lg border px-4 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => {
            if (!isLoggedIn) {
              setLoginModal({ open: true });
            } else if (!isBlocked) {
              setIsCommentFormExpanded(true);
            }
          }}
        >
          {isLoggedIn ? "Write a comment..." : "Log in to leave a comment..."}
        </button>
      ) : (
        /* Expanded state */
        <div className="border-border-card bg-tertiary-bg focus-within:border-button-info overflow-hidden rounded-lg border transition-colors">
          <textarea
            id="new-comment-textarea"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={4}
            disabled={isBlocked}
            className="text-primary-text placeholder-secondary-text w-full resize-none bg-transparent p-3 text-sm focus:outline-none disabled:opacity-60"
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
            autoCapitalize="off"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsCommentFormExpanded(false);
                setNewComment("");
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (newComment.trim() && !isSubmittingComment && !isBlocked) {
                  e.currentTarget.form?.requestSubmit();
                }
              }
            }}
          />
          <div className="border-border-card flex items-center justify-end gap-2 border-t px-3 py-2">
            {/* Mobile: show buttons */}
            <div className="flex items-center gap-2 lg:hidden">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCommentFormExpanded(false);
                  setNewComment("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={
                  !newComment.trim() || isSubmittingComment || isBlocked
                }
                data-umami-event="Post Comment"
                data-umami-event-type={type}
                data-umami-event-context-id={changelogId.toString()}
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
                    Post
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
                      setIsCommentFormExpanded(false);
                      setNewComment("");
                    }}
                  >
                    cancel
                  </button>
                  <span> • Enter to </span>
                  <button
                    type="button"
                    className="text-link cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={
                      !newComment.trim() || isSubmittingComment || isBlocked
                    }
                    onClick={() => {
                      if (
                        newComment.trim() &&
                        !isSubmittingComment &&
                        !isBlocked
                      ) {
                        document
                          .querySelector<HTMLFormElement>("#new-comment-form")
                          ?.requestSubmit();
                      }
                    }}
                  >
                    post
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
