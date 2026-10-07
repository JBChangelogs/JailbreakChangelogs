"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createLogger } from "@/services/logger";
import { useAuthContext } from "@/contexts/AuthContext";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { parseBan, showBanToast } from "@/utils/api/ban";
import type {
  Suggestion,
  SuggestionsResponse,
} from "@/components/Items/Suggestions/types";

const log = createLogger("API");

type AuthContextValue = ReturnType<typeof useAuthContext>;

interface UseSuggestionVotingOptions {
  suggestions: Suggestion[];
  setSuggestions: Dispatch<SetStateAction<Suggestion[]>>;
  user: AuthContextValue["user"];
  isAuthenticated: boolean;
  setLoginModal: AuthContextValue["setLoginModal"];
  setBan: AuthContextValue["setBan"];
  sort: string | null;
  page: number;
}

export function useSuggestionVoting({
  suggestions,
  setSuggestions,
  user,
  isAuthenticated,
  setLoginModal,
  setBan,
  sort,
  page,
}: UseSuggestionVotingOptions) {
  const queryClient = useQueryClient();
  // Per-suggestion voting loading state
  const [votingIds, setVotingIds] = useState<Set<number>>(new Set());
  const [votingTypes, setVotingTypes] = useState<
    Map<number, "upvote" | "downvote">
  >(new Map());
  const [voteRateLimits, setVoteRateLimits] = useState<Map<number, number>>(
    new Map(),
  );

  const handleVote = async (
    suggestion: Suggestion,
    type: "upvote" | "downvote",
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("You need to be logged in to vote on item suggestions.");
      setLoginModal({ open: true });
      return;
    }
    if (votingIds.has(suggestion.id)) return;

    const wasUpvoted = suggestion.votes.upvotes.some(
      (v) => v.user.id === user?.id,
    );
    const wasDownvoted = suggestion.votes.downvotes.some(
      (v) => v.user.id === user?.id,
    );
    const removing = type === "upvote" ? wasUpvoted : wasDownvoted;

    setSuggestions((prev) =>
      prev.map((s) => {
        if (s.id !== suggestion.id) return s;
        let upvotes = s.upvotes;
        let downvotes = s.downvotes;
        let newUpvoters = s.votes.upvotes;
        let newDownvoters = s.votes.downvotes;
        if (removing) {
          if (type === "upvote") {
            upvotes--;
            newUpvoters = newUpvoters.filter((v) => v.user.id !== user!.id);
          } else {
            downvotes--;
            newDownvoters = newDownvoters.filter((v) => v.user.id !== user!.id);
          }
        } else {
          if (wasUpvoted) {
            upvotes--;
            newUpvoters = newUpvoters.filter((v) => v.user.id !== user!.id);
          }
          if (wasDownvoted) {
            downvotes--;
            newDownvoters = newDownvoters.filter((v) => v.user.id !== user!.id);
          }
          if (type === "upvote") {
            upvotes++;
            newUpvoters = [
              ...newUpvoters,
              { created_at: Date.now(), user: user! },
            ];
          } else {
            downvotes++;
            newDownvoters = [
              ...newDownvoters,
              { created_at: Date.now(), user: user! },
            ];
          }
        }
        return {
          ...s,
          upvotes: Math.max(0, upvotes),
          downvotes: Math.max(0, downvotes),
          votes: { upvotes: newUpvoters, downvotes: newDownvoters },
        };
      }),
    );

    setVotingIds((prev) => new Set(prev).add(suggestion.id));
    setVotingTypes((prev) => new Map(prev).set(suggestion.id, type));
    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL!,
        `/v2/value-suggestions/${suggestion.id}/votes/me`,
      );
      const res = await fetch(url, {
        method: removing ? "DELETE" : "PUT",
        credentials: "include",
        ...(removing
          ? { headers }
          : {
              headers: { ...headers, "Content-Type": "application/json" },
              body: JSON.stringify({ vote_type: type }),
            }),
      });
      if (!res.ok) {
        // Revert
        setSuggestions((prev) =>
          prev.map((s) => (s.id === suggestion.id ? suggestion : s)),
        );
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
          const until = Date.now() + retryAfter * 1000;
          setVoteRateLimits((prev) => new Map(prev).set(suggestion.id, until));
          setTimeout(
            () => {
              setVoteRateLimits((prev) => {
                const next = new Map(prev);
                next.delete(suggestion.id);
                return next;
              });
            },
            retryAfter * 1000 + 500,
          );
        } else if (res.status === 403) {
          if (data?.detail === "Forbidden") {
            toast.info(
              "You need to connect your Roblox account to vote on item suggestions.",
            );
            setLoginModal({ open: true, tab: "roblox", onlyRoblox: true });
          } else {
            toast.error(
              data?.message ?? data?.error ?? "Failed to register vote.",
            );
          }
        } else {
          log.error(`Vote failed ${res.status}`, data);
          toast.error(
            data?.message ?? data?.error ?? "Failed to register vote.",
          );
        }
      }
    } catch (err) {
      log.error("Vote request threw", err);
      setSuggestions((prev) =>
        prev.map((s) => (s.id === suggestion.id ? suggestion : s)),
      );
      toast.error("Failed to register vote.");
    } finally {
      setVotingIds((prev) => {
        const n = new Set(prev);
        n.delete(suggestion.id);
        return n;
      });
      setVotingTypes((prev) => {
        const n = new Map(prev);
        n.delete(suggestion.id);
        return n;
      });
    }
  };

  // Voters modal state
  const [votersOpen, setVotersOpen] = useState(false);
  const [votersTab, setVotersTab] = useState<"up" | "down">("up");
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<
    number | null
  >(null);
  const selectedSuggestion = votersOpen
    ? suggestions.find((suggestion) => suggestion.id === selectedSuggestionId)
    : undefined;
  const activeVoters = selectedSuggestion
    ? {
        up: selectedSuggestion.votes.upvotes,
        down: selectedSuggestion.votes.downvotes,
        upCount: selectedSuggestion.upvotes,
        downCount: selectedSuggestion.downvotes,
      }
    : null;

  const openVotersModal = (
    suggestion: Suggestion,
    tab: "up" | "down",
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedSuggestionId(suggestion.id);
    setVotersTab(tab);
    setVotersOpen(true);
  };

  const silentRefreshVotes = useCallback(
    async (id?: number | null) => {
      try {
        if (id != null) {
          const { url, headers } = buildApiFetchRequest(
            PUBLIC_API_URL!,
            `/v2/value-suggestions/${id}/votes`,
          );
          const fresh = await queryClient.fetchQuery({
            queryKey: ["value-suggestion-votes", id],
            queryFn: async () => {
              const response = await fetch(url, {
                credentials: "include",
                headers,
              });
              if (!response.ok) throw new Error("Failed to refresh votes");
              return (await response.json()) as Suggestion["votes"];
            },
            staleTime: 0,
            gcTime: 0,
            retry: false,
          });
          setSuggestions((previous) =>
            previous.map((suggestion) =>
              suggestion.id === id
                ? {
                    ...suggestion,
                    upvotes: fresh.upvotes.length,
                    downvotes: fresh.downvotes.length,
                    votes: fresh,
                  }
                : suggestion,
            ),
          );
          return;
        }

        const query = new URLSearchParams({ page: String(page) });
        if (sort !== null) query.set("sort", sort);
        const { url, headers } = buildApiFetchRequest(
          PUBLIC_API_URL!,
          `/v2/value-suggestions?${query}`,
        );
        const data = await queryClient.fetchQuery({
          queryKey: ["suggestion-vote-snapshot", sort, page],
          queryFn: async () => {
            const response = await fetch(url, {
              credentials: "include",
              headers,
            });
            if (!response.ok) throw new Error("Failed to refresh votes");
            return (await response.json()) as SuggestionsResponse;
          },
          staleTime: 0,
          gcTime: 0,
          retry: false,
        });
        const freshById = new Map(
          data.items.map((suggestion) => [suggestion.id, suggestion]),
        );
        setSuggestions((previous) =>
          previous.map((suggestion) => {
            const fresh = freshById.get(suggestion.id);
            return fresh
              ? {
                  ...suggestion,
                  upvotes: fresh.upvotes,
                  downvotes: fresh.downvotes,
                  votes: fresh.votes,
                }
              : suggestion;
          }),
        );
      } catch {
        // Stale vote counts are acceptable until the next refresh.
      }
    },
    [page, queryClient, setSuggestions, sort],
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const realtimeEvent = event as CustomEvent<{
        action?: string;
        type?: string;
        id?: number | null;
      }>;
      if (realtimeEvent.detail?.action !== "refresh_suggestions") return;
      const type = realtimeEvent.detail?.type;
      if (type === "vote" || type === "unvote") {
        void silentRefreshVotes(realtimeEvent.detail.id);
      }
    };
    window.addEventListener("realtimeSuggestions", handler);
    return () => window.removeEventListener("realtimeSuggestions", handler);
  }, [silentRefreshVotes]);

  return {
    votingIds,
    votingTypes,
    voteRateLimits,
    handleVote,
    votersOpen,
    votersTab,
    activeVoters,
    openVotersModal,
    setVotersOpen,
    setVotersTab,
  };
}
