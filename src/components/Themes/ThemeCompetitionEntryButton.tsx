"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  competitionStatus,
  enterCompetition,
  fetchCompetition,
  fetchCurrentCompetition,
  withdrawFromCompetition,
  type SharedTheme,
} from "@/utils/api/userThemes";

export default function ThemeCompetitionEntryButton({
  theme,
}: {
  theme: SharedTheme;
}) {
  const { user, isAuthenticated } = useAuthContext();
  const owner = isAuthenticated && user?.id === theme.user_id;
  const [submitting, setSubmitting] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: competition } = useQuery({
    queryKey: ["theme-competition-current"],
    queryFn: fetchCurrentCompetition,
    enabled: owner,
    staleTime: 5 * 60_000,
    refetchInterval: owner ? 60_000 : false,
    retry: false,
  });
  const running = !!competition && competitionStatus(competition) === "running";
  const { data, error, refetch } = useQuery({
    queryKey: ["theme-competition", competition?.id],
    queryFn: () => fetchCompetition(competition!.id),
    enabled: owner && running && !!theme.published_at,
    refetchInterval: owner && running && theme.published_at ? 60_000 : false,
    retry: false,
  });

  if (!owner || !competition || !running) return null;
  if (!theme.published_at)
    return (
      <p className="text-secondary-text text-sm">
        <Link
          href="/settings?highlight=themes#themes"
          className="text-link hover:text-link-hover underline"
        >
          Publish this theme
        </Link>{" "}
        to the marketplace to enter {competition.title}.
      </p>
    );
  if (error)
    return (
      <Button variant="secondary" onClick={() => void refetch()}>
        Retry loading competition
      </Button>
    );

  const entered = data?.items.some(
    ({ theme: entry }) => entry.share_code === theme.share_code,
  );
  const full =
    !!data &&
    data.items.filter(({ theme: entry }) => entry.user?.id === user.id)
      .length >= data.max_entries_per_user;

  return (
    <Button
      variant="secondary"
      disabled={!data || (!entered && full) || !!submitting}
      onClick={async () => {
        if (
          !data ||
          (!entered && full) ||
          submitting ||
          competitionStatus(competition) !== "running"
        )
          return;
        setSubmitting(entered ? "Withdrawing…" : "Entering…");
        try {
          if (entered) {
            await withdrawFromCompetition(competition.id, theme.share_code);
            toast.success("Submission withdrawn");
          } else {
            await enterCompetition(competition.id, theme.share_code);
            toast.success(`Submitted to ${competition.title}`);
          }
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ["theme-competition", competition.id],
            }),
            queryClient.invalidateQueries({
              queryKey: ["theme-competition-current"],
            }),
          ]);
        } catch (err) {
          toast.error(
            err instanceof Error
              ? err.message
              : entered
                ? "Couldn't withdraw your theme"
                : "Couldn't submit your theme",
          );
        } finally {
          setSubmitting(null);
        }
      }}
    >
      {submitting ??
        (!data
          ? "Loading competition…"
          : entered
            ? "Withdraw from competition"
            : full
              ? "Competition entry limit reached"
              : "Enter competition")}
    </Button>
  );
}
