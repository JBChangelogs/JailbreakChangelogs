"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import type { UserFlag } from "@/types/auth";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UserBadgesProps {
  usernumber: number;
  premiumType?: number;
  flags?: UserFlag[];
  size?: "sm" | "md" | "lg";
  className?: string;
  primary_guild?: {
    tag: string | null;
    badge: string | null;
    identity_enabled: boolean;
    identity_guild_id: string | null;
  } | null;
  disableTooltips?: boolean;
  customBgClass?: string;
  noContainer?: boolean;
}

const BADGE_BASE_URL =
  "https://assets.jailbreakchangelogs.com/assets/website_icons";

export const UserBadges = ({
  usernumber,
  premiumType,
  flags = [],
  size = "md",
  className = "",
  primary_guild,
  disableTooltips = false,
  customBgClass,
  noContainer = false,
}: UserBadgesProps) => {
  const [failedFlagCount, setFailedFlagCount] = useState(0);
  const badgeSize = { sm: 16, md: 20, lg: 24 }[size];
  const containerHeight = { sm: "h-7", md: "h-9", lg: "h-11" }[size];

  const sortedFlags = flags
    .filter((f) => f.enabled !== false && f.flag !== null)
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0)) as (UserFlag & {
    flag: string;
  })[];

  const renderTooltipWrapper = (
    key: string,
    content: React.ReactNode,
    tooltipText: string,
  ) => {
    if (disableTooltips)
      return <React.Fragment key={key}>{content}</React.Fragment>;
    return (
      <Tooltip key={key}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    );
  };

  const handleFlagClick = (
    e: React.MouseEvent,
    flag: UserFlag & { flag: string },
  ) => {
    e.stopPropagation();
    toast.success(flag.description || flag.flag, {
      duration: 4000,
      icon: (
        <Image
          src={getFlagIconUrl(flag.flag)}
          alt={flag.flag}
          width={20}
          height={20}
          className="object-contain"
        />
      ),
    });
  };

  const getFlagIconUrl = (f: string) => {
    const name = f.startsWith("is_") ? f.slice(3) : f;
    return `${BADGE_BASE_URL}/jbcl_${name}.svg`;
  };

  const badges: React.ReactNode[] = sortedFlags.map((flag) =>
    renderTooltipWrapper(
      flag.flag,
      <Image
        src={getFlagIconUrl(flag.flag)}
        alt={flag.flag}
        width={badgeSize}
        height={badgeSize}
        className="cursor-pointer"
        onClick={(e) => handleFlagClick(e, flag)}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
          setFailedFlagCount((c) => c + 1);
        }}
      />,
      flag.description || flag.flag,
    ),
  );

  if (premiumType && premiumType >= 1 && premiumType <= 3) {
    const handlePremiumClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      toast.success(`This user has Supporter Type ${premiumType}!`, {
        duration: 4000,
        icon: (
          <Image
            src={`${BADGE_BASE_URL}/jbcl_supporter_${premiumType}.svg`}
            alt={`Supporter Type ${premiumType}`}
            width={20}
            height={20}
            className="object-contain"
          />
        ),
      });
    };
    badges.push(
      renderTooltipWrapper(
        "premium",
        <Image
          src={`${BADGE_BASE_URL}/jbcl_supporter_${premiumType}.svg`}
          alt={`Supporter Type ${premiumType}`}
          width={badgeSize}
          height={badgeSize}
          className="cursor-pointer"
          onClick={handlePremiumClick}
        />,
        `Supporter Type ${premiumType}`,
      ),
    );
  }

  if (
    usernumber <= 100 &&
    !sortedFlags.some((f) => f.flag === "is_early_adopter")
  ) {
    const handleEarlyAdopterClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      toast.success(
        "This badge is awarded to the first 100 people to sign up to Jailbreak Changelogs!",
        {
          duration: 4000,
          icon: (
            <Image
              src={`${BADGE_BASE_URL}/jbcl_early_adopter.svg`}
              alt="Early Adopter"
              width={20}
              height={20}
            />
          ),
        },
      );
    };
    badges.push(
      renderTooltipWrapper(
        "early",
        <Image
          src={`${BADGE_BASE_URL}/jbcl_early_adopter.svg`}
          alt="Early Adopter"
          width={badgeSize}
          height={badgeSize}
          className="cursor-pointer"
          onClick={handleEarlyAdopterClick}
        />,
        "Early Adopter",
      ),
    );
  }

  let guildBadge = null;

  if (
    primary_guild &&
    primary_guild.tag &&
    primary_guild.badge &&
    primary_guild.identity_guild_id
  ) {
    const badgeUrl = `https://cdn.discordapp.com/guild-tag-badges/${primary_guild.identity_guild_id}/${primary_guild.badge}`;
    const guildBadgeContent = (
      <button
        type="button"
        onClick={(e) => e.stopPropagation()}
        className={`${customBgClass || "bg-tertiary-bg"} border-border-card text-primary-text hover:bg-quaternary-bg/30 flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 transition-colors ${containerHeight}`}
      >
        <Image
          src={badgeUrl}
          alt={primary_guild.tag}
          width={badgeSize}
          height={badgeSize}
          className="shrink-0"
        />
        <span className="text-sm leading-none font-semibold">
          {primary_guild.tag}
        </span>
      </button>
    );
    guildBadge = renderTooltipWrapper(
      "guild",
      guildBadgeContent,
      `Guild: ${primary_guild.tag}`,
    );
  }

  if (badges.length === 0 && !guildBadge) return null;

  return (
    <div className={`inline-flex items-stretch gap-2 ${className}`}>
      {badges.length - failedFlagCount > 0 &&
        (noContainer ? (
          <div className="flex items-center gap-1">{badges}</div>
        ) : (
          <div
            className={`${customBgClass || "bg-tertiary-bg"} border-border-card inline-flex items-center gap-2 rounded-lg border px-2.5 ${containerHeight}`}
          >
            {badges}
          </div>
        ))}
      {guildBadge}
    </div>
  );
};
