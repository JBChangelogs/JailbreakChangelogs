"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import Image from "next/image";
import { useAuthContext } from "@/contexts/AuthContext";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiUrlWithDevToken } from "@/utils/api/apiDevToken";
import { createLogger } from "@/services/logger";
import { Icon } from "@/components/ui/IconWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/Pagination";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { formatCustomDate } from "@/utils/helpers/timestamp";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import { convertUrlsToLinks } from "@/utils/ui/urlConverter";

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

  return (
    <div
      className={`relative cursor-pointer overflow-hidden ${rounded ? "inline-block rounded-full" : "rounded-lg"}`}
      onClick={(e) => {
        e.stopPropagation();
        setRevealed(true);
      }}
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
      {!revealed && (
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
      )}
    </div>
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
  if (normalized === "pending review" || normalized === "pending") {
    return {
      label: "Pending Review",
      className:
        "bg-yellow-500/15 text-primary-text border border-yellow-500/30",
    };
  }
  if (normalized === "resolved") {
    return {
      label: "Resolved",
      className: "bg-green-500/15 text-primary-text border border-green-500/30",
    };
  }
  if (normalized === "dismissed") {
    return {
      label: "Dismissed",
      className: "text-primary-text border-border-card bg-tertiary-bg border",
    };
  }
  return {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    className: "text-primary-text border-border-card bg-tertiary-bg border",
  };
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
  const { user, isLoading: authLoading } = useAuthContext();
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

  const fetchReports = useCallback(
    async (currentPage: number) => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const url = buildApiUrlWithDevToken(
          PUBLIC_API_URL,
          `/reports/me?page=${currentPage}`,
        );
        const response = await fetch(url, {
          credentials: "include",
          cache: "no-store",
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
        setReports(data.items ?? []);
        setTotalPages(data.total_pages ?? 1);
        setTotal(data.total ?? 0);
      } catch (err) {
        log.error("Error fetching reports:", err);
        setError(err instanceof Error ? err.message : "Failed to load reports");
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && user) {
      void fetchReports(page);
    }
  }, [authLoading, user, page, fetchReports]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    void setPageParam(String(value));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (authLoading) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <Breadcrumb />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} style={{ height: 160 }} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen pb-8">
      <div className="container mx-auto max-w-7xl px-4 py-4">
        <Breadcrumb />

        <div className="mt-4 mb-4 flex items-center gap-2">
          <Icon icon="heroicons:flag" className="text-primary-text h-5 w-5" />
          <h1 className="text-primary-text text-lg font-semibold">
            My Reports
          </h1>
          {!loading && (
            <span className="text-secondary-text text-sm">({total})</span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} style={{ height: 160 }} />
            ))}
          </div>
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
        ) : (
          <>
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
              {reports.map((report) => {
                const statusStyle = getStatusStyle(report.status);
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
                      </div>
                      <span className="text-secondary-text text-xs">
                        {formatCustomDate(report.created_at * 1000)}
                      </span>
                    </div>

                    <ReportContext report={report} />

                    <p className="text-primary-text mt-2 text-sm break-words">
                      <span className="text-secondary-text">Reason: </span>
                      {report.content}
                    </p>

                    <div className="mt-1 space-y-0.5 text-xs">
                      <p className="text-secondary-text">
                        Report ID:{" "}
                        <span className="text-primary-text font-mono">
                          {report.id}
                        </span>
                      </p>
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
