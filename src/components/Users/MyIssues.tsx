"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryState } from "nuqs";
import { Icon } from "@/components/ui/IconWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/Pagination";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import SubmissionTabs from "@/components/Users/SubmissionTabs";
import { getResponseErrorMessage, PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { formatCustomDate } from "@/utils/helpers/timestamp";
import { createLogger } from "@/services/logger";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const log = createLogger("UI");

type Issue = {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: number;
};

type IssuesResponse = {
  total: number;
  items: Issue[];
  page: number;
  total_pages: number;
  size: number;
};

function getStatusStyle(status: string) {
  switch (status.toLowerCase()) {
    case "resolved":
      return "border-green-500/25 bg-green-500/10 text-primary-text";
    case "acknowledged":
      return "border-blue-500/25 bg-blue-500/10 text-primary-text";
    case "wont fix":
      return "bg-button-danger/15 text-primary-text border-button-danger/30";
    default:
      return "border-yellow-500/25 bg-yellow-500/10 text-primary-text";
  }
}

function getStatusLabel(status: string) {
  return status === "Wont Fix" ? "Won't Fix" : status;
}

function getSortLabel(sort: string) {
  return sort
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function IssueDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = description.length > 220;

  return (
    <div className="mt-2">
      <p
        className={`text-secondary-text text-sm leading-relaxed break-words whitespace-pre-wrap ${expanded ? "" : "line-clamp-4"}`}
      >
        {description}
      </p>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="text-link hover:text-link-hover mt-2 cursor-pointer text-xs font-medium transition-colors"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

export default function MyIssues() {
  const [pageParam, setPageParam] = useQueryState("page", {
    defaultValue: "1",
    history: "push",
    shallow: true,
  });
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const [sort, setSort] = useQueryState("sort", {
    history: "push",
    shallow: true,
  });
  const [issues, setIssues] = useState<Issue[]>([]);
  const [sortTypes, setSortTypes] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredIssues = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return issues.filter((issue) => {
      if (!query) return true;
      return (
        String(issue.id).includes(query) ||
        issue.title.toLowerCase().includes(query) ||
        issue.description.toLowerCase().includes(query)
      );
    });
  }, [debouncedSearch, issues]);

  const fetchIssues = useCallback(
    async (currentPage: number, currentSort: string | null) => {
      setLoading(true);
      setError(null);
      try {
        const { url, headers } = buildApiFetchRequest(
          PUBLIC_API_URL,
          `/issues/me?page=${currentPage}${currentSort ? `&sort=${encodeURIComponent(currentSort)}` : ""}`,
        );
        const response = await fetch(url, {
          credentials: "include",
          cache: "no-store",
          headers,
        });
        if (!response.ok) {
          throw new Error(
            await getResponseErrorMessage(response, "Failed to load issues"),
          );
        }

        const data = (await response.json()) as IssuesResponse;
        setIssues(Array.isArray(data.items) ? data.items : []);
        setTotal(data.total ?? 0);
        setTotalPages(Math.max(1, data.total_pages ?? 1));
      } catch (fetchError) {
        log.error("Error fetching reported issues", fetchError);
        setIssues([]);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load issues",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchIssues(page, sort);
  }, [fetchIssues, page, sort]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchSortTypes = async () => {
      try {
        const { url, headers } = buildApiFetchRequest(
          PUBLIC_API_URL,
          "/issues/sorts",
        );
        const response = await fetch(url, {
          cache: "no-store",
          headers,
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as unknown;
        if (
          Array.isArray(data) &&
          data.every((value) => typeof value === "string")
        ) {
          setSortTypes(data);
        }
      } catch (sortError) {
        if (!controller.signal.aborted) {
          log.error("Error fetching issue sort types", sortError);
        }
      }
    };
    void fetchSortTypes();
    return () => controller.abort();
  }, []);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    void setPageParam(String(value));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen pb-8">
      <div className="container mx-auto max-w-7xl px-4">
        <Breadcrumb />

        <div className="mb-4 flex items-center gap-2">
          <Icon
            icon="heroicons:inbox-stack"
            className="text-primary-text h-5 w-5"
          />
          <h1 className="text-primary-text text-lg font-semibold">
            My Reports
          </h1>
          {!loading && (
            <span className="text-secondary-text text-sm">
              ({total} issues)
            </span>
          )}
        </div>

        <SubmissionTabs active="issues" />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <input
              type="text"
              placeholder="Search by issue ID, title, or description..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info h-11 w-full rounded-lg border px-10 text-sm transition-colors focus:outline-none"
            />
            <Icon
              icon="heroicons:magnifying-glass"
              className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
                aria-label="Clear search"
              >
                <Icon icon="heroicons:x-mark" />
              </button>
            )}
          </div>

          <div className="w-full sm:w-52">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info hover:border-border-focus flex h-11 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-colors focus:outline-none"
                >
                  <span>
                    {sort
                      ? getSortLabel(sort)
                      : sortTypes[0]
                        ? getSortLabel(sortTypes[0])
                        : "Sort"}
                  </span>
                  <Icon
                    icon="heroicons:chevron-down"
                    className="text-secondary-text h-5 w-5"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="border-border-card bg-secondary-bg text-primary-text w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) rounded-xl border p-1.5 shadow-lg"
              >
                <DropdownMenuRadioGroup
                  value={sort ?? sortTypes[0] ?? ""}
                  onValueChange={(value) => {
                    void setSort(value);
                    void setPageParam("1");
                  }}
                >
                  {sortTypes.map((value) => (
                    <DropdownMenuRadioItem
                      key={value}
                      value={value}
                      className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                    >
                      {getSortLabel(value)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="border-border-card bg-secondary-bg h-full rounded-xl border p-4 sm:p-5"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Skeleton
                      style={{ width: 36, height: 36 }}
                      className="rounded-lg"
                    />
                    <div className="space-y-1.5">
                      <Skeleton style={{ width: 92, height: 14 }} />
                    </div>
                    <Skeleton style={{ width: 80, height: 26 }} />
                  </div>
                  <Skeleton style={{ width: 90, height: 14 }} />
                </div>
                <Skeleton
                  className="mb-3"
                  style={{ width: "65%", height: 18 }}
                />
                <Skeleton style={{ height: 54 }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="border-border-card bg-secondary-bg rounded-2xl border p-10 text-center shadow-sm">
            <Icon
              icon="heroicons:exclamation-circle"
              className="text-button-danger mx-auto mb-3 h-10 w-10"
            />
            <p className="text-primary-text font-medium">
              Failed to load reported issues
            </p>
            <p className="text-secondary-text mt-1 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => void fetchIssues(page, sort)}
              className="bg-button-info text-form-button-text hover:bg-button-info-hover mt-4 rounded-lg px-4 py-2 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        ) : issues.length === 0 ? (
          <div className="border-border-card bg-secondary-bg rounded-2xl border p-10 text-center shadow-sm">
            <Icon
              icon="heroicons:check-circle"
              className="text-secondary-text mx-auto mb-3 h-10 w-10"
            />
            <p className="text-primary-text font-medium">
              No reported issues yet
            </p>
            <p className="text-secondary-text mt-1 text-sm">
              Issues you submit will appear here.
            </p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="border-border-card bg-secondary-bg rounded-2xl border p-10 text-center shadow-sm">
            <Icon
              icon="heroicons:magnifying-glass"
              className="text-secondary-text mx-auto mb-3 h-10 w-10"
            />
            <p className="text-primary-text font-medium">
              No issues match your filters
            </p>
            <p className="text-secondary-text mt-1 text-sm">
              Try another search or status.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="mt-4"
              onClick={() => {
                setSearchTerm("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredIssues.map((issue) => (
                <article
                  key={issue.id}
                  className="border-border-card bg-secondary-bg hover:border-border-focus relative h-full rounded-xl border p-4 transition-colors sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                      <span className="bg-button-info/10 text-button-info flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                        <Icon icon="heroicons:flag" className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <p className="text-primary-text text-sm font-semibold">
                          Issue #{issue.id}
                        </p>
                      </div>
                      <span
                        className={`inline-flex h-5 items-center rounded-lg border px-2 text-[10px] leading-none font-medium backdrop-blur-xl sm:h-6 sm:px-2.5 sm:text-xs ${getStatusStyle(issue.status)}`}
                      >
                        {getStatusLabel(issue.status)}
                      </span>
                    </div>
                    <time className="text-secondary-text pt-1 text-right text-xs">
                      {formatCustomDate(issue.created_at * 1000)}
                    </time>
                  </div>
                  <div className="relative z-10 mt-3 sm:pl-11">
                    <h2 className="text-primary-text text-base font-semibold break-words">
                      {issue.title}
                    </h2>
                    <IssueDescription description={issue.description} />
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
