"use client";

import NumberFlow from "@number-flow/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "../ui/IconWrapper";
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getSortLabel } from "@/utils/api/sortGroups";
import { useCommentsContext } from "./CommentsContext";

export function CommentHeader({ pill }: { pill?: ReactNode }) {
  const headerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const header = headerRef.current;
    const container = header?.parentElement;
    if (!header || !container) return;
    let offset = 0;

    const update = () => {
      const style = getComputedStyle(header);
      const bounds = container.getBoundingClientRect();
      const top = header.getBoundingClientRect().top - offset;
      const releaseHeight = Math.min(
        (window.innerHeight - parseFloat(style.top)) * 0.5,
        bounds.height,
      );
      offset =
        style.position === "sticky"
          ? Math.min(0, bounds.bottom - releaseHeight - top)
          : 0;
      header.style.transform = offset ? `translateY(${offset}px)` : "";
    };
    const observer = new ResizeObserver(update);
    observer.observe(header);
    observer.observe(container);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      header.style.transform = "";
    };
  }, []);

  const {
    totalComments,
    isRefreshingComments,
    type,
    changelogId,
    changelogTitle,
    itemType,
    containerBgClass,
    pinnedTitle,
  } = useCommentsContext();

  return (
    <>
      <div
        ref={headerRef}
        className={`${containerBgClass} @container sticky top-(--header-height) z-10 -mx-2 -mt-2 -mb-4 rounded-t-lg px-2 py-2 sm:-mx-3 sm:-mt-3 sm:mb-0 sm:px-3`}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2">
          <h2
            className={`text-primary-text col-span-2 min-w-0 text-lg font-bold tracking-tight sm:text-xl @xl:col-span-1 ${pinnedTitle ? "xl:col-span-1" : ""}`}
          >
            <span>
              {/* No "0" while loading, or it rolls up to the real count. */}
              {isRefreshingComments ? (
                <Skeleton
                  className="inline-block h-5 w-8 align-middle"
                  aria-hidden="true"
                />
              ) : (
                <NumberFlow translate="no" value={totalComments} />
              )}{" "}
              {totalComments === 1 && !isRefreshingComments
                ? "Comment"
                : "Comments"}
            </span>{" "}
            {/* The page title is already pinned beside it on xl. */}
            <span className={pinnedTitle ? "xl:hidden" : undefined}>
              for{" "}
              {type === "changelog" ? (
                `Changelog ${changelogId}: ${changelogTitle}`
              ) : type === "season" ? (
                `Season ${changelogId}: ${changelogTitle}`
              ) : type === "tradev2" ? (
                `Trade #${changelogId}`
              ) : type === "inventory" || type === "user" ? (
                changelogTitle
              ) : type === "theme" ? (
                `${changelogTitle} Community Theme`
              ) : type === "vsuggestion" ? (
                changelogTitle
              ) : (
                <>
                  <span>{changelogTitle} </span>
                  <span className="text-secondary-text">({itemType})</span>
                </>
              )}
            </span>
          </h2>
          <p
            className={`text-secondary-text flex items-start gap-1 text-xs max-sm:col-span-2 @xl:order-2 @xl:col-span-2 ${pinnedTitle ? "xl:order-2 xl:col-span-2" : ""}`}
          >
            <Icon
              icon="heroicons:information-circle"
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
            />
            <span>Comments are user-submitted and unverified.</span>
          </p>
          <div
            className={`flex justify-end max-sm:col-span-2 @xl:order-1 ${pinnedTitle ? "xl:order-1" : ""}`}
          >
            <JumpToCommentForm headerRef={headerRef} />
            <CommentSort />
          </div>
        </div>
        {pill && (
          <div className="absolute top-full left-1/2 mt-3 -translate-x-1/2">
            {pill}
          </div>
        )}
      </div>
    </>
  );
}

function JumpToCommentForm({
  headerRef,
}: {
  headerRef: RefObject<HTMLDivElement | null>;
}) {
  const {
    profileCommentsDisabled,
    isLoggedIn,
    isBlocked,
    isCommentFormExpanded,
    setIsCommentFormExpanded,
    setLoginModal,
  } = useCommentsContext();
  const [formPassed, setFormPassed] = useState(false);

  useEffect(() => {
    const form = document.getElementById("new-comment-form");
    const header = headerRef.current;
    if (!form || !header) return;
    // Only offer a jump back once the form has passed behind the header.
    const update = () => {
      const topBar =
        parseFloat(
          document.documentElement.style.getPropertyValue("--header-height"),
        ) || 0;
      const covered = Math.max(topBar, header.getBoundingClientRect().bottom);
      const rect = form.getBoundingClientRect();
      setFormPassed(rect.bottom <= covered);
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [headerRef]);

  if (profileCommentsDisabled || isBlocked) return null;

  // 0fr/1fr grid track so the width can animate.
  return (
    <div
      className={`grid shrink-0 transition-[grid-template-columns,opacity,visibility] duration-300 ${formPassed ? "grid-cols-[1fr]" : "invisible grid-cols-[0fr] opacity-0"}`}
    >
      <div className="min-w-0 overflow-hidden">
        <button
          type="button"
          onClick={() => {
            if (!isLoggedIn) {
              setLoginModal({ open: true });
              return;
            }
            document
              .getElementById("comments-top")
              ?.scrollIntoView({ behavior: "smooth" });
            if (isCommentFormExpanded) {
              document
                .getElementById("new-comment-textarea")
                ?.focus({ preventScroll: true });
            } else {
              setIsCommentFormExpanded(true);
            }
          }}
          className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus mr-2 flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs whitespace-nowrap transition-colors duration-300 focus:ring-1 focus:outline-none"
        >
          <Icon
            icon="heroicons:pencil-square"
            className="h-4 w-4 shrink-0"
            inline={true}
          />
          <span>Comment</span>
        </button>
      </div>
    </div>
  );
}

function CommentSort() {
  const { sortOrder, sortGroups, handleSortChange } = useCommentsContext();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Sort comments"
          className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all duration-300 focus:ring-1 focus:outline-none sm:w-auto"
        >
          <span className="text-secondary-text sm:@max-xl:hidden">Sort:</span>
          <span className="font-medium">
            {getSortLabel(sortGroups, sortOrder)}
          </span>
          <Icon
            icon="heroicons:chevron-down"
            className="text-secondary-text ml-auto h-4 w-4 shrink-0"
            inline={true}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="border-border-card bg-secondary-bg text-primary-text w-(--radix-dropdown-menu-trigger-width) rounded-xl border p-1 shadow-lg"
      >
        <DropdownMenuRadioGroup
          value={sortOrder ?? ""}
          onValueChange={handleSortChange}
        >
          {sortGroups.map((group, index) => (
            <Fragment key={group.label}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                {group.label}
              </DropdownMenuLabel>
              {group.options.map((option) => (
                <DropdownMenuRadioItem
                  key={option.value}
                  value={option.value}
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </Fragment>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
