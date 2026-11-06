"use client";

import { useEffect, useReducer, useSyncExternalStore } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Icon } from "@/components/ui/IconWrapper";
import {
  competitionStatus,
  fetchCurrentCompetition,
} from "@/utils/api/userThemes";
import {
  getThemeCompetitionBannerEnabled,
  setThemeCompetitionBannerEnabled,
  subscribeThemeCompetitionBanner,
  syncThemeCompetitionBannerPreferences,
} from "@/utils/ui/themeCompetitionBanner";

const formatDate = (ts: number) =>
  new Date(ts * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

export default function CompetitionBanner() {
  const enabled = useSyncExternalStore(
    subscribeThemeCompetitionBanner,
    getThemeCompetitionBannerEnabled,
    () => true,
  );
  useEffect(syncThemeCompetitionBannerPreferences, []);
  const queryClient = useQueryClient();
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const { data: competition } = useQuery({
    queryKey: ["theme-competition-current"],
    queryFn: fetchCurrentCompetition,
    enabled,
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
    if (!enabled || boundary === undefined) return;
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
  }, [queryClient, boundary, status, enabled]);

  if (!enabled || !competition || status === "ended") return null;
  const href = `/themes/competitions/${competition.id}`;

  return (
    <div className="bg-secondary-bg/70 border-button-info/30 text-primary-text relative border-b px-12 py-2 text-center text-sm">
      <p className="min-w-0">
        <Icon
          icon="heroicons:trophy"
          className="text-button-info mr-1.5 inline size-4 align-[-3px]"
          aria-hidden="true"
        />
        {status === "upcoming" ? (
          <>
            <Link href={href} className="font-semibold hover:underline">
              {competition.title}
            </Link>
            <span className="hidden sm:inline"> theme competition</span> starts{" "}
            {formatDate(competition.starts_at)}.
          </>
        ) : (
          <>
            <span className="font-semibold">{competition.title}</span>
            <span className="hidden sm:inline">
              {" "}
              theme competition is live until {formatDate(competition.ends_at)}.
            </span>{" "}
            <Link
              href={`${href}#submit`}
              className="text-link hover:text-link-hover font-medium hover:underline"
            >
              Enter<span className="hidden sm:inline"> competition</span>
            </Link>
            <span className="sm:hidden"> · </span>
            <span className="hidden sm:inline"> or </span>
            <Link
              href={`${href}#standings`}
              className="text-link hover:text-link-hover font-medium hover:underline"
            >
              <span className="sm:hidden">Standings</span>
              <span className="hidden sm:inline">view the standings</span>
            </Link>
            <span className="hidden sm:inline">.</span>
          </>
        )}
      </p>
      <button
        type="button"
        aria-label="Hide theme competition banner"
        title="Hide banner. Turn it back on in Settings or global search."
        className="text-secondary-text hover:text-primary-text hover:bg-button-info/10 focus-visible:ring-button-info absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
        onClick={() => {
          setThemeCompetitionBannerEnabled(false);
          toast.success("Competition banner hidden", {
            description:
              "Turn it back on in Settings → Themes or global search.",
          });
        }}
      >
        <Icon icon="heroicons:x-mark" className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
