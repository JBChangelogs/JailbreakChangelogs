"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { UserAvatar } from "@/utils/ui/avatar";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { parseBan, showBanToast } from "@/utils/api/ban";
import { BanBanner } from "@/components/ui/BanBanner";
import { RateLimitBanner } from "@/components/ui/RateLimitBanner";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");
import { formatMessageDate } from "@/utils/helpers/timestamp";
import { formatFullValue } from "@/utils/trading/values";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  getItemImagePath,
  handleImageError,
  isVideoItem,
  getVideoPath,
} from "@/utils/ui/images";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ChangelogComments from "@/components/PageComments/ChangelogComments";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import Link from "next/link";
import type { Item } from "@/types/index";
import NitroValuesSuggestionDetailRailAd from "@/components/Ads/NitroValuesSuggestionDetailRailAd";
import NitroValuesSuggestionDetailRightRailAd from "@/components/Ads/NitroValuesSuggestionDetailRightRailAd";
import NitroValuesSuggestionDetailVideoPlayer from "@/components/Ads/NitroValuesSuggestionDetailVideoPlayer";
import ItemValueChart, {
  type ValueHistory,
} from "@/components/Items/ItemValueChart";

interface UserSettings {
  custom_avatar?: boolean;
  hide_presence?: boolean;
  profile_public?: boolean | number;
  custom_banner?: boolean;
  hide_connections?: boolean;
  dms_allowed?: boolean | number;
  allow_gifting?: boolean;
  show_recent_comments?: boolean | number;
  hide_following?: boolean | number;
  hide_followers?: boolean | number;
  hide_favorites?: boolean | number;
}

interface SuggesterStats {
  total_submitted: number;
  total_accepted: number;
  total_rejected: number;
  total_expired: number;
  acceptance_rate: number;
  active_suggestions: number;
  active_pending: number;
  active_accepted: number;
  active_rejected: number;
  last_updated: number;
}

interface SuggestionUser {
  id: string;
  username?: string;
  global_name?: string;
  avatar?: string | null;
  custom_avatar?: string | null;
  premiumtype?: number;
  usernumber?: number;
  settings?: UserSettings;
  roblox_id?: string;
  roblox_username?: string;
  roblox_display_name?: string;
  roblox_avatar?: string;
}

interface Suggestion {
  id: number;
  item_id: number;
  field: string;
  current_value: string;
  suggested_value: string;
  reason: string;
  status: string;
  upvotes: number;
  downvotes: number;
  is_vt: number;
  created_at: number;
  updated_at: number;
  user: SuggestionUser;
  item?: Item;
  votes: {
    upvotes: { created_at: number; user: SuggestionUser }[];
    downvotes: { created_at: number; user: SuggestionUser }[];
  };
}

const fieldLabel = (field: string) =>
  field
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-primary-text border-yellow-500/30",
  approved: "bg-green-500/20 text-primary-text border-green-500/30",
  accepted: "bg-green-500/20 text-primary-text border-green-500/30",
  rejected: "bg-red-500/20 text-primary-text border-red-500/30",
};

const badgeBase =
  "inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium backdrop-blur-xl";

const voterListClassName =
  "max-h-96 space-y-2 overflow-y-auto scrollbar-thin pr-1";

const MAX_REASON_LENGTH = 400;

function VoterCard({ v }: { v: { created_at: number; user: SuggestionUser } }) {
  return (
    <div className="border-border-card bg-tertiary-bg flex items-center gap-3 rounded-lg border px-4 py-3">
      <div className="relative h-10 w-10 shrink-0">
        <UserAvatar
          userId={v.user.id}
          avatarHash={null}
          username={v.user.roblox_username ?? v.user.username ?? ""}
          forceAvatarUrl={v.user.roblox_avatar ?? undefined}
          premiumType={v.user.premiumtype ?? 0}
          size={10}
          showBadge={false}
          bgClassName="bg-quaternary-bg"
        />
      </div>
      <div className="min-w-0 flex-1">
        <Link
          href={`/users/${v.user.id}`}
          prefetch={false}
          className="text-primary-text hover:text-link block truncate text-sm font-medium transition-colors"
        >
          {v.user.roblox_display_name ||
            v.user.roblox_username ||
            `User #${v.user.id}`}
        </Link>
        <p className="text-tertiary-text mt-0.5 text-xs">
          {formatMessageDate(v.created_at)}
        </p>
      </div>
    </div>
  );
}

export default function ValueSuggestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    user,
    setLoginModal,
    bans,
    setBan,
  } = useAuthContext();
  const ban = bans["value_suggestions"] ?? null;

  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggesterStats, setSuggesterStats] = useState<SuggesterStats | null>(
    null,
  );
  const [shouldShowNotFound, setShouldShowNotFound] = useState(false);
  const [routeError, setRouteError] = useState<Error | null>(null);
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null);
  const [voteCounts, setVoteCounts] = useState({ up: 0, down: 0 });
  const [voteLoading, setVoteLoading] = useState(false);
  const [votingType, setVotingType] = useState<"upvote" | "downvote" | null>(
    null,
  );
  const [voteRateLimit, setVoteRateLimit] = useState<number | null>(null);
  const [voteRateLimitSeconds, setVoteRateLimitSeconds] = useState(0);

  useEffect(() => {
    if (!voteRateLimit) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((voteRateLimit - Date.now()) / 1000));
      setVoteRateLimitSeconds(left);
      if (left === 0) setVoteRateLimit(null);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [voteRateLimit]);
  const [isEditing, setIsEditing] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editRateLimitUntil, setEditRateLimitUntil] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (!editRateLimitUntil) return;
    const ms = editRateLimitUntil - Date.now();
    if (ms <= 0) {
      setEditRateLimitUntil(null);
      return;
    }
    const t = setTimeout(() => setEditRateLimitUntil(null), ms);
    return () => clearTimeout(t);
  }, [editRateLimitUntil]);
  const [reasonExpanded, setReasonExpanded] = useState(false);
  const [reasonOverflows, setReasonOverflows] = useState(false);
  const reasonRef = useRef<HTMLDivElement | null>(null);
  const [refreshType, setRefreshType] = useState<string | null>(null);
  const [itemHistory, setItemHistory] = useState<ValueHistory[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const run = async () => {
      setLoading(true);
      setError(null);
      setShouldShowNotFound(false);
      setRouteError(null);
      try {
        const { url: suggestionUrl, headers: devTokenHeaders } =
          buildApiFetchRequest(PUBLIC_API_URL!, `/value-suggestions/${id}`);
        const res = await fetch(suggestionUrl, {
          credentials: "include",
          headers: devTokenHeaders,
        });
        if (!res.ok) {
          if (res.status === 404) {
            setShouldShowNotFound(true);
          } else if (res.status >= 500) {
            setRouteError(new Error("Failed to load suggestion details."));
          } else {
            const body = await res.json().catch(() => ({}));
            log.error("fetch suggestion failed", {
              status: res.status,
              body,
            });
            setError("Failed to load suggestion.");
          }
          return;
        }
        const data: Suggestion = await res.json();
        setSuggestion(data);
        setVoteCounts({ up: data.upvotes, down: data.downvotes });
        if (data.item) {
          setItem(data.item);
        }
      } catch {
        setError("Failed to load suggestion.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const suggesterId = suggestion?.user.id;
  useEffect(() => {
    if (!suggesterId) return;
    const run = async () => {
      try {
        const { url, headers } = buildApiFetchRequest(
          PUBLIC_API_URL!,
          `/value-suggestions/user/${suggesterId}/stats`,
        );
        const res = await fetch(url, { credentials: "include", headers });
        if (!res.ok) return;
        const data = await res.json();
        setSuggesterStats(data.stats ?? null);
      } catch {
        // stats are non-critical
      }
    };
    run();
  }, [suggesterId]);

  if (shouldShowNotFound) {
    notFound();
  }

  if (routeError) {
    throw routeError;
  }

  useEffect(() => {
    if (!suggestion || isAuthLoading) return;
    if (suggestion.is_vt !== 1) return;
    const canSee =
      user?.flags?.some(
        (f) =>
          (f.flag === "is_owner" || f.flag === "is_vt") && f.enabled !== false,
      ) ?? false;
    if (!canSee) setShouldShowNotFound(true);
  }, [suggestion, isAuthLoading, user]);

  useEffect(() => {
    if (!suggestion || !user) return;
    const hasUp = suggestion.votes.upvotes.some((v) => v.user.id === user.id);
    const hasDown = suggestion.votes.downvotes.some(
      (v) => v.user.id === user.id,
    );
    setUserVote(hasUp ? "upvote" : hasDown ? "downvote" : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestion?.id, user?.id]);

  useEffect(() => {
    setReasonExpanded(false);
  }, [suggestion?.id]);

  useEffect(() => {
    if (!suggestion?.reason.trim() || loading) {
      setReasonOverflows(false);
      return;
    }
    const el = reasonRef.current;
    if (!el) return;

    const checkOverflow = () => {
      setReasonOverflows(el.scrollHeight > el.clientHeight);
    };

    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [suggestion?.reason, suggestion?.id, loading, reasonExpanded]);

  const silentRefreshVotes = useCallback(async () => {
    if (!id) return;
    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL!,
        `/value-suggestions/${id}/votes`,
      );
      const res = await fetch(url, { credentials: "include", headers });
      if (!res.ok) return;
      const fresh: Suggestion["votes"] = await res.json();
      setVoteCounts({ up: fresh.upvotes.length, down: fresh.downvotes.length });
      setSuggestion((prev) =>
        prev
          ? {
              ...prev,
              upvotes: fresh.upvotes.length,
              downvotes: fresh.downvotes.length,
              votes: fresh,
            }
          : prev,
      );
    } catch {
      // silently fail — stale counts are acceptable
    }
  }, [id]);

  const handleVote = async (type: "upvote" | "downvote") => {
    if (!isAuthenticated) {
      toast.info("You need to be logged in to vote on value suggestions.");
      setLoginModal({ open: true });
      return;
    }
    if (voteLoading) return;

    const removing = userVote === type;
    const prevVote = userVote;
    const prevCounts = { ...voteCounts };

    // Optimistic update
    setUserVote(removing ? null : type);
    setVoteCounts((prev) => {
      const next = { ...prev };
      if (removing) {
        next[type === "upvote" ? "up" : "down"] -= 1;
      } else {
        if (prevVote) next[prevVote === "upvote" ? "up" : "down"] -= 1;
        next[type === "upvote" ? "up" : "down"] += 1;
      }
      return { up: Math.max(0, next.up), down: Math.max(0, next.down) };
    });

    setVoteLoading(true);
    setVotingType(type);
    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL!,
        `/value-suggestions/${id}/vote`,
      );
      const res = await fetch(url, {
        method: removing ? "DELETE" : "POST",
        credentials: "include",
        ...(removing
          ? { headers }
          : {
              headers: { ...headers, "Content-Type": "application/json" },
              body: JSON.stringify({ vote_type: type }),
            }),
      });
      if (!res.ok) {
        setUserVote(prevVote);
        setVoteCounts(prevCounts);
        const banInfo = parseBan(res);
        if (banInfo) {
          setBan(banInfo);
          showBanToast(banInfo);
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
          toast.error("You're voting too fast. Please wait a moment.");
          const retryAfter = parseInt(
            res.headers.get("retry-after") ?? "60",
            10,
          );
          setVoteRateLimit(Date.now() + retryAfter * 1000);
        } else if (res.status === 403) {
          if (data?.detail === "Forbidden") {
            toast.info(
              "You need to connect your Roblox account to vote on value suggestions.",
            );
            setLoginModal({ open: true, tab: "roblox", onlyRoblox: true });
          } else {
            toast.error(
              data?.message ?? data?.error ?? "Failed to register vote.",
            );
          }
        } else {
          toast.error(
            data?.message ?? data?.error ?? "Failed to register vote.",
          );
        }
      }
    } catch {
      setUserVote(prevVote);
      setVoteCounts(prevCounts);
      toast.error("Failed to register vote.");
    } finally {
      setVoteLoading(false);
      setVotingType(null);
    }
  };

  const handleEditSave = async () => {
    if (!suggestion) return;
    if (editReason.trim().length < 350) {
      toast.error("Reason must be at least 350 characters.");
      return;
    }
    setEditSaving(true);
    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL!,
        `/value-suggestions/${id}`,
      );
      const res = await fetch(url, {
        method: "PATCH",
        credentials: "include",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          item: suggestion.item_id,
          suggestion: { reason: editReason.trim() },
        }),
      });
      if (!res.ok) {
        if (res.status === 429) {
          const retryAfter = parseInt(
            res.headers.get("Retry-After") ?? "60",
            10,
          );
          setEditRateLimitUntil(Date.now() + retryAfter * 1000);
          return;
        }
        const data = await res.json().catch(() => ({}));
        toast.error(
          data?.message ?? data?.error ?? "Failed to update suggestion.",
        );
        return;
      }
      setSuggestion((prev) =>
        prev ? { ...prev, reason: editReason.trim() } : prev,
      );
      setIsEditing(false);
      toast.success("Suggestion updated.");
    } catch {
      toast.error("Failed to update suggestion.");
    } finally {
      setEditSaving(false);
    }
  };

  useEffect(() => {
    const handler = (event: Event) => {
      const e = event as CustomEvent<{ action?: string; type?: string }>;
      if (e.detail?.action !== "refresh_suggestion") return;
      const type = e.detail?.type ?? "new";
      if (type === "vote" || type === "unvote") {
        silentRefreshVotes();
        return;
      }
      setRefreshType(type);
    };
    window.addEventListener("realtimeSuggestion", handler);
    return () => window.removeEventListener("realtimeSuggestion", handler);
  }, [silentRefreshVotes]);

  const isValueSuggestion =
    suggestion?.field === "cash_value" || suggestion?.field === "duped_value";

  useEffect(() => {
    if (!item?.id || !isValueSuggestion) return;
    const run = async () => {
      setHistoryLoading(true);
      try {
        const { url, headers } = buildApiFetchRequest(
          PUBLIC_API_URL!,
          `/item/history?id=${item.id}`,
        );
        const res = await fetch(url, { credentials: "include", headers });
        if (!res.ok) return;
        const data = await res.json();
        setItemHistory(Array.isArray(data) ? data : null);
      } catch {
        // non-critical
      } finally {
        setHistoryLoading(false);
      }
    };
    run();
  }, [item?.id, isValueSuggestion]);

  const categoryIcon = item ? getCategoryIcon(item.type) : null;

  return (
    <>
      <NitroValuesSuggestionDetailRailAd />
      <NitroValuesSuggestionDetailRightRailAd />
      <main className="min-h-screen">
        <div className="container mx-auto px-4 pb-10 sm:px-6">
          <Breadcrumb />

          {/* Upvote Disclaimer */}
          <div className="border-border-error bg-button-danger/10 mb-5 rounded-lg border px-5 py-4">
            <p className="text-form-error text-lg font-bold">
              Please note that a high upvote count does not guarantee a
              suggestion will be accepted.
            </p>
          </div>

          {ban && <BanBanner ban={ban} className="mb-5" />}

          {(loading || (suggestion?.is_vt === 1 && isAuthLoading)) && (
            <div className="animate-pulse space-y-5">
              {/* Hero */}
              <div className="border-border-card bg-secondary-bg overflow-hidden rounded-xl border">
                <div className="flex flex-col sm:flex-row">
                  <div
                    className="bg-tertiary-bg w-full shrink-0 sm:w-56"
                    style={{ aspectRatio: "16/9" }}
                  />
                  <div className="flex flex-1 flex-col justify-center gap-4 p-5">
                    <div className="bg-quaternary-bg h-7 w-48 rounded" />
                    <div className="flex flex-wrap gap-1.5">
                      <div className="bg-quaternary-bg h-6 w-16 rounded-lg" />
                      <div className="bg-quaternary-bg h-6 w-20 rounded-lg" />
                      <div className="bg-quaternary-bg h-6 w-16 rounded-lg" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-quaternary-bg h-5 w-5 rounded-full" />
                      <div className="bg-quaternary-bg h-4 w-28 rounded" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="border-border-card bg-secondary-bg rounded-xl border">
                <div className="border-border-card border-b px-5 py-3.5">
                  <div className="bg-quaternary-bg h-4 w-16 rounded" />
                </div>
                <div className="space-y-2 p-5">
                  <div className="bg-quaternary-bg h-3 w-full rounded" />
                  <div className="bg-quaternary-bg h-3 w-full rounded" />
                  <div className="bg-quaternary-bg h-3 w-5/6 rounded" />
                  <div className="bg-quaternary-bg h-3 w-full rounded" />
                  <div className="bg-quaternary-bg h-3 w-3/4 rounded" />
                </div>
              </div>

              {/* Mobile: stacked value + votes cards */}
              <div className="space-y-5 lg:hidden">
                <div className="border-border-card bg-secondary-bg rounded-xl border">
                  <div className="border-border-card border-b px-5 py-3.5">
                    <div className="bg-quaternary-bg h-4 w-32 rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-5">
                    <div className="p-3">
                      <div className="bg-quaternary-bg mb-2 h-3 w-8 rounded" />
                      <div className="bg-quaternary-bg h-6 w-20 rounded" />
                    </div>
                    <div className="p-3">
                      <div className="bg-quaternary-bg mb-2 h-3 w-8 rounded" />
                      <div className="bg-quaternary-bg h-6 w-20 rounded" />
                    </div>
                  </div>
                </div>
                <div className="border-border-card bg-secondary-bg rounded-xl border">
                  <div className="border-border-card flex items-center justify-between border-b px-5 py-3">
                    <div className="bg-quaternary-bg h-4 w-12 rounded" />
                    <div className="flex gap-2">
                      <div className="bg-quaternary-bg h-7 w-16 rounded-lg" />
                      <div className="bg-quaternary-bg h-7 w-16 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop: 5-col grid */}
              <div className="hidden lg:grid lg:grid-cols-5 lg:gap-5">
                <div className="border-border-card bg-secondary-bg min-w-0 space-y-3 rounded-xl border p-5 lg:col-span-3">
                  <div className="bg-quaternary-bg h-4 w-24 rounded" />
                  <div className="bg-quaternary-bg h-3 w-full rounded" />
                  <div className="bg-quaternary-bg h-3 w-full rounded" />
                  <div className="bg-quaternary-bg h-3 w-2/3 rounded" />
                </div>
                <div className="space-y-5 lg:col-span-2">
                  <div className="border-border-card bg-secondary-bg rounded-xl border">
                    <div className="border-border-card border-b px-5 py-3.5">
                      <div className="bg-quaternary-bg h-4 w-32 rounded" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 p-5">
                      <div className="p-3">
                        <div className="bg-quaternary-bg mb-2 h-3 w-8 rounded" />
                        <div className="bg-quaternary-bg h-6 w-20 rounded" />
                      </div>
                      <div className="p-3">
                        <div className="bg-quaternary-bg mb-2 h-3 w-8 rounded" />
                        <div className="bg-quaternary-bg h-6 w-20 rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="border-border-card bg-secondary-bg rounded-xl border">
                    <div className="border-border-card flex items-center justify-between border-b px-5 py-3">
                      <div className="bg-quaternary-bg h-4 w-12 rounded" />
                      <div className="flex gap-2">
                        <div className="bg-quaternary-bg h-7 w-16 rounded-lg" />
                        <div className="bg-quaternary-bg h-7 w-16 rounded-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="border-border-card bg-secondary-bg rounded-xl border p-10 text-center">
              <Icon
                icon="material-symbols:error-outline-rounded"
                className="text-button-danger mx-auto mb-3 h-12 w-12"
                inline
              />
              <p className="text-primary-text font-semibold">{error}</p>
              <Link
                href="/values/suggestions"
                prefetch={false}
                className="text-link hover:text-link-hover mt-3 inline-block text-sm transition-colors"
              >
                Back to suggestions
              </Link>
            </div>
          )}

          {refreshType !== null && !loading && (
            <div
              className="fixed left-1/2 z-[1500] -translate-x-1/2"
              style={{ top: "calc(var(--header-height, 64px) + 12px)" }}
            >
              <button
                type="button"
                onClick={() => {
                  window.location.reload();
                }}
                className="bg-button-info hover:bg-button-info-hover text-form-button-text flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap shadow-lg transition-colors"
              >
                <Icon
                  icon="material-symbols:refresh-rounded"
                  className="h-4 w-4"
                  inline
                />
                {refreshType === "edit"
                  ? "This suggestion was edited — click to refresh"
                  : refreshType === "status"
                    ? "Suggestion status changed — click to refresh"
                    : "This suggestion was updated — click to refresh"}
              </button>
            </div>
          )}

          {!loading &&
            !(suggestion?.is_vt === 1 && isAuthLoading) &&
            suggestion && (
              <div className="space-y-5">
                {/* ── Hero ── */}
                <div className="border-border-card bg-secondary-bg overflow-hidden rounded-xl border">
                  <div className="flex flex-col sm:flex-row">
                    {/* Item image */}
                    <div
                      className="bg-secondary-bg relative w-full shrink-0 sm:w-56 lg:w-80"
                      style={{ aspectRatio: "16/9" }}
                    >
                      {item && isVideoItem(item.name) ? (
                        <video
                          src={getVideoPath(item.type, item.name)}
                          className="h-full w-full object-contain"
                          muted
                          loop
                          autoPlay
                        />
                      ) : (
                        <Image
                          src={
                            item
                              ? getItemImagePath(item.type, item.name, true)
                              : "/placeholder.png"
                          }
                          alt={item?.name ?? `Item #${suggestion.item_id}`}
                          fill
                          className="object-contain"
                          onError={handleImageError}
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-5">
                      <div>
                        {item ? (
                          <Link
                            href={`/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}?tab=suggestions`}
                            prefetch={false}
                            className="text-primary-text hover:text-link text-2xl font-bold transition-colors"
                          >
                            {item.name}
                          </Link>
                        ) : (
                          <span className="text-primary-text text-2xl font-bold">
                            Item #{suggestion.item_id}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {item && (
                          <span
                            className={`${badgeBase} bg-tertiary-bg/40 text-primary-text`}
                            style={{ borderColor: getCategoryColor(item.type) }}
                          >
                            {categoryIcon && (
                              <categoryIcon.Icon
                                className="mr-1.5 h-3 w-3"
                                style={{ color: getCategoryColor(item.type) }}
                              />
                            )}
                            {item.type}
                          </span>
                        )}
                        <span
                          className={`${badgeBase} border-border-card bg-tertiary-bg text-primary-text`}
                        >
                          {fieldLabel(suggestion.field)}
                        </span>
                        <span
                          className={`${badgeBase} capitalize ${statusColors[suggestion.status] ?? "border-border-card bg-tertiary-bg/40 text-secondary-text"}`}
                        >
                          {suggestion.status}
                        </span>
                        {suggestion.is_vt === 1 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Image
                                src="https://assets.jailbreakchangelogs.com/assets/website_icons/jbcl_vt.svg"
                                alt="Value Team"
                                width={20}
                                height={20}
                                className="shrink-0"
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              Value Team Suggestion
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                      <div>
                        <p className="text-secondary-text mb-1.5 text-xs font-semibold tracking-wide uppercase">
                          Suggested by
                        </p>
                        <div className="mt-1 flex items-start gap-2.5">
                          <UserAvatar
                            userId={suggestion.user.id}
                            avatarHash={null}
                            username={
                              suggestion.user.roblox_username ??
                              suggestion.user.username ??
                              ""
                            }
                            forceAvatarUrl={
                              suggestion.user.roblox_avatar ?? undefined
                            }
                            premiumType={suggestion.user.premiumtype ?? 0}
                            size={9}
                            showBadge={false}
                            bgClassName="bg-tertiary-bg"
                          />
                          <div className="min-w-0">
                            <Link
                              href={`/users/${suggestion.user.id}`}
                              prefetch={false}
                              className="text-link hover:text-link-hover block text-sm font-medium transition-colors"
                            >
                              {suggestion.user.roblox_display_name ||
                                suggestion.user.roblox_username ||
                                `User #${suggestion.user.id}`}
                            </Link>
                            <p className="text-secondary-text mt-1 text-xs">
                              Posted on{" "}
                              {formatMessageDate(suggestion.created_at)}
                              {suggestion.updated_at !== suggestion.created_at
                                ? " (Edited)"
                                : ""}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            asChild
                            className="w-fit"
                          >
                            <Link
                              href="/values/suggestions?submit=true"
                              prefetch={false}
                            >
                              <Icon
                                icon="material-symbols:add-rounded"
                                className="h-4 w-4"
                                inline
                              />
                              Submit a Suggestion
                            </Link>
                          </Button>
                          {suggestion.user.roblox_id && (
                            <Button
                              variant="default"
                              size="sm"
                              asChild
                              className="w-fit"
                            >
                              <Link
                                href={`/inventories/${suggestion.user.roblox_id}`}
                                prefetch={false}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Icon
                                  icon="material-symbols:inventory-2-outline-rounded"
                                  className="h-4 w-4"
                                  inline
                                />
                                View Inventory
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Video ad — 3rd column, desktop only */}
                    <NitroValuesSuggestionDetailVideoPlayer />
                  </div>
                </div>

                {/* ── Content + Sidebar ── */}
                <div className="space-y-5">
                  {/* Reason — always first on every screen */}
                  <div className="min-w-0 space-y-5">
                    {/* Reason */}
                    <div className="border-border-card bg-secondary-bg rounded-xl border">
                      <div className="border-border-card flex items-center justify-between border-b px-5 py-3.5">
                        <h2 className="text-primary-text flex items-center gap-2 text-sm font-semibold">
                          <Icon
                            icon="material-symbols:description-outline-rounded"
                            className="text-secondary-text h-4 w-4"
                            inline
                          />
                          Reason
                        </h2>
                        {isAuthenticated &&
                          user?.id === suggestion.user.id &&
                          suggestion.status === "pending" && (
                            <Button
                              size="sm"
                              variant={isEditing ? "destructive" : "default"}
                              onClick={() => {
                                if (isEditing) {
                                  setIsEditing(false);
                                } else {
                                  setEditReason(suggestion.reason);
                                  setIsEditing(true);
                                }
                              }}
                            >
                              <Icon
                                icon={
                                  isEditing
                                    ? "material-symbols:close-rounded"
                                    : "material-symbols:edit-outline-rounded"
                                }
                                className="h-3.5 w-3.5"
                                inline
                              />
                              {isEditing ? "Cancel" : "Edit"}
                            </Button>
                          )}
                      </div>
                      <div className="p-5">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="flex justify-end">
                              <span className="text-secondary-text text-xs">
                                {editReason.length} / 350 min
                              </span>
                            </div>
                            <textarea
                              value={editReason}
                              onChange={(e) => setEditReason(e.target.value)}
                              rows={8}
                              className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-tertiary-text focus:border-button-info w-full resize-none rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none"
                            />
                            <RateLimitBanner
                              until={editRateLimitUntil}
                              label="You're updating too fast."
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={handleEditSave}
                                disabled={
                                  editSaving ||
                                  !!editRateLimitUntil ||
                                  editReason.trim().length < 350
                                }
                                className="bg-button-info hover:bg-button-info-hover text-form-button-text flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {editSaving ? (
                                  <>
                                    <Spinner className="h-3.5 w-3.5" />
                                    Saving...
                                  </>
                                ) : (
                                  "Save"
                                )}
                              </button>
                            </div>
                          </div>
                        ) : suggestion.reason.trim() ? (
                          (() => {
                            const isTruncated =
                              suggestion.reason.split("\n").length > 5 ||
                              suggestion.reason.length > MAX_REASON_LENGTH;
                            const mdContent = (() => {
                              const withBold = suggestion.reason.replace(
                                /(Common Trades?:?)/gi,
                                "**$1**",
                              );
                              return withBold
                                .split(/\n\n+/)
                                .map((part) => part.replace(/\n/g, "\n\n"))
                                .join("\n\n");
                            })();
                            const showReasonToggle =
                              reasonOverflows ||
                              (reasonExpanded && isTruncated);
                            return (
                              <div>
                                <div
                                  ref={reasonRef}
                                  className={`text-secondary-text overflow-hidden text-sm leading-relaxed break-words transition-all duration-200 ${
                                    isTruncated && !reasonExpanded
                                      ? "max-h-36"
                                      : ""
                                  }`}
                                >
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      h1: ({ children }) => (
                                        <h1 className="text-primary-text mt-3 mb-1.5 text-lg font-bold first:mt-0">
                                          {children}
                                        </h1>
                                      ),
                                      h2: ({ children }) => (
                                        <h2 className="text-primary-text mt-3 mb-1 text-base font-semibold first:mt-0">
                                          {children}
                                        </h2>
                                      ),
                                      h3: ({ children }) => (
                                        <h3 className="text-primary-text mt-2 mb-1 text-sm font-semibold first:mt-0">
                                          {children}
                                        </h3>
                                      ),
                                      p: ({ children }) => (
                                        <p className="mb-2 last:mb-0">
                                          {children}
                                        </p>
                                      ),
                                      ul: ({ children }) => (
                                        <ul className="mb-2 list-inside list-disc space-y-0.5 last:mb-0">
                                          {children}
                                        </ul>
                                      ),
                                      ol: ({ children }) => (
                                        <ol className="mb-2 list-inside list-decimal space-y-0.5 last:mb-0">
                                          {children}
                                        </ol>
                                      ),
                                      em: (props) => (
                                        <em className="italic" {...props} />
                                      ),
                                      strong: (props) => (
                                        <b
                                          className="text-primary-text font-semibold"
                                          {...props}
                                        />
                                      ),
                                    }}
                                  >
                                    {mdContent}
                                  </ReactMarkdown>
                                </div>
                                {showReasonToggle && (
                                  <button
                                    type="button"
                                    onClick={() => setReasonExpanded((v) => !v)}
                                    className="text-link hover:text-link-hover mt-2 flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors hover:underline"
                                  >
                                    <Icon
                                      icon={
                                        reasonExpanded
                                          ? "heroicons-outline:chevron-up"
                                          : "heroicons-outline:chevron-down"
                                      }
                                      className="h-4 w-4"
                                      inline
                                    />
                                    {reasonExpanded ? "Show Less" : "Read More"}
                                  </button>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          <p className="text-secondary-text text-sm leading-relaxed">
                            No reason provided.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Mobile layout (< lg): tabs — Details | Discussion ── */}
                  <div className="lg:hidden">
                    <Tabs defaultValue="details">
                      <TabsList fullWidth>
                        <TabsTrigger value="details" fullWidth>
                          Details
                        </TabsTrigger>
                        {isValueSuggestion && (
                          <TabsTrigger value="history" fullWidth>
                            Value History
                          </TabsTrigger>
                        )}
                        <TabsTrigger value="discussion" fullWidth>
                          Discussion
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="details" className="mt-4 space-y-5">
                        {/* Value change */}
                        <div className="border-border-card bg-secondary-bg rounded-xl border">
                          <div className="border-border-card border-b px-5 py-3.5">
                            <h2 className="text-primary-text flex items-center justify-center gap-2 text-sm font-semibold">
                              <Icon
                                icon="material-symbols:swap-vert-rounded"
                                className="text-secondary-text h-4 w-4"
                                inline
                              />
                              {fieldLabel(suggestion.field)} Suggestion
                            </h2>
                          </div>
                          <div className="grid grid-cols-2 gap-2 p-5">
                            <div className="min-w-0 p-3">
                              <div className="text-button-danger mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                                <Icon
                                  icon="mdi:minus-circle"
                                  className="h-3.5 w-3.5"
                                  inline
                                />
                                {`Old ${fieldLabel(suggestion.field).toUpperCase()}`}
                              </div>
                              <div
                                className="text-secondary-text text-lg font-bold line-through"
                                style={{
                                  wordBreak: "normal",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {formatFullValue(
                                  suggestion.current_value || "N/A",
                                )}
                              </div>
                            </div>
                            <div className="min-w-0 p-3">
                              <div className="text-button-success mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                                <Icon
                                  icon="mdi:plus-circle"
                                  className="h-3.5 w-3.5"
                                  inline
                                />
                                {`New ${fieldLabel(suggestion.field).toUpperCase()}`}
                              </div>
                              <div
                                className="text-primary-text text-lg font-bold"
                                style={{
                                  wordBreak: "normal",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {formatFullValue(suggestion.suggested_value)}
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Votes */}
                        <div className="border-border-card bg-secondary-bg rounded-xl border">
                          <div className="border-border-card flex items-center justify-between border-b px-5 py-3">
                            <h2 className="text-primary-text flex items-center gap-2 text-sm font-semibold">
                              <Icon
                                icon="material-symbols:how-to-vote-outline-rounded"
                                className="text-secondary-text h-4 w-4"
                                inline
                              />
                              Votes
                            </h2>
                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => handleVote("upvote")}
                                    disabled={
                                      voteLoading || !!voteRateLimit || !!ban
                                    }
                                    className="bg-button-success/10 hover:bg-button-success/20 flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {votingType === "upvote" ? (
                                      <Spinner className="text-button-success h-4 w-4" />
                                    ) : (
                                      <Icon
                                        icon={
                                          userVote === "upvote"
                                            ? "material-symbols:thumb-up-rounded"
                                            : "material-symbols:thumb-up-outline-rounded"
                                        }
                                        className="text-button-success h-4 w-4"
                                        inline
                                      />
                                    )}
                                    <span className="text-button-success font-bold">
                                      {voteCounts.up}
                                    </span>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {userVote === "upvote"
                                    ? "Remove upvote"
                                    : "Upvote"}
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => handleVote("downvote")}
                                    disabled={
                                      voteLoading || !!voteRateLimit || !!ban
                                    }
                                    className="bg-button-danger/10 hover:bg-button-danger/20 flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {votingType === "downvote" ? (
                                      <Spinner className="text-button-danger h-4 w-4" />
                                    ) : (
                                      <Icon
                                        icon={
                                          userVote === "downvote"
                                            ? "material-symbols:thumb-down-rounded"
                                            : "material-symbols:thumb-down-outline-rounded"
                                        }
                                        className="text-button-danger h-4 w-4"
                                        inline
                                      />
                                    )}
                                    <span className="text-button-danger font-bold">
                                      {voteCounts.down}
                                    </span>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {userVote === "downvote"
                                    ? "Remove downvote"
                                    : "Downvote"}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                          {voteRateLimit && voteRateLimitSeconds > 0 && (
                            <div className="border-border-card bg-tertiary-bg flex items-center justify-center gap-1.5 border-b px-3 py-1.5 text-xs text-yellow-400">
                              <Icon
                                icon="material-symbols:hourglass-empty-rounded"
                                className="h-3.5 w-3.5 shrink-0"
                                inline
                              />
                              Too fast — wait{" "}
                              {voteRateLimitSeconds >= 60
                                ? `${Math.floor(voteRateLimitSeconds / 60)}m ${voteRateLimitSeconds % 60}s`
                                : `${voteRateLimitSeconds}s`}
                            </div>
                          )}
                          {(suggestion.votes.upvotes.length > 0 ||
                            suggestion.votes.downvotes.length > 0) && (
                            <div className="p-5">
                              <Tabs defaultValue="upvotes">
                                <TabsList fullWidth className="mb-4">
                                  <TabsTrigger value="upvotes" fullWidth>
                                    <span className="flex items-center gap-1.5">
                                      <Icon
                                        icon="material-symbols:thumb-up-rounded"
                                        className="text-button-success h-3.5 w-3.5"
                                        inline
                                      />
                                      Upvotes ({suggestion.votes.upvotes.length}
                                      )
                                    </span>
                                  </TabsTrigger>
                                  <TabsTrigger value="downvotes" fullWidth>
                                    <span className="flex items-center gap-1.5">
                                      <Icon
                                        icon="material-symbols:thumb-down-rounded"
                                        className="text-button-danger h-3.5 w-3.5"
                                        inline
                                      />
                                      Downvotes (
                                      {suggestion.votes.downvotes.length})
                                    </span>
                                  </TabsTrigger>
                                </TabsList>
                                <TabsContent value="upvotes">
                                  {suggestion.votes.upvotes.length === 0 ? (
                                    <p className="text-secondary-text py-4 text-center text-sm">
                                      No upvotes yet.
                                    </p>
                                  ) : (
                                    <div className={voterListClassName}>
                                      {suggestion.votes.upvotes.map((v) => (
                                        <VoterCard
                                          key={v.user.id + v.created_at}
                                          v={v}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </TabsContent>
                                <TabsContent value="downvotes">
                                  {suggestion.votes.downvotes.length === 0 ? (
                                    <p className="text-secondary-text py-4 text-center text-sm">
                                      No downvotes yet.
                                    </p>
                                  ) : (
                                    <div className={voterListClassName}>
                                      {suggestion.votes.downvotes.map((v) => (
                                        <VoterCard
                                          key={v.user.id + v.created_at}
                                          v={v}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </TabsContent>
                              </Tabs>
                            </div>
                          )}
                        </div>
                        {/* Suggester Stats */}
                        {suggesterStats && (
                          <div className="border-border-card bg-secondary-bg rounded-xl border">
                            <div className="border-border-card border-b px-5 py-3.5">
                              <h2 className="text-primary-text flex items-center gap-2 text-sm font-semibold">
                                <Icon
                                  icon="material-symbols:bar-chart-4-bars-rounded"
                                  className="text-secondary-text h-4 w-4"
                                  inline
                                />
                                Suggester Stats
                              </h2>
                            </div>
                            <div className="space-y-3 p-4">
                              <div>
                                <div className="mb-1.5 flex items-center justify-between">
                                  <span className="text-secondary-text text-xs">
                                    Acceptance Rate
                                  </span>
                                  <span
                                    className={`text-sm font-bold ${suggesterStats.acceptance_rate >= 50 ? "text-button-success" : "text-button-danger"}`}
                                  >
                                    {suggesterStats.acceptance_rate.toFixed(0)}%
                                  </span>
                                </div>
                                <div className="bg-tertiary-bg h-1.5 overflow-hidden rounded-full">
                                  <div
                                    className={`h-full rounded-full transition-all ${suggesterStats.acceptance_rate >= 50 ? "bg-button-success" : "bg-button-danger"}`}
                                    style={{
                                      width: `${suggesterStats.acceptance_rate}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="bg-tertiary-bg rounded-lg p-2.5 text-center">
                                  <Icon
                                    icon="material-symbols:send-rounded"
                                    className="text-secondary-text mx-auto mb-1 h-4 w-4"
                                  />
                                  <p className="text-primary-text text-sm font-bold">
                                    {suggesterStats.total_submitted}
                                  </p>
                                  <p className="text-secondary-text text-[10px]">
                                    Submitted
                                  </p>
                                </div>
                                <div className="bg-button-success/10 rounded-lg p-2.5 text-center">
                                  <Icon
                                    icon="material-symbols:thumb-up-rounded"
                                    className="text-button-success mx-auto mb-1 h-4 w-4"
                                  />
                                  <p className="text-button-success text-sm font-bold">
                                    {suggesterStats.total_accepted}
                                  </p>
                                  <p className="text-secondary-text text-[10px]">
                                    Accepted
                                  </p>
                                </div>
                                <div className="bg-button-danger/10 rounded-lg p-2.5 text-center">
                                  <Icon
                                    icon="material-symbols:thumb-down-rounded"
                                    className="text-button-danger mx-auto mb-1 h-4 w-4"
                                  />
                                  <p className="text-button-danger text-sm font-bold">
                                    {suggesterStats.total_rejected}
                                  </p>
                                  <p className="text-secondary-text text-[10px]">
                                    Rejected
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                      {isValueSuggestion && (
                        <TabsContent value="history" className="mt-4">
                          <div className="border-border-card bg-secondary-bg rounded-xl border">
                            <div className="p-5">
                              {historyLoading ? (
                                <div className="bg-tertiary-bg h-87.5 animate-pulse rounded" />
                              ) : (
                                <ItemValueChart
                                  historyData={itemHistory}
                                  showOnlyValueHistory
                                  hideTradingMetrics
                                />
                              )}
                            </div>
                          </div>
                        </TabsContent>
                      )}
                      <TabsContent value="discussion" className="mt-4">
                        <ChangelogComments
                          changelogId={suggestion.id}
                          changelogTitle={`Value Suggestion #${suggestion.id}`}
                          type="vsuggestion"
                          suggestion={{
                            suggester: suggestion.user.id,
                            upvoterIds: suggestion.votes.upvotes.map(
                              (v) => v.user.id,
                            ),
                            downvoterIds: suggestion.votes.downvotes.map(
                              (v) => v.user.id,
                            ),
                          }}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* ── Desktop layout (lg+): 3-col grid ── */}
                  <div className="hidden lg:grid lg:grid-cols-5 lg:gap-5">
                    {/* Main — comments */}
                    <div className="min-w-0 lg:col-span-3">
                      <ChangelogComments
                        changelogId={suggestion.id}
                        changelogTitle={`Value Suggestion #${suggestion.id}`}
                        type="vsuggestion"
                        suggestion={{
                          suggester: suggestion.user.id,
                          upvoterIds: suggestion.votes.upvotes.map(
                            (v) => v.user.id,
                          ),
                          downvoterIds: suggestion.votes.downvotes.map(
                            (v) => v.user.id,
                          ),
                        }}
                      />
                    </div>

                    {/* Sidebar — value change + votes + suggester stats */}
                    <div className="space-y-5 lg:col-span-2">
                      {/* Value change */}
                      <div className="border-border-card bg-secondary-bg rounded-xl border">
                        <div className="border-border-card border-b px-5 py-3.5">
                          <h2 className="text-primary-text flex items-center justify-center gap-2 text-sm font-semibold">
                            <Icon
                              icon="material-symbols:swap-vert-rounded"
                              className="text-secondary-text h-4 w-4"
                              inline
                            />
                            {fieldLabel(suggestion.field)} Suggestion
                          </h2>
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-5">
                          <div className="min-w-0 p-3">
                            <div className="text-button-danger mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                              <Icon
                                icon="mdi:minus-circle"
                                className="h-3.5 w-3.5"
                                inline
                              />
                              {`Old ${fieldLabel(suggestion.field).toUpperCase()}`}
                            </div>
                            <div
                              className="text-secondary-text text-lg font-bold line-through"
                              style={{
                                wordBreak: "normal",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {formatFullValue(
                                suggestion.current_value || "N/A",
                              )}
                            </div>
                          </div>
                          <div className="min-w-0 p-3">
                            <div className="text-button-success mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                              <Icon
                                icon="mdi:plus-circle"
                                className="h-3.5 w-3.5"
                                inline
                              />
                              {`New ${fieldLabel(suggestion.field).toUpperCase()}`}
                            </div>
                            <div
                              className="text-primary-text text-lg font-bold"
                              style={{
                                wordBreak: "normal",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {formatFullValue(suggestion.suggested_value)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Votes */}
                      <div className="border-border-card bg-secondary-bg rounded-xl border">
                        <div className="border-border-card flex items-center justify-between border-b px-5 py-3">
                          <h2 className="text-primary-text flex items-center gap-2 text-sm font-semibold">
                            <Icon
                              icon="material-symbols:how-to-vote-outline-rounded"
                              className="text-secondary-text h-4 w-4"
                              inline
                            />
                            Votes
                          </h2>
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => handleVote("upvote")}
                                  disabled={
                                    voteLoading || !!voteRateLimit || !!ban
                                  }
                                  className="bg-button-success/10 hover:bg-button-success/20 flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {votingType === "upvote" ? (
                                    <Spinner className="text-button-success h-4 w-4" />
                                  ) : (
                                    <Icon
                                      icon={
                                        userVote === "upvote"
                                          ? "material-symbols:thumb-up-rounded"
                                          : "material-symbols:thumb-up-outline-rounded"
                                      }
                                      className="text-button-success h-4 w-4"
                                      inline
                                    />
                                  )}
                                  <span className="text-button-success font-bold">
                                    {voteCounts.up}
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {userVote === "upvote"
                                  ? "Remove upvote"
                                  : "Upvote"}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => handleVote("downvote")}
                                  disabled={
                                    voteLoading || !!voteRateLimit || !!ban
                                  }
                                  className="bg-button-danger/10 hover:bg-button-danger/20 flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {votingType === "downvote" ? (
                                    <Spinner className="text-button-danger h-4 w-4" />
                                  ) : (
                                    <Icon
                                      icon={
                                        userVote === "downvote"
                                          ? "material-symbols:thumb-down-rounded"
                                          : "material-symbols:thumb-down-outline-rounded"
                                      }
                                      className="text-button-danger h-4 w-4"
                                      inline
                                    />
                                  )}
                                  <span className="text-button-danger font-bold">
                                    {voteCounts.down}
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {userVote === "downvote"
                                  ? "Remove downvote"
                                  : "Downvote"}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        {voteRateLimit && voteRateLimitSeconds > 0 && (
                          <div className="border-border-card bg-tertiary-bg flex items-center justify-center gap-1.5 border-b px-3 py-1.5 text-xs text-yellow-400">
                            <Icon
                              icon="material-symbols:hourglass-empty-rounded"
                              className="h-3.5 w-3.5 shrink-0"
                              inline
                            />
                            Too fast — wait{" "}
                            {voteRateLimitSeconds >= 60
                              ? `${Math.floor(voteRateLimitSeconds / 60)}m ${voteRateLimitSeconds % 60}s`
                              : `${voteRateLimitSeconds}s`}
                          </div>
                        )}
                        {(suggestion.votes.upvotes.length > 0 ||
                          suggestion.votes.downvotes.length > 0) && (
                          <div className="p-5">
                            <Tabs defaultValue="upvotes">
                              <TabsList fullWidth className="mb-4">
                                <TabsTrigger value="upvotes" fullWidth>
                                  <span className="flex items-center gap-1.5">
                                    <Icon
                                      icon="material-symbols:thumb-up-rounded"
                                      className="text-button-success h-3.5 w-3.5"
                                      inline
                                    />
                                    Upvotes ({suggestion.votes.upvotes.length})
                                  </span>
                                </TabsTrigger>
                                <TabsTrigger value="downvotes" fullWidth>
                                  <span className="flex items-center gap-1.5">
                                    <Icon
                                      icon="material-symbols:thumb-down-rounded"
                                      className="text-button-danger h-3.5 w-3.5"
                                      inline
                                    />
                                    Downvotes (
                                    {suggestion.votes.downvotes.length})
                                  </span>
                                </TabsTrigger>
                              </TabsList>
                              <TabsContent value="upvotes">
                                {suggestion.votes.upvotes.length === 0 ? (
                                  <p className="text-secondary-text py-4 text-center text-sm">
                                    No upvotes yet.
                                  </p>
                                ) : (
                                  <div className={voterListClassName}>
                                    {suggestion.votes.upvotes.map((v) => (
                                      <VoterCard
                                        key={v.user.id + v.created_at}
                                        v={v}
                                      />
                                    ))}
                                  </div>
                                )}
                              </TabsContent>
                              <TabsContent value="downvotes">
                                {suggestion.votes.downvotes.length === 0 ? (
                                  <p className="text-secondary-text py-4 text-center text-sm">
                                    No downvotes yet.
                                  </p>
                                ) : (
                                  <div className={voterListClassName}>
                                    {suggestion.votes.downvotes.map((v) => (
                                      <VoterCard
                                        key={v.user.id + v.created_at}
                                        v={v}
                                      />
                                    ))}
                                  </div>
                                )}
                              </TabsContent>
                            </Tabs>
                          </div>
                        )}
                      </div>

                      {/* Suggester Stats */}
                      {suggesterStats && (
                        <div className="border-border-card bg-secondary-bg rounded-xl border">
                          <div className="border-border-card border-b px-5 py-3.5">
                            <h2 className="text-primary-text flex items-center gap-2 text-sm font-semibold">
                              <Icon
                                icon="material-symbols:bar-chart-4-bars-rounded"
                                className="text-secondary-text h-4 w-4"
                                inline
                              />
                              Suggester Stats
                            </h2>
                          </div>
                          <div className="space-y-3 p-4">
                            <div>
                              <div className="mb-1.5 flex items-center justify-between">
                                <span className="text-secondary-text text-xs">
                                  Acceptance Rate
                                </span>
                                <span
                                  className={`text-sm font-bold ${suggesterStats.acceptance_rate >= 50 ? "text-button-success" : "text-button-danger"}`}
                                >
                                  {suggesterStats.acceptance_rate.toFixed(0)}%
                                </span>
                              </div>
                              <div className="bg-tertiary-bg h-1.5 overflow-hidden rounded-full">
                                <div
                                  className={`h-full rounded-full transition-all ${suggesterStats.acceptance_rate >= 50 ? "bg-button-success" : "bg-button-danger"}`}
                                  style={{
                                    width: `${suggesterStats.acceptance_rate}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-tertiary-bg rounded-lg p-2.5 text-center">
                                <Icon
                                  icon="material-symbols:send-rounded"
                                  className="text-secondary-text mx-auto mb-1 h-4 w-4"
                                />
                                <p className="text-primary-text text-sm font-bold">
                                  {suggesterStats.total_submitted}
                                </p>
                                <p className="text-secondary-text text-[10px]">
                                  Submitted
                                </p>
                              </div>
                              <div className="bg-button-success/10 rounded-lg p-2.5 text-center">
                                <Icon
                                  icon="material-symbols:thumb-up-rounded"
                                  className="text-button-success mx-auto mb-1 h-4 w-4"
                                />
                                <p className="text-button-success text-sm font-bold">
                                  {suggesterStats.total_accepted}
                                </p>
                                <p className="text-secondary-text text-[10px]">
                                  Accepted
                                </p>
                              </div>
                              <div className="bg-button-danger/10 rounded-lg p-2.5 text-center">
                                <Icon
                                  icon="material-symbols:thumb-down-rounded"
                                  className="text-button-danger mx-auto mb-1 h-4 w-4"
                                />
                                <p className="text-button-danger text-sm font-bold">
                                  {suggesterStats.total_rejected}
                                </p>
                                <p className="text-secondary-text text-[10px]">
                                  Rejected
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Value History Chart */}
                      {isValueSuggestion && (
                        <div className="border-border-card bg-secondary-bg rounded-xl border">
                          <div className="border-border-card border-b px-5 py-3.5">
                            <h2 className="text-primary-text flex items-center gap-2 text-sm font-semibold">
                              <Icon
                                icon="material-symbols:show-chart-rounded"
                                className="text-secondary-text h-4 w-4"
                                inline
                              />
                              Value History
                            </h2>
                          </div>
                          <div className="p-5">
                            {historyLoading ? (
                              <div className="bg-tertiary-bg h-87.5 animate-pulse rounded" />
                            ) : (
                              <ItemValueChart
                                historyData={itemHistory}
                                showOnlyValueHistory
                                hideTradingMetrics
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </main>
    </>
  );
}
