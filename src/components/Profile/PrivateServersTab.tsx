"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
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

interface PrivateServersTabProps {
  userId: string;
  isOwnProfile: boolean;
}

function PrivateServersTabSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[0, 1].map((index) => (
        <div
          key={index}
          className="border-border-card bg-tertiary-bg rounded-xl border p-4 sm:p-5"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="bg-quaternary-bg h-5 w-28 rounded" />
            <div className="flex gap-2">
              <div className="bg-quaternary-bg h-8 w-24 rounded-lg" />
              <div className="bg-quaternary-bg h-8 w-28 rounded-lg" />
            </div>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="bg-quaternary-bg h-7 w-44 rounded-md" />
            <div className="bg-quaternary-bg h-7 w-28 rounded-md" />
          </div>
          <div className="bg-quaternary-bg h-20 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

const PrivateServersTab: React.FC<PrivateServersTabProps> = ({
  userId,
  isOwnProfile,
}) => {
  const serversQuery = useQuery({
    queryKey: ["profile-private-servers", userId],
    queryFn: async ({ signal }): Promise<PrivateServer[]> => {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/v2/users/${encodeURIComponent(userId)}/servers`,
      );
      const response = await fetch(url, {
        credentials: "include",
        headers,
        signal,
      });
      if (response.status === 404) return [];
      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(
            response,
            "Failed to load private servers",
          ),
        );
      }

      const data = (await response.json()) as unknown;
      return Array.isArray(data) ? (data as PrivateServer[]) : [];
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
  });
  const servers = serversQuery.data ?? [];
  const isLoading = serversQuery.isPending;
  const error = serversQuery.data ? null : serversQuery.error?.message;

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
      <div className="border-border-card bg-secondary-bg rounded-2xl border p-5 sm:p-6">
        <div className="bg-quaternary-bg mb-4 h-6 w-36 animate-pulse rounded" />
        <PrivateServersTabSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-border-card bg-secondary-bg rounded-2xl border p-5 sm:p-6">
        <h2 className="text-primary-text mb-3 text-lg font-semibold">
          Private Servers
        </h2>
        <p className="text-status-error">Error: {error}</p>
      </div>
    );
  }

  if (!servers || servers.length === 0) {
    return (
      <div className="border-border-card bg-secondary-bg rounded-2xl border p-5 sm:p-6">
        <h2 className="text-primary-text mb-3 text-lg font-semibold">
          Private Servers{" "}
          <span className="text-secondary-text ml-1 text-sm font-normal">
            0
          </span>
        </h2>
        <div className="py-6 text-center">
          <Image
            src="https://assets.jailbreakchangelogs.com/assets/images/404.svg"
            alt="No private servers"
            width={160}
            height={128}
            className="mx-auto mb-4"
          />
          <p className="text-primary-text mb-1 font-semibold">
            No Private Servers Yet
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
      </div>
    );
  }

  return (
    <section className="border-border-card bg-secondary-bg rounded-2xl border p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-primary-text text-lg font-semibold">
          Private Servers{" "}
          <span className="text-secondary-text ml-1 text-sm font-normal">
            {servers.length}
          </span>
        </h2>
        <Button asChild variant="secondary" size="sm">
          <Link href="/servers">
            {isOwnProfile ? "Manage servers" : "Browse servers"}
          </Link>
        </Button>
      </div>
      <div className="space-y-4">
        {servers.map((server, index) => (
          <article
            key={server.id}
            className="border-border-card bg-tertiary-bg min-w-0 rounded-xl border p-4 sm:p-5"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-primary-text flex items-center gap-2 text-base font-semibold">
                <Icon
                  icon="heroicons-outline:shield-check"
                  className="text-link size-5 shrink-0"
                />
                Server #{index + 1}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleCopyLink(server.link)}
                  variant="secondary"
                  size="sm"
                  aria-label="Copy Server Link"
                >
                  <Icon icon="heroicons:clipboard" /> Copy link
                </Button>
                <Button asChild variant="default" size="sm">
                  <a
                    href={server.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join Server <Icon icon="akar-icons:link-out" />
                  </a>
                </Button>
              </div>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="text-primary-text bg-secondary-bg border-border-card inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium">
                <Icon icon="heroicons:clock" className="size-3.5 shrink-0" />
                Added {formatProfileDate(server.created_at)}
              </span>
              <span className="text-primary-text bg-secondary-bg border-border-card inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium">
                <Icon
                  icon="heroicons:calendar-days"
                  className="size-3.5 shrink-0"
                />
                Expires{" "}
                {server.expires === "Never"
                  ? "Never"
                  : formatProfileDate(server.expires)}
              </span>
            </div>
            <div className="border-border-card bg-secondary-bg rounded-lg border p-3 sm:p-4">
              <h4 className="text-primary-text mb-2 text-sm font-medium">
                Server rules
              </h4>
              <p className="text-secondary-text text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
                {server.rules && server.rules !== "N/A"
                  ? sanitizeText(server.rules)
                  : "No rules set by owner"}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default PrivateServersTab;
