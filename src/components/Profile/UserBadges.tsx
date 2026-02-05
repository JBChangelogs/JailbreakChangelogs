"use client";

import React from "react";
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
  const badges = [];

  const badgeSize = { sm: 16, md: 20, lg: 24 }[size];
  const badimoSize = { sm: 20, md: 24, lg: 28 }[size]; // Scaled down to fit container
  const containerHeight = { sm: "h-7", md: "h-9", lg: "h-11" }[size];
  const BADGE_BASE_URL =
    "https://assets.jailbreakchangelogs.xyz/assets/website_icons";

  const sortedFlags = flags
    .filter((f) => f.enabled !== false)
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  const handleOwnerBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const ownerFlag = sortedFlags.find((f) => f.flag === "is_owner");
    toast.success(
      ownerFlag?.description || "This user created Jailbreak Changelogs!",
      {
        icon: (
          <Image
            src={`${BADGE_BASE_URL}/jbcl_owner.svg`}
            alt="Owner"
            width={20}
            height={20}
          />
        ),
      },
    );
  };

  const handleEarlyAdopterBadgeClick = (e: React.MouseEvent) => {
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

  const handleTesterBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const testerFlag = sortedFlags.find((f) => f.flag === "is_tester");
    toast.success(
      testerFlag?.description ||
        "This user is a trusted tester of Jailbreak Changelogs!",
      {
        duration: 4000,
        icon: (
          <Image
            src={`${BADGE_BASE_URL}/jbcl_tester.svg`}
            alt="Tester"
            width={20}
            height={20}
            className="object-contain"
          />
        ),
      },
    );
  };

  const handleVTMBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const vtmFlag = sortedFlags.find((f) => f.flag === "is_vtm");
    toast.success(
      vtmFlag?.description || "This user is a Trading Core Value Team Manager!",
      {
        duration: 4000,
        icon: (
          <Image
            src={`${BADGE_BASE_URL}/jbcl_value_team_manager.svg`}
            alt="Value Team Manager"
            width={20}
            height={20}
            className="object-contain"
          />
        ),
      },
    );
  };

  const handleVTBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const vtFlag = sortedFlags.find((f) => f.flag === "is_vt");
    toast.success(
      vtFlag?.description ||
        "This user is a member of the Trading Core Value Team!",
      {
        duration: 4000,
        icon: (
          <Image
            src={`${BADGE_BASE_URL}/jbcl_value_team.svg`}
            alt="Value Team"
            width={20}
            height={20}
            className="object-contain"
          />
        ),
      },
    );
  };

  const handlePartnerBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const partnerFlag = sortedFlags.find((f) => f.flag === "is_partner");
    toast.success(
      partnerFlag?.description ||
        "This user is a partner of Jailbreak Changelogs!",
      {
        duration: 4000,
        icon: (
          <Image
            src={`${BADGE_BASE_URL}/jbcl_partner.svg`}
            alt="Partner"
            width={20}
            height={20}
            className="object-contain"
          />
        ),
      },
    );
  };

  const handleContributorBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const contributorFlag = sortedFlags.find(
      (f) => f.flag === "is_contributor",
    );
    toast.success(
      contributorFlag?.description ||
        "This user contributed to Jailbreak Changelogs!",
      {
        duration: 4000,
        icon: (
          <Image
            src={`${BADGE_BASE_URL}/jbcl_contributor.svg`}
            alt="Contributor"
            width={20}
            height={20}
            className="object-contain"
          />
        ),
      },
    );
  };

  const handleDeveloperBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const developerFlag = sortedFlags.find((f) => f.flag === "is_developer");
    toast.success(
      developerFlag?.description ||
        "This user is a developer for Jailbreak Changelogs!",
      {
        duration: 4000,
        icon: (
          <Image
            src={`${BADGE_BASE_URL}/jbcl_developer.svg`}
            alt="Developer"
            width={20}
            height={20}
            className="object-contain"
          />
        ),
      },
    );
  };

  const handleDesignerBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const designerFlag = sortedFlags.find((f) => f.flag === "is_designer");
    toast.success(
      designerFlag?.description ||
        "This user is a graphic designer for Jailbreak Changelogs!",
      {
        duration: 4000,
        icon: (
          <Image
            src={`${BADGE_BASE_URL}/jbcl_designer.svg`}
            alt="Designer"
            width={20}
            height={20}
            className="object-contain"
          />
        ),
      },
    );
  };

  const handleBadimoBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const badimoFlag = sortedFlags.find((f) => f.flag === "is_badimo");
    toast(
      () => (
        <div className="flex items-center gap-2">
          <Image
            src="https://assets.jailbreakchangelogs.xyz/assets/images/badimo_transparent.png"
            alt="Badimo"
            width={20}
            height={20}
            className="h-5 w-5 object-contain"
          />
          <span>
            {badimoFlag?.description ||
              "This user is an official Badimo developer"}
          </span>
        </div>
      ),
      {
        duration: 4000,
        style: {
          background: "linear-gradient(to right, #111827, #1F2937)",
          color: "white",
          fontWeight: "600",
        },
      },
    );
  };

  const handlePremiumBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!premiumType || premiumType < 1 || premiumType > 3) return;
    const premiumMessages: Record<number, string> = {
      1: "This user has Supporter Type 1!",
      2: "This user has Supporter Type 2!",
      3: "This user has Supporter Type 3!",
    };
    const premiumIcons: Record<number, string> = {
      1: `${BADGE_BASE_URL}/jbcl_supporter_1.svg`,
      2: `${BADGE_BASE_URL}/jbcl_supporter_2.svg`,
      3: `${BADGE_BASE_URL}/jbcl_supporter_3.svg`,
    };
    toast.success(premiumMessages[premiumType], {
      duration: 4000,
      icon: (
        <Image
          src={premiumIcons[premiumType]}
          alt={`Supporter Type ${premiumType}`}
          width={20}
          height={20}
          className="object-contain"
        />
      ),
    });
  };

  const createBadge = (flag: UserFlag) => {
    switch (flag.flag) {
      case "is_owner":
        return renderTooltipWrapper(
          flag.flag,
          <Image
            src={`${BADGE_BASE_URL}/jbcl_owner.svg`}
            alt="Owner"
            width={badgeSize}
            height={badgeSize}
            className="cursor-pointer"
            onClick={handleOwnerBadgeClick}
          />,
          "Website Owner",
        );
      case "is_tester":
        return renderTooltipWrapper(
          flag.flag,
          <Image
            src={`${BADGE_BASE_URL}/jbcl_tester.svg`}
            alt="Tester"
            width={badgeSize}
            height={badgeSize}
            className="cursor-pointer"
            onClick={handleTesterBadgeClick}
          />,
          "Trusted Tester",
        );
      case "is_vtm":
        return renderTooltipWrapper(
          flag.flag,
          <Image
            src={`${BADGE_BASE_URL}/jbcl_value_team_manager.svg`}
            alt="Value Team Manager"
            width={badgeSize}
            height={badgeSize}
            className="cursor-pointer"
            onClick={handleVTMBadgeClick}
          />,
          "Value Team Manager",
        );
      case "is_vt":
        return renderTooltipWrapper(
          flag.flag,
          <Image
            src={`${BADGE_BASE_URL}/jbcl_value_team.svg`}
            alt="Value Team Member"
            width={badgeSize}
            height={badgeSize}
            className="cursor-pointer"
            onClick={handleVTBadgeClick}
          />,
          "Value Team Member",
        );
      case "is_partner":
        return renderTooltipWrapper(
          flag.flag,
          <Image
            src={`${BADGE_BASE_URL}/jbcl_partner.svg`}
            alt="Partner"
            width={badgeSize}
            height={badgeSize}
            className="cursor-pointer"
            onClick={handlePartnerBadgeClick}
          />,
          "Partner",
        );
      case "is_contributor":
        return renderTooltipWrapper(
          flag.flag,
          <Image
            src={`${BADGE_BASE_URL}/jbcl_contributor.svg`}
            alt="Contributor"
            width={badgeSize}
            height={badgeSize}
            className="cursor-pointer"
            onClick={handleContributorBadgeClick}
          />,
          "Contributor",
        );
      case "is_developer":
        return renderTooltipWrapper(
          flag.flag,
          <Image
            src={`${BADGE_BASE_URL}/jbcl_developer.svg`}
            alt="Developer"
            width={badgeSize}
            height={badgeSize}
            className="cursor-pointer"
            onClick={handleDeveloperBadgeClick}
          />,
          "Developer",
        );
      case "is_designer":
        return renderTooltipWrapper(
          flag.flag,
          <Image
            src={`${BADGE_BASE_URL}/jbcl_designer.svg`}
            alt="Designer"
            width={badgeSize}
            height={badgeSize}
            className="cursor-pointer"
            onClick={handleDesignerBadgeClick}
          />,
          "Graphic Designer",
        );
      case "is_badimo":
        return renderTooltipWrapper(
          flag.flag,
          <Image
            src="https://assets.jailbreakchangelogs.xyz/assets/images/badimo_transparent.png"
            alt="Badimo"
            width={badimoSize}
            height={badimoSize}
            className="cursor-pointer"
            onClick={handleBadimoBadgeClick}
          />,
          "Badimo Developer",
        );
      case "is_early_adopter":
        return renderTooltipWrapper(
          flag.flag,
          <Image
            src={`${BADGE_BASE_URL}/jbcl_early_adopter.svg`}
            alt="Early Adopter"
            width={badgeSize}
            height={badgeSize}
            className="cursor-pointer"
            onClick={handleEarlyAdopterBadgeClick}
          />,
          "Early Adopter",
        );
      default:
        return null;
    }
  };

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

  sortedFlags.forEach((flag) => {
    const badge = createBadge(flag);
    if (badge) badges.push(badge);
  });

  if (premiumType && premiumType >= 1 && premiumType <= 3) {
    const premiumIcons: Record<number, string> = {
      1: `${BADGE_BASE_URL}/jbcl_supporter_1.svg`,
      2: `${BADGE_BASE_URL}/jbcl_supporter_2.svg`,
      3: `${BADGE_BASE_URL}/jbcl_supporter_3.svg`,
    };
    const premiumBadge = (
      <Image
        src={premiumIcons[premiumType]}
        alt={`Supporter Type ${premiumType}`}
        width={badgeSize}
        height={badgeSize}
        className="cursor-pointer"
        onClick={handlePremiumBadgeClick}
      />
    );
    badges.push(
      renderTooltipWrapper(
        "premium",
        premiumBadge,
        `Supporter Type ${premiumType}`,
      ),
    );
  }

  if (
    usernumber <= 100 &&
    !sortedFlags.some((f) => f.flag === "is_early_adopter")
  ) {
    const earlyBadge = (
      <Image
        src={`${BADGE_BASE_URL}/jbcl_early_adopter.svg`}
        alt="Early Adopter"
        width={badgeSize}
        height={badgeSize}
        className="cursor-pointer"
        onClick={handleEarlyAdopterBadgeClick}
      />
    );
    badges.push(renderTooltipWrapper("early", earlyBadge, "Early Adopter"));
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
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${customBgClass || "bg-tertiary-bg/40"} border-border-primary text-primary-text hover:bg-quaternary-bg/30 flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 shadow-2xl backdrop-blur-xl transition-colors ${containerHeight}`}
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
      </div>
    );
    guildBadge = renderTooltipWrapper(
      "guild",
      guildBadgeContent,
      `Guild: ${primary_guild.tag}`,
    );
  }

  if (badges.length === 0 && !guildBadge) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-stretch gap-2 ${className}`}
    >
      {badges.length > 0 &&
        (noContainer ? (
          <div className="flex items-center gap-1">{badges}</div>
        ) : (
          <div
            onClick={(e) => e.stopPropagation()}
            className={`${customBgClass || "bg-tertiary-bg/40"} border-border-primary inline-flex items-center gap-2 rounded-lg border px-2.5 shadow-2xl backdrop-blur-xl ${containerHeight}`}
          >
            {badges}
          </div>
        ))}
      {guildBadge}
    </div>
  );
};
