"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/ui/IconWrapper";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { PUBLIC_API_URL } from "@/utils/api/api";

type Ban = {
  id: number;
  ban_type: string;
  reason: string;
  banned_at: number;
  expires_at: number;
  active: boolean;
  banned_by_user: {
    id: string;
    username: string;
    global_name: string;
  } | null;
};

type BansResponse = {
  items: Ban[];
  total: number;
};

function formatDate(ts: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(ts * 1000));
}

function BanCardSkeleton() {
  return (
    <div className="border-border-card bg-tertiary-bg animate-pulse overflow-hidden rounded-lg border">
      <div className="p-4">
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="bg-quaternary-bg h-5 w-28 rounded-md" />
            <div className="bg-quaternary-bg h-5 w-16 rounded-full" />
          </div>
          <div className="bg-quaternary-bg h-4 w-3/4 rounded" />
          <div className="bg-quaternary-bg h-3 w-1/2 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function UserBansTab() {
  const [bans, setBans] = useState<Ban[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { url, headers } = buildApiFetchRequest(PUBLIC_API_URL, "/bans/me");
      const res = await fetch(url, { credentials: "include", headers });
      if (!res.ok) {
        setError(`Failed to load bans (${res.status})`);
        return;
      }
      const data: BansResponse = await res.json();
      setBans(data.items ?? []);
    } catch {
      setError("Failed to load bans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBans();
  }, [fetchBans]);

  return (
    <div className="border-border-card rounded-t-none rounded-b-lg border p-4">
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <BanCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <Icon
            icon="heroicons:exclamation-circle"
            className="text-button-danger h-8 w-8 opacity-70"
          />
          <p className="text-secondary-text text-sm">{error}</p>
          <button
            onClick={() => void fetchBans()}
            className="border-border-card bg-secondary-bg text-primary-text hover:bg-tertiary-bg inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      ) : bans.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <Icon
            icon="heroicons:shield-check"
            className="text-status-success h-10 w-10 opacity-70"
          />
          <p className="text-primary-text font-medium">No bans on record</p>
          <p className="text-secondary-text text-sm">
            Your account is in good standing.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-primary-text text-lg font-semibold">
              Bans [{bans.length}]
            </h2>
          </div>
          <div className="space-y-3">
            {bans.map((ban) => (
              <div
                key={ban.id}
                className="border-border-card bg-tertiary-bg overflow-hidden rounded-lg border"
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: ban.active
                    ? "var(--color-status-success)"
                    : "var(--color-status-error)",
                }}
              >
                <div className="flex gap-3 p-4">
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    {/* Top row: type + status */}
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="bg-quaternary-bg text-primary-text rounded-md px-2 py-0.5 text-xs font-medium capitalize">
                        {ban.ban_type.replace(/_/g, " ")}
                      </span>
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{
                          backgroundColor: ban.active
                            ? "color-mix(in srgb, var(--color-status-success) 80%, transparent)"
                            : "color-mix(in srgb, var(--color-status-error) 80%, transparent)",
                          color: "var(--color-form-button-text)",
                        }}
                      >
                        {ban.active ? "Active" : "Expired"}
                      </span>
                    </div>

                    {/* Reason */}
                    <div className="mb-2">
                      <span className="text-secondary-text mr-1.5 text-xs font-medium">
                        Reason
                      </span>
                      <span className="text-primary-text text-sm">
                        {ban.reason}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div className="text-secondary-text flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      {ban.banned_by_user && (
                        <span className="flex items-center gap-1">
                          <Icon
                            icon="heroicons:user"
                            className="h-3.5 w-3.5 shrink-0"
                          />
                          <span>
                            Banned by{" "}
                            <span className="text-primary-text font-medium">
                              {ban.banned_by_user.global_name &&
                              ban.banned_by_user.global_name !== "None"
                                ? ban.banned_by_user.global_name
                                : ban.banned_by_user.username}
                            </span>
                          </span>
                        </span>
                      )}
                      <span className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-1">
                        <span className="flex items-center gap-1">
                          <span className="text-secondary-text font-medium">
                            Banned on
                          </span>{" "}
                          <span className="text-primary-text">
                            {formatDate(ban.banned_at)}
                          </span>
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>
                          {ban.active ? "Expires" : "Expired"}{" "}
                          <span className="text-primary-text">
                            {formatDate(ban.expires_at)}
                          </span>
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
