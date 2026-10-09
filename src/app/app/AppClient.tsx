"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import type { ChangelogEntry } from "@/lib/changelog-parser";
import { formatMonthDayYear } from "@/utils/helpers/timestamp";
import { appAccessKey, fetchAppAccess } from "./access";
import { AppReleaseNotes } from "./AppReleaseNotes";
import type { Releases } from "./releases";
import { getBrowserDownloadPlatform } from "./platform";

const subscribePlatform = () => () => {};
const getServerPlatform = () => null;
const downloads = {
  Windows: {
    url: "https://updates.jailbreakchangelogs.com/JBCLSetup.exe",
    format: ".exe",
    icon: "simple-icons:windows",
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
const previewOrigin = "https://assets.jailbreakchangelogs.com";

// Things the website can't do, in the app's own wording.
const appOnly = [
  {
    icon: "ic:baseline-discord",
    title: "Discord Rich Presence",
    description:
      "Your Discord status shows what you're doing in the app, with an optional Join Server button so friends can join your Jailbreak server.",
  },
  {
    icon: "lucide:radar",
    title: "Auto trade scanning",
    description:
      "While you're in a Jailbreak trading server, keeps the calculator in sync with the open trade, and clears it when you leave the trade menu.",
  },
  {
    icon: "lucide:bell-ring",
    title: "Robbery and bounty alerts",
    description:
      "Watch robbery types and bounty ranges for a player or a whole server, and get alerted the moment one hits, even with the app in the background.",
  },
  {
    icon: "lucide:gamepad-2",
    title: "Join from a game invite",
    description:
      "Send a game invite in Messages and the other person can join your server straight from the conversation. Detecting your Roblox session is Windows only.",
  },
];

export default function AppClient({
  releases,
  changes,
}: {
  releases: Releases;
  /** Recent app releases from GitHub, newest first. */
  changes: ChangelogEntry[];
}) {
  const { theme } = useTheme();
  // The preview posts its content height, so the iframe fits it with no
  // inner scrollbar. Until then it uses the CSS estimate below.
  const previewRef = useRef<HTMLIFrameElement>(null);
  const [previewHeight, setPreviewHeight] = useState<number>();
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (
        e.origin !== previewOrigin ||
        e.source !== previewRef.current?.contentWindow ||
        e.data?.type !== "jbcl-preview-height"
      )
        return;
      const height = Number(e.data.height);
      if (Number.isFinite(height) && height > 0) setPreviewHeight(height);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
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
    queryKey: appAccessKey(user?.id),
    enabled: !isLoading && signedIn && platform !== "Mobile",
    queryFn: ({ signal }) => fetchAppAccess(signal),
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });
  // A cached answer (from an earlier visit) shows right away and refreshes
  // quietly; only wait when there's no answer yet.
  const checking =
    platform !== "Mobile" && (isLoading || (signedIn && access.isPending));
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
            <a
              href="https://github.com/JBChangelogs/JailbreakChangelogsApp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:text-link-hover focus-visible:ring-border-focus mt-3 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
            >
              <Icon icon="mdi:github" aria-hidden="true" className="size-4" />
              Open source on GitHub
              <Icon
                icon="lucide:external-link"
                aria-hidden="true"
                className="size-3.5"
              />
            </a>
            <p className="text-secondary-text mt-4 flex max-w-lg gap-2 text-sm leading-relaxed">
              <Icon
                icon="lucide:flask-conical"
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
                // Shaped like the download button, so nothing jumps.
                <div role="status">
                  <span className="sr-only">
                    {isLoading
                      ? "Loading your account…"
                      : "Checking your access…"}
                  </span>
                  <Skeleton aria-hidden="true" className="h-12 w-full" />
                  <Skeleton
                    aria-hidden="true"
                    className="mx-auto mt-2 h-4 w-28"
                  />
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
                              <Icon
                                icon="lucide:info"
                                aria-hidden="true"
                                className="size-3.5"
                              />
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
                              <Icon
                                icon="lucide:download"
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
                    disabled={access.isFetching}
                    onClick={() => void access.refetch()}
                  >
                    {access.isFetching ? (
                      <>
                        <Spinner />
                        Checking…
                      </>
                    ) : access.isError ? (
                      "Retry"
                    ) : (
                      "Check again"
                    )}
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
        <div className="mt-6 overflow-hidden rounded-2xl">
          <iframe
            ref={previewRef}
            src={`${previewOrigin}/app/preview.html?theme=${encodeURIComponent(theme)}`}
            className="block w-full border-0 bg-transparent"
            style={{
              height:
                previewHeight ?? "clamp(720px, calc(56.25vw + 300px), 1000px)",
            }}
            loading="lazy"
            allow="autoplay"
            title="Desktop app preview"
          />
        </div>
      </section>
      <section
        aria-labelledby="app-only-heading"
        className="border-border-card mx-auto mt-16 max-w-6xl border-t pt-8"
      >
        <h2
          id="app-only-heading"
          className="text-primary-text text-2xl font-semibold tracking-tight"
        >
          Only in the desktop app
        </h2>
        <p className="text-secondary-text mt-2 max-w-2xl">
          Running on your computer, the app can follow your Roblox game and show
          your status on Discord, so it can do things the website can&apos;t.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {appOnly.map(({ icon, title, description }) => (
            <li
              key={title}
              className="border-border-card bg-secondary-bg rounded-xl border p-5"
            >
              <span
                aria-hidden="true"
                className="bg-button-info/10 text-link inline-flex size-10 items-center justify-center rounded-lg"
              >
                <Icon icon={icon} className="size-5" />
              </span>
              <h3 className="text-primary-text mt-4 font-semibold">{title}</h3>
              <p className="text-secondary-text mt-1.5 text-sm leading-relaxed">
                {description}
              </p>
            </li>
          ))}
        </ul>
      </section>
      {changes.length > 0 && <AppReleaseNotes changes={changes} />}
    </main>
  );
}
