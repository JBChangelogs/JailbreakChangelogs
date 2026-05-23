"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import Image from "next/image";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { createLogger } from "@/services/logger";
import { Icon } from "@/components/ui/IconWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/Pagination";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { formatCustomDate } from "@/utils/helpers/timestamp";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import { convertUrlsToLinks } from "@/utils/ui/urlConverter";
import { UserAvatar } from "@/utils/ui/avatar";
import type { UserData } from "@/types/auth";
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

function SpoilerImage({
  src,
  alt,
  rounded = false,
}: {
  src: string;
  alt: string;
  rounded?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!revealed) {
      setRevealed(true);
    } else {
      setLightbox(true);
    }
  }

  return (
    <>
      <div
        className={`relative cursor-pointer overflow-hidden ${rounded ? "inline-block rounded-full" : "rounded-lg"}`}
        onClick={handleClick}
      >
        <Image
          src={src}
          alt={alt}
          {...(rounded
            ? { width: 64, height: 64 }
            : {
                width: 0,
                height: 0,
                sizes: "100vw",
                style: { width: "100%", height: "auto" },
              })}
          className={`transition-all duration-500 ${rounded ? "rounded-full object-cover" : "rounded-lg"} ${!revealed ? "scale-110 blur-2xl" : "blur-0 scale-100"}`}
          unoptimized
        />
        {!revealed ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            {rounded ? (
              <Icon
                icon="solar:eye-outline"
                className="h-6 w-6 text-white drop-shadow"
              />
            ) : (
              <span className="rounded-md border border-white/30 bg-white/20 px-2 py-0.5 text-xs font-semibold tracking-widest text-white uppercase backdrop-blur-md">
                Spoiler
              </span>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity hover:bg-black/20 hover:opacity-100">
            <Icon
              icon="mdi:magnify-plus-outline"
              className="h-6 w-6 text-white drop-shadow"
            />
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[10000] flex cursor-default flex-col items-center justify-center gap-3 bg-black/90 p-4"
          onClick={(e) => {
            e.stopPropagation();
            setLightbox(false);
          }}
        >
          <button
            className="absolute top-4 right-4 cursor-pointer rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(false);
            }}
          >
            <Icon icon="mdi:close" className="h-5 w-5" />
          </button>
          <Image
            src={src}
            alt={alt}
            width={0}
            height={0}
            sizes="100vw"
            style={{
              width: rounded ? "min(80vh, 80vw)" : "min(95vw, 1400px)",
              height: rounded ? "min(80vh, 80vw)" : "auto",
              maxHeight: "80vh",
              objectFit: "contain",
            }}
            className={rounded ? "rounded-full" : "rounded-lg"}
            unoptimized
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="w-full px-6 text-center font-mono text-xs break-all text-white/50 hover:text-white/80 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {src}
          </a>
        </div>
      )}
    </>
  );
}

export interface ReportMetadataComment {
  id: number;
  date: string;
  author: string;
  content: string;
  item_id: number;
  item_type: string;
  user_id: string;
  edited_at: number | null;
  parent_id: number | null;
}

export interface ReportMetadataDescription {
  user_id: string;
  description: string;
  last_updated: string;
}

export interface ReportMetadataMessage {
  id: number | string;
  content: string;
  user_id: string;
  recipient_id: string | number;
}

export interface ReportMetadataUsername {
  username: string;
  global_name: string;
  last_updated: number;
}

export interface ReportMetadata {
  comment?: ReportMetadataComment;
  avatar?: string;
  username?: string | ReportMetadataUsername;
  global_name?: string;
  banner?: string | null;
  custom_banner?: string;
  description?: ReportMetadataDescription;
  message?: ReportMetadataMessage;
}

export interface ReportUser {
  id: string;
  username: string;
  global_name: string;
  avatar: string;
  custom_avatar?: string;
  usernumber: number;
}

export interface Report {
  id: number;
  report_id: string;
  type: string;
  ref: string;
  content: string;
  metadata: ReportMetadata;
  status: string;
  created_at: number;
  last_updated: number;
  user?: ReportUser;
}

interface ReportsResponse {
  items: Report[];
  page: number;
  total_pages: number;
  total: number;
  size: number;
}

const TYPE_LABELS: Record<string, string> = {
  avatar: "Avatar",
  banner: "Banner",
  description: "Description",
  username: "Username",
  message: "Message",
  comment: "Comment",
};

export function getTypeLabel(type: string) {
  return (
    TYPE_LABELS[type.toLowerCase()] ??
    type.charAt(0).toUpperCase() + type.slice(1)
  );
}

export function getStatusStyle(status: string): {
  label: string;
  className: string;
} {
  const normalized = status.toLowerCase();
  if (normalized === "pending review") {
    return {
      label: "Pending Review",
      className:
        "bg-yellow-500/15 text-primary-text border border-yellow-500/30",
    };
  }
  if (normalized === "action taken") {
    return {
      label: "Action Taken",
      className: "bg-green-500/15 text-primary-text border border-green-500/30",
    };
  }
  if (normalized === "denied") {
    return {
      label: "Denied",
      className:
        "bg-button-danger/15 text-primary-text border border-button-danger/30",
    };
  }
  return {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    className: "text-primary-text border-border-card bg-tertiary-bg border",
  };
}

export function getReportedUserId(report: Report): string | null {
  switch (report.type) {
    case "comment":
      return report.metadata.comment?.user_id ?? null;
    case "message":
      return report.metadata.message?.user_id ?? null;
    case "description":
      return report.metadata.description?.user_id ?? null;
    default:
      // avatar, banner, username — ref is the reported user's Discord ID
      return report.ref;
  }
}

export function ReportContext({ report }: { report: Report }) {
  const router = useRouter();
  const { type, metadata } = report;

  switch (type) {
    case "comment":
      if (metadata.comment) {
        return (
          <div className="border-border-card bg-tertiary-bg mt-2 rounded-lg border p-3">
            <p className="text-secondary-text mb-1 text-xs">
              Comment by{" "}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/users/${metadata.comment!.user_id}`);
                }}
                className="text-link hover:text-link-hover transition-colors"
              >
                {metadata.comment.author}
              </button>{" "}
              on {metadata.comment.item_type} #{metadata.comment.item_id}
            </p>
            <p className="text-primary-text line-clamp-3 text-sm break-words">
              {metadata.comment.content}
            </p>
          </div>
        );
      }
      return null;

    case "avatar":
      if (metadata.avatar) {
        return (
          <div className="border-border-card bg-tertiary-bg mt-2 rounded-lg border p-3">
            <p className="text-secondary-text mb-2 text-xs">Reported avatar</p>
            <SpoilerImage src={metadata.avatar} alt="Reported avatar" rounded />
          </div>
        );
      }
      return null;

    case "banner":
      if (metadata.custom_banner ?? metadata.banner) {
        return (
          <div className="border-border-card bg-tertiary-bg mt-2 rounded-lg border p-3">
            <p className="text-secondary-text mb-2 text-xs">Reported banner</p>
            <SpoilerImage
              src={(metadata.custom_banner ?? metadata.banner) as string}
              alt="Reported banner"
            />
          </div>
        );
      }
      return null;

    case "username": {
      const usernameObj =
        metadata.username && typeof metadata.username === "object"
          ? metadata.username
          : null;
      const usernameStr = usernameObj
        ? usernameObj.username
        : typeof metadata.username === "string"
          ? metadata.username
          : undefined;
      const globalNameStr = usernameObj
        ? usernameObj.global_name
        : metadata.global_name;
      const hasGlobalName = globalNameStr && globalNameStr !== "None";
      const displayName = hasGlobalName
        ? `${globalNameStr}${usernameStr ? ` (@${usernameStr})` : ""}`
        : usernameStr
          ? `@${usernameStr}`
          : "";
      return (
        <div className="border-border-card bg-tertiary-bg mt-2 rounded-lg border p-3">
          <p className="text-secondary-text text-xs">Reported username</p>
          <p className="text-primary-text text-sm font-medium">{displayName}</p>
        </div>
      );
    }

    case "description":
      if (metadata.description?.description) {
        return (
          <div className="border-border-card bg-tertiary-bg mt-2 rounded-lg border p-3">
            <p className="text-secondary-text mb-1 text-xs">
              Reported description
            </p>
            <p className="text-primary-text/80 mt-0.5 line-clamp-4 text-sm break-words whitespace-pre-wrap">
              {convertUrlsToLinks(
                sanitizeText(metadata.description.description),
              )}
            </p>
          </div>
        );
      }
      return null;

    case "message":
      if (metadata.message?.content) {
        return (
          <div className="border-border-card bg-tertiary-bg mt-2 rounded-lg border p-3">
            <p className="text-secondary-text mb-1 text-xs">Reported message</p>
            <p className="text-primary-text line-clamp-3 text-sm break-words">
              {metadata.message.content}
            </p>
          </div>
        );
      }
      return null;

    default:
      return null;
  }
}

export default function MyReports() {
  const router = useRouter();
  const [pageParam, setPageParam] = useQueryState("page", {
    defaultValue: "1",
    history: "push",
    shallow: true,
  });

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [reports, setReports] = useState<Report[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportedUsers, setReportedUsers] = useState<Record<string, UserData>>(
    {},
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (typeFilter !== "all" && report.type !== typeFilter) return false;
      if (
        statusFilter !== "all" &&
        report.status.toLowerCase() !== statusFilter
      )
        return false;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const reportedId = getReportedUserId(report);
        const reportedUser = reportedId ? reportedUsers[reportedId] : undefined;
        const matches =
          report.ref.toLowerCase().includes(q) ||
          (reportedId?.toLowerCase().includes(q) ?? false) ||
          (reportedUser?.username.toLowerCase().includes(q) ?? false) ||
          (reportedUser?.global_name?.toLowerCase().includes(q) ?? false);
        if (!matches) return false;
      }
      return true;
    });
  }, [reports, typeFilter, statusFilter, debouncedSearch, reportedUsers]);

  const fetchReports = useCallback(async (currentPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/reports/me?page=${currentPage}`,
      );
      const response = await fetch(url, {
        credentials: "include",
        cache: "no-store",
        headers,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        if (response.status === 404) {
          setReports([]);
          setTotalPages(1);
          setTotal(0);
          return;
        }
        log.error("Failed to fetch reports", { status: response.status, body });
        throw new Error(
          (body as { message?: string })?.message ?? "Failed to load reports",
        );
      }

      const data: ReportsResponse = await response.json();
      const items = data.items ?? [];
      setReports(items);
      setTotalPages(data.total_pages ?? 1);
      setTotal(data.total ?? 0);

      const ids = [
        ...new Set(
          items.map(getReportedUserId).filter((id): id is string => !!id),
        ),
      ];
      if (ids.length > 0) {
        try {
          const usersRes = await fetch(
            `/api/users/batch?ids=${encodeURIComponent(ids.join(","))}`,
            { cache: "no-store" },
          );
          if (usersRes.ok) {
            const usersArr = (await usersRes.json()) as UserData[];
            setReportedUsers(
              usersArr.reduce<Record<string, UserData>>((acc, u) => {
                acc[u.id] = u;
                return acc;
              }, {}),
            );
          }
        } catch {
          // non-critical
        }
      }
    } catch (err) {
      log.error("Error fetching reports:", err);
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReports(page);
  }, [page, fetchReports]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    void setPageParam(String(value));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen pb-8">
      <div className="container mx-auto max-w-7xl px-4">
        <Breadcrumb />

        <div className="mb-4 flex items-center gap-2">
          <Icon icon="heroicons:flag" className="text-primary-text h-5 w-5" />
          <h1 className="text-primary-text text-lg font-semibold">
            My Reports
          </h1>
          {!loading && (
            <span className="text-secondary-text text-sm">({total})</span>
          )}
        </div>

        {/* Search and filter controls */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row">
          {/* Search input */}
          <div className="w-full lg:w-1/3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by ref ID, user ID, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info h-14 w-full rounded-lg border px-4 pr-10 pl-10 transition-all duration-300 focus:outline-none"
              />
              <Icon
                icon="heroicons:magnifying-glass"
                className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
                  aria-label="Clear search"
                >
                  <Icon icon="heroicons:x-mark" />
                </button>
              )}
            </div>
          </div>

          {/* Type and status dropdowns */}
          <div className="grid w-full grid-cols-2 gap-4 lg:flex lg:flex-1 lg:gap-4">
            {/* Type filter */}
            <div className="col-span-1 w-full lg:w-1/2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info hover:border-border-focus flex h-14 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:outline-none"
                  >
                    <span className="truncate">
                      {typeFilter === "all"
                        ? "All Types"
                        : getTypeLabel(typeFilter)}
                    </span>
                    <Icon
                      icon="heroicons:chevron-down"
                      className="text-secondary-text h-5 w-5 shrink-0"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="border-border-card bg-secondary-bg text-primary-text w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) rounded-xl border p-1 shadow-lg"
                >
                  <DropdownMenuRadioGroup
                    value={typeFilter}
                    onValueChange={setTypeFilter}
                  >
                    {[
                      { value: "all", label: "All Types" },
                      { value: "avatar", label: "Avatar" },
                      { value: "banner", label: "Banner" },
                      { value: "comment", label: "Comment" },
                      { value: "description", label: "Description" },
                      { value: "message", label: "Message" },
                      { value: "username", label: "Username" },
                    ].map((opt) => (
                      <DropdownMenuRadioItem
                        key={opt.value}
                        value={opt.value}
                        className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                      >
                        {opt.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Status filter */}
            <div className="col-span-1 w-full lg:w-1/2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info hover:border-border-focus flex h-14 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:outline-none"
                  >
                    <span className="truncate">
                      {statusFilter === "all"
                        ? "All Statuses"
                        : getStatusStyle(statusFilter).label ||
                          statusFilter
                            .split(" ")
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(" ")}
                    </span>
                    <Icon
                      icon="heroicons:chevron-down"
                      className="text-secondary-text h-5 w-5 shrink-0"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="border-border-card bg-secondary-bg text-primary-text w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) rounded-xl border p-1 shadow-lg"
                >
                  <DropdownMenuRadioGroup
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    {[
                      { value: "all", label: "All Statuses" },
                      { value: "action taken", label: "Action Taken" },
                      { value: "denied", label: "Denied" },
                      { value: "pending review", label: "Pending Review" },
                    ].map((opt) => (
                      <DropdownMenuRadioItem
                        key={opt.value}
                        value={opt.value}
                        className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                      >
                        {opt.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {loading ? (
          <>
            {/* Search controls skeleton */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row">
              <div className="w-full lg:w-1/3">
                <Skeleton style={{ height: 56 }} />
              </div>
              <div className="grid w-full grid-cols-2 gap-4 lg:flex lg:flex-1 lg:gap-4">
                <Skeleton style={{ height: 56 }} />
                <Skeleton style={{ height: 56 }} />
              </div>
            </div>
            {/* Card grid skeleton */}
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="border-border-card bg-secondary-bg flex flex-col rounded-lg border p-4 shadow-sm"
                >
                  {/* Badge row + date */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex gap-2">
                      <Skeleton style={{ width: 64, height: 22 }} />
                      <Skeleton style={{ width: 100, height: 22 }} />
                    </div>
                    <Skeleton style={{ width: 80, height: 16 }} />
                  </div>
                  {/* Reported user row */}
                  <div className="mt-2 flex items-center gap-2">
                    <Skeleton style={{ width: 78, height: 14 }} />
                    <Skeleton
                      style={{ width: 28, height: 28 }}
                      className="rounded-full"
                    />
                    <Skeleton style={{ width: 90, height: 14 }} />
                  </div>
                  {/* Content preview box */}
                  <div className="border-border-card bg-tertiary-bg mt-2 rounded-lg border p-3">
                    <Skeleton style={{ width: 100, height: 12 }} />
                    <Skeleton
                      style={{ width: "100%", height: 14 }}
                      className="mt-1"
                    />
                  </div>
                  {/* Reason */}
                  <Skeleton
                    style={{ width: "75%", height: 14 }}
                    className="mt-2"
                  />
                  {/* IDs */}
                  <div className="mt-1 space-y-1">
                    <Skeleton style={{ width: 130, height: 12 }} />
                    <Skeleton style={{ width: 170, height: 12 }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : error ? (
          <div className="border-border-card bg-secondary-bg rounded-lg border p-8 text-center shadow-sm">
            <Icon
              icon="heroicons:exclamation-circle"
              className="text-button-danger mx-auto mb-3 h-10 w-10"
            />
            <p className="text-primary-text font-medium">
              Failed to load reports
            </p>
            <p className="text-secondary-text mt-1 text-sm">{error}</p>
            <button
              onClick={() => void fetchReports(page)}
              className="text-link hover:text-link-hover mt-3 cursor-pointer text-sm transition-colors"
            >
              Try again
            </button>
          </div>
        ) : reports.length === 0 ? (
          <div className="border-border-card bg-secondary-bg rounded-lg border p-8 text-center shadow-sm">
            <Icon
              icon="heroicons:flag"
              className="text-secondary-text mx-auto mb-3 h-10 w-10 opacity-40"
            />
            <p className="text-primary-text font-medium">No reports yet</p>
            <p className="text-secondary-text mt-1 text-sm">
              Reports you submit will appear here.
            </p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="border-border-card bg-secondary-bg rounded-lg border p-8 text-center">
            <Icon
              icon="heroicons:magnifying-glass"
              className="text-secondary-text mx-auto mb-3 h-10 w-10 opacity-40"
            />
            <p className="text-primary-text font-medium">
              {(() => {
                let msg = "No reports found";
                if (debouncedSearch) msg += ` matching "${debouncedSearch}"`;
                if (typeFilter !== "all")
                  msg += ` in ${getTypeLabel(typeFilter)}`;
                if (statusFilter !== "all")
                  msg += ` with ${getStatusStyle(statusFilter).label} status`;
                return msg;
              })()}
            </p>
            <p className="text-secondary-text mt-1 text-sm">
              Try adjusting your search or filter.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {debouncedSearch &&
                (typeFilter !== "all" || statusFilter !== "all") && (
                  <Button variant="secondary" onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                )}
              <Button
                variant="default"
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
              {filteredReports.map((report) => {
                const statusStyle = getStatusStyle(report.status);
                const reportedId = getReportedUserId(report);
                const reportedUser = reportedId
                  ? reportedUsers[reportedId]
                  : undefined;
                const hasGlobalName =
                  reportedUser?.global_name &&
                  reportedUser.global_name !== "None";
                const reportedDisplayName = reportedUser
                  ? hasGlobalName
                    ? reportedUser.global_name
                    : `@${reportedUser.username}`
                  : null;
                return (
                  <div
                    key={String(report.id)}
                    onClick={() => router.push(`/reports/${report.report_id}`)}
                    className="border-border-card bg-secondary-bg hover:bg-tertiary-bg flex cursor-pointer flex-col rounded-lg border p-4 shadow-sm transition-colors"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-tertiary-bg border-border-card text-primary-text rounded-md border px-2 py-0.5 text-xs font-medium">
                          {getTypeLabel(report.type)}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-medium ${statusStyle.className}`}
                        >
                          {statusStyle.label}
                        </span>
                        <span className="text-secondary-text font-mono text-xs">
                          #{report.id}
                        </span>
                      </div>
                      <span className="text-secondary-text text-xs">
                        {formatCustomDate(report.created_at * 1000)}
                      </span>
                    </div>

                    {reportedUser && reportedDisplayName && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-secondary-text text-xs">
                          Reported user:
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(`/users/${reportedUser.id}`);
                          }}
                          className="flex cursor-pointer items-center gap-1.5 transition-opacity hover:opacity-80"
                        >
                          <UserAvatar
                            userId={reportedUser.id}
                            avatarHash={reportedUser.avatar}
                            username={reportedUser.username}
                            custom_avatar={reportedUser.custom_avatar}
                            settings={{
                              custom_avatar:
                                reportedUser.settings_v2?.custom_avatar,
                            }}
                            premiumType={reportedUser.premiumtype}
                            size={7}
                            showBadge={false}
                          />
                          <span className="text-link hover:text-link-hover text-xs font-medium transition-colors">
                            {reportedDisplayName}
                          </span>
                        </button>
                      </div>
                    )}

                    <ReportContext report={report} />

                    <p className="text-primary-text mt-2 text-sm break-words">
                      <span className="text-secondary-text">Reason: </span>
                      {report.content}
                    </p>

                    <div className="mt-1 space-y-0.5 text-xs">
                      <p className="text-secondary-text">
                        Reference ID:{" "}
                        <span className="text-primary-text truncate font-mono">
                          {report.ref}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
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
