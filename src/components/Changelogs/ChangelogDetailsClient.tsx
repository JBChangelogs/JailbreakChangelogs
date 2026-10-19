"use client";

import { useState, useEffect, useMemo } from "react";
import Fuse from "fuse.js";
import { useRouter } from "nextjs-toploader/app";
import {
  extractContentInfo,
  getContentPreview,
} from "@/utils/changelogs/changelogs";
import { isFuzzyTokenMatch } from "@/utils/helpers/itemSearch";
import { useDebounce } from "@/hooks/useDebounce";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import Link from "next/link";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ChangelogFilter from "@/components/Changelogs/ChangelogFilter";
import ChangelogSearchInput from "@/components/Changelogs/ChangelogSearchInput";
import NitroInlineVideoPlayer from "@/components/Ads/NitroInlineVideoPlayer";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { Changelog, CommentData } from "@/utils/api/api";
import { UserData } from "@/types/auth";

// Dynamic imports for heavy components
const ChangelogContent = dynamic(
  () => import("@/components/Changelogs/ChangelogContent"),
  {
    loading: () => (
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-12">
        <div className="sm:col-span-12 lg:col-span-8">
          <Skeleton className="mb-4" style={{ height: 80 }} />
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="w-3/5" style={{ height: 40 }} />
                <div className="space-y-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <Skeleton
                        className="rounded-full"
                        style={{ width: 24, height: 24 }}
                      />
                      <Skeleton
                        className={
                          j === 0
                            ? "w-[90%]"
                            : j === 1
                              ? "w-[85%]"
                              : j === 2
                                ? "w-[75%]"
                                : "w-[80%]"
                        }
                        style={{ height: 24 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-8 sm:col-span-12 lg:col-span-4">
          <Skeleton className="rounded-none" style={{ height: 200 }} />
        </div>
      </div>
    ),
    ssr: true,
  },
);

interface SearchResult {
  id: number;
  title: string;
  contentPreview?: string;
  mediaTypes: string[];
  mentions: string[];
  // Actual text a fuzzy match was found on (may differ from the typed query)
  highlightTerms?: string[];
}

// 0 = exact/substring match, 1 = fuzzy typo match; exact hits are ranked first.
interface RankedSearchResult extends SearchResult {
  matchTier: number;
}

interface ChangelogDetailsClientProps {
  changelogList: Changelog[];
  currentChangelog: Changelog;
  changelogId: string;
  initialComments?: CommentData[];
  initialUserMap?: Record<string, UserData>;
}

export default function ChangelogDetailsClient({
  changelogList,
  currentChangelog,
  changelogId,
  initialComments = [],
  initialUserMap = {},
}: ChangelogDetailsClientProps) {
  const router = useRouter();

  const [currentChangelogState, setCurrentChangelogState] =
    useState(currentChangelog);
  const changelog = currentChangelogState;

  const [selectedId, setSelectedId] = useState(changelogId);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // True while the debounce is waiting to settle, so the UI can show a
  // "searching" state instead of briefly flashing "no results found"
  const isSearching =
    searchQuery.trim() !== "" && searchQuery !== debouncedSearchQuery;

  // Fuzzy search index over titles and content, rebuilt only when the list changes
  const fuse = useMemo(
    () =>
      new Fuse(changelogList, {
        keys: [
          { name: "title", weight: 2 },
          { name: "sections", weight: 1 },
        ],
        includeMatches: true,
        useTokenSearch: true,
        ignoreLocation: true,
        threshold: 0.3,
        minMatchCharLength: 2,
      }),
    [changelogList],
  );

  useEffect(() => {
    setSelectedId(changelogId);
  }, [changelogId]);

  useEffect(() => {
    if (debouncedSearchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    let results: RankedSearchResult[] = [];

    // Queries for mentions, images, etc.
    if (debouncedSearchQuery.startsWith("has:")) {
      const [hasPart, ...searchTerms] = debouncedSearchQuery.split(" ");
      const mediaType = hasPart.substring(4).toLowerCase();
      const additionalQuery = searchTerms.join(" ").toLowerCase();

      const filteredResults = changelogList
        .map((item) => {
          const contentInfo = extractContentInfo(item.sections);

          if (mediaType === "mentions") {
            const hasMentions = contentInfo.mentions.length > 0;
            const matchesAdditionalQuery =
              additionalQuery === "" ||
              item.title.toLowerCase().includes(additionalQuery) ||
              item.sections.toLowerCase().includes(additionalQuery);

            if (hasMentions && matchesAdditionalQuery) {
              return {
                id: item.id,
                title: item.title,
                mediaTypes: contentInfo.mediaTypes,
                mentions: contentInfo.mentions,
                contentPreview: getContentPreview(
                  item.sections,
                  additionalQuery || "@",
                ),
                matchTier: 0,
              } as RankedSearchResult;
            }
            return null;
          }

          const hasMediaType = contentInfo.mediaTypes.includes(mediaType);
          const matchesAdditionalQuery =
            additionalQuery === "" ||
            item.title.toLowerCase().includes(additionalQuery) ||
            item.sections.toLowerCase().includes(additionalQuery);

          if (hasMediaType && matchesAdditionalQuery) {
            return {
              id: item.id,
              title: item.title,
              mediaTypes: contentInfo.mediaTypes,
              mentions: contentInfo.mentions,
              contentPreview: getContentPreview(
                item.sections,
                additionalQuery || mediaType,
              ),
              matchTier: 0,
            } as RankedSearchResult;
          }
          return null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      results = filteredResults;
    } else {
      const searchTokens =
        debouncedSearchQuery.toLowerCase().match(/[a-z0-9]+/g) ?? [];

      results = fuse
        .search(debouncedSearchQuery)
        .map(({ item, matches }) => {
          const contentInfo = extractContentInfo(item.sections);
          const contentMatch = matches?.find(
            (match) => match.key === "sections",
          );

          // Fuse's own fuzzy scoring is too loose on its own (e.g. "goal"
          // matching "gala"), so re-check every matched fragment against the
          // stricter rule used for item search and drop the ones that fail.
          const matchedTerms = new Set<string>();
          let isExactMatch = false;
          for (const match of matches ?? []) {
            if (!match.value) continue;
            for (const [start, end] of match.indices ?? []) {
              const fragment = match.value.slice(start, end + 1);
              if (
                searchTokens.some((token) =>
                  fragment.toLowerCase().includes(token),
                )
              ) {
                matchedTerms.add(fragment);
                isExactMatch = true;
              } else if (
                searchTokens.some((token) => isFuzzyTokenMatch(token, fragment))
              ) {
                matchedTerms.add(fragment);
              }
            }
          }
          const highlightTerms = [...matchedTerms];
          if (highlightTerms.length === 0) return null;

          return {
            id: item.id,
            title: item.title,
            mediaTypes: contentInfo.mediaTypes,
            mentions: contentInfo.mentions,
            contentPreview: contentMatch
              ? getContentPreview(item.sections, highlightTerms)
              : undefined,
            highlightTerms,
            matchTier: isExactMatch ? 0 : 1,
          } as RankedSearchResult;
        })
        .filter((result): result is RankedSearchResult => result !== null);
    }

    // Exact matches rank above fuzzy ones; ties break by newest changelog first.
    setSearchResults(
      [...results].sort((a, b) => a.matchTier - b.matchTier || b.id - a.id),
    );
  }, [debouncedSearchQuery, changelogList, fuse]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleChangelogSelect = async (selectedId: string) => {
    // Find the selected changelog from the already fetched data, handling leading zeros
    const selectedChangelog = changelogList.find(
      (changelog) =>
        changelog.id.toString() === selectedId ||
        changelog.id === parseInt(selectedId),
    );

    if (selectedChangelog) {
      // Update the URL without triggering a full page navigation
      window.history.pushState({}, "", `/changelogs/${selectedId}`);
      setSelectedId(selectedId);
      setSearchQuery("");
      setSearchResults([]);

      // Update the current changelog data directly
      setCurrentChangelogState(selectedChangelog);
      document.title = `${selectedChangelog.title} | Jailbreak Changelogs`;
    } else {
      // If the changelog is not in our list, navigate to fetch it
      router.replace(`/changelogs/${selectedId}`);
    }
  };

  const latestId = Math.max(...changelogList.map((item) => item.id));
  const isLatest = changelog.id === latestId;

  return (
    <main className="min-h-screen">
      <div className="container mx-auto mb-8 px-4 sm:px-6">
        <Breadcrumb />

        <section className="border-border-card mb-8 flex flex-col gap-6 border-b pb-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row">
              <ChangelogSearchInput
                className="w-full sm:flex-1"
                searchQuery={searchQuery}
                searchResults={searchResults}
                isSearching={isSearching}
                isSearchFocused={isSearchFocused}
                onSearchChange={handleSearch}
                onSearchFocus={setIsSearchFocused}
                onChangelogSelect={handleChangelogSelect}
              />
              <ChangelogFilter
                changelogList={changelogList}
                selectedId={selectedId}
                onChangelogSelect={handleChangelogSelect}
              />
            </div>

            <h1 className="page-heading">
              <span className="text-secondary-text flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
                Changelog #{changelog.id}
                {isLatest && (
                  <span className="bg-status-success text-button-success-text inline-flex h-5 items-center rounded-md px-2 text-xs leading-none font-bold normal-case">
                    Latest
                  </span>
                )}
              </span>
              {changelog.title}
            </h1>

            <div className="mt-4 flex flex-wrap gap-2">
              {!isLatest && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleChangelogSelect(latestId.toString())}
                >
                  <Icon icon="heroicons:arrow-uturn-right" inline={true} />
                  Go to Latest Update
                </Button>
              )}
              <Button asChild size="sm" variant="secondary">
                <Link href="/changelogs/timeline">
                  <Icon icon="heroicons:clock" inline={true} />
                  View Timeline
                </Link>
              </Button>
            </div>
          </div>
          {/* Nitro: video-nc unit should sit above the fold */}
          <NitroInlineVideoPlayer
            slotId="np-changelogs-video"
            className="lg:mx-0 lg:w-80 lg:shrink-0"
          />
        </section>

        <ChangelogContent
          title={changelog.title}
          sections={changelog.sections}
          imageUrl={changelog.image_url}
          changelogId={changelog.id}
          onChangelogSelect={handleChangelogSelect}
          changelogList={changelogList}
          initialComments={initialComments}
          initialUserMap={initialUserMap}
        />
      </div>
    </main>
  );
}
