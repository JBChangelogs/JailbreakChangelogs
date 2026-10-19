"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { IMAGE_PLACEHOLDER } from "@/utils/ui/imagePlaceholder";
import { DefaultAvatar } from "@/utils/ui/avatar";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const profileLinkButtonClass =
  "text-primary-text bg-quaternary-bg border-border-card hover:bg-quaternary-bg/80 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-all";

const USER_TOOL_LINKS = [
  { key: "inventory", label: "Check Inventory", href: "/inventories" },
  { key: "og", label: "Check OG Items", href: "/og" },
  { key: "dupes", label: "Check Dupes", href: "/dupes" },
] as const;

interface UserEmptyStateCardProps {
  robloxId: string;
  avatarSrc: string;
  displayName: string;
  username: string;
  icon: string;
  title: string;
  description: ReactNode;
  /** Current tool, excluded from the cross-link buttons. */
  tool: (typeof USER_TOOL_LINKS)[number]["key"];
  /** Extra profile buttons shown after the Roblox button. */
  profileLinks?: ReactNode;
  children?: ReactNode;
}

export function UserEmptyStateCard({
  robloxId,
  avatarSrc,
  displayName,
  username,
  icon,
  title,
  description,
  tool,
  profileLinks,
  children,
}: UserEmptyStateCardProps) {
  const [avatarError, setAvatarError] = useState(false);

  return (
    <div className="border-border-card bg-secondary-bg overflow-hidden rounded-lg border">
      <div className="border-border-card bg-tertiary-bg flex items-center gap-4 border-b px-5 py-4">
        <div className="bg-quaternary-bg relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
          {!avatarError ? (
            <Image
              placeholder={IMAGE_PLACEHOLDER}
              src={avatarSrc}
              alt="Roblox Avatar"
              fill
              className="object-cover"
              unoptimized
              onError={() => setAvatarError(true)}
            />
          ) : (
            <DefaultAvatar />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-primary-text truncate font-semibold">
            {displayName}
          </p>
          <p className="text-secondary-text truncate text-sm">@{username}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`https://www.roblox.com/users/${robloxId}/profile`}
                  target="_blank"
                  rel="noopener noreferrer"
                  prefetch={false}
                  className={profileLinkButtonClass}
                >
                  <RobloxIcon className="h-3.5 w-3.5 shrink-0" />
                  Roblox
                </Link>
              </TooltipTrigger>
              <TooltipContent>Roblox profile</TooltipContent>
            </Tooltip>
            {profileLinks}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <div className="bg-secondary-text/10 mt-0.5 shrink-0 rounded-full p-2">
            <Icon icon={icon} className="text-secondary-text h-5 w-5" />
          </div>
          <div>
            <p className="text-primary-text font-medium">{title}</p>
            <p className="text-secondary-text mt-0.5 text-sm">{description}</p>
          </div>
        </div>

        {children}

        <div className="flex flex-wrap gap-2">
          {USER_TOOL_LINKS.filter((link) => link.key !== tool).map((link) => (
            <Button key={link.key} asChild size="sm" variant="secondary">
              <Link href={`${link.href}/${robloxId}`} prefetch={false}>
                {link.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
