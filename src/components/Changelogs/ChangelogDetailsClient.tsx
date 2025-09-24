"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "@mui/material";
import { extractContentInfo, getContentPreview } from "@/utils/changelogs";
import { useDebounce } from "@/hooks/useDebounce";
import { darkTheme } from "@/theme/darkTheme";
import { Skeleton } from "@mui/material";
import dynamic from "next/dynamic";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Changelog, CommentData } from "@/utils/api";
import { UserData } from "@/types/auth";

// Dynamic imports for heavy components
const ChangelogHeader = dynamic(
  () => import("@/components/Changelogs/ChangelogHeader"),
  {
    loading: () => (
      <div className="bg-secondary-bg mb-4 h-16 animate-pulse rounded" />
    ),
    ssr: true,
  },
);

const ChangelogFilter = dynamic(
  () => import("@/components/Changelogs/ChangelogFilter"),
  {
    loading: () => (
      <div className="bg-secondary-bg mb-4 h-20 animate-pulse rounded" />
    ),
    ssr: true,
  },
);

const ChangelogContent = dynamic(
  () => import("@/components/Changelogs/ChangelogContent"),
  {
    loading: () => (
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-12">
        <div className="sm:col-span-12 lg:col-span-8">
          <Skeleton
            variant="text"
            height={80}
            sx={{ bgcolor: "var(--color-secondary-bg)", mb: 4 }}
          />
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton
                  variant="text"
                  width="60%"
                  height={40}
                  sx={{ bgcolor: "var(--color-secondary-bg)" }}
                />
                <div className="space-y-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <Skeleton
                        variant="circular"
                        width={24}
                        height={24}
                        sx={{ bgcolor: "var(--color-secondary-bg)", mt: 0.5 }}
                      />
                      <Skeleton
                        variant="text"
                        width={`${j === 0 ? "90%" : j === 1 ? "85%" : j === 2 ? "75%" : "80%"}`}
                        height={24}
                        sx={{ bgcolor: "var(--color-secondary-bg)" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-8 sm:col-span-12 lg:col-span-4">
          <Skeleton
            variant="rectangular"
            height={200}
            sx={{ bgcolor: "var(--color-secondary-bg)", borderRadius: "8px" }}
          />
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

  // Use state to manage the current changelog
  const [currentChangelogState, setCurrentChangelogState] =
    useState(currentChangelog);
  const changelog = currentChangelogState;

  const [selectedId, setSelectedId] = useState(changelogId);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Update selectedId when changelogId changes
  useEffect(() => {
    setSelectedId(changelogId);
  }, [changelogId]);

  // Handle search functionality
  useEffect(() => {
    if (debouncedSearchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    let results: SearchResult[] = [];

    // Queries for mentions, images, etc.
    if (debouncedSearchQuery.startsWith("has:")) {
      const [hasPart, ...searchTerms] = debouncedSearchQuery.split(" ");
      const mediaType = hasPart.substring(4).toLowerCase();
      const additionalQuery = searchTerms.join(" ").toLowerCase();

      const filteredResults = changelogList
        .map((item) => {
          const contentInfo = extractContentInfo(item.sections);

          // Special handling for mentions
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
              } as SearchResult;
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
            } as SearchResult;
          }
          return null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      results = filteredResults;
    } else {
      const filteredResults = changelogList
        .map((item) => {
          const titleMatch = item.title
            .toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase());
          const contentMatch = item.sections
            .toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase());

          if (titleMatch || contentMatch) {
            const contentInfo = extractContentInfo(item.sections);
            return {
              id: item.id,
              title: item.title,
              mediaTypes: contentInfo.mediaTypes,
              mentions: contentInfo.mentions,
              contentPreview: contentMatch
                ? getContentPreview(item.sections, debouncedSearchQuery)
                : undefined,
            } as SearchResult;
          }
          return null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      results = filteredResults;
    }

    setSearchResults(results);
  }, [debouncedSearchQuery, changelogList]);

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
    } else {
      // If the changelog is not in our list, navigate to fetch it
      router.replace(`/changelogs/${selectedId}`);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <main className="min-h-screen">
        <div className="container mx-auto mb-8 px-4 sm:px-6">
          <Breadcrumb />
          <ChangelogHeader />
          <ChangelogFilter
            changelogList={changelogList}
            selectedId={selectedId}
            onChangelogSelect={handleChangelogSelect}
            searchQuery={searchQuery}
            searchResults={searchResults}
            isSearchFocused={isSearchFocused}
            onSearchChange={handleSearch}
            onSearchFocus={setIsSearchFocused}
          />

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
    </ThemeProvider>
  );
}
