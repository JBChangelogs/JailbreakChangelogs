"use client";

import { useEffect, useReducer, useSyncExternalStore } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
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
    <div className="bg-secondary-bg/70 border-border-card text-primary-text @container relative border-b px-10 py-1 text-xs">
      <div className="flex min-h-7 min-w-0 items-center justify-center gap-4 pointer-coarse:min-h-9">
        <div className="flex min-w-0 items-center gap-2">
          <Icon
            icon="heroicons:trophy"
            className="text-link size-3.5 shrink-0"
            aria-hidden="true"
          />
          <Link
            href={href}
            className="relative inline-flex min-h-7 items-center font-medium hover:underline pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-2"
            aria-label={competition.title}
          >
            <span className="@lg:hidden">Theme competition</span>
            <span className="hidden @lg:inline">{competition.title}</span>
          </Link>
          <span className="text-secondary-text hidden @2xl:inline">
            {status === "upcoming"
              ? `Starts ${formatDate(competition.starts_at)}`
              : `Entries close ${formatDate(competition.ends_at)}`}
          </span>
        </div>
        {status === "running" && (
          <div className="flex shrink-0 items-center gap-4">
            <Button
              asChild
              size="xs"
              className="relative pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-2.5"
            >
              <Link href={`${href}#submit`}>
                Enter<span className="hidden @lg:inline"> competition</span>
                <Icon icon="heroicons:arrow-right" aria-hidden="true" />
              </Link>
            </Button>
            <Link
              href={`${href}#standings`}
              className="text-secondary-text hover:text-primary-text relative hidden min-h-7 items-center underline-offset-4 hover:underline @2xl:inline-flex pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-2"
            >
              View standings
            </Link>
          </div>
        )}
      </div>
      <button
        type="button"
        aria-label="Hide theme competition banner"
        title="Hide banner. Turn it back on in Settings or global search."
        className="text-secondary-text hover:text-primary-text hover:bg-button-info/10 focus-visible:ring-button-info absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none pointer-coarse:right-0.5 pointer-coarse:size-11"
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
