"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { UserAvatar } from "@/utils/avatar";
import { buildApiUrlWithDevToken } from "@/utils/apiDevToken";
import { PUBLIC_API_URL } from "@/utils/api";
import { formatMessageDate } from "@/utils/timestamp";
import { formatFullValue } from "@/utils/values";
import {
  getItemImagePath,
  handleImageError,
  isVideoItem,
  getVideoPath,
} from "@/utils/images";
import { getCategoryColor, getCategoryIcon } from "@/utils/categoryIcons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import type { Item } from "@/types/index";

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

interface SuggestionUser {
  id: string;
  username?: string;
  global_name?: string;
  avatar?: string | null;
  custom_avatar?: string | null;
  premiumtype?: number;
  usernumber?: number;
  settings?: UserSettings;
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
  created_at: number;
  updated_at: number;
  user: SuggestionUser;
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
  rejected: "bg-red-500/20 text-primary-text border-red-500/30",
};

const badgeBase =
  "inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl";

function VoterCard({ v }: { v: { created_at: number; user: SuggestionUser } }) {
  return (
    <div className="border-border-card bg-tertiary-bg flex items-center gap-3 rounded-lg border px-4 py-3">
      <div className="relative h-10 w-10 shrink-0">
        <UserAvatar
          userId={v.user.id}
          avatarHash={v.user.avatar ?? null}
          username={v.user.username ?? ""}
          custom_avatar={v.user.custom_avatar ?? undefined}
          premiumType={v.user.premiumtype ?? 0}
          settings={
            v.user.settings
              ? {
                  custom_avatar: !!v.user.settings.custom_avatar,
                  hide_presence: !!v.user.settings.hide_presence,
                }
              : undefined
          }
          size={10}
          showBadge={false}
        />
      </div>
      <div className="min-w-0 flex-1">
        <Link
          href={`/users/${v.user.id}`}
          prefetch={false}
          className="text-primary-text hover:text-link block truncate text-sm font-medium transition-colors"
        >
          {v.user.global_name || v.user.username || `User #${v.user.id}`}
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
  const isMobile = useMediaQuery("(max-width:640px)");
  const { isAuthenticated, user, setLoginModal } = useAuthContext();

  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldShowNotFound, setShouldShowNotFound] = useState(false);
  const [routeError, setRouteError] = useState<Error | null>(null);
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null);
  const [voteCounts, setVoteCounts] = useState({ up: 0, down: 0 });
  const [voteLoading, setVoteLoading] = useState(false);
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

  useEffect(() => {
    if (!id) return;
    const run = async () => {
      setLoading(true);
      setError(null);
      setShouldShowNotFound(false);
      setRouteError(null);
      try {
        const res = await fetch(
          buildApiUrlWithDevToken(PUBLIC_API_URL!, `/value-suggestions/${id}`),
          { credentials: "include" },
        );
        if (!res.ok) {
          if (res.status === 404) {
            setShouldShowNotFound(true);
          } else if (res.status >= 500) {
            setRouteError(new Error("Failed to load suggestion details."));
          } else {
            setError("Failed to load suggestion.");
          }
          return;
        }
        const data: Suggestion = await res.json();
        setSuggestion(data);
        setVoteCounts({ up: data.upvotes, down: data.downvotes });
        try {
          const itemRes = await fetch(
            buildApiUrlWithDevToken(
              PUBLIC_API_URL!,
              `/items/get?id=${data.item_id}`,
            ),
          );
          if (itemRes.ok) setItem(await itemRes.json());
        } catch {
          /* non-fatal */
        }
      } catch {
        setError("Failed to load suggestion.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  if (shouldShowNotFound) {
    notFound();
  }

  if (routeError) {
    throw routeError;
  }

  useEffect(() => {
    if (!suggestion || !user) return;
    const hasUp = suggestion.votes.upvotes.some((v) => v.user.id === user.id);
    const hasDown = suggestion.votes.downvotes.some(
      (v) => v.user.id === user.id,
    );
    setUserVote(hasUp ? "upvote" : hasDown ? "downvote" : null);
  }, [suggestion, user]);

  const handleVote = async (type: "upvote" | "downvote") => {
    if (!isAuthenticated) {
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
      return next;
    });

    setVoteLoading(true);
    try {
      const url = buildApiUrlWithDevToken(
        PUBLIC_API_URL!,
        `/value-suggestions/${id}/vote`,
      );
      const res = await fetch(url, {
        method: removing ? "DELETE" : "POST",
        credentials: "include",
        ...(removing
          ? {}
          : {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ vote_type: type }),
            }),
      });
      if (!res.ok) {
        setUserVote(prevVote);
        setVoteCounts(prevCounts);
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
          toast.error("You're voting too fast. Please wait a moment.");
          const retryAfter = parseInt(
            res.headers.get("retry-after") ?? "60",
            10,
          );
          setVoteRateLimit(Date.now() + retryAfter * 1000);
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
      const url = buildApiUrlWithDevToken(
        PUBLIC_API_URL!,
        `/value-suggestions/${id}`,
      );
      const res = await fetch(url, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: suggestion.item_id,
          suggestion: { reason: editReason.trim() },
        }),
      });
      if (!res.ok) {
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

  const categoryIcon = item ? getCategoryIcon(item.type) : null;

  return (
    <main className="min-h-screen">
      <div className="container mx-auto max-w-5xl px-4 pb-10 sm:px-6">
        <Breadcrumb />

        {loading && (
          <div className="flex items-center justify-center py-32">
            <Spinner className="h-8 w-8" />
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

        {!loading && suggestion && (
          <div className="space-y-5">
            {/* ── Hero ── */}
            <div className="border-border-card bg-secondary-bg overflow-hidden rounded-xl border">
              <div className="flex flex-col sm:flex-row">
                {/* Item image */}
                <div
                  className="bg-secondary-bg relative w-full shrink-0 sm:w-56"
                  style={{ aspectRatio: "16/9" }}
                >
                  {item && isVideoItem(item.name) ? (
                    <video
                      src={getVideoPath(item.type, item.name)}
                      className="h-full w-full object-cover"
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
                      className="object-cover"
                      onError={handleImageError}
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-5">
                  <div>
                    {item ? (
                      <Link
                        href={`/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`}
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

                  <div className="flex flex-wrap gap-1.5">
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
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-secondary-text text-xs">
                      Suggested by
                    </span>
                    <UserAvatar
                      userId={suggestion.user.id}
                      avatarHash={suggestion.user.avatar ?? null}
                      username={suggestion.user.username ?? ""}
                      custom_avatar={suggestion.user.custom_avatar ?? undefined}
                      premiumType={suggestion.user.premiumtype ?? 0}
                      settings={
                        suggestion.user.settings
                          ? {
                              custom_avatar:
                                !!suggestion.user.settings.custom_avatar,
                              hide_presence:
                                !!suggestion.user.settings.hide_presence,
                            }
                          : undefined
                      }
                      size={5}
                      showBadge={false}
                    />
                    <Link
                      href={`/users/${suggestion.user.id}`}
                      prefetch={false}
                      className="text-link hover:text-link-hover text-sm font-medium transition-colors"
                    >
                      {suggestion.user.global_name ||
                        suggestion.user.username ||
                        `User #${suggestion.user.id}`}
                    </Link>
                    <span className="text-tertiary-text text-xs">·</span>
                    <span className="text-secondary-text text-xs">
                      {formatMessageDate(suggestion.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Content + Sidebar ── */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* Main — reason + voters */}
              <div className="min-w-0 space-y-5 lg:col-span-2">
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
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={handleEditSave}
                            disabled={
                              editSaving || editReason.trim().length < 350
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
                    ) : (
                      <p
                        className="text-secondary-text text-sm leading-relaxed break-words whitespace-pre-wrap"
                        style={{ overflowWrap: "break-word" }}
                      >
                        {suggestion.reason.trim() || "No reason provided."}
                      </p>
                    )}
                  </div>
                </div>

                {/* Voters */}
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
                            disabled={voteLoading || !!voteRateLimit}
                            className="bg-button-success/10 hover:bg-button-success/20 flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Icon
                              icon={
                                userVote === "upvote"
                                  ? "material-symbols:thumb-up-rounded"
                                  : "material-symbols:thumb-up-outline-rounded"
                              }
                              className="text-button-success h-4 w-4"
                              inline
                            />
                            <span className="text-button-success font-bold">
                              {voteCounts.up}
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {userVote === "upvote" ? "Remove upvote" : "Upvote"}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => handleVote("downvote")}
                            disabled={voteLoading || !!voteRateLimit}
                            className="bg-button-danger/10 hover:bg-button-danger/20 flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Icon
                              icon={
                                userVote === "downvote"
                                  ? "material-symbols:thumb-down-rounded"
                                  : "material-symbols:thumb-down-outline-rounded"
                              }
                              className="text-button-danger h-4 w-4"
                              inline
                            />
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
                                icon="material-symbols:thumb-up-outline-rounded"
                                className="text-button-success h-3.5 w-3.5"
                                inline
                              />
                              Upvotes ({suggestion.votes.upvotes.length})
                            </span>
                          </TabsTrigger>
                          <TabsTrigger value="downvotes" fullWidth>
                            <span className="flex items-center gap-1.5">
                              <Icon
                                icon="material-symbols:thumb-down-outline-rounded"
                                className="text-button-danger h-3.5 w-3.5"
                                inline
                              />
                              Downvotes ({suggestion.votes.downvotes.length})
                            </span>
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="upvotes">
                          {suggestion.votes.upvotes.length === 0 ? (
                            <p className="text-secondary-text py-4 text-center text-sm">
                              No upvotes yet.
                            </p>
                          ) : (
                            <div className="space-y-2">
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
                            <div className="space-y-2">
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
              </div>

              {/* Sidebar */}
              <div className="space-y-5">
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
                  <div className="space-y-4 p-5">
                    {/* Current */}
                    <div>
                      <p className="text-secondary-text mb-1 text-xs font-medium tracking-wide uppercase">
                        Current {fieldLabel(suggestion.field)}
                      </p>
                      <p
                        className="text-secondary-text text-xl font-bold line-through"
                        style={{ overflowWrap: "anywhere" }}
                      >
                        {isMobile
                          ? suggestion.current_value || "N/A"
                          : formatFullValue(suggestion.current_value || "N/A")}
                      </p>
                    </div>

                    <Icon
                      icon="material-symbols:arrow-downward-rounded"
                      className="text-secondary-text h-4 w-4"
                      inline
                    />

                    {/* Suggested */}
                    <div>
                      <p className="text-button-success mb-1 text-xs font-medium tracking-wide uppercase">
                        Suggested {fieldLabel(suggestion.field)}
                      </p>
                      <p
                        className="text-primary-text text-xl font-bold"
                        style={{ overflowWrap: "anywhere" }}
                      >
                        {isMobile
                          ? suggestion.suggested_value
                          : formatFullValue(suggestion.suggested_value)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
