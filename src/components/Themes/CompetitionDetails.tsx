"use client";

import {
  Suspense,
  use,
  useEffect,
  useReducer,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { Icon } from "@/components/ui/IconWrapper";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatShortDate } from "@/components/charts/chartParts";
import { TimeBlocks } from "@/components/Seasons/SeasonCountdown";
import CustomThemePreview from "@/components/Settings/CustomThemePreview";
import ThemePreviewImages from "@/components/Settings/ThemePreviewImages";
import ReportThemeButton from "@/components/Settings/ReportThemeButton";
import ThemeShareCode from "@/components/Settings/ThemeShareCode";
import { DEFAULT_THEME_ICON } from "@/components/Settings/ThemeIconPicker";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  enterCompetition,
  fetchCompetition,
  fetchCompetitionStandings,
  listMyThemes,
  withdrawFromCompetition,
  ThemeApiError,
  type CompetitionStandings,
  competitionStatus,
  type CompetitionStatus,
  type MarketplaceTheme,
} from "@/utils/api/userThemes";
import { setCustomTheme } from "@/utils/ui/customTheme";
import { rememberSharedTheme } from "@/utils/ui/recentThemes";
import { UserAvatar } from "@/utils/ui/avatar";
import { UserProfilePopover } from "@/components/Users/UserProfilePopover";
import { parseCompetitionEvent } from "@/utils/ui/marketplaceRealtime";

type Competition = Awaited<ReturnType<typeof fetchCompetition>>;

const formatDate = (ts: number) =>
  new Date(ts * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const STATUS = {
  upcoming: { label: "Upcoming", color: "var(--color-status-info)" },
  running: { label: "Live", color: "var(--color-status-success)" },
  ended: { label: "Ended", color: "var(--color-status-neutral)" },
} satisfies Record<CompetitionStatus, { label: string; color: string }>;

export function CompetitionStatusBadge({
  status,
}: {
  status: CompetitionStatus;
}) {
  const { label, color } = STATUS[status];
  return (
    <span
      className="text-primary-text inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold tracking-normal normal-case"
      style={{
        borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
      }}
    >
      {status === "running" && (
        <span
          aria-hidden="true"
          className="size-1.5 animate-pulse rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </span>
  );
}

const noop = () => () => {};

/** Formatted in the viewer's locale and time zone, so only after hydration. */
export function LocalDate({ ts }: { ts: number }) {
  const client = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  return client ? formatDate(ts) : null;
}

const ENTER_ERRORS: Record<string, string> = {
  entries_closed: "Submissions for this competition are closed.",
  entry_limit_reached:
    "You've submitted as many themes as this competition allows.",
  already_entered: "That theme is already submitted.",
  theme_not_found: "That theme isn't published anymore.",
};

const authorName = (theme: MarketplaceTheme) =>
  theme.user?.global_name && theme.user.global_name !== "None"
    ? theme.user.global_name
    : (theme.user?.username ?? "Unknown author");

function CreatorLink({ theme }: { theme: MarketplaceTheme }) {
  if (!theme.user?.id) return <>{authorName(theme)}</>;
  return (
    <UserProfilePopover user={theme.user}>
      <Link
        href={`/users/${theme.user.id}`}
        prefetch={false}
        className="text-link hover:text-link-hover relative z-10 transition-colors"
      >
        {authorName(theme)}
      </Link>
    </UserProfilePopover>
  );
}

function UseThemeButton({ theme }: { theme: MarketplaceTheme }) {
  const { customTheme } = useTheme();
  const inUse = customTheme?.share_code === theme.share_code;
  return (
    <Button
      size="sm"
      className="relative z-10"
      disabled={inUse}
      onClick={() => {
        setCustomTheme(theme);
        rememberSharedTheme(theme.share_code);
        toast.success(`Using ${theme.label}`);
      }}
    >
      {inUse ? "In use" : "Use theme"}
    </Button>
  );
}

const GOLD = "hsl(45 100% 50%)";

function WinnerBanner({
  winner,
}: {
  winner: NonNullable<Competition["winner"]>;
}) {
  const { theme } = winner;
  return (
    <section
      className="bg-secondary-bg grid overflow-hidden rounded-xl border md:grid-cols-[minmax(0,24rem)_1fr]"
      style={{
        borderColor: `color-mix(in srgb, ${GOLD} 45%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${GOLD} 6%, var(--color-secondary-bg))`,
      }}
    >
      <div className="min-w-0 p-4">
        {theme.previews?.length ? (
          <ThemePreviewImages previews={theme.previews} label={theme.label} />
        ) : (
          <CustomThemePreview
            vars={theme.vars}
            scheme={theme.scheme}
            logoFilter={theme.logo_filter}
            compact
          />
        )}
      </div>
      <div className="flex min-w-0 flex-col justify-center gap-3 p-5 md:pl-2">
        <p
          className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase"
          style={{ color: GOLD }}
        >
          <Icon icon="heroicons:trophy" className="size-4" aria-hidden="true" />
          Winner
        </p>
        <h2 className="flex min-w-0 items-center gap-2 text-2xl font-bold">
          <Icon
            icon={theme.icon ?? DEFAULT_THEME_ICON}
            className="size-6 shrink-0"
            aria-hidden="true"
          />
          <span className="truncate">{theme.label}</span>
        </h2>
        {theme.description && (
          <p className="text-secondary-text line-clamp-3 text-sm wrap-break-word whitespace-pre-line">
            {theme.description}
          </p>
        )}
        <div className="text-secondary-text flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="flex min-w-0 items-center gap-2">
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
            <span className="truncate">
              Created by <CreatorLink theme={theme} />
            </span>
          </span>
          <span className="text-primary-text font-semibold tabular-nums">
            {winner.user_days.toLocaleString()}{" "}
            {winner.user_days === 1 ? "point" : "points"}
          </span>
        </div>
        <div>
          <ThemeShareCode code={theme.share_code} />
        </div>
        <div className="flex flex-wrap gap-2">
          <UseThemeButton theme={theme} />
          <Button asChild size="sm" variant="secondary">
            <Link href={`/themes/${theme.share_code}`}>View theme</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function EntryCard({ theme }: { theme: MarketplaceTheme }) {
  return (
    <article className="border-border-card bg-secondary-bg relative isolate flex min-w-0 flex-col gap-3 rounded-xl border p-4">
      {theme.previews?.length ? (
        <div className="relative z-10">
          <ThemePreviewImages previews={theme.previews} label={theme.label} />
        </div>
      ) : (
        <CustomThemePreview
          vars={theme.vars}
          scheme={theme.scheme}
          logoFilter={theme.logo_filter}
          compact
        />
      )}
      <div>
        <h3 className="text-primary-text flex items-center gap-2 text-lg font-semibold">
          <Icon
            icon={theme.icon ?? DEFAULT_THEME_ICON}
            className="size-5 shrink-0"
            aria-hidden="true"
          />
          <Link
            href={`/themes/${theme.share_code}`}
            className="hover:text-link focus-visible:after:ring-button-info min-w-0 transition-colors after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2"
          >
            <span className="block truncate">{theme.label}</span>
          </Link>
        </h3>
        {theme.description && (
          <p className="text-secondary-text mt-1 line-clamp-3 text-sm wrap-break-word whitespace-pre-line">
            {theme.description}
          </p>
        )}
        <div className="text-secondary-text mt-1 flex items-center gap-2 text-sm">
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
            Created by <CreatorLink theme={theme} />
          </p>
        </div>
        <ThemeShareCode code={theme.share_code} />
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        <UseThemeButton theme={theme} />
        <ReportThemeButton theme={theme} className="relative z-10" />
      </div>
    </article>
  );
}

function Countdown({ label, at }: { label: string; at: number }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Math.floor(Date.now() / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);
  // Rendered after mount so server and client markup match.
  if (now === null || now >= at) return null;
  const left = at - now;
  return (
    <div className="border-border-card mb-4 border-b pb-4">
      <span className="text-secondary-text text-sm font-medium">{label}</span>
      <TimeBlocks
        time={{
          days: Math.floor(left / 86400),
          hours: Math.floor((left % 86400) / 3600),
          minutes: Math.floor((left % 3600) / 60),
          seconds: left % 60,
        }}
      />
    </div>
  );
}

function EnterPicker({ competition }: { competition: Competition }) {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading, setShowLoginModal } =
    useAuthContext();
  const [busy, setBusy] = useState<{
    code: string;
    withdrawing: boolean;
  } | null>(null);
  const { data: myThemes } = useQuery({
    queryKey: ["my-themes", user?.id],
    queryFn: listMyThemes,
    enabled: isAuthenticated,
  });
  const mine = competition.items.filter((e) => e.theme.user?.id === user?.id);
  const published = myThemes?.themes.filter((t) => t.published_at) ?? [];
  const entered = new Set(mine.map((e) => e.theme.share_code));
  const limit = competition.max_entries_per_user;
  const full = mine.length >= limit;

  const run = async (
    code: string,
    action: () => Promise<unknown>,
    success: string,
  ) => {
    setBusy({
      code,
      withdrawing: entered.has(code),
    });
    try {
      await action();
      toast.success(success);
      await queryClient.invalidateQueries({
        queryKey: ["theme-competition", competition.id],
      });
      void queryClient.invalidateQueries({
        queryKey: ["theme-competition-current"],
      });
    } catch (err) {
      toast.error(
        (err instanceof ThemeApiError && err.code && ENTER_ERRORS[err.code]) ||
          (err instanceof Error ? err.message : "Something went wrong"),
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <section id="submit" className="scroll-mt-24 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Enter competition</h2>
          <p className="text-secondary-text text-sm">
            Choose a published theme that follows this competition&apos;s style.
            Publishing to the marketplace does not automatically enter it.
          </p>
        </div>
        {isAuthenticated && (
          <span className="bg-button-info/15 text-button-info rounded-md px-2.5 py-1 text-sm font-medium tabular-nums">
            {mine.length} / {limit} submitted
          </span>
        )}
      </div>
      {isLoading || (isAuthenticated && !myThemes) ? (
        <div role="status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <span className="sr-only">Loading your themes…</span>
          {Array.from({ length: 2 }, (_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="border-border-card bg-secondary-bg overflow-hidden rounded-xl border"
            >
              <Skeleton className="h-36 w-full rounded-none" />
              <div className="flex items-center gap-2 p-3">
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : !isAuthenticated ? (
        <div className="border-border-card bg-secondary-bg flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
          <p className="text-secondary-text text-sm">
            Log in to enter up to {limit} {limit === 1 ? "theme" : "themes"}.
          </p>
          <Button onClick={() => setShowLoginModal(true)}>Log in</Button>
        </div>
      ) : published.length === 0 ? (
        <div className="border-border-card bg-secondary-bg rounded-xl border px-6 py-8 text-center">
          <Icon
            icon="lucide:palette"
            aria-hidden="true"
            className="text-secondary-text mx-auto mb-3 size-10 opacity-50"
          />
          <p className="text-primary-text font-medium">
            No published themes yet
          </p>
          <p className="text-secondary-text mt-1 text-sm">
            Publish one to the marketplace, then come back to enter it.
          </p>
          <Button asChild className="mt-4">
            <Link href="/settings?highlight=themes#themes">
              Open theme settings
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {published.map((theme) => {
            const isIn = entered.has(theme.share_code);
            const withdrawing =
              busy?.code === theme.share_code ? busy.withdrawing : isIn;
            return (
              <article
                key={theme.share_code}
                className={`bg-secondary-bg relative isolate flex min-w-0 flex-col overflow-hidden rounded-xl border transition-colors ${
                  isIn ? "border-button-info" : "border-border-card"
                }`}
              >
                <div className="relative h-36 overflow-hidden">
                  {theme.previews?.[0] ? (
                    // Above the card's link, so a click opens the screenshots.
                    <ImageLightbox
                      images={theme.previews.map((preview, index) => ({
                        src: preview.url,
                        alt: `${theme.label}: ${preview.kind} screenshot ${index + 1}`,
                      }))}
                      alt={`${theme.label} screenshots`}
                      className="absolute inset-0 z-10 size-full"
                    >
                      <Image
                        src={theme.previews[0].url}
                        alt=""
                        fill
                        unoptimized
                        sizes="(min-width: 1280px) 20rem, (min-width: 640px) 50vw, 100vw"
                        className="object-cover object-top"
                      />
                    </ImageLightbox>
                  ) : (
                    <CustomThemePreview
                      vars={theme.vars}
                      scheme={theme.scheme}
                      logoFilter={theme.logo_filter}
                      compact
                      className="pointer-events-none min-h-0 rounded-none border-0"
                    />
                  )}
                  {isIn && (
                    <span className="bg-button-info text-form-button-text pointer-events-none absolute top-2 right-2 z-20 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold">
                      <Icon
                        icon="heroicons:check-20-solid"
                        className="size-3.5"
                        aria-hidden="true"
                      />
                      Submitted
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col items-start gap-3 p-3">
                  <div className="w-full min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon
                        icon={theme.icon ?? DEFAULT_THEME_ICON}
                        className="size-5 shrink-0"
                        aria-hidden="true"
                      />
                      <Link
                        href={`/themes/${theme.share_code}`}
                        className="hover:text-link focus-visible:after:ring-button-info block min-w-0 truncate font-medium transition-colors after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2"
                      >
                        {theme.label}
                      </Link>
                    </div>
                    {theme.description && (
                      <p className="text-secondary-text line-clamp-2 text-xs wrap-break-word">
                        {theme.description}
                      </p>
                    )}
                    <ThemeShareCode code={theme.share_code} />
                  </div>
                  {withdrawing ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="relative z-10"
                      disabled={busy !== null}
                      onClick={() =>
                        void run(
                          theme.share_code,
                          () =>
                            withdrawFromCompetition(
                              competition.id,
                              theme.share_code,
                            ),
                          "Submission withdrawn",
                        )
                      }
                    >
                      {busy?.code === theme.share_code
                        ? "Withdrawing…"
                        : "Withdraw"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="relative z-10"
                      disabled={busy !== null || full}
                      title={full ? `You can enter up to ${limit}.` : undefined}
                      onClick={() =>
                        void run(
                          theme.share_code,
                          () =>
                            enterCompetition(competition.id, theme.share_code),
                          `${theme.label} submitted`,
                        )
                      }
                    >
                      {busy?.code === theme.share_code
                        ? "Entering…"
                        : "Enter competition"}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

const MEDALS: Record<number, string> = {
  1: "45 100% 50%",
  2: "0 0% 75%",
  3: "30 100% 50%",
};

function Standings({
  data,
  status,
}: {
  data: CompetitionStandings;
  status: CompetitionStatus;
}) {
  if (data.standings.length === 0) return null;
  // Limit the chart to the six available series colors.
  const top = data.standings.slice(0, 6);
  const config: ChartConfig = Object.fromEntries(
    top.map((s, i) => [
      s.theme.share_code,
      { label: s.theme.label, color: `var(--color-chart-${i + 1})` },
    ]),
  );
  const points = data.daily.map((d) => ({
    t: d.timestamp * 1000,
    ...Object.fromEntries(
      top.map((s) => [s.theme.share_code, d.users[s.theme.share_code] ?? 0]),
    ),
  }));

  return (
    <section id="standings" className="scroll-mt-24 space-y-4">
      <h2 className="text-xl font-semibold">Standings</h2>
      {points.length > 1 && (
        <div className="border-border-card bg-secondary-bg rounded-xl border p-4">
          <p className="text-secondary-text mb-2 text-sm">
            Users with each theme applied, per day
          </p>
          <ChartContainer config={config} className="h-64 w-full">
            <LineChart
              accessibilityLayer
              data={points}
              margin={{ left: 6, right: 6 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--color-border-card)"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                ticks={points.map((point) => point.t)}
                tickFormatter={formatShortDate}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={48}
                tick={{ fill: "var(--color-secondary-text)", fontSize: 12 }}
              />
              <YAxis
                allowDecimals={false}
                width={40}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: "var(--color-secondary-text)", fontSize: 12 }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    className="min-w-48 px-3 py-2"
                    formatter={(value, name, item) => (
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="text-secondary-text flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-xs"
                            style={{
                              backgroundColor:
                                config[String(item.dataKey)]?.color,
                            }}
                          />
                          {config[String(item.dataKey)]?.label ?? name}
                        </span>
                        <span className="text-primary-text font-mono font-semibold tabular-nums">
                          {Number(value).toLocaleString()}
                        </span>
                      </div>
                    )}
                    labelFormatter={(_, payload) =>
                      formatShortDate(Number(payload?.[0]?.payload?.t))
                    }
                  />
                }
              />
              {top.map((s) => (
                <Line
                  key={s.theme.share_code}
                  dataKey={s.theme.share_code}
                  stroke={`var(--color-${s.theme.share_code})`}
                  strokeWidth={2}
                  dot={false}
                  type="monotone"
                />
              ))}
            </LineChart>
          </ChartContainer>
        </div>
      )}
      <div className="border-border-card overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-secondary-bg text-secondary-text text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Rank</th>
              <th className="px-4 py-2 font-medium">Theme</th>
              <th className="px-4 py-2 text-right font-medium">Points</th>
              <th className="px-4 py-2 text-right font-medium">
                {status === "ended" ? "Users (final day)" : "Users today"}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.standings.map((s) => {
              const medal = MEDALS[s.rank];
              return (
                <tr
                  key={s.theme.share_code}
                  className="border-border-card border-t"
                >
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex size-8 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                        medal ? "text-black" : "text-primary-text"
                      }`}
                      style={
                        medal ? { background: `hsl(${medal})` } : undefined
                      }
                    >
                      #{s.rank}
                    </span>
                  </td>
                  <td className="min-w-0 px-4 py-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon
                        icon={s.theme.icon ?? DEFAULT_THEME_ICON}
                        className="size-5 shrink-0"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/themes/${s.theme.share_code}`}
                          className="text-link hover:text-link-hover block truncate font-medium"
                        >
                          {s.theme.label}
                        </Link>
                        <div className="text-secondary-text flex min-w-0 items-center gap-1.5 text-xs">
                          {s.theme.user?.id && (
                            <UserAvatar
                              userId={s.theme.user.id}
                              avatarHash={s.theme.user.avatar ?? null}
                              username={s.theme.user.username}
                              custom_avatar={s.theme.user.custom_avatar}
                              premiumType={s.theme.user.premiumtype}
                              settings={s.theme.user.settings}
                              size={4}
                              showBadge={false}
                            />
                          )}
                          <span className="truncate">
                            by <CreatorLink theme={s.theme} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {s.user_days.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {s.current_users.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-secondary-text text-xs">
        A theme earns 1 point for every user who has it applied, each day since
        it was submitted. Most points wins.
      </p>
    </section>
  );
}

type StandingsData = Awaited<ReturnType<typeof fetchCompetitionStandings>>;

function StandingsSkeleton() {
  return (
    <section role="status" className="space-y-4">
      <span className="sr-only">Loading standings…</span>
      <Skeleton aria-hidden="true" className="h-7 w-32" />
      <Skeleton aria-hidden="true" className="h-64 w-full rounded-xl" />
      <Skeleton aria-hidden="true" className="h-32 w-full rounded-xl" />
    </section>
  );
}

function LiveStandings({
  id,
  status,
  promise,
}: {
  id: number;
  status: CompetitionStatus;
  promise: Promise<StandingsData | null>;
}) {
  const initial = use(promise);
  const { data } = useQuery({
    queryKey: ["theme-competition", id, "standings"],
    queryFn: () => fetchCompetitionStandings(id),
    initialData: initial ?? undefined,
    refetchInterval: status === "running" ? 60_000 : false,
  });
  return data ? (
    <Standings data={data} status={status} />
  ) : (
    <StandingsSkeleton />
  );
}

export default function CompetitionDetails({
  initial,
  standings,
}: {
  initial: Competition;
  standings: Promise<StandingsData | null>;
}) {
  const queryClient = useQueryClient();
  const { data: competition } = useQuery({
    queryKey: ["theme-competition", initial.id],
    queryFn: () => fetchCompetition(initial.id),
    initialData: initial,
  });
  // The API caches status, so it can lag the clock by a minute; derive it
  // from the dates instead (server value until hydrated, to match the HTML).
  const client = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const status = client ? competitionStatus(competition) : competition.status;
  const winner = competition.winner;
  const { id, starts_at, ends_at } = competition;

  useEffect(() => {
    if (status === "ended") return;
    const at = (status === "upcoming" ? starts_at : ends_at) * 1000;
    const timer = setTimeout(
      () => {
        tick();
        void queryClient.invalidateQueries({
          queryKey: ["theme-competition", id],
        });
      },
      // +250ms so the clock is past the boundary when it fires.
      Math.min(Math.max(at - Date.now(), 0) + 250, 2 ** 31 - 1),
    );
    return () => clearTimeout(timer);
  }, [queryClient, id, status, starts_at, ends_at]);

  useEffect(() => {
    const key = ["theme-competition", id];
    const update = (fn: (c: Competition) => Competition) =>
      queryClient.setQueryData<Competition>(key, (c) => c && fn(c));
    const refreshStandings = () =>
      void queryClient.invalidateQueries({
        queryKey: [...key, "standings"],
        exact: true,
      });
    const handle = (event: Event) => {
      const change_ = parseCompetitionEvent(
        (event as CustomEvent<unknown>).detail,
      );
      if (!change_) return;
      if (change_.action === "competition_entry_added") {
        if (change_.competitionId !== id) return;
        const { entry } = change_;
        update((c) =>
          c.items.some((e) => e.theme.share_code === entry.theme.share_code)
            ? c
            : { ...c, entries: c.entries + 1, items: [...c.items, entry] },
        );
      } else if (change_.action === "competition_entry_removed") {
        if (change_.competitionId !== id) return;
        const code = change_.shareCode;
        update((c) =>
          c.items.some((e) => e.theme.share_code === code)
            ? {
                ...c,
                entries: Math.max(0, c.entries - 1),
                items: c.items.filter((e) => e.theme.share_code !== code),
              }
            : c,
        );
      } else if (change_.action === "competition_finalized") {
        if (change_.competition.id !== id) return;
        const next = change_.competition;
        update((c) => ({ ...c, ...next, items: c.items }));
      } else {
        if (!change_.competitionIds.includes(id)) return;
        const change = change_.event;
        if (change.action === "marketplace_theme_removed") {
          // Unlisted entries stay counted but drop out of the list.
          update((c) => ({
            ...c,
            items: c.items.filter(
              (e) => e.theme.share_code !== change.data.share_code,
            ),
          }));
        } else {
          const theme = change.data;
          const listed = queryClient
            .getQueryData<Competition>(key)
            ?.items.some((e) => e.theme.share_code === theme.share_code);
          // A relisted entry's entered_at isn't in the event, so fetch it.
          if (!listed)
            void queryClient.invalidateQueries({ queryKey: key, exact: true });
          else
            update((c) => ({
              ...c,
              items: c.items.map((e) =>
                e.theme.share_code === theme.share_code ? { ...e, theme } : e,
              ),
            }));
        }
      }
      refreshStandings();
    };
    window.addEventListener("realtimeThemeMarketplace", handle);
    return () => window.removeEventListener("realtimeThemeMarketplace", handle);
  }, [queryClient, id]);

  return (
    <div className="space-y-8">
      {status === "ended" && winner && <WinnerBanner winner={winner} />}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-10 lg:gap-y-8">
        <header className="min-w-0 space-y-3 lg:col-start-1 lg:row-start-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="min-w-0 text-3xl font-bold wrap-break-word">
              {competition.title}
            </h1>
            <CompetitionStatusBadge status={status} />
          </div>
          {competition.description && (
            <p className="text-secondary-text leading-relaxed wrap-break-word whitespace-pre-wrap">
              {competition.description}
            </p>
          )}
          {status === "ended" && !winner && (
            <p className="text-secondary-text text-sm">
              Results are being finalized. Check back in a few minutes.
            </p>
          )}
        </header>
        <aside className="border-border-card bg-secondary-bg rounded-xl border p-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {status !== "ended" && (
            <Countdown
              key={status}
              label={status === "upcoming" ? "Starts in" : "Ends in"}
              at={
                status === "upcoming"
                  ? competition.starts_at
                  : competition.ends_at
              }
            />
          )}
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-secondary-text mb-1">Style</dt>
              <dd>{competition.style}</dd>
            </div>
            <div>
              <dt className="text-secondary-text mb-1">Submissions</dt>
              <dd>{competition.entries}</dd>
            </div>
            <div>
              <dt className="text-secondary-text mb-1">Starts</dt>
              <dd>
                <LocalDate ts={competition.starts_at} />
              </dd>
            </div>
            <div>
              <dt className="text-secondary-text mb-1">Ends</dt>
              <dd>
                <LocalDate ts={competition.ends_at} />
              </dd>
            </div>
          </dl>
        </aside>
        <div className="min-w-0 space-y-8 lg:col-start-1 lg:row-start-2">
          {status === "running" && <EnterPicker competition={competition} />}

          {status !== "upcoming" && (
            <Suspense fallback={<StandingsSkeleton />}>
              <LiveStandings
                id={competition.id}
                status={status}
                promise={standings}
              />
            </Suspense>
          )}

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Submissions
              {competition.items.length > 0 && (
                <span className="text-secondary-text ml-2 text-sm font-normal tabular-nums">
                  {competition.items.length}
                </span>
              )}
            </h2>
            {competition.items.length === 0 ? (
              <div className="border-border-card bg-secondary-bg rounded-xl border px-6 py-10 text-center">
                <Icon
                  icon="lucide:palette"
                  aria-hidden="true"
                  className="text-secondary-text mx-auto mb-3 size-10 opacity-50"
                />
                <p className="text-primary-text font-medium">
                  No submissions yet
                </p>
                <p className="text-secondary-text mt-1 text-sm">
                  {status === "upcoming"
                    ? "Submissions open when the competition starts."
                    : status === "running"
                      ? "Be the first to submit a theme."
                      : "No themes were submitted."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {competition.items
                  .toSorted((a, b) => b.entered_at - a.entered_at)
                  .map(({ theme }) => (
                    <EntryCard key={theme.share_code} theme={theme} />
                  ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
