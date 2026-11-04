"use client";

import { useEffect, useReducer } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/IconWrapper";
import {
  competitionStatus,
  fetchCurrentCompetition,
} from "@/utils/api/userThemes";

const formatDate = (ts: number) =>
  new Date(ts * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

export default function CompetitionBanner() {
  const queryClient = useQueryClient();
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const { data: competition } = useQuery({
    queryKey: ["theme-competition-current"],
    queryFn: fetchCurrentCompetition,
    staleTime: 5 * 60_000,
    retry: false,
  });
  // Derived from the dates: the API caches status for up to a minute.
  const status = competition && competitionStatus(competition);
  const boundary =
    status === "upcoming"
      ? competition?.starts_at
      : status === "running"
        ? competition?.ends_at
        : undefined;

  useEffect(() => {
    if (boundary === undefined) return;
    const timer = setTimeout(
      () => {
        tick();
        if (status === "running")
          void queryClient.invalidateQueries({
            queryKey: ["theme-competition-current"],
          });
      },
      Math.min(Math.max(boundary * 1000 - Date.now(), 0) + 250, 2 ** 31 - 1),
    );
    return () => clearTimeout(timer);
  }, [queryClient, boundary, status]);

  if (!competition || status === "ended") return null;
  const href = `/themes/competitions/${competition.id}`;

  return (
    <div className="bg-button-info/10 border-button-info/30 text-primary-text flex items-center justify-center gap-2 border-b px-4 py-2 text-center text-sm">
      <Icon
        icon="heroicons:trophy"
        className="text-button-info size-4 shrink-0"
        aria-hidden="true"
      />
      {status === "upcoming" ? (
        <p className="min-w-0">
          <Link href={href} className="font-semibold hover:underline">
            {competition.title}
          </Link>{" "}
          theme competition starts {formatDate(competition.starts_at)}.
        </p>
      ) : (
        <p className="min-w-0">
          <span className="font-semibold">{competition.title}</span> theme
          competition is live until {formatDate(competition.ends_at)}.{" "}
          <Link
            href={`${href}#submit`}
            className="text-link hover:text-link-hover font-medium"
          >
            Submit your theme
          </Link>{" "}
          or{" "}
          <Link
            href={`${href}#standings`}
            className="text-link hover:text-link-hover font-medium"
          >
            view the standings
          </Link>
          .
        </p>
      )}
    </div>
  );
}
