"use client";

import ProfileTabError from "./ProfileTabError";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/contexts/AuthContext";
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
            <div className="bg-quaternary-bg h-5 w-16 rounded-md" />
          </div>
          <div className="bg-quaternary-bg h-4 w-3/4 rounded" />
          <div className="bg-quaternary-bg h-3 w-1/2 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function UserBansTab({ userId }: { userId: string }) {
  const { user } = useAuthContext();
  const isOwnProfile = user?.id === userId;
  const canViewBans =
    isOwnProfile ||
    user?.flags?.some(
      (flag) => flag.flag === "is_owner" && flag.enabled !== false,
    );
  const bansQuery = useQuery({
    queryKey: ["profile-bans", userId, user?.id],
    queryFn: async ({ signal }): Promise<BansResponse> => {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        isOwnProfile
          ? "/v2/users/me/bans"
          : `/v2/users/${encodeURIComponent(userId)}/bans`,
      );
      const res = await fetch(url, { credentials: "include", headers, signal });
      if (!res.ok) {
        throw new Error(`Failed to load bans (${res.status})`);
      }
      return res.json() as Promise<BansResponse>;
    },
    enabled: Boolean(user?.id && canViewBans),
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const bans = bansQuery.data?.items ?? [];
  const loading = bansQuery.isPending;
  const error = bansQuery.data ? null : bansQuery.error?.message;

  if (!canViewBans) return null;

  return (
    <div className="border-border-card bg-secondary-bg rounded-2xl border p-5 sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-primary-text text-lg font-semibold">
          Bans{" "}
          <span className="text-secondary-text ml-1 text-sm font-normal">
            {!loading && !error && (bansQuery.data?.total ?? bans.length)}
          </span>
        </h2>
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <BanCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ProfileTabError
          title="Failed to load bans"
          message={error}
          onRetry={() => void bansQuery.refetch()}
        />
      ) : bans.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <Icon
            icon="heroicons:shield-check"
            className="text-status-success h-10 w-10 opacity-70"
          />
          <p className="text-primary-text font-medium">No bans on record</p>
          <p className="text-secondary-text text-sm">
            {isOwnProfile
              ? "Your account is in good standing."
              : "This account is in good standing."}
          </p>
        </div>
      ) : (
        <>
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
                        className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
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
