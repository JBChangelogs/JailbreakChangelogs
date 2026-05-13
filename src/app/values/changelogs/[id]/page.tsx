"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { PUBLIC_API_URL } from "@/utils/api";
import { buildApiUrlWithDevToken } from "@/utils/apiDevToken";
import ChangelogDetailsClient from "@/components/Values/ChangelogDetailsClient";
import NitroValuesChangelogsRailAd from "@/components/Ads/NitroValuesChangelogsRailAd";
import Loading from "./loading";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

interface VoteUser {
  id: string;
  username?: string;
  global_name?: string;
  avatar?: string | null;
  custom_avatar?: string | null;
}

interface EntryUser extends VoteUser {
  premiumtype?: number;
  settings?: Record<string, unknown>;
}

interface EntryItem {
  id: number;
  name: string;
  type: string;
  creator: string;
  cash_value: string;
  duped_value: string;
  tradable: number;
}

interface ChangelogEntry {
  id: number;
  field: string;
  current_value: string;
  suggested_value: string;
  reason: string;
  upvotes: number;
  downvotes: number;
  created_at: number;
  user: EntryUser;
  item: EntryItem;
  votes: {
    upvotes: { created_at: number; user: VoteUser }[];
    downvotes: { created_at: number; user: VoteUser }[];
  };
}

interface ValueChangelogDetail {
  id: number;
  created_at: number;
  count: number;
  entries: ChangelogEntry[];
}

function userDisplayName(user: VoteUser): string {
  return user.global_name || user.username || `User #${user.id}`;
}

function userAvatarUrl(user: VoteUser): string | undefined {
  if (user.custom_avatar) return user.custom_avatar;
  if (user.avatar)
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}?size=128`;
  return undefined;
}

function transformToChangelogGroup(data: ValueChangelogDetail) {
  return {
    id: data.id,
    change_count: data.count,
    created_at: data.created_at,
    change_data: data.entries.map((entry) => ({
      change_id: entry.id,
      id: entry.id,
      item: entry.item,
      changed_by: userDisplayName(entry.user),
      changed_by_id: entry.user.id,
      reason: entry.reason,
      posted: entry.created_at,
      created_at: entry.created_at,
      changes: {
        old: { [entry.field]: entry.current_value },
        new: { [entry.field]: entry.suggested_value },
      },
      suggestion: {
        id: entry.id,
        user_id: entry.user.id,
        suggestor_name: userDisplayName(entry.user),
        message_id: entry.id,
        data: {
          item_name: entry.item.name,
          reason: entry.reason,
        },
        vote_data: {
          upvotes: entry.upvotes,
          downvotes: entry.downvotes,
          voters: [
            ...entry.votes.upvotes.map((v, i) => ({
              id: v.user.id,
              name: userDisplayName(v.user),
              avatar: v.user.avatar ?? "",
              avatar_hash: v.user.avatar ?? undefined,
              vote_number: i + 1,
              vote_type: "upvote" as const,
              timestamp: v.created_at,
            })),
            ...entry.votes.downvotes.map((v, i) => ({
              id: v.user.id,
              name: userDisplayName(v.user),
              avatar: v.user.avatar ?? "",
              avatar_hash: v.user.avatar ?? undefined,
              vote_number: i + 1,
              vote_type: "downvote" as const,
              timestamp: v.created_at,
            })),
          ],
        },
        created_at: entry.created_at,
        metadata: {
          avatar: userAvatarUrl(entry.user),
          avatar_hash: entry.user.avatar ?? undefined,
          suggestion_type: entry.field,
        },
      },
    })),
  };
}

export default function ChangelogDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [changelog, setChangelog] = useState<ReturnType<
    typeof transformToChangelogGroup
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChangelog = async () => {
      try {
        const url = buildApiUrlWithDevToken(
          PUBLIC_API_URL!,
          `/value-changelogs/${id}`,
        );
        const res = await fetch(url, { credentials: "include" });
        if (res.status === 404) {
          setNotFoundError(true);
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          log.error("fetch value changelog failed", {
            status: res.status,
            body,
          });
          throw new Error("Failed to fetch changelog");
        }
        const data: ValueChangelogDetail = await res.json();
        setChangelog(transformToChangelogGroup(data));
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    void fetchChangelog();
  }, [id]);

  if (notFoundError) {
    notFound();
  }

  return (
    <>
      <NitroValuesChangelogsRailAd />
      <main className="mb-8 min-h-screen">
        <div className="container mx-auto px-4">
          <Breadcrumb />
          {loading ? (
            <Loading />
          ) : error ? (
            <div className="text-button-danger mt-8 text-center">{error}</div>
          ) : changelog ? (
            <ChangelogDetailsClient changelog={changelog} userData={{}} />
          ) : null}
        </div>
      </main>
    </>
  );
}
