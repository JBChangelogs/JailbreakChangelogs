"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthContext } from "@/contexts/AuthContext";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { createLogger } from "@/services/logger";
import { Icon } from "@/components/ui/IconWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { formatCustomDate } from "@/utils/helpers/timestamp";
import { UserAvatar } from "@/utils/ui/avatar";
import type { UserData } from "@/types/auth";
import {
  Report,
  ReportContext,
  getReportedUserId,
  getTypeLabel,
  getStatusStyle,
} from "@/components/Users/MyReports";

const log = createLogger("UI");

export default function ReportDetail({ reportId }: { reportId: string }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthContext();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportedUser, setReportedUser] = useState<UserData | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    setLoading(true);
    setError(null);

    const { url, headers } = buildApiFetchRequest(
      PUBLIC_API_URL,
      `/reports/${reportId}`,
    );
    fetch(url, { credentials: "include", cache: "no-store", headers })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { message?: string })?.message ?? "Failed to load report",
          );
        }
        return res.json() as Promise<Report>;
      })
      .then((data) => setReport(data))
      .catch((err) => {
        log.error("Error fetching report detail:", err);
        setError(err instanceof Error ? err.message : "Failed to load report");
      })
      .finally(() => setLoading(false));
  }, [authLoading, user, reportId]);

  useEffect(() => {
    if (!report) return;
    const id = getReportedUserId(report);
    if (!id) return;

    fetch(`/api/users/batch?ids=${encodeURIComponent(id)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) return;
        const arr = (await res.json()) as UserData[];
        if (arr.length > 0) setReportedUser(arr[0]);
      })
      .catch(() => undefined);
  }, [report]);

  if (authLoading || (!report && loading)) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <Breadcrumb />
          <div className="mt-4 space-y-3">
            <Skeleton style={{ height: 32 }} />
            <Skeleton style={{ height: 100 }} />
            <Skeleton style={{ height: 80 }} />
            <Skeleton style={{ height: 60 }} />
          </div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  if (error) {
    return (
      <main className="min-h-screen pb-8">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <Breadcrumb />
          <div className="border-border-card bg-secondary-bg mt-4 rounded-lg border p-8 text-center shadow-sm">
            <Icon
              icon="heroicons:exclamation-circle"
              className="text-button-danger mx-auto mb-3 h-10 w-10"
            />
            <p className="text-primary-text font-medium">
              Failed to load report
            </p>
            <p className="text-secondary-text mt-1 text-sm">{error}</p>
            <Button variant="default" size="sm" asChild className="mt-4">
              <Link href="/reports">Back to reports</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (!report) return null;

  const statusStyle = getStatusStyle(report.status);
  const hasGlobalName =
    reportedUser?.global_name && reportedUser.global_name !== "None";
  const reportedDisplayName = reportedUser
    ? hasGlobalName
      ? reportedUser.global_name
      : `@${reportedUser.username}`
    : null;

  return (
    <main className="min-h-screen pb-8">
      <div className="container mx-auto max-w-4xl px-4 py-4">
        <Breadcrumb />

        <div className="mt-4 mb-4 flex items-center gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/reports">
              <Icon icon="heroicons:arrow-left" className="h-4 w-4" />
              Reports
            </Link>
          </Button>
        </div>

        <div className="border-border-card bg-secondary-bg space-y-4 rounded-lg border p-5 shadow-sm">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
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

          {/* Reported content preview */}
          <ReportContext report={report} />

          {/* Reason */}
          <div className="border-border-card bg-tertiary-bg rounded-lg border p-3">
            <p className="text-secondary-text mb-1 text-xs">Reason</p>
            <p className="text-primary-text text-sm break-words">
              {report.content}
            </p>
          </div>

          {/* Metadata rows */}
          <div className="border-border-card bg-tertiary-bg divide-border-card divide-y rounded-lg border text-xs">
            {reportedUser && reportedDisplayName && (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-secondary-text">Reported user</span>
                <button
                  onClick={() => router.push(`/users/${reportedUser.id}`)}
                  className="flex cursor-pointer items-center gap-1.5 transition-opacity hover:opacity-80"
                >
                  <UserAvatar
                    userId={reportedUser.id}
                    avatarHash={reportedUser.avatar}
                    username={reportedUser.username}
                    custom_avatar={reportedUser.custom_avatar}
                    settings={{
                      custom_avatar: reportedUser.settings_v2?.custom_avatar,
                    }}
                    premiumType={reportedUser.premiumtype}
                    size={7}
                    showBadge={false}
                  />
                  <span className="text-link hover:text-link-hover font-medium transition-colors">
                    {reportedDisplayName}
                  </span>
                </button>
              </div>
            )}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-secondary-text">Report ID</span>
              <span className="text-primary-text font-mono">
                {report.report_id}
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-secondary-text">Reference ID</span>
              <span className="text-primary-text font-mono">{report.ref}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-secondary-text">Submitted</span>
              <span className="text-primary-text">
                {formatCustomDate(report.created_at * 1000)}
              </span>
            </div>
            {report.last_updated !== report.created_at && (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-secondary-text">Last updated</span>
                <span className="text-primary-text">
                  {formatCustomDate(report.last_updated * 1000)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
