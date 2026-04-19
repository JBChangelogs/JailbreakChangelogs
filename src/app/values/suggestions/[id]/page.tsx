"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Icon } from "@/components/ui/IconWrapper";
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
import { useMediaQuery } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import type { Item } from "@/types/index";

interface SuggestionUser {
  id: string;
  username: string;
  global_name: string;
  avatar: string | null;
  custom_avatar: string | null;
  premiumtype: number;
  usernumber: number;
  settings?: {
    avatar_discord: number;
    hide_presence?: number;
  };
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

function VoterRow({ v }: { v: { created_at: number; user: SuggestionUser } }) {
  return (
    <div className="flex items-center gap-2">
      <UserAvatar
        userId={v.user.id}
        avatarHash={v.user.avatar}
        username={v.user.username}
        custom_avatar={v.user.custom_avatar ?? undefined}
        premiumType={v.user.premiumtype}
        settings={v.user.settings}
        size={6}
        showBadge={false}
      />
      <Link
        href={`/users/${v.user.id}`}
        prefetch={false}
        className="text-primary-text hover:text-link text-sm transition-colors"
      >
        {v.user.global_name || v.user.username}
      </Link>
    </div>
  );
}

export default function ValueSuggestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isMobile = useMediaQuery("(max-width:640px)");

  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          buildApiUrlWithDevToken(PUBLIC_API_URL!, `/value-suggestions/${id}`),
          { credentials: "include" },
        );
        if (!res.ok) {
          setError(
            res.status === 404
              ? "Suggestion not found."
              : "Failed to load suggestion.",
          );
          return;
        }
        const data: Suggestion = await res.json();
        setSuggestion(data);
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

  const categoryIcon = item ? getCategoryIcon(item.type) : null;

  return (
    <main className="min-h-screen">
      <div className="container mx-auto max-w-5xl px-4 pb-10 sm:px-6">
        <Breadcrumb />

        {loading && (
          <div className="flex items-center justify-center py-32">
            <Icon
              icon="svg-spinners:ring-resize"
              className="text-button-info h-8 w-8"
              inline
            />
          </div>
        )}

        {error && !loading && (
          <div className="border-border-card bg-tertiary-bg rounded-xl border p-10 text-center">
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
            <div className="border-border-card bg-tertiary-bg overflow-hidden rounded-xl border">
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
                      className={`${badgeBase} border-border-card bg-tertiary-bg/40 text-primary-text`}
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
                      avatarHash={suggestion.user.avatar}
                      username={suggestion.user.username}
                      custom_avatar={suggestion.user.custom_avatar ?? undefined}
                      premiumType={suggestion.user.premiumtype}
                      settings={suggestion.user.settings}
                      size={5}
                      showBadge={false}
                    />
                    <Link
                      href={`/users/${suggestion.user.id}`}
                      prefetch={false}
                      className="text-link hover:text-link-hover text-sm font-medium transition-colors"
                    >
                      {suggestion.user.global_name || suggestion.user.username}
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
              <div className="space-y-5 lg:col-span-2">
                {/* Reason */}
                <div className="border-border-card bg-tertiary-bg rounded-xl border">
                  <div className="border-border-card border-b px-5 py-3.5">
                    <h2 className="text-primary-text flex items-center gap-2 text-sm font-semibold">
                      <Icon
                        icon="material-symbols:description-outline-rounded"
                        className="text-secondary-text h-4 w-4"
                        inline
                      />
                      Reason
                    </h2>
                  </div>
                  <div className="p-5">
                    <p
                      className="text-secondary-text text-sm leading-relaxed break-words whitespace-pre-wrap"
                      style={{ overflowWrap: "anywhere" }}
                    >
                      {suggestion.reason}
                    </p>
                  </div>
                </div>

                {/* Voters */}
                {(suggestion.votes.upvotes.length > 0 ||
                  suggestion.votes.downvotes.length > 0) && (
                  <div className="border-border-card bg-tertiary-bg rounded-xl border">
                    <div className="border-border-card border-b px-5 py-3.5">
                      <h2 className="text-primary-text flex items-center gap-2 text-sm font-semibold">
                        <Icon
                          icon="material-symbols:how-to-vote-outline-rounded"
                          className="text-secondary-text h-4 w-4"
                          inline
                        />
                        Voters
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2">
                      {suggestion.votes.upvotes.length > 0 && (
                        <div>
                          <p className="text-button-success mb-3 flex items-center gap-1.5 text-xs font-semibold">
                            <Icon
                              icon="material-symbols:thumb-up-rounded"
                              className="h-3.5 w-3.5"
                              inline
                            />
                            Upvotes ({suggestion.votes.upvotes.length})
                          </p>
                          <div className="space-y-2.5">
                            {suggestion.votes.upvotes.map((v) => (
                              <VoterRow key={v.user.id + v.created_at} v={v} />
                            ))}
                          </div>
                        </div>
                      )}
                      {suggestion.votes.downvotes.length > 0 && (
                        <div>
                          <p className="text-button-danger mb-3 flex items-center gap-1.5 text-xs font-semibold">
                            <Icon
                              icon="material-symbols:thumb-down-rounded"
                              className="h-3.5 w-3.5"
                              inline
                            />
                            Downvotes ({suggestion.votes.downvotes.length})
                          </p>
                          <div className="space-y-2.5">
                            {suggestion.votes.downvotes.map((v) => (
                              <VoterRow key={v.user.id + v.created_at} v={v} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-5">
                {/* Value change */}
                <div className="border-border-card bg-tertiary-bg rounded-xl border">
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

                {/* Votes */}
                <div className="border-border-card bg-tertiary-bg rounded-xl border">
                  <div className="border-border-card border-b px-5 py-3.5">
                    <h2 className="text-primary-text flex items-center justify-center gap-2 text-sm font-semibold">
                      <Icon
                        icon="material-symbols:thumb-up-outline-rounded"
                        className="text-secondary-text h-4 w-4"
                        inline
                      />
                      Votes
                    </h2>
                  </div>
                  <div className="divide-border-card flex divide-x">
                    <div className="bg-button-success/10 flex flex-1 items-center justify-center gap-2 py-4">
                      <Icon
                        icon="material-symbols:thumb-up-rounded"
                        className="text-button-success h-5 w-5"
                        inline
                      />
                      <span className="text-button-success text-xl font-bold">
                        {suggestion.upvotes}
                      </span>
                    </div>
                    <div className="bg-button-danger/10 flex flex-1 items-center justify-center gap-2 py-4">
                      <Icon
                        icon="material-symbols:thumb-down-rounded"
                        className="text-button-danger h-5 w-5"
                        inline
                      />
                      <span className="text-button-danger text-xl font-bold">
                        {suggestion.downvotes}
                      </span>
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
