"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { formatFullDate } from "@/utils/helpers/timestamp";

export function SiteBanScreen() {
  const { siteBan, logout } = useAuthContext();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!siteBan) return null;

  const title =
    siteBan.expiresAt < 0
      ? "Your account has been banned"
      : siteBan.expiresAt > 0
        ? `Your account has been banned until ${formatFullDate(siteBan.expiresAt)}`
        : "Your account has been banned permanently";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <main className="bg-primary-bg text-primary-text relative flex min-h-dvh items-center overflow-hidden bg-[url('/backgrounds/v2/background16.webp')] bg-cover bg-center bg-no-repeat p-6 sm:p-8">
      <div className="absolute inset-0 bg-black/65" />
      <div className="absolute inset-0 bg-[url('/backgrounds/vignette.png')] bg-cover bg-center bg-no-repeat opacity-80" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="mx-auto w-full max-w-lg lg:mx-0">
          <Image
            src="/logos/JBCL_Long_Transparent.webp"
            alt="Jailbreak Changelogs"
            width={256}
            height={58}
            priority
            className="mx-auto mb-8 h-auto w-56 drop-shadow-lg sm:w-64"
          />
          <section
            aria-labelledby="site-ban-title"
            className="bg-secondary-bg/90 rounded-2xl border border-white/15 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8"
          >
            <div className="text-button-danger mb-5 flex items-center gap-3">
              <div className="border-button-danger/20 bg-button-danger/15 flex size-12 shrink-0 items-center justify-center rounded-full border">
                <svg
                  aria-hidden="true"
                  className="size-6"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="m13.766 13.08l2.91 2.91a1.8 1.8 0 0 0 2.547 0l2.404-2.404a1.8 1.8 0 0 0 0-2.545L17.95 7.364a1 1 0 1 0 1.414-1.414L17.95 4.536a1 1 0 0 0-1.415 1.413l-3.677-3.676a1.8 1.8 0 0 0-2.545 0L7.909 4.677a1.8 1.8 0 0 0 0 2.546l2.91 2.91l-8.65 7.359l-.059.054a2.6 2.6 0 0 0 0 3.677l.566.566a2.6 2.6 0 0 0 3.732-.06zm-1.418-1.419l-.11-.11l-8.735 7.432a.6.6 0 0 0 .022.826l.565.566a.6.6 0 0 0 .827.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase">
                Access restricted
              </p>
            </div>
            <h1
              id="site-ban-title"
              className="text-2xl leading-tight font-bold text-balance sm:text-3xl"
            >
              {title}
            </h1>
            <p className="text-secondary-text mt-3 leading-relaxed">
              You cannot access Jailbreak Changelogs while this website ban is
              active.
            </p>
            <div className="border-border-card bg-tertiary-bg/70 mt-6 rounded-xl border p-4">
              {siteBan.expiresAt < 0 ? (
                <p className="text-secondary-text text-sm">
                  Checking ban details…
                </p>
              ) : (
                <>
                  <p className="text-secondary-text text-xs font-semibold tracking-wider uppercase">
                    Reason
                  </p>
                  <p className="mt-1 text-sm leading-relaxed break-words">
                    {siteBan.reason}
                  </p>
                </>
              )}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="w-full sm:w-auto">
                <a
                  href="https://discord.jailbreakchangelogs.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Appeal ban
                </a>
              </Button>
              <Button
                className="w-full sm:w-auto"
                disabled={isLoggingOut}
                onClick={() => void handleLogout()}
                variant="secondary"
              >
                {isLoggingOut ? "Logging out…" : "Log out"}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export function SiteBanGate({ children }: { children: ReactNode }) {
  const { siteBan } = useAuthContext();
  return siteBan ? <SiteBanScreen /> : children;
}
