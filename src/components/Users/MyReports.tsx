"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "nextjs-toploader/app";
import Link from "next/link";
import { useQueryState } from "nuqs";
import Image from "next/image";
import { fetchItemByIdClient, PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { createLogger } from "@/services/logger";
import { Icon } from "@/components/ui/IconWrapper";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { humanizeIdentifier } from "@/utils/humanizeIdentifier";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import SubmissionTabs from "@/components/Users/SubmissionTabs";
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

  const imageProps = rounded
    ? { width: 64, height: 64 }
    : {
        width: 0,
        height: 0,
        sizes: "100vw",
        style: { width: "100%", height: "auto" },
      };

  if (revealed) {
    return (
      <ImageLightbox
        src={src}
        alt={alt}
        compact={rounded}
        showUrl
        stopPropagation
        previewRadius={rounded ? "rounded-full" : "rounded-lg"}
        className={rounded ? "inline-block" : undefined}
      >
        <Image
          src={src}
          alt={alt}
          {...imageProps}
          className={
            rounded ? "rounded-full object-cover" : "w-full rounded-lg"
          }
          unoptimized
        />
      </ImageLightbox>
    );
  }

  return (
    <button
      type="button"
      aria-label={`Reveal ${alt}`}
      className={`relative cursor-pointer overflow-hidden ${rounded ? "inline-block rounded-full" : "rounded-lg"}`}
      onClick={(event) => {
        event.stopPropagation();
        setRevealed(true);
      }}
    >
      <Image
        src={src}
        alt={alt}
        {...imageProps}
        className={`scale-110 blur-2xl transition-all duration-500 ${rounded ? "rounded-full object-cover" : "rounded-lg"}`}
        unoptimized
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/30">
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
      </span>
    </button>
  );
}

export interface ReportMetadataComment {
  id?: number;
  date: string;
  author: string;
  content: string;
  item_id: number;
  item_type: string;
  user_id: string | number;
  edited_at: number | null;
  parent_id: number | null;
}

export interface ReportMetadataDescription {
  user_id: string | number;
  description: string;
  last_updated: string;
}

export interface ReportMetadataMessage {
  id: number | string;
  content: string;
  user_id: string | number;
  recipient_id: string | number;
}

export interface ReportMetadataSuggestion {
  id: number;
  field: string;
  current_value: string;
  suggested_value: string;
  author: string;
  user_id: string | number;
  item_id: number;
  item_name: string;
  item_type: string;
}

export interface ReportMetadataUsername {
  username: string;
  global_name: string;
  last_updated: number;
}

export interface ReportMetadataUser {
  username: string;
  global_name: string;
}

export interface ReportMetadataItem {
  id: string | number;
  name: string;
  type: string;
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
  suggestion?: ReportMetadataSuggestion;
  user?: ReportMetadataUser;
  item?: ReportMetadataItem;
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

export function getTypeLabel(type: string) {
  return humanizeIdentifier(type);
}

function CopyIdentifierButton({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access may be unavailable in an insecure context.
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={copyReference}
          className="text-secondary-text hover:bg-quaternary-bg hover:text-primary-text flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors"
          aria-label={copied ? `${label} copied` : `Copy ${label}`}
        >
          <Icon
            icon={copied ? "heroicons:check" : "heroicons:clipboard-document"}
            className={copied ? "text-button-success h-4 w-4" : "h-4 w-4"}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied" : `Copy ${label}`}</TooltipContent>
    </Tooltip>
  );
}

function ItemTypeBadge({ type }: { type: string }) {
  const categoryColor = getCategoryColor(type);
  const categoryIcon = getCategoryIcon(type);

  return (
    <span
      className="text-primary-text bg-tertiary-bg/40 inline-flex h-5 items-center rounded-lg border px-2 text-[10px] leading-none font-medium backdrop-blur-xl sm:h-6 sm:px-2.5 sm:text-xs"
      style={{
        borderColor: categoryColor,
        backgroundColor: `${categoryColor}22`,
      }}
    >
      {categoryIcon && (
        <categoryIcon.Icon
          className="mr-1.5 h-3 w-3"
          style={{ color: categoryColor }}
        />
      )}
      {type}
    </span>
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

function normalizeUserId(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function getCommentTargetUrl(comment: ReportMetadataComment): string | null {
  switch (comment.item_type.toLowerCase()) {
    case "changelog":
      return `/changelogs/${comment.item_id}`;
    case "season":
      return `/seasons/${comment.item_id}`;
    case "tradev2":
      return `/trading/ad/${comment.item_id}`;
    case "inventory":
      return `/inventories/${comment.item_id}`;
    case "vsuggestion":
      return `/items/suggestions/${comment.item_id}`;
    default:
      return null;
  }
}

export function getReportedUserId(report: Report): string | null {
  switch (report.type) {
    case "comment":
      return normalizeUserId(report.metadata.comment?.user_id);
    case "message":
      return normalizeUserId(report.metadata.message?.user_id);
    case "value_suggestions":
      return normalizeUserId(report.metadata.suggestion?.user_id);
    case "description":
      return normalizeUserId(
        report.metadata.description?.user_id ?? report.ref,
      );
    case "avatar":
    case "banner":
    case "username":
    case "user":
      return normalizeUserId(report.ref);
    case "item_info":
    case "false_dupe":
      return null;
    default:
      return null;
  }
}

export function ReportContext({ report }: { report: Report }) {
  const router = useRouter();
  const { type, metadata } = report;
  const contextClassName =
    "border-border-card bg-tertiary-bg/55 mt-3 rounded-xl border p-3.5";

  switch (type) {
    case "comment":
      if (metadata.comment) {
        const commentTargetUrl = getCommentTargetUrl(metadata.comment);
        return (
          <div className={contextClassName}>
            <p className="text-secondary-text mb-2 flex items-center gap-1.5 text-xs">
              <Icon icon="heroicons:chat-bubble-left" className="h-3.5 w-3.5" />
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
              {commentTargetUrl ? (
                <Link
                  href={commentTargetUrl}
                  prefetch={false}
                  onClick={(event) => event.stopPropagation()}
                  className="text-link hover:text-link-hover inline-flex items-center gap-1 transition-colors"
                >
                  on {getTypeLabel(metadata.comment.item_type)} #
                  {metadata.comment.item_id}
                  <Icon
                    icon="heroicons:arrow-top-right-on-square"
                    className="h-3 w-3"
                  />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={async (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const item = await fetchItemByIdClient(
                      String(metadata.comment!.item_id),
                    );
                    if (!item) return;
                    router.push(
                      `/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`,
                    );
                  }}
                  className="text-link hover:text-link-hover inline-flex cursor-pointer items-center gap-1 transition-colors"
                >
                  on {getTypeLabel(metadata.comment.item_type)} #
                  {metadata.comment.item_id}
                  <Icon
                    icon="heroicons:arrow-top-right-on-square"
                    className="h-3 w-3"
                  />
                </button>
              )}
            </p>
            <p className="text-primary-text border-border-focus/40 line-clamp-3 border-l-2 pl-3 text-sm leading-relaxed break-words">
              {metadata.comment.content}
            </p>
          </div>
        );
      }
      return null;

    case "user": {
      const reportedUser = metadata.user;
      if (!reportedUser) return null;

      const hasGlobalName =
        reportedUser.global_name && reportedUser.global_name !== "None";
      return (
        <div className={`${contextClassName} flex items-center gap-3`}>
          <div className="bg-button-danger/10 text-button-danger flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
            <Icon icon="heroicons:user" className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-secondary-text text-xs">Reported user</p>
            <p className="text-primary-text truncate text-sm font-medium">
              {hasGlobalName ? reportedUser.global_name : reportedUser.username}
            </p>
            {hasGlobalName && (
              <p className="text-secondary-text truncate text-xs">
                @{reportedUser.username}
              </p>
            )}
          </div>
        </div>
      );
    }

    case "avatar":
      if (metadata.avatar) {
        return (
          <div className={`${contextClassName} flex items-center gap-3`}>
            <SpoilerImage src={metadata.avatar} alt="Reported avatar" rounded />
            <div>
              <p className="text-secondary-text text-xs">Reported avatar</p>
              <p className="text-primary-text mt-0.5 text-sm font-medium">
                Click to reveal
              </p>
            </div>
          </div>
        );
      }
      return null;

    case "banner":
      if (metadata.custom_banner ?? metadata.banner) {
        return (
          <div className={contextClassName}>
            <p className="text-secondary-text mb-2 flex items-center gap-1.5 text-xs">
              <Icon icon="heroicons:photo" className="h-3.5 w-3.5" />
              Reported banner
            </p>
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
        <div className={`${contextClassName} flex items-center gap-3`}>
          <div className="bg-button-info/10 text-button-info flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
            <Icon icon="heroicons:identification" className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-secondary-text text-xs">Reported username</p>
            <p className="text-primary-text truncate text-sm font-medium">
              {displayName}
            </p>
          </div>
        </div>
      );
    }

    case "description":
      if (metadata.description?.description) {
        return (
          <div className={contextClassName}>
            <p className="text-secondary-text mb-2 flex items-center gap-1.5 text-xs">
              <Icon icon="heroicons:document-text" className="h-3.5 w-3.5" />
              Reported description
            </p>
            <p className="text-primary-text/80 border-border-focus/40 line-clamp-4 border-l-2 pl-3 text-sm leading-relaxed break-words whitespace-pre-wrap">
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
          <div className={contextClassName}>
            <p className="text-secondary-text mb-2 flex items-center gap-1.5 text-xs">
              <Icon icon="heroicons:envelope" className="h-3.5 w-3.5" />
              Reported message
            </p>
            <p className="text-primary-text border-border-focus/40 line-clamp-3 border-l-2 pl-3 text-sm leading-relaxed break-words">
              {metadata.message.content}
            </p>
          </div>
        );
      }
      return null;

    case "value_suggestions":
      if (metadata.suggestion) {
        return (
          <Link
            href={`/items/suggestions/${metadata.suggestion.id}`}
            prefetch={false}
            onClick={(event) => event.stopPropagation()}
            className="border-border-card bg-tertiary-bg/55 hover:border-border-focus hover:bg-tertiary-bg mt-3 block rounded-xl border p-3.5 transition-colors"
          >
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="text-secondary-text text-xs">
                Value suggestion for {metadata.suggestion.item_name}
              </p>
              <ItemTypeBadge type={metadata.suggestion.item_type} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <p className="text-button-danger mb-1 flex items-center gap-1 text-xs font-semibold tracking-wide uppercase">
                  <Icon icon="mdi:minus-circle" className="h-3 w-3" inline />
                  Old{" "}
                  {metadata.suggestion.field
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </p>
                <p className="text-secondary-text text-sm font-bold [overflow-wrap:anywhere] break-words line-through">
                  {metadata.suggestion.current_value || "N/A"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-button-success mb-1 flex items-center gap-1 text-xs font-semibold tracking-wide uppercase">
                  <Icon icon="mdi:plus-circle" className="h-3 w-3" inline />
                  New{" "}
                  {metadata.suggestion.field
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </p>
                <p className="text-primary-text text-sm font-bold [overflow-wrap:anywhere] break-words">
                  {metadata.suggestion.suggested_value}
                </p>
              </div>
            </div>
          </Link>
        );
      }
      return null;

    case "item_info":
    case "false_dupe": {
      const item = metadata.item;
      if (!item) return null;

      return (
        <Link
          href={`/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`}
          prefetch={false}
          onClick={(event) => event.stopPropagation()}
          className="border-border-card bg-tertiary-bg/55 hover:border-border-focus hover:bg-tertiary-bg mt-3 flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors"
        >
          <div className="min-w-0">
            <p className="text-secondary-text text-xs">
              {type === "false_dupe"
                ? "Item duplicate dispute"
                : "Reported item information"}
            </p>
            <p className="text-primary-text truncate text-sm font-semibold">
              {item.name}
            </p>
            <div className="mt-1">
              <ItemTypeBadge type={item.type} />
            </div>
          </div>
          <Icon
            icon="heroicons:arrow-top-right-on-square"
            className="text-secondary-text h-4 w-4 shrink-0"
          />
        </Link>
      );
    }

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
  const [reportTypes, setReportTypes] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
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
          report.report_id.toLowerCase().includes(q) ||
          report.ref.toLowerCase().includes(q) ||
          (report.metadata.item?.name.toLowerCase().includes(q) ?? false) ||
          (report.metadata.item?.type.toLowerCase().includes(q) ?? false) ||
          (reportedId?.toLowerCase().includes(q) ?? false) ||
          (reportedUser?.username.toLowerCase().includes(q) ?? false) ||
          (reportedUser?.global_name?.toLowerCase().includes(q) ?? false);
        if (!matches) return false;
      }
      return true;
    });
  }, [reports, statusFilter, debouncedSearch, reportedUsers]);

  const fetchReports = useCallback(
    async (currentPage: number, reportType: string) => {
      setLoading(true);
      setError(null);
      try {
        const typeQuery =
          reportType === "all"
            ? ""
            : `&report_type=${encodeURIComponent(reportType)}`;
        const { url, headers } = buildApiFetchRequest(
          PUBLIC_API_URL,
          `/reports/me?page=${currentPage}${typeQuery}`,
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
          log.error("Failed to fetch reports", {
            status: response.status,
            body,
          });
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
            const { url, headers } = buildApiFetchRequest(
              PUBLIC_API_URL,
              `/users/get/batch?ids=${ids.map(encodeURIComponent).join(",")}`,
            );
            const usersRes = await fetch(url, { cache: "no-store", headers });
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
    },
    [],
  );

  useEffect(() => {
    void fetchReports(page, typeFilter);
  }, [page, typeFilter, fetchReports]);

  useEffect(() => {
    const { url, headers } = buildApiFetchRequest(
      PUBLIC_API_URL,
      "/reports/types",
    );

    fetch(url, { credentials: "include", cache: "no-store", headers })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<{ types?: string[] }>;
      })
      .then((data) => {
        setReportTypes(
          [...(data.types ?? [])].sort((a, b) =>
            getTypeLabel(a).localeCompare(getTypeLabel(b)),
          ),
        );
      })
      .catch((error) => {
        log.error("Failed to fetch report types:", error);
      });
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
              ({total} reports)
            </span>
          )}
        </div>

        <SubmissionTabs active="reports" />

        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="min-w-0 flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by report ID, user ID, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info h-11 w-full rounded-lg border px-10 text-sm transition-colors focus:outline-none"
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

            <div className="w-full sm:w-52">
              <div className="w-full">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info hover:border-border-focus flex h-11 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-colors focus:outline-none"
                    >
                      <span className="truncate">
                        {statusFilter === "all"
                          ? "All Statuses"
                          : getStatusStyle(statusFilter).label ||
                            statusFilter
                              .split(" ")
                              .map(
                                (w) => w.charAt(0).toUpperCase() + w.slice(1),
                              )
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
                    className="border-border-card bg-secondary-bg text-primary-text w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) rounded-xl border p-1.5 shadow-lg"
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

          <div className="mb-6">
            <p className="text-secondary-text mb-2 text-xs font-semibold tracking-wide uppercase">
              Report type
            </p>
            <div className="flex flex-wrap gap-2">
              {["all", ...reportTypes].map((type) => {
                const active = typeFilter === type;
                return (
                  <Button
                    key={type}
                    type="button"
                    onClick={() => {
                      setTypeFilter(active && type !== "all" ? "all" : type);
                      void setPageParam("1");
                    }}
                    aria-pressed={active}
                    variant={active ? "default" : "secondary"}
                    size="sm"
                    className="gap-2"
                  >
                    {active && (
                      <Icon icon="heroicons:check" className="h-4 w-4" />
                    )}
                    <span>{type === "all" ? "All" : getTypeLabel(type)}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </>

        {loading ? (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="border-border-card bg-secondary-bg flex h-full flex-col rounded-xl border p-5 shadow-sm"
                >
                  {/* Badge row + date */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Skeleton
                        style={{ width: 36, height: 36 }}
                        className="rounded-lg"
                      />
                      <div className="space-y-1.5">
                        <Skeleton style={{ width: 90, height: 14 }} />
                      </div>
                      <Skeleton style={{ width: 94, height: 26 }} />
                    </div>
                    <Skeleton style={{ width: 80, height: 16 }} />
                  </div>
                  <div className="bg-tertiary-bg/55 mt-3 rounded-xl p-3.5">
                    <Skeleton style={{ width: 112, height: 11 }} />
                    <Skeleton
                      style={{ width: "100%", height: 14 }}
                      className="mt-2"
                    />
                  </div>
                  <div className="mt-3 space-y-2">
                    <Skeleton style={{ width: 88, height: 10 }} />
                    <Skeleton style={{ width: "72%", height: 14 }} />
                  </div>
                  <div className="border-border-card mt-4 flex items-center gap-2 border-t pt-3">
                    <Skeleton style={{ width: 16, height: 16 }} />
                    <Skeleton style={{ width: "55%", height: 12 }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : error ? (
          <div className="border-border-card bg-secondary-bg rounded-2xl border p-10 text-center shadow-sm">
            <Icon
              icon="heroicons:exclamation-circle"
              className="text-button-danger mx-auto mb-3 h-10 w-10"
            />
            <p className="text-primary-text font-medium">
              Failed to load reports
            </p>
            <p className="text-secondary-text mt-1 text-sm">{error}</p>
            <button
              onClick={() => void fetchReports(page, typeFilter)}
              className="text-link hover:text-link-hover mt-3 cursor-pointer text-sm transition-colors"
            >
              Try again
            </button>
          </div>
        ) : reports.length === 0 ? (
          <div className="border-border-card bg-secondary-bg rounded-2xl border p-10 text-center shadow-sm">
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
          <div className="border-border-card bg-secondary-bg rounded-2xl border p-10 text-center shadow-sm">
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
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                    className="border-border-card bg-secondary-bg hover:border-border-focus group relative flex h-full flex-col overflow-hidden rounded-xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                        <span className="bg-button-info/10 text-button-info flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                          <Icon icon="heroicons:flag" className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-primary-text truncate text-sm font-semibold">
                            {getTypeLabel(report.type)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex h-5 items-center rounded-lg px-2 text-[10px] leading-none font-medium backdrop-blur-xl sm:h-6 sm:px-2.5 sm:text-xs ${statusStyle.className}`}
                        >
                          {statusStyle.label}
                        </span>
                      </div>
                      <time className="text-secondary-text pt-1 text-right text-xs">
                        {formatCustomDate(report.created_at * 1000)}
                      </time>
                    </div>

                    <div className="relative z-10 flex flex-1 flex-col">
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

                      <div className="border-border-card bg-tertiary-bg/55 mt-3 rounded-xl border p-3.5">
                        <p className="text-secondary-text text-[10px] font-semibold tracking-wider uppercase">
                          Report reason
                        </p>
                        <p className="text-primary-text mt-1 text-sm leading-relaxed break-words">
                          {report.content}
                        </p>
                      </div>

                      <div className="min-h-4 flex-1" />
                      <div className="border-border-card flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-3">
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className="text-secondary-text text-[10px] font-semibold tracking-wide uppercase">
                            Report
                          </span>
                          <code className="text-primary-text text-xs font-semibold">
                            #{report.id}
                          </code>
                          <CopyIdentifierButton
                            value={String(report.id)}
                            label="report number"
                          />
                        </div>
                        <span
                          aria-hidden="true"
                          className="bg-border-card hidden h-4 w-px sm:block"
                        />
                        <div className="flex min-w-0 flex-1 items-center gap-1.5">
                          <Icon
                            icon="heroicons:finger-print"
                            className="text-secondary-text h-4 w-4 shrink-0"
                          />
                          <span className="text-secondary-text text-[10px] font-semibold tracking-wide uppercase">
                            ID
                          </span>
                          <code
                            className="text-secondary-text min-w-0 flex-1 truncate text-xs"
                            title={report.report_id}
                          >
                            {report.report_id}
                          </code>
                          <CopyIdentifierButton
                            value={report.report_id}
                            label="report ID"
                          />
                        </div>
                      </div>
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
