"use client";

import NumberFlow from "@number-flow/react";
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
        className={`${containerBgClass} sticky top-(--header-height) z-10 -mx-2 -mt-2 -mb-4 rounded-t-lg px-2 py-2 sm:-mx-3 sm:-mt-3 sm:mb-0 sm:px-3 ${pinnedTitle ? "xl:static" : ""}`}
      >
        <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-4">
          <h2 className="text-primary-text min-w-0 text-lg font-bold tracking-tight sm:text-xl">
            <span>
              <NumberFlow translate="no" value={totalComments} />{" "}
              {totalComments === 1 ? "Comment for" : "Comments for"}
            </span>{" "}
            <span>
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
          <p className="text-secondary-text flex items-start gap-1 text-xs sm:order-2 sm:col-span-2">
            <Icon
              icon="heroicons:information-circle"
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
            />
            <span>Comments are user-submitted and unverified.</span>
          </p>
          <div className="flex justify-end gap-2 sm:order-1">
            <JumpToCommentForm headerRef={headerRef} />
            <CommentSort />
          </div>
        </div>
        {/* Rides along under the stuck title. Where the title isn't sticky,
          ChangelogComments shows the fixed pill instead. */}
        {pill && (
          <div
            className={`absolute top-full left-1/2 mt-3 -translate-x-1/2 ${pinnedTitle ? "xl:hidden" : ""}`}
          >
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
  const [formInView, setFormInView] = useState(true);

  useEffect(() => {
    const form = document.getElementById("new-comment-form");
    const header = headerRef.current;
    if (!form || !header) return;
    const inset =
      header.offsetHeight + (parseFloat(getComputedStyle(header).top) || 0);
    const observer = new IntersectionObserver(
      ([entry]) => setFormInView(entry.isIntersecting),
      { rootMargin: `-${inset}px 0px 0px 0px` },
    );
    observer.observe(form);
    return () => observer.disconnect();
  }, [headerRef]);

  if (profileCommentsDisabled || isBlocked || formInView) return null;

  return (
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
      className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-all duration-300 focus:ring-1 focus:outline-none"
    >
      <Icon
        icon="heroicons:pencil-square"
        className="h-4 w-4 shrink-0"
        inline={true}
      />
      <span>Comment</span>
    </button>
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
          <span className="text-secondary-text">Sort by:</span>
          <span>{getSortLabel(sortGroups, sortOrder)}</span>
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
