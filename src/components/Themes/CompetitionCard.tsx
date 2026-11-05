"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { DEFAULT_THEME_ICON } from "@/components/Settings/ThemeIconPicker";
import { UserProfilePopover } from "@/components/Users/UserProfilePopover";
import { UserAvatar } from "@/utils/ui/avatar";
import { useTheme } from "@/contexts/ThemeContext";
import { setCustomTheme } from "@/utils/ui/customTheme";
import { rememberSharedTheme } from "@/utils/ui/recentThemes";
import {
  competitionStatus,
  fetchCurrentCompetition,
  fetchCompetitionStandings,
} from "@/utils/api/userThemes";

const MEDALS: Record<number, string> = {
  1: "45 100% 50%",
  2: "0 0% 75%",
  3: "30 100% 50%",
};

function TopThemes({ id }: { id: number }) {
  const { customTheme } = useTheme();
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["theme-competition", id, "standings"],
    queryFn: () => fetchCompetitionStandings(id),
    refetchInterval: 60_000,
    retry: false,
  });

  if (isPending)
    return (
      <p role="status" className="text-secondary-text text-sm">
        Loading standings…
      </p>
    );
  if (error)
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p role="status" className="text-secondary-text text-sm">
          Standings are unavailable right now.
        </p>
        <Button size="sm" variant="secondary" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  if (!data?.standings.length)
    return (
      <p className="text-secondary-text text-sm">
        No entries yet. Be the first to submit a theme!
      </p>
    );

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Top themes</h3>
      <ol className="grid gap-3 lg:grid-cols-3">
        {data.standings
          .slice(0, 3)
          .map(({ theme, rank, user_days, current_users }) => {
            const medal = MEDALS[rank];
            const author =
              theme.user?.global_name && theme.user.global_name !== "None"
                ? theme.user.global_name
                : (theme.user?.username ?? "Unknown author");
            return (
              <li key={theme.share_code}>
                <div className="border-border-card bg-tertiary-bg hover:border-border-focus relative isolate flex h-full min-w-0 items-center gap-3 rounded-lg border p-3 transition-colors">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${medal ? "text-black" : "text-primary-text"}`}
                    style={medal ? { background: `hsl(${medal})` } : undefined}
                  >
                    #{rank}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/themes/${theme.share_code}`}
                      className="focus-visible:after:ring-button-info flex items-center gap-2 font-medium after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-2"
                    >
                      <Icon
                        icon={theme.icon ?? DEFAULT_THEME_ICON}
                        className="size-5 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="truncate">{theme.label}</span>
                    </Link>
                    <div className="text-secondary-text mt-1 flex min-w-0 items-center gap-2 text-xs">
                      {theme.user?.id && (
                        <UserAvatar
                          userId={theme.user.id}
                          avatarHash={theme.user.avatar ?? null}
                          username={theme.user.username}
                          custom_avatar={theme.user.custom_avatar}
                          premiumType={theme.user.premiumtype}
                          settings={theme.user.settings}
                          size={6}
                          showBadge={false}
                        />
                      )}
                      <p className="min-w-0 truncate">
                        Created by{" "}
                        {theme.user?.id ? (
                          <UserProfilePopover user={theme.user}>
                            <Link
                              href={`/users/${theme.user.id}`}
                              prefetch={false}
                              className="text-link hover:text-link-hover relative z-10 transition-colors"
                            >
                              {author}
                            </Link>
                          </UserProfilePopover>
                        ) : (
                          author
                        )}
                      </p>
                    </div>
                    <p className="text-secondary-text mt-1 text-xs tabular-nums">
                      {user_days.toLocaleString()} points ·{" "}
                      {current_users.toLocaleString()} users today
                    </p>
                    <Button
                      size="sm"
                      className="relative z-10 mt-2"
                      disabled={customTheme?.share_code === theme.share_code}
                      onClick={() => {
                        setCustomTheme(theme);
                        rememberSharedTheme(theme.share_code);
                        toast.success(`Using ${theme.label}`);
                      }}
                    >
                      {customTheme?.share_code === theme.share_code
                        ? "In use"
                        : "Use theme"}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
      </ol>
      <p className="text-secondary-text text-xs">
        Ranked by points: 1 point per user, per day.
      </p>
    </div>
  );
}

export default function CompetitionCard() {
  const { data: competition } = useQuery({
    queryKey: ["theme-competition-current"],
    queryFn: fetchCurrentCompetition,
    staleTime: 5 * 60_000,
    refetchInterval: 60_000,
    retry: false,
  });
  const status = competition && competitionStatus(competition);
  if (!competition || status === "ended") return null;
  const href = `/themes/competitions/${competition.id}`;
  const date = new Date(
    (status === "upcoming" ? competition.starts_at : competition.ends_at) *
      1000,
  );

  return (
    <section
      aria-labelledby="marketplace-competition-title"
      className="bg-button-info/10 border-button-info mb-6 space-y-3 rounded-lg border p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 basis-64 space-y-1">
          <p className="text-button-info flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
            <Icon
              icon="heroicons:trophy"
              className="size-4 shrink-0"
              aria-hidden="true"
            />
            {status === "upcoming"
              ? "Upcoming theme competition"
              : "Live theme competition"}
          </p>
          <h2
            id="marketplace-competition-title"
            className="text-xl font-semibold"
          >
            {competition.title}
          </h2>
          <p className="text-secondary-text text-sm">
            Optional competition. You can publish marketplace themes in any
            style; enter here only if your theme follows this competition&apos;s
            style.
          </p>
          {competition.description && (
            <p className="text-secondary-text line-clamp-2 text-sm">
              {competition.description}
            </p>
          )}
          <p className="text-secondary-text text-sm">
            {status === "upcoming" ? "Starts" : "Ends"}{" "}
            <time dateTime={date.toISOString()}>
              {date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
              })}
            </time>{" "}
            (UTC)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {status === "running" && (
            <Button asChild size="sm">
              <Link href={`${href}#submit`}>Enter competition</Link>
            </Button>
          )}
          <Button asChild size="sm" variant="secondary">
            <Link href={href}>
              Rules &amp; prizes
              <span className="sr-only"> for {competition.title}</span>
            </Link>
          </Button>
        </div>
      </div>
      {status === "running" && <TopThemes id={competition.id} />}
    </section>
  );
}
