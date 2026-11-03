"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { UpdatePill } from "@/components/ui/UpdatePill";
import { useDebounce } from "@/hooks/useDebounce";
import { Pagination } from "@/components/ui/Pagination";
import { ReportReasonModal } from "@/components/ui/ReportReasonModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomThemePreview from "@/components/Settings/CustomThemePreview";
import ThemePreviewImages from "@/components/Settings/ThemePreviewImages";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  fetchMarketplaceThemes,
  reportMarketplaceTheme,
  listMyThemes,
  updateMyTheme,
  ThemeApiError,
  type MarketplaceSort,
  type MarketplaceTheme,
  type MarketplaceThemesPage,
} from "@/utils/api/userThemes";
import { setCustomTheme } from "@/utils/ui/customTheme";
import { rememberSharedTheme } from "@/utils/ui/recentThemes";
import { isItemSearchShortcut } from "@/utils/ui/searchShortcut";
import { UserAvatar } from "@/utils/ui/avatar";
import {
  applyMarketplaceEvent,
  parseMarketplaceEvent,
  marketplaceMatchesSearch,
} from "@/utils/ui/marketplaceRealtime";

export default function ThemeMarketplace() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthContext();
  const { customTheme } = useTheme();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<MarketplaceSort>("newest");
  const [reporting, setReporting] = useState<MarketplaceTheme | null>(null);
  const [reason, setReason] = useState("");
  const [unpublishing, setUnpublishing] = useState<string | null>(null);
  const [pendingNew, setPendingNew] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const marketplaceRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isItemSearchShortcut(event) && searchInputRef.current) {
        event.preventDefault();
        searchInputRef.current.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const debouncedInput = useDebounce(input.trim(), 400);
  useEffect(() => {
    setQuery(debouncedInput);
    setPage(1);
  }, [debouncedInput]);
  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: ["theme-marketplace", query, page, sort],
    queryFn: ({ signal }) => fetchMarketplaceThemes(page, sort, query, signal),
    retry: false,
  });
  const searching = isFetching || input.trim() !== query;

  useEffect(() => setPendingNew(new Set()), [query, sort, isAuthenticated]);
  useEffect(() => {
    if (!data) return;
    setPendingNew((previous) => {
      const remaining = new Set(
        [...previous].filter(
          (code) => !data.items.some((theme) => theme.share_code === code),
        ),
      );
      return remaining.size === previous.size ? previous : remaining;
    });
  }, [data]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const queryKey = ["theme-marketplace", query, page, sort];
    const handleUpdate = async (event: Event) => {
      const update = parseMarketplaceEvent(
        (event as CustomEvent<unknown>).detail,
      );
      if (!update) return;
      const before = queryClient.getQueryData<MarketplaceThemesPage>(queryKey);
      const nearTop =
        (marketplaceRef.current?.getBoundingClientRect().top ?? 0) >= 0;
      const matches =
        update.action !== "marketplace_theme_removed" &&
        marketplaceMatchesSearch(update.data, query);
      if (update.action === "marketplace_theme_removed" || !matches) {
        setPendingNew((previous) => {
          if (!previous.has(update.data.share_code)) return previous;
          const next = new Set(previous);
          next.delete(update.data.share_code);
          return next;
        });
      }
      if (
        update.action !== "marketplace_theme_removed" &&
        !matches &&
        !before?.items.some(
          (theme) => theme.share_code === update.data.share_code,
        )
      )
        return;
      if (
        update.action === "marketplace_theme_published" &&
        before &&
        matches &&
        !before.items.some(
          (theme) => theme.share_code === update.data.share_code,
        ) &&
        (page !== 1 || sort !== "newest" || !nearTop)
      ) {
        setPendingNew((previous) =>
          previous.has(update.data.share_code)
            ? previous
            : new Set([...previous, update.data.share_code]),
        );
        return;
      }
      await queryClient.cancelQueries({ queryKey, exact: true });
      const previous =
        queryClient.getQueryData<MarketplaceThemesPage>(queryKey);
      queryClient.setQueryData<MarketplaceThemesPage>(queryKey, (current) =>
        applyMarketplaceEvent(current, update, query, sort),
      );
      await queryClient.invalidateQueries({
        queryKey,
        exact: true,
        refetchType:
          !previous ||
          (nearTop &&
            page === 1 &&
            update.action === "marketplace_theme_removed")
            ? "active"
            : "none",
      });
    };
    window.addEventListener("realtimeThemeMarketplace", handleUpdate);
    return () =>
      window.removeEventListener("realtimeThemeMarketplace", handleUpdate);
  }, [queryClient, query, page, sort, isAuthenticated]);

  useEffect(() => {
    if (data && page > Math.max(1, data.total_pages))
      setPage(Math.max(1, data.total_pages));
  }, [data, page]);

  const unpublishTheme = async (theme: MarketplaceTheme) => {
    if (!isAuthenticated || !user || theme.user?.id !== user.id || unpublishing)
      return;
    setUnpublishing(theme.share_code);
    const toastId = toast.loading("Removing theme from marketplace…");
    try {
      // Marketplace entries have share codes; owner updates require the private numeric ID.
      const { themes } = await listMyThemes();
      const own = themes.find((saved) => saved.share_code === theme.share_code);
      if (!own)
        throw new Error("This theme is no longer in your saved themes.");
      await updateMyTheme(own.id, { published: false });
      setPage(1);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-themes", user.id] }),
        queryClient.invalidateQueries({ queryKey: ["theme-marketplace"] }),
      ]);
      toast.success("Theme removed from marketplace", { id: toastId });
    } catch (err) {
      toast.error("Couldn't remove the theme from marketplace", {
        id: toastId,
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUnpublishing(null);
    }
  };

  const submitReport = async (reportReason: string) => {
    if (!reporting || !isAuthenticated || reporting.user?.id === user?.id)
      return;
    try {
      await reportMarketplaceTheme(reporting.share_code, reportReason);
      toast.success("Report submitted");
      setReporting(null);
      setReason("");
    } catch (err) {
      const message =
        err instanceof ThemeApiError
          ? err.code === "report_exists"
            ? "You've already reported this theme."
            : err.code === "self_report"
              ? "You can't report your own theme."
              : err.status === 404
                ? "This theme is no longer published."
                : err.message
          : err instanceof Error
            ? err.message
            : undefined;
      toast.error("Couldn't report the theme", { description: message });
    }
  };

  return (
    <div ref={marketplaceRef} className="space-y-6">
      {pendingNew.size > 0 && !isPending && (
        <UpdatePill
          centerOn={marketplaceRef}
          onClick={() => {
            setPendingNew(new Set());
            if (page === 1 && sort === "newest") void refetch();
            else {
              void queryClient.invalidateQueries({
                queryKey: ["theme-marketplace"],
                refetchType: "none",
              });
              setPage(1);
              setSort("newest");
            }
            marketplaceRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        >
          <Icon
            icon="material-symbols:arrow-upward-rounded"
            aria-hidden="true"
            className="size-4"
          />
          {pendingNew.size === 1
            ? "1 new theme"
            : `${pendingNew.size} new themes`}{" "}
          — click to load
        </UpdatePill>
      )}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <form
            className="relative min-w-0 flex-1"
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(input.trim());
              setPage(1);
            }}
          >
            <input
              ref={searchInputRef}
              type="text"
              aria-keyshortcuts="/"
              aria-label="Search themes by name, description, author, or id:CODE"
              placeholder="Name, description, author, or id:ABCDEFGH"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info h-14 w-full rounded-lg border px-4 pr-24 transition-all duration-300 focus:outline-none"
            />
            <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
              {input && (
                <>
                  <button
                    type="button"
                    aria-label="Clear search"
                    className="text-secondary-text hover:text-primary-text cursor-pointer transition-colors"
                    onClick={() => {
                      setInput("");
                      setQuery("");
                      setPage(1);
                      searchInputRef.current?.focus();
                    }}
                  >
                    <Icon
                      icon="heroicons:x-mark"
                      aria-hidden="true"
                      className="size-5"
                    />
                  </button>
                  <div
                    aria-hidden="true"
                    className="border-primary-text h-6 border-l opacity-30"
                  />
                </>
              )}
              <button
                type="submit"
                aria-label="Search"
                aria-busy={searching}
                className="hover:bg-link/10 text-link flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors"
              >
                {searching ? (
                  <Spinner className="size-5" />
                ) : (
                  <Icon
                    icon="heroicons:magnifying-glass"
                    aria-hidden="true"
                    className="size-5"
                  />
                )}
              </button>
            </div>
          </form>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Sort themes"
                className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-14 min-w-44 cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
              >
                <span className="truncate">
                  {sort === "newest" ? "Newest first" : "Oldest first"}
                </span>
                <Icon
                  icon="heroicons:chevron-down"
                  className="text-secondary-text size-5"
                  aria-hidden="true"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="border-border-card bg-secondary-bg text-primary-text w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) rounded-xl border p-1 shadow-lg"
            >
              <DropdownMenuRadioGroup
                value={sort}
                onValueChange={(value) => {
                  setSort(value as MarketplaceSort);
                  setPage(1);
                }}
              >
                <DropdownMenuRadioItem
                  value="newest"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 pr-8 text-sm"
                >
                  Newest first
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="oldest"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 pr-8 text-sm"
                >
                  Oldest first
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="text-secondary-text mt-2 hidden items-center gap-1 text-xs lg:flex">
          <Icon
            icon="emojione:light-bulb"
            aria-hidden="true"
            className="text-sm text-yellow-500"
          />
          Helpful tip: Press{" "}
          <kbd className="border-border-card bg-secondary-bg text-secondary-text shrink-0 rounded border px-1.5 py-1 font-sans text-xs leading-none">
            /
          </kbd>{" "}
          to quickly focus the search.
        </div>
      </div>

      {isPending ? (
        <div role="status">
          <span className="sr-only">Loading themes…</span>
          <Skeleton aria-hidden="true" className="h-6 w-36" />
        </div>
      ) : (
        !error &&
        !!data?.total && (
          <p role="status" className="text-secondary-text">
            {query
              ? `Found ${data.total} ${data.total === 1 ? "theme" : "themes"} matching "${query}"`
              : `Total Themes: ${data.total}`}
          </p>
        )
      )}
      {error && (
        <div role="alert" className="space-y-3">
          <p>{error.message}</p>
          <Button variant="secondary" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      )}
      {!error && !isPending && data?.items.length === 0 && (
        <div
          role="status"
          className="border-border-card bg-secondary-bg rounded-lg border px-6 py-12 text-center"
        >
          <Icon
            icon={query ? "lucide:search" : "lucide:palette"}
            aria-hidden="true"
            className="text-secondary-text mx-auto mb-4 size-12 opacity-50"
          />
          <h2 className="text-primary-text mb-2 text-xl font-semibold">
            {query ? "No matching themes" : "No themes published yet"}
          </h2>
          <p className="text-secondary-text mx-auto max-w-md text-sm">
            {query
              ? `No themes match “${query}”. Try another name, description, author, or share code.`
              : "Community themes will appear here once published. You can share a custom theme from your theme settings."}
          </p>
          {query ? (
            <Button
              variant="secondary"
              className="mt-6"
              onClick={() => {
                setInput("");
                setQuery("");
                setPage(1);
              }}
            >
              Clear search
            </Button>
          ) : (
            <Button asChild className="mt-6">
              <Link href="/settings?highlight=themes#themes">
                Open theme settings
              </Link>
            </Button>
          )}
        </div>
      )}
      <div
        aria-busy={isPending}
        className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
      >
        {isPending
          ? Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                aria-hidden="true"
                className="border-border-card bg-secondary-bg min-w-0 space-y-3 rounded-xl border p-4"
              >
                <Skeleton className="h-64 w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-2/3" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-6 rounded-full" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
                <Skeleton className="h-8 w-28" />
              </div>
            ))
          : data?.items.map((theme) => {
              const author =
                theme.user?.global_name && theme.user.global_name !== "None"
                  ? theme.user.global_name
                  : (theme.user?.username ?? "Unknown author");
              const inUse = customTheme?.share_code === theme.share_code;
              return (
                <article
                  key={theme.share_code}
                  className="border-border-card bg-secondary-bg min-w-0 space-y-3 rounded-xl border p-4"
                >
                  {theme.previews?.length ? (
                    <ThemePreviewImages
                      previews={theme.previews}
                      label={theme.label}
                    />
                  ) : (
                    <CustomThemePreview
                      vars={theme.vars}
                      scheme={theme.scheme}
                      logoFilter={theme.logo_filter}
                      compact
                    />
                  )}
                  <div>
                    <h2
                      className="text-primary-text truncate text-lg font-semibold"
                      title={theme.label}
                    >
                      {theme.label}
                    </h2>
                    {theme.description && (
                      <p className="text-secondary-text mt-1 line-clamp-3 text-sm wrap-break-word whitespace-pre-line">
                        {theme.description}
                      </p>
                    )}
                    <div className="text-secondary-text mt-1 flex items-center gap-2 text-sm">
                      {theme.user?.id && (
                        <UserAvatar
                          userId={theme.user.id}
                          avatarHash={theme.user.avatar ?? null}
                          username={theme.user.username}
                          custom_avatar={theme.user.custom_avatar}
                          premiumType={theme.user.premiumtype}
                          settings={theme.user.settings}
                          size={6}
                          showBadge={false}
                        />
                      )}
                      <p className="min-w-0 truncate">
                        Created by{" "}
                        {theme.user?.id ? (
                          <Link
                            href={`/users/${theme.user.id}`}
                            className="text-link hover:text-link-hover transition-colors"
                          >
                            {author}
                          </Link>
                        ) : (
                          author
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={inUse}
                      onClick={() => {
                        setCustomTheme(theme);
                        rememberSharedTheme(theme.share_code);
                        toast.success(`Using ${theme.label}`);
                      }}
                    >
                      {inUse ? "In use" : "Use theme"}
                    </Button>
                    {isAuthenticated && user && theme.user?.id === user.id && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={unpublishing !== null}
                        onClick={() => void unpublishTheme(theme)}
                      >
                        {unpublishing === theme.share_code
                          ? "Removing…"
                          : "Remove from marketplace"}
                      </Button>
                    )}
                    {isAuthenticated &&
                      theme.user?.id &&
                      theme.user.id !== user?.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setReason("");
                            setReporting(theme);
                          }}
                        >
                          Report
                        </Button>
                      )}
                  </div>
                </article>
              );
            })}
      </div>
      {data && data.total_pages > 1 && (
        <Pagination
          count={data.total_pages}
          page={data.page}
          onChange={(_event, value) => setPage(value)}
        />
      )}
      <ReportReasonModal
        open={reporting !== null}
        onClose={() => setReporting(null)}
        onSubmit={submitReport}
        reportReason={reason}
        setReportReason={setReason}
        subject="theme"
        title={`Report ${reporting?.label ?? "theme"}`}
      />
    </div>
  );
}
