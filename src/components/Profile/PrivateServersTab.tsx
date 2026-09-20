"use client";

import React from "react";
import { Icon } from "@/components/ui/IconWrapper";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatProfileDate } from "@/utils/helpers/timestamp";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import Link from "next/link";
import { toast } from "sonner";
import type { PrivateServer } from "@/types/server";
import { PUBLIC_API_URL, getResponseErrorMessage } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { createLogger } from "@/services/logger";

const log = createLogger("API");

interface PrivateServersTabProps {
  userId: string;
  isOwnProfile: boolean;
}

function ServerCardSkeleton() {
  return (
    <div className="border-border-card bg-tertiary-bg rounded-lg border p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-quaternary-bg h-5 w-5 rounded" />
          <div className="bg-quaternary-bg h-4 w-20 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="bg-quaternary-bg h-8 w-8 rounded" />
          <div className="bg-quaternary-bg h-8 w-24 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="bg-quaternary-bg h-4 w-full rounded" />
        <div className="bg-quaternary-bg h-4 w-4/5 rounded" />
        <div className="bg-quaternary-bg h-16 w-full rounded" />
      </div>
    </div>
  );
}

function PrivateServersTabSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ServerCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

const PrivateServersTab: React.FC<PrivateServersTabProps> = ({
  userId,
  isOwnProfile,
}) => {
  const [servers, setServers] = React.useState<PrivateServer[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();

    const fetchServers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { url, headers } = buildApiFetchRequest(
          PUBLIC_API_URL,
          `/servers/owner/${encodeURIComponent(userId)}`,
        );
        const response = await fetch(url, {
          cache: "no-store",
          credentials: "include",
          headers,
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(
            await getResponseErrorMessage(
              response,
              "Failed to load private servers",
            ),
          );
        }

        const data = (await response.json()) as unknown;
        if (!controller.signal.aborted) {
          setServers(Array.isArray(data) ? (data as PrivateServer[]) : []);
        }
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        log.error("Failed to fetch profile private servers", fetchError);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load private servers",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void fetchServers();
    return () => controller.abort();
  }, [userId]);

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Server link copied to clipboard!");
    } catch {
      toast.error("Failed to copy server link");
    }
  };

  if (isLoading) {
    return (
      <div className="border-border-card rounded-t-none rounded-b-lg border p-4">
        <div className="bg-quaternary-bg mb-4 h-6 w-36 animate-pulse rounded" />
        <PrivateServersTabSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-button-danger bg-button-danger/10 text-button-danger rounded-t-none rounded-b-lg border p-4">
        {error}
      </div>
    );
  }

  if (!servers || servers.length === 0) {
    return (
      <div className="border-border-card rounded-t-none rounded-b-lg border p-8 text-center">
        <Image
          src="https://assets.jailbreakchangelogs.com/assets/images/404.svg"
          alt="No private servers"
          width={160}
          height={128}
          className="mx-auto mb-4"
        />
        <p className="text-primary-text mb-1 font-semibold">
          {isOwnProfile
            ? "You haven't submitted any private servers yet."
            : "No Private Servers Yet"}
        </p>
        <p className="text-secondary-text mx-auto mb-6 max-w-sm text-sm leading-relaxed">
          {isOwnProfile
            ? "Share a private server link so others can join your session."
            : "This user hasn't shared any private servers yet."}
        </p>
        <Button asChild variant="default" size="sm">
          <Link href="/servers">
            {isOwnProfile ? "Add Private Server" : "Browse Servers"}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-border-card rounded-t-none rounded-b-lg border p-4">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-primary-text text-lg font-semibold">
            Private Servers [{servers.length}]
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {servers.map((server, index) => (
            <div
              key={server.id}
              className="border-border-card bg-tertiary-bg rounded-lg border p-4 transition-colors sm:p-6"
            >
              <div className="mb-4 flex flex-col gap-3">
                <div className="flex items-center space-x-2">
                  <Icon
                    icon="heroicons-outline:shield-check"
                    className="text-link h-5 w-5"
                  />
                  <span className="text-primary-text">Server #{index + 1}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleCopyLink(server.link)}
                    variant="default"
                    size="sm"
                    className="px-2 sm:px-3"
                    aria-label="Copy Server Link"
                  >
                    <Icon
                      icon="heroicons-outline:clipboard"
                      className="h-4 w-4"
                    />
                  </Button>
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="px-2 sm:px-3"
                  >
                    <a
                      href={server.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join Server
                    </a>
                  </Button>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-2">
                  <Icon
                    icon="mdi:clock"
                    className="text-secondary-text h-5 w-5 shrink-0"
                  />
                  <span className="text-secondary-text text-sm sm:text-base">
                    Created: {formatProfileDate(server.created_at)} • Expires:{" "}
                    {server.expires === "Never"
                      ? "Never"
                      : formatProfileDate(server.expires)}
                  </span>
                </div>
                <div className="border-border-card bg-secondary-bg rounded-lg border p-3 sm:p-4">
                  <h3 className="text-primary-text mb-2 text-sm font-semibold">
                    Server Rules
                  </h3>
                  <p className="text-primary-text text-xs wrap-break-word whitespace-pre-wrap sm:text-sm">
                    {server.rules === "N/A"
                      ? "No Rules set by owner"
                      : sanitizeText(server.rules)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivateServersTab;
