"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import {
  Check,
  Download,
  ExternalLink,
  FlaskConical,
  Info,
} from "lucide-react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthContext } from "@/contexts/AuthContext";
import { formatMonthDayYear } from "@/utils/helpers/timestamp";
import { fetchAppAccess } from "./access";
import type { Releases } from "./releases";
import { getBrowserDownloadPlatform } from "./platform";

const subscribePlatform = () => () => {};
const getServerPlatform = () => null;
const downloads = {
  Windows: {
    url: "https://updates.jailbreakchangelogs.com/JBCLSetup.exe",
    format: ".exe",
    icon: "mdi:microsoft-windows",
  },
  macOS: {
    url: "https://updates.jailbreakchangelogs.com/JBCLSetup.dmg",
    format: ".dmg",
    icon: "mdi:apple",
  },
  Linux: {
    url: "https://updates.jailbreakchangelogs.com/JBCLSetup.AppImage",
    format: ".AppImage",
    icon: "mdi:linux",
  },
};
const allPlatforms = ["Windows", "macOS", "Linux"] as const;

const previews = "https://assets.jailbreakchangelogs.com/app";
const appRepoUrl = "https://github.com/JBChangelogs/JailbreakChangelogsApp";
// Folder layout from the app repo's README.
const appRepoLayout = [
  ["src/main", "Windows, auto-update, Discord RPC, notifications"],
  ["src/preload", "Bridge exposing window.api to the app"],
  ["src/renderer", "The React app"],
  ["src/shared", "Types and data shared by both sides"],
];
const features = [
  {
    label: "Robberies",
    title: "Find an open robbery and join in one click",
    description:
      "A live grid of open robberies across Jailbreak servers, with a Bounties tab next to it.",
    points: [
      "Each card shows the criminal and cop count, who's already joined, the server's location, and a Join button. Private servers show their code, and Cargo Planes show a departure countdown.",
      "Filter by server size and country, sort by when a robbery was logged, and hide servers you've already joined.",
      "Turn on the bell next to any robbery in the sidebar to get an alert when it opens. Alerts keep working while you're on other tabs.",
    ],
    image: `${previews}/preview-robberies.png`,
    alt: "Robberies tab showing a grid of open robbery servers with filters and alert toggles",
  },
  {
    label: "Values",
    title: "Clean and duped values side by side",
    description:
      "Browse every item, with clean and duped values on every card.",
    points: [
      "Each value shows whether it went up or down, plus a demand rating, a trend, and when it was last updated.",
      "Narrow by type, from vehicles and HyperChromes to rims, horns, drifts and furniture, or by seasonal, limited and untradable items.",
      "Filter by demand from Close to None up to Very High, or by trend such as Rising, Hoarded, Manipulated or Hyped.",
    ],
    image: `${previews}/preview-values.png`,
    alt: "Values tab showing item cards with clean and duped values, demand and trend",
  },
  {
    label: "Trades",
    title: "Build a trade ad without leaving the list",
    description:
      "Add items from the values list or your own inventory, and keep a running total for each side.",
    points: [
      "Shift-click an item to add it to Offering, or Ctrl-click to add it to Requesting.",
      "Mark each item as clean, duped or OG, or move it to the other side.",
      "Tag what you're after, such as adds, overpays, upgrades or OG owners, and add a note.",
    ],
    image: `${previews}/preview-trades.png`,
    alt: "Trade ad builder with offering and requesting panels next to a searchable item list",
  },
  {
    label: "Messages",
    title: "Agree on the trade, then meet in-game",
    description:
      "Direct messages with unread counts, online status and replies.",
    points: [
      "Accepted trade offers appear in the chat, showing the items and values on each side.",
      "Send a game invite and the other person can join your server straight from the conversation. Detecting your Roblox session is Windows only.",
    ],
    image: `${previews}/preview-messages.png`,
    alt: "Messages tab with a conversation showing an accepted trade offer and a game invite",
  },
  {
    label: "Dupe Finder",
    title: "Check a player's dupes before you trade",
    description:
      "Search a Roblox username to see how many duped items they have and what those items are worth in total.",
    points: [
      "See when each copy was logged and how many owners it has had.",
      "Search within their dupes, filter by type, and sort to show duplicates first.",
    ],
    image: `${previews}/preview-dupes.png`,
    alt: "Dupe Finder showing a player's duped items with value and ownership details",
  },
  {
    label: "Rich Presence",
    title: "Show friends what you're up to on Discord",
    description:
      "Your Discord status shows what you're doing in the app, such as “Checking the value list”, and Settings shows a live preview of it.",
    points: [
      "Choose which lines appear: the page you're viewing, the app tab you're on, and the Roblox activity badge.",
      "Add a Join Server button so friends can join your exact Jailbreak server from your status, plus a Visit Website button.",
      "Turn Rich Presence off to clear your status entirely. You can stop sharing your Roblox game and server separately, and that setting applies outside Discord too.",
    ],
    image: `${previews}/preview-richpresence.png`,
    alt: "Rich Presence settings with a live Discord status preview and toggles for each detail",
  },
  {
    label: "Open Source",
    title: "Read the code, or run it yourself",
    description:
      "The desktop app is open source on GitHub, built with Electron, React and TypeScript.",
    points: [
      "See exactly what runs on your computer, from auto-updates and Discord Rich Presence to notifications.",
      "The app uses the same public Jailbreak Changelogs API as the website.",
      "Clone it and run it locally with npm install and npm run dev.",
    ],
    link: appRepoUrl,
  },
];

export default function AppClient({ releases }: { releases: Releases }) {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  // The screenshot shown in the open lightbox; autoplay waits until it closes.
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  // Picking a tab or opening a preview pauses autoplay; it resumes after a
  // short delay. Bumping `hold` restarts the delay and the current segment.
  const [hold, setHold] = useState(0);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!held) return;
    const timeout = setTimeout(() => setHeld(false), 5000);
    return () => clearTimeout(timeout);
  }, [held, hold]);
  const pause = () => {
    setHeld(true);
    setHold((count) => count + 1);
  };
  const platform = useSyncExternalStore(
    subscribePlatform,
    getBrowserDownloadPlatform,
    getServerPlatform,
  );
  // The visitor's own platform first, then the rest in a fixed order. An
  // unknown platform gets a full button for every build.
  const platforms = [
    ...allPlatforms.filter((option) => option === platform),
    ...allPlatforms.filter((option) => option !== platform),
  ];
  const detected = allPlatforms.find((option) => option === platform);
  const primaryPlatforms = detected ? [detected] : platforms;
  const otherPlatforms = platforms.slice(primaryPlatforms.length);
  const latest = releases[platforms[0]];
  const fileDetails = (option: keyof Releases) => {
    const size = releases[option]?.size;
    return size
      ? `${downloads[option].format} · ${Math.round(size / 1024 ** 2)} MB`
      : downloads[option].format;
  };
  const { user, isAuthenticated, isLoading, setShowLoginModal } =
    useAuthContext();
  const signedIn = isAuthenticated && !!user;
  const access = useQuery({
    queryKey: ["app-access", user?.id],
    enabled: !isLoading && signedIn && platform !== "Mobile",
    queryFn: ({ signal }) => fetchAppAccess(signal),
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });
  const checking =
    platform !== "Mobile" &&
    (isLoading || (signedIn && (access.isPending || access.isFetching)));
  const granted =
    signedIn && !checking && !access.isError && access.data === true;

  return (
    <main className="container mx-auto mb-16 px-4">
      <Breadcrumb currentLabel="Desktop App" containerClassName="py-4" />
      <section className="relative isolate mx-auto max-w-6xl py-6 sm:py-10">
        <div
          aria-hidden="true"
          className="bg-button-info/10 pointer-events-none absolute top-0 right-0 -z-10 h-96 w-3/4 rounded-full blur-3xl"
        />
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <span className="bg-button-info/10 text-link inline-flex rounded-full px-3 py-1 text-xs font-semibold">
              Early access · Windows, macOS and Linux
            </span>
            <h1 className="text-primary-text mt-4 text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl">
              Jailbreak Changelogs,
              <br />
              <span className="text-link">on your desktop</span>
            </h1>
            <p className="text-secondary-text mt-4 max-w-lg text-lg leading-relaxed">
              Robbery alerts, values, trades, messages and the Dupe Finder in
              one window.
            </p>
            <p className="text-secondary-text mt-4 flex max-w-lg gap-2 text-sm leading-relaxed">
              <FlaskConical
                aria-hidden="true"
                className="text-status-warning mt-0.5 size-4 shrink-0"
              />
              <span>
                <span className="text-primary-text font-medium">
                  Experimental.
                </span>{" "}
                Not every account has access yet, and features are still being
                added and brought over from the website.
              </span>
            </p>
          </div>
          <section
            aria-labelledby="app-download-heading"
            className="border-border-card bg-secondary-bg rounded-2xl border p-6 shadow-xl sm:p-8"
          >
            <h2
              id="app-download-heading"
              className="text-primary-text text-2xl font-semibold tracking-tight"
            >
              Get the desktop app
            </h2>
            {latest && (
              <p className="text-secondary-text mt-2 text-sm">
                Version {latest.version}
                {latest.releasedAt && (
                  <>
                    {" · Released "}
                    <time
                      dateTime={new Date(latest.releasedAt).toISOString()}
                      suppressHydrationWarning
                    >
                      {formatMonthDayYear(latest.releasedAt)}
                    </time>
                  </>
                )}
              </p>
            )}
            <div
              className="border-border-card mt-6 border-t pt-6"
              aria-live="polite"
              aria-busy={checking}
            >
              {platform === "Mobile" ? (
                <>
                  <h3 className="text-primary-text font-semibold">
                    Only available on desktop
                  </h3>
                  <p className="text-secondary-text mt-2 text-sm leading-relaxed">
                    Open this page on a Windows, Mac or Linux computer to
                    download the app.
                  </p>
                </>
              ) : checking ? (
                <div
                  className="text-secondary-text flex items-center gap-3 text-sm"
                  role="status"
                >
                  <Spinner />
                  {isLoading
                    ? "Loading your account…"
                    : "Checking your access…"}
                </div>
              ) : !signedIn ? (
                <>
                  <p className="text-secondary-text text-sm leading-relaxed">
                    The app is in early access. Sign in to see if it’s available
                    to you.
                  </p>
                  <Button
                    className="mt-5 w-full"
                    size="lg"
                    onClick={() => setShowLoginModal(true)}
                  >
                    Sign in to download
                  </Button>
                </>
              ) : granted ? (
                <>
                  <div className="space-y-4">
                    {primaryPlatforms.map((option) => (
                      <div key={option}>
                        <Button
                          asChild
                          className="h-auto! min-h-12! w-full py-3! text-sm! whitespace-normal! sm:text-base!"
                        >
                          <a href={downloads[option].url}>
                            <Icon
                              icon={downloads[option].icon}
                              aria-hidden="true"
                              className="size-5"
                            />
                            <span>
                              Download for {option}
                              {option === "Linux" ? " (AppImage)" : ""}
                            </span>
                          </a>
                        </Button>
                        <p className="text-secondary-text mt-2 text-center text-xs">
                          {fileDetails(option)}
                        </p>
                        {option === "Windows" && (
                          <Popover>
                            <PopoverTrigger className="text-secondary-text hover:text-primary-text focus-visible:ring-border-focus mx-auto mt-3 flex cursor-pointer items-center gap-1.5 rounded-sm text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none">
                              <Info aria-hidden="true" className="size-3.5" />
                              Seeing &ldquo;Windows protected your PC&rdquo;?
                            </PopoverTrigger>
                            <PopoverContent
                              side="top"
                              className="w-80 p-4 text-sm"
                            >
                              <p className="text-secondary-text leading-relaxed">
                                Windows shows this for apps that are newer or
                                less widely downloaded. It&apos;s a general
                                caution, not a sign that anything is wrong with
                                the app. To install, click{" "}
                                <strong className="text-primary-text font-medium">
                                  More info
                                </strong>
                                , then{" "}
                                <strong className="text-primary-text font-medium">
                                  Run anyway
                                </strong>
                                . We&apos;re working on getting the app verified
                                with Microsoft so this warning goes away in the
                                future.
                              </p>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    ))}
                  </div>
                  {otherPlatforms.length > 0 && (
                    <div className="mt-6">
                      <p className="text-secondary-text mb-2 text-xs font-medium">
                        Other platforms
                      </p>
                      <ul className="border-border-card divide-border-card divide-y overflow-hidden rounded-lg border">
                        {otherPlatforms.map((option) => (
                          <li key={option}>
                            <a
                              href={downloads[option].url}
                              className="hover:bg-tertiary-bg focus-visible:ring-border-focus group flex items-center gap-3 px-3 py-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
                            >
                              <Icon
                                icon={downloads[option].icon}
                                aria-hidden="true"
                                className="text-secondary-text group-hover:text-primary-text size-5 shrink-0 transition-colors"
                              />
                              <span className="text-primary-text font-medium">
                                <span className="sr-only">Download for </span>
                                {option}
                              </span>
                              <span className="text-secondary-text ml-auto text-xs">
                                {fileDetails(option)}
                              </span>
                              <Download
                                aria-hidden="true"
                                className="text-secondary-text group-hover:text-link size-4 shrink-0 transition-colors"
                              />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-primary-text font-semibold">
                    {access.isError
                      ? "Couldn't check your access"
                      : "You don't have access yet"}
                  </h3>
                  <p className="text-secondary-text mt-2 text-sm leading-relaxed">
                    {access.isError
                      ? "Something went wrong while checking your account. Please try again."
                      : "The desktop app is still in early access and is only available to some accounts for now."}
                  </p>
                  <Button
                    className="mt-5 w-full"
                    size="lg"
                    onClick={() => void access.refetch()}
                  >
                    {access.isError ? "Retry" : "Check again"}
                  </Button>
                </>
              )}
            </div>
          </section>
        </div>
      </section>
      <section
        aria-labelledby="app-features-heading"
        className="border-border-card mx-auto max-w-6xl border-t pt-8"
      >
        <h2 id="app-features-heading" className="sr-only">
          App features
        </h2>
        <Tabs
          value={features[active].label}
          onValueChange={(value) => {
            setActive(features.findIndex((f) => f.label === value));
            pause();
          }}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          <TabsList
            aria-label="App features"
            hideIndicator
            className="border-border-card bg-secondary-bg w-full min-w-0 flex-wrap gap-1 rounded-xl border p-1 lg:flex-nowrap"
          >
            {features.map((feature, index) => (
              <TabsTrigger
                key={feature.label}
                value={feature.label}
                className="data-[state=active]:bg-tertiary-bg relative isolate flex-1 overflow-hidden rounded-lg px-3 py-2 transition-colors duration-200 sm:px-4 sm:py-2.5"
              >
                <span
                  aria-hidden="true"
                  className={`bg-button-info/20 absolute inset-0 -z-10 origin-left transition-opacity duration-300 motion-reduce:hidden ${index === active ? "opacity-100" : "opacity-0"}`}
                  style={
                    index === active
                      ? {
                          // Alternating between two identical keyframes
                          // restarts the fill when autoplay is paused.
                          animationName: `app-preview-progress${hold % 2 ? "-restart" : ""}`,
                          animationDuration: "6s",
                          animationTimingFunction: "linear",
                          animationPlayState:
                            hovered || held || previewIndex !== null
                              ? "paused"
                              : "running",
                        }
                      : undefined
                  }
                  onAnimationEnd={() =>
                    setActive((current) => (current + 1) % features.length)
                  }
                />
                {feature.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div onClickCapture={pause} className="mt-6 grid">
            <div
              inert={!!features[active].link}
              className={`transition-opacity duration-700 ease-in-out [grid-area:1/1] motion-reduce:transition-none ${features[active].link ? "opacity-0" : "opacity-100"}`}
            >
              <ImageLightbox
                src={features[previewIndex ?? active].image}
                alt={features[previewIndex ?? active].alt}
                previewRadius="rounded-xl"
                noReferrer
                onOpenChange={(open) =>
                  setPreviewIndex((current) =>
                    open ? (current ?? active) : null,
                  )
                }
                className="border-border-card w-full border shadow-2xl"
              >
                <div className="grid">
                  {features.map(
                    (feature, index) =>
                      feature.image && (
                        <Image
                          key={feature.image}
                          src={feature.image}
                          alt={index === active ? feature.alt : ""}
                          aria-hidden={index !== active}
                          width={2560}
                          height={1439}
                          sizes="(min-width: 1152px) 1152px, 100vw"
                          referrerPolicy="no-referrer"
                          className={`h-auto w-full transition-opacity duration-700 ease-in-out [grid-area:1/1] motion-reduce:transition-none ${index === active ? "opacity-100" : "opacity-0"}`}
                        />
                      ),
                  )}
                </div>
              </ImageLightbox>
            </div>
            <div
              inert={!features[active].link}
              className={`border-border-card bg-secondary-bg flex flex-col overflow-hidden rounded-xl border shadow-2xl transition-opacity duration-700 ease-in-out [grid-area:1/1] motion-reduce:transition-none ${features[active].link ? "opacity-100" : "opacity-0"}`}
            >
              <div className="border-border-card flex items-center gap-2 border-b px-4 py-2.5">
                <span aria-hidden="true" className="flex gap-1.5">
                  <span className="bg-secondary-text/30 size-2.5 rounded-full" />
                  <span className="bg-secondary-text/30 size-2.5 rounded-full" />
                  <span className="bg-secondary-text/30 size-2.5 rounded-full" />
                </span>
                <span className="text-secondary-text ml-2 truncate font-mono text-xs">
                  github.com/JBChangelogs/JailbreakChangelogsApp
                </span>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center sm:gap-5 sm:p-8">
                <Icon
                  icon="mdi:github"
                  aria-hidden="true"
                  className="text-primary-text size-10 sm:size-16"
                />
                <div>
                  <p className="text-primary-text font-semibold sm:text-xl">
                    JailbreakChangelogsApp
                  </p>
                  <p className="text-secondary-text mt-1 text-xs sm:text-sm">
                    Electron · React · TypeScript
                  </p>
                </div>
                <ul className="border-border-card divide-border-card hidden w-full max-w-lg divide-y rounded-lg border text-left font-mono text-xs md:block">
                  {appRepoLayout.map(([path, about]) => (
                    <li key={path} className="flex gap-4 px-3 py-2">
                      <span className="text-link w-28 shrink-0">{path}</span>
                      <span className="text-secondary-text truncate">
                        {about}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button asChild size="sm">
                  <a
                    href={appRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon
                      icon="mdi:github"
                      aria-hidden="true"
                      className="size-4"
                    />
                    View on GitHub
                    <ExternalLink aria-hidden="true" className="size-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
          {features.map((feature) => (
            <TabsContent
              key={feature.label}
              value={feature.label}
              className="animate-in fade-in-0 slide-in-from-bottom-2 mt-8 duration-500 motion-reduce:animate-none"
            >
              <div className="grid gap-6 md:grid-cols-2 md:gap-12">
                <div>
                  <h3 className="text-primary-text text-2xl font-semibold tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-secondary-text mt-3 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                <ul className="space-y-3">
                  {feature.points.map((point) => (
                    <li
                      key={point}
                      className="text-secondary-text flex gap-3 text-sm leading-relaxed"
                    >
                      <Check
                        aria-hidden="true"
                        className="text-link mt-0.5 size-4 shrink-0"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </main>
  );
}
