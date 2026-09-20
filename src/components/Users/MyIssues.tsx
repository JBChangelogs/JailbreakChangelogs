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
      return "border-green-500/25 bg-green-500/10 text-green-600 dark:text-green-400";
    case "acknowledged":
      return "border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "wont fix":
      return "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400";
    default:
      return "border-yellow-500/25 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
  }
}

function getStatusLabel(status: string) {
  return status === "Wont Fix" ? "Won't Fix" : status;
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
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredIssues = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return issues.filter((issue) => {
      if (
        statusFilter !== "all" &&
        issue.status.toLowerCase() !== statusFilter
      ) {
        return false;
      }
      if (!query) return true;
      return (
        String(issue.id).includes(query) ||
        issue.title.toLowerCase().includes(query) ||
        issue.description.toLowerCase().includes(query)
      );
    });
  }, [debouncedSearch, issues, statusFilter]);

  const fetchIssues = useCallback(async (currentPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/issues/me?page=${currentPage}`,
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
  }, []);

  useEffect(() => {
    void fetchIssues(page);
  }, [fetchIssues, page]);

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
            My Submissions
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
                    {statusFilter === "all"
                      ? "All Statuses"
                      : getStatusLabel(
                          statusFilter === "wont fix"
                            ? "Wont Fix"
                            : statusFilter.replace(/\b\w/g, (character) =>
                                character.toUpperCase(),
                              ),
                        )}
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
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  {[
                    { value: "all", label: "All Statuses" },
                    { value: "pending", label: "Pending" },
                    { value: "acknowledged", label: "Acknowledged" },
                    { value: "resolved", label: "Resolved" },
                    { value: "wont fix", label: "Won't Fix" },
                  ].map((option) => (
                    <DropdownMenuRadioItem
                      key={option.value}
                      value={option.value}
                      className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                    >
                      {option.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="border-border-card bg-secondary-bg rounded-xl border p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Skeleton
                      style={{ width: 36, height: 36 }}
                      className="rounded-lg"
                    />
                    <div className="space-y-1.5">
                      <Skeleton style={{ width: 92, height: 14 }} />
                      <Skeleton style={{ width: 62, height: 10 }} />
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
              onClick={() => void fetchIssues(page)}
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
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
              {filteredIssues.map((issue) => (
                <article
                  key={issue.id}
                  className="border-border-card bg-secondary-bg hover:border-border-focus group relative overflow-hidden rounded-xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                      <span className="bg-button-info/10 text-button-info flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                        <Icon icon="heroicons:flag" className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <p className="text-primary-text text-sm font-semibold">
                          Reported issue
                        </p>
                        <p className="text-secondary-text text-[11px]">
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
                  <h2 className="text-primary-text relative z-10 mt-4 text-base font-semibold break-words">
                    {issue.title}
                  </h2>
                  <div className="relative z-10">
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
