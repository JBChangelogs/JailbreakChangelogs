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

  const expiry =
    siteBan.expiresAt < 0
      ? "Checking ban details…"
      : siteBan.expiresAt > 0
        ? `Expires: ${formatFullDate(siteBan.expiresAt)}`
        : "This ban is permanent.";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <main className="bg-primary-bg text-primary-text flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Image
          src="/logos/JBCL_Long_Transparent.webp"
          alt="Jailbreak Changelogs"
          width={256}
          height={58}
          priority
          className="mx-auto mb-8 h-auto w-56 sm:w-64"
        />
        <section
          aria-labelledby="site-ban-title"
          className="border-border-card bg-secondary-bg rounded-xl border p-6 shadow-xl sm:p-8"
        >
          <div className="bg-button-danger/10 text-button-danger mb-5 flex size-12 items-center justify-center rounded-full">
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
          <h1 id="site-ban-title" className="text-2xl font-bold sm:text-3xl">
            Your account has been banned
          </h1>
          <p className="text-secondary-text mt-2">
            You cannot access Jailbreak Changelogs while this website ban is
            active.
          </p>
          <div className="border-border-card bg-tertiary-bg mt-6 rounded-lg border p-4 text-sm">
            <p>
              <span className="font-semibold">Reason:</span> {siteBan.reason}
            </p>
            <p className="text-secondary-text mt-1">{expiry}</p>
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
    </main>
  );
}

export function SiteBanGate({ children }: { children: ReactNode }) {
  const { siteBan } = useAuthContext();
  return siteBan ? <SiteBanScreen /> : children;
}
