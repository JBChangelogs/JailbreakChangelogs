"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/IconWrapper";
import { usePartialItemFields } from "@/hooks/usePartialItems";
import { useSeasonsList } from "@/hooks/useSeasonsList";
import { useChangelogTimeline } from "@/hooks/useChangelogTimeline";
import { useUserSearch } from "@/hooks/useUserSearch";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useAuthContext } from "@/contexts/AuthContext";
import { getItemHref } from "@/components/Values/ValuesSearchSuggestions";
import { getItemImagePath, handleImageError } from "@/utils/ui/images";
import { formatFullValue } from "@/utils/trading/values";
import { UserAvatar } from "@/utils/ui/avatar";
import { UserBadges } from "@/components/Profile/UserBadges";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { trackEvent } from "@/utils/analytics/rybbit";
import {
  createGlobalSearchIndex,
  getGlobalSearchResults,
  getGlobalUserResults,
  getGlobalUserQuery,
  GLOBAL_SEARCH_GROUP_LIMIT,
  SEARCH_ITEM_FIELDS,
  type SearchCatalogItem,
} from "@/utils/ui/globalSearch";

export default function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef(document.activeElement);
  const resultsRef = useRef<HTMLDivElement>(null);
  const trackedOpenRef = useRef(false);
  const { user } = useAuthContext();
  const settings = useUserSettings(user?.id);
  const items = usePartialItemFields<SearchCatalogItem>(SEARCH_ITEM_FIELDS);
  const seasons = useSeasonsList();
  const changelogs = useChangelogTimeline();
  const userQuery = getGlobalUserQuery(query);
  const usersEnabled = userQuery !== null && userQuery.length >= 1;
  const users = useUserSearch(userQuery ?? "", null, {
    limit: GLOBAL_SEARCH_GROUP_LIMIT,
    enabled: usersEnabled,
  });
  const sources = [
    { label: "Items", ...items },
    { label: "Seasons and rewards", ...seasons },
    { label: "Changelogs", ...changelogs },
    ...(user ? [{ label: "Settings", ...settings }] : []),
  ];
  const isLoading =
    userQuery !== null
      ? usersEnabled && users.isLoading
      : sources.some((source) => source.isPending);
  const hasError =
    userQuery !== null
      ? usersEnabled && users.isError
      : sources.some((source) => source.isError);
  const index = useMemo(
    () =>
      createGlobalSearchIndex(
        items.data,
        seasons.data,
        changelogs.data,
        user ? settings.data : undefined,
        Boolean(user),
      ),
    [items.data, seasons.data, changelogs.data, settings.data, user],
  );
  const localResults = useMemo(
    () => getGlobalSearchResults(index, query),
    [index, query],
  );
  const results = [
    ...localResults,
    ...getGlobalUserResults(
      !usersEnabled || users.isLoading ? [] : users.results,
    ),
  ];
  const activeIndex = Math.min(highlighted, results.length - 1);
  const groups = [...new Set(results.map((result) => result.group))];
  const orderedResults = groups.flatMap((group) =>
    results.filter((result) => result.group === group),
  );

  useEffect(() => {
    resultsRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, query]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        data-global-search-dialog
        className="top-[10dvh] flex h-[min(40rem,80dvh)] max-h-[80dvh] w-[calc(100%-2rem)] max-w-2xl translate-y-0 flex-col gap-0 overflow-hidden p-0"
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
          if (!trackedOpenRef.current) {
            trackEvent("Global Search Opened");
            trackedOpenRef.current = true;
          }
        }}
        onKeyDown={(event) => {
          if (event.defaultPrevented || event.nativeEvent.isComposing) return;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            inputRef.current?.focus();
            if (orderedResults.length)
              setHighlighted(
                (previous) =>
                  (Math.min(previous, orderedResults.length - 1) +
                    (event.key === "ArrowDown" ? 1 : -1) +
                    orderedResults.length) %
                  orderedResults.length,
              );
          }
          if (
            event.key === "Enter" &&
            event.target === inputRef.current &&
            activeIndex >= 0
          ) {
            event.preventDefault();
            resultsRef.current
              ?.querySelector<HTMLAnchorElement>(
                `#global-search-result-${activeIndex} a`,
              )
              ?.click();
          }
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (
            returnFocusRef.current instanceof HTMLElement &&
            returnFocusRef.current.isConnected
          )
            returnFocusRef.current.focus();
        }}
      >
        <DialogTitle className="sr-only">Search the site</DialogTitle>
        <div className="border-border-card flex shrink-0 items-center gap-3 border-b px-4">
          <Icon
            icon="heroicons:magnifying-glass"
            className="text-secondary-text size-5 shrink-0"
          />
          <input
            ref={inputRef}
            role="combobox"
            aria-label="Search pages, items, rewards, seasons, users and changelogs"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls="global-search-results"
            aria-describedby="global-search-hint"
            aria-activedescendant={
              activeIndex >= 0
                ? `global-search-result-${activeIndex}`
                : undefined
            }
            className="text-primary-text placeholder:text-secondary-text h-16 min-w-0 flex-1 bg-transparent outline-none"
            placeholder="What are you looking for?"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setHighlighted(0);
            }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="text-secondary-text hover:text-primary-text focus-visible:ring-link cursor-pointer rounded-md p-2 focus-visible:ring-2 focus-visible:outline-none"
          >
            <Icon icon="heroicons:x-mark" className="size-5" />
          </button>
        </div>
        <div
          ref={resultsRef}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto p-2"
        >
          <div
            id="global-search-results"
            role="listbox"
            aria-label="Search results"
          >
            {groups.map((group) => (
              <div key={group} role="group" aria-label={group}>
                <p
                  className="text-secondary-text px-3 pt-3 pb-2 text-xs font-medium"
                  aria-hidden="true"
                >
                  {group}
                </p>
                {orderedResults.map((result, position) =>
                  result.group !== group ? null : (
                    <div
                      key={
                        result.item
                          ? `item-${result.item.id}`
                          : `${result.group}:${result.href}:${result.title}`
                      }
                      id={`global-search-result-${position}`}
                      role="option"
                      aria-selected={position === activeIndex}
                    >
                      <Link
                        href={
                          result.item ? getItemHref(result.item) : result.href!
                        }
                        prefetch={false}
                        onClick={onClose}
                        onFocus={() => setHighlighted(position)}
                        onPointerMove={() => setHighlighted(position)}
                        className={`text-primary-text focus-visible:ring-link flex min-h-14 items-center gap-3 rounded-lg px-3 py-2 focus-visible:ring-2 focus-visible:outline-none ${position === activeIndex ? "bg-tertiary-bg" : ""}`}
                      >
                        {result.user ? (
                          <UserAvatar
                            userId={result.user.id}
                            avatarHash={result.user.avatar}
                            username={result.user.username}
                            size={9}
                            cdnSize={64}
                            custom_avatar={result.user.custom_avatar}
                            settings={result.user.settings_v2}
                            premiumType={result.user.premiumtype}
                            showBadge={false}
                            className="shrink-0"
                          />
                        ) : result.item || result.image ? (
                          <div className="relative h-9 w-14 shrink-0 overflow-hidden rounded-md">
                            <Image
                              src={
                                result.item
                                  ? getItemImagePath(
                                      result.item.type,
                                      result.item.name,
                                      true,
                                    )
                                  : result.image!
                              }
                              alt=""
                              fill
                              sizes="56px"
                              className="object-contain"
                              onError={handleImageError}
                            />
                          </div>
                        ) : (
                          <Icon
                            icon={result.icon!}
                            className="text-secondary-text size-5 shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium">
                              {result.title}
                            </span>
                            {result.user && (
                              <div className="flex shrink-0 items-center gap-1">
                                <UserBadges
                                  usernumber={
                                    result.user.usernumber ?? Infinity
                                  }
                                  flags={result.user.flags}
                                  size="sm"
                                  noContainer
                                  limit={1}
                                  disableClick
                                />
                                <UserBadges
                                  usernumber={Infinity}
                                  premiumType={result.user.premiumtype}
                                  size="sm"
                                  noContainer
                                  limit={1}
                                  disableClick
                                />
                              </div>
                            )}
                          </div>
                          <span className="text-secondary-text block truncate text-xs">
                            {result.description}
                          </span>
                        </div>
                        {result.user?.roblox_id &&
                          result.user.roblox_id !== "None" &&
                          result.user.roblox_username &&
                          result.user.roblox_username !== "None" && (
                            <span className="border-border-card bg-tertiary-bg text-secondary-text inline-flex max-w-[40%] shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs">
                              <RobloxIcon className="size-3.5 shrink-0" />
                              <span className="sr-only">
                                Connected Roblox account:{" "}
                              </span>
                              <span className="truncate">
                                @{result.user.roblox_username}
                              </span>
                            </span>
                          )}
                        {result.item && (
                          <span className="text-secondary-text shrink-0 text-sm">
                            {formatFullValue(result.item.cash_value)}
                          </span>
                        )}
                      </Link>
                    </div>
                  ),
                )}
                {group === "Items" &&
                  localResults.filter((result) => result.item).length ===
                    GLOBAL_SEARCH_GROUP_LIMIT && (
                    <Link
                      href={`/values?${new URLSearchParams({ query: query.trim() })}`}
                      prefetch={false}
                      onClick={onClose}
                      className="text-link focus-visible:ring-link mx-3 my-2 block w-fit rounded text-xs underline focus-visible:ring-2 focus-visible:outline-none"
                    >
                      View all item results
                    </Link>
                  )}
              </div>
            ))}
          </div>
          <div
            role="status"
            className={`text-secondary-text px-3 py-2 text-sm ${!results.length ? "flex flex-1 flex-col items-center justify-center text-center" : ""}`}
          >
            {!results.length &&
              !isLoading &&
              !hasError &&
              (userQuery !== null && !usersEnabled ? (
                <p>Type a username to search accounts.</p>
              ) : (
                <>
                  <p className="text-primary-text font-medium">
                    No results found
                  </p>
                  <p className="mt-1">
                    Try a different name or search users with @username.
                  </p>
                </>
              ))}
            {isLoading && <p>Searching…</p>}
            {sources
              .filter((source) => userQuery === null && source.isError)
              .map((source) => (
                <p key={source.label}>
                  {source.label} could not be refreshed.{" "}
                  <button
                    type="button"
                    className="text-link cursor-pointer underline"
                    onClick={() => void source.refetch()}
                  >
                    Retry
                  </button>
                </p>
              ))}
            {usersEnabled && users.isError && (
              <p>
                User search failed.{" "}
                <button
                  type="button"
                  className="text-link cursor-pointer underline"
                  onClick={() => void users.refetch()}
                >
                  Retry
                </button>
              </p>
            )}
          </div>
        </div>
        <div className="text-secondary-text border-border-card shrink-0 space-y-2 border-t px-4 py-3 text-xs">
          <p id="global-search-hint">Search users with @username.</p>
          <p className="flex flex-wrap items-center gap-1">
            <kbd className="border-border-card bg-secondary-bg text-primary-text shrink-0 rounded border px-1.5 py-1 font-sans text-xs leading-none">
              ↑
            </kbd>
            <kbd className="border-border-card bg-secondary-bg text-primary-text shrink-0 rounded border px-1.5 py-1 font-sans text-xs leading-none">
              ↓
            </kbd>
            <span>to navigate ·</span>
            <kbd className="border-border-card bg-secondary-bg text-primary-text shrink-0 rounded border px-1.5 py-1 font-sans text-xs leading-none">
              Enter
            </kbd>
            <span>to open ·</span>
            <kbd className="border-border-card bg-secondary-bg text-primary-text shrink-0 rounded border px-1.5 py-1 font-sans text-xs leading-none">
              Esc
            </kbd>
            <span>to close</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
