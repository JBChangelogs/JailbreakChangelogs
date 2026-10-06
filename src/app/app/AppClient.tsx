"use client";

import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthContext } from "@/contexts/AuthContext";
import { fetchAppAccess } from "./access";
import { getBrowserDownloadPlatform } from "./platform";

const subscribePlatform = () => () => {};
const getServerPlatform = () => null;
const downloads = {
  Windows: {
    url: "https://updates.jailbreakchangelogs.com/JBCLSetup.exe",
    format: ".exe",
  },
  Linux: {
    url: "https://updates.jailbreakchangelogs.com/JBCLSetup.AppImage",
    format: ".AppImage",
  },
};

export default function AppClient() {
  const platform = useSyncExternalStore(
    subscribePlatform,
    getBrowserDownloadPlatform,
    getServerPlatform,
  );
  const platforms =
    platform === "Linux"
      ? (["Linux", "Windows"] as const)
      : (["Windows", "Linux"] as const);
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
      <section className="relative isolate mx-auto max-w-6xl py-10 sm:py-16 lg:py-24">
        <div
          aria-hidden="true"
          className="bg-button-info/10 pointer-events-none absolute top-0 right-0 -z-10 h-96 w-3/4 rounded-full blur-3xl"
        />
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div>
            <h1 className="text-primary-text text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Jailbreak Changelogs
              <br />
              <span className="text-link">for desktop</span>
            </h1>
            <p className="text-secondary-text mt-6 max-w-lg text-lg leading-relaxed">
              A desktop companion to the website, with configurable robbery and
              bounty alerts and optional Discord Rich Presence.
            </p>
            <p className="text-secondary-text mt-8 text-sm">
              Available for Windows and Linux.
            </p>
          </div>
          <section
            aria-labelledby="app-download-heading"
            className="border-border-card bg-secondary-bg rounded-2xl border p-6 shadow-xl sm:p-8"
          >
            <span className="bg-button-info/10 text-link inline-flex rounded-full px-3 py-1 text-xs font-semibold">
              Early access
            </span>
            <h2
              id="app-download-heading"
              className="text-primary-text mt-5 text-2xl font-semibold tracking-tight"
            >
              Get the desktop app
            </h2>
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
                    Open this page on a Windows or Linux computer to download
                    the app.
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
                    {platforms.map((option) => (
                      <div key={option}>
                        {platform && option !== platform ? (
                          <a
                            href={downloads[option].url}
                            className="text-link hover:text-link-hover focus-visible:ring-border-focus block rounded-sm text-center text-sm underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                          >
                            Download for {option} ({downloads[option].format})
                          </a>
                        ) : (
                          <Button
                            asChild
                            className="h-auto! min-h-12! w-full py-3! text-sm! whitespace-normal! sm:text-base!"
                          >
                            <a href={downloads[option].url}>
                              <Download aria-hidden="true" />
                              <span>
                                Download for {option}
                                {option === "Linux" ? " (AppImage)" : ""}
                              </span>
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
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
        className="border-border-card mx-auto max-w-6xl border-t pt-10 sm:pt-12"
      >
        <h2
          id="app-features-heading"
          className="text-primary-text text-2xl font-semibold tracking-tight"
        >
          Desktop features
        </h2>
        <div className="mt-8 grid gap-8 md:grid-cols-3 md:gap-12">
          <div>
            <h3 className="text-primary-text font-semibold">
              Robbery and bounty alerts
            </h3>
            <p className="text-secondary-text mt-3 text-sm leading-relaxed">
              Watch selected robberies for openings, or set player and server
              bounty ranges. Alerts stay active while you use other tabs in the
              app.
            </p>
          </div>
          <div>
            <h3 className="text-primary-text font-semibold">
              Discord Rich Presence
            </h3>
            <p className="text-secondary-text mt-3 text-sm leading-relaxed">
              Show your activity on your Discord profile, with controls for
              which details and buttons appear. You can turn it off in Settings.
            </p>
          </div>
          <div>
            <h3 className="text-primary-text font-semibold">
              Roblox game invites
            </h3>
            <p className="text-secondary-text mt-3 text-sm leading-relaxed">
              On Windows, the app detects your Roblox session so you can send an
              invite to your current game directly from a conversation.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
