import { Tooltip } from "@mui/material";
import { toast } from "sonner";
import type { UserFlag } from "@/types/auth";
import Image from "next/image";

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
}

export const UserBadges = ({
  usernumber,
  premiumType,
  flags = [],
  size = "md",
  className = "",
  primary_guild,
}: UserBadgesProps) => {
  const badges = [];

  // Size configurations for badge images
  const badgeSize = { sm: 16, md: 20, lg: 24 }[size];
  const badimoSize = { sm: 24, md: 36, lg: 40 }[size];
  const BADGE_BASE_URL =
    "https://assets.jailbreakchangelogs.xyz/assets/website_icons";

  // Sort flags by index (1 as first badge)
  // Treat flags as enabled if enabled field is missing or explicitly true
  const sortedFlags = flags
    .filter((f) => f.enabled !== false)
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  const handleOwnerBadgeClick = () => {
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
            className="object-contain"
          />
        ),
      },
    );
  };

  const handleEarlyAdopterBadgeClick = () => {
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
            className="object-contain"
          />
        ),
      },
    );
  };

  const handleTesterBadgeClick = () => {
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

  const handleVTMBadgeClick = () => {
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

  const handleVTBadgeClick = () => {
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

  const handlePartnerBadgeClick = () => {
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

  const handleContributorBadgeClick = () => {
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

  const handleDeveloperBadgeClick = () => {
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

  const handleDesignerBadgeClick = () => {
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

  const handleBadimoBadgeClick = () => {
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

  const handlePremiumBadgeClick = () => {
    // Only handle clicks for valid premium types 1-3
    if (!premiumType || premiumType < 1 || premiumType > 3) {
      return;
    }

    const premiumMessages = {
      1: "This user has Supporter Type 1!",
      2: "This user has Supporter Type 2!",
      3: "This user has Supporter Type 3!",
    };

    const premiumIcons = {
      1: `${BADGE_BASE_URL}/jbcl_supporter_1.svg`,
      2: `${BADGE_BASE_URL}/jbcl_supporter_2.svg`,
      3: `${BADGE_BASE_URL}/jbcl_supporter_3.svg`,
    };

    toast.success(
      premiumMessages[premiumType as keyof typeof premiumMessages],
      {
        duration: 4000,
        icon: (
          <Image
            src={premiumIcons[premiumType as keyof typeof premiumIcons]}
            alt={`Supporter Type ${premiumType}`}
            width={20}
            height={20}
            className="object-contain"
          />
        ),
      },
    );
  };

  // Helper function to create badge elements
  const createBadge = (flag: UserFlag) => {
    switch (flag.flag) {
      case "is_owner":
        return (
          <Tooltip
            key={`flag-${flag.flag}`}
            title="Website Owner"
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  "& .MuiTooltip-arrow": {
                    color: "var(--color-secondary-bg)",
                  },
                },
              },
            }}
          >
            <Image
              src={`${BADGE_BASE_URL}/jbcl_owner.svg`}
              alt="Owner"
              width={badgeSize}
              height={badgeSize}
              className="cursor-pointer object-contain hover:opacity-90"
              onClick={handleOwnerBadgeClick}
            />
          </Tooltip>
        );
      case "is_tester":
        return (
          <Tooltip
            key={`flag-${flag.flag}`}
            title="Trusted Tester"
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  "& .MuiTooltip-arrow": {
                    color: "var(--color-secondary-bg)",
                  },
                },
              },
            }}
          >
            <Image
              src={`${BADGE_BASE_URL}/jbcl_tester.svg`}
              alt="Tester"
              width={badgeSize}
              height={badgeSize}
              className="cursor-pointer object-contain hover:opacity-90"
              onClick={handleTesterBadgeClick}
            />
          </Tooltip>
        );
      case "is_vtm":
        return (
          <Tooltip
            key={`flag-${flag.flag}`}
            title="Value Team Manager"
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  "& .MuiTooltip-arrow": {
                    color: "var(--color-secondary-bg)",
                  },
                },
              },
            }}
          >
            <Image
              src={`${BADGE_BASE_URL}/jbcl_value_team_manager.svg`}
              alt="Value Team Manager"
              width={badgeSize}
              height={badgeSize}
              className="cursor-pointer object-contain hover:opacity-90"
              onClick={handleVTMBadgeClick}
            />
          </Tooltip>
        );
      case "is_vt":
        return (
          <Tooltip
            key={`flag-${flag.flag}`}
            title="Value Team Member"
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  "& .MuiTooltip-arrow": {
                    color: "var(--color-secondary-bg)",
                  },
                },
              },
            }}
          >
            <Image
              src={`${BADGE_BASE_URL}/jbcl_value_team.svg`}
              alt="Value Team Member"
              width={badgeSize}
              height={badgeSize}
              className="cursor-pointer object-contain hover:opacity-90"
              onClick={handleVTBadgeClick}
            />
          </Tooltip>
        );
      case "is_partner":
        return (
          <Tooltip
            key={`flag-${flag.flag}`}
            title="Partner"
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  "& .MuiTooltip-arrow": {
                    color: "var(--color-secondary-bg)",
                  },
                },
              },
            }}
          >
            <Image
              src={`${BADGE_BASE_URL}/jbcl_partner.svg`}
              alt="Partner"
              width={badgeSize}
              height={badgeSize}
              className="cursor-pointer object-contain hover:opacity-90"
              onClick={handlePartnerBadgeClick}
            />
          </Tooltip>
        );
      case "is_contributor":
        return (
          <Tooltip
            key={`flag-${flag.flag}`}
            title="Contributor"
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  "& .MuiTooltip-arrow": {
                    color: "var(--color-secondary-bg)",
                  },
                },
              },
            }}
          >
            <Image
              src={`${BADGE_BASE_URL}/jbcl_contributor.svg`}
              alt="Contributor"
              width={badgeSize}
              height={badgeSize}
              className="cursor-pointer object-contain hover:opacity-90"
              onClick={handleContributorBadgeClick}
            />
          </Tooltip>
        );
      case "is_developer":
        return (
          <Tooltip
            key={`flag-${flag.flag}`}
            title="Developer"
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  "& .MuiTooltip-arrow": {
                    color: "var(--color-secondary-bg)",
                  },
                },
              },
            }}
          >
            <Image
              src={`${BADGE_BASE_URL}/jbcl_developer.svg`}
              alt="Developer"
              width={badgeSize}
              height={badgeSize}
              className="cursor-pointer object-contain hover:opacity-90"
              onClick={handleDeveloperBadgeClick}
            />
          </Tooltip>
        );
      case "is_designer":
        return (
          <Tooltip
            key={`flag-${flag.flag}`}
            title="Graphic Designer"
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  "& .MuiTooltip-arrow": {
                    color: "var(--color-secondary-bg)",
                  },
                },
              },
            }}
          >
            <Image
              src={`${BADGE_BASE_URL}/jbcl_designer.svg`}
              alt="Designer"
              width={badgeSize}
              height={badgeSize}
              className="cursor-pointer object-contain hover:opacity-90"
              onClick={handleDesignerBadgeClick}
            />
          </Tooltip>
        );
      case "is_badimo":
        return (
          <Tooltip
            key={`flag-${flag.flag}`}
            title="Badimo Developer"
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  "& .MuiTooltip-arrow": {
                    color: "var(--color-secondary-bg)",
                  },
                },
              },
            }}
          >
            <Image
              src="https://assets.jailbreakchangelogs.xyz/assets/images/badimo_transparent.png"
              alt="Badimo"
              width={badimoSize}
              height={badimoSize}
              className="cursor-pointer object-contain hover:opacity-90"
              onClick={handleBadimoBadgeClick}
            />
          </Tooltip>
        );
      default:
        return null;
    }
  };

  sortedFlags.forEach((flag) => {
    const badge = createBadge(flag);
    if (badge) {
      badges.push(badge);
    }
  });

  // Only show premium badges for types 1, 2, and 3
  if (premiumType && premiumType >= 1 && premiumType <= 3) {
    const premiumIcons = {
      1: `${BADGE_BASE_URL}/jbcl_supporter_1.svg`,
      2: `${BADGE_BASE_URL}/jbcl_supporter_2.svg`,
      3: `${BADGE_BASE_URL}/jbcl_supporter_3.svg`,
    };

    badges.push(
      <Tooltip
        key="premium"
        title={`Supporter Type ${premiumType}`}
        placement="top"
        arrow
        slotProps={{
          tooltip: {
            sx: {
              backgroundColor: "var(--color-secondary-bg)",
              color: "var(--color-primary-text)",
              "& .MuiTooltip-arrow": {
                color: "var(--color-secondary-bg)",
              },
            },
          },
        }}
      >
        <Image
          src={premiumIcons[premiumType as keyof typeof premiumIcons]}
          alt={`Supporter Type ${premiumType}`}
          width={badgeSize}
          height={badgeSize}
          className="cursor-pointer object-contain hover:opacity-90"
          onClick={handlePremiumBadgeClick}
        />
      </Tooltip>,
    );
  }

  if (usernumber <= 100) {
    badges.push(
      <Tooltip
        key="first-100"
        title="Early Adopter"
        placement="top"
        arrow
        slotProps={{
          tooltip: {
            sx: {
              backgroundColor: "var(--color-secondary-bg)",
              color: "var(--color-primary-text)",
              "& .MuiTooltip-arrow": {
                color: "var(--color-secondary-bg)",
              },
            },
          },
        }}
      >
        <Image
          src={`${BADGE_BASE_URL}/jbcl_early_adopter.svg`}
          alt="Early Adopter"
          width={badgeSize}
          height={badgeSize}
          className="cursor-pointer object-contain hover:opacity-90"
          onClick={handleEarlyAdopterBadgeClick}
        />
      </Tooltip>,
    );
  }

  if (
    primary_guild &&
    primary_guild.tag &&
    primary_guild.badge &&
    primary_guild.identity_guild_id
  ) {
    const badgeUrl = `https://cdn.discordapp.com/guild-tag-badges/${primary_guild.identity_guild_id}/${primary_guild.badge}`;
    const isJBCLGuildId =
      primary_guild.identity_guild_id === "1286064050135896064";
    const badgeContent = (
      <div
        className="border-border-primary bg-primary-bg text-primary-text inline-flex cursor-help items-center gap-1 rounded-md border px-2.5 py-1"
        style={{ minWidth: 0 }}
      >
        <Image
          src={badgeUrl}
          alt={`${primary_guild.tag} guild badge`}
          className="block h-4 w-4 object-contain"
          width={16}
          height={16}
        />
        <span className="text-sm font-semibold" style={{ lineHeight: 1.1 }}>
          {primary_guild.tag}
        </span>
      </div>
    );
    badges.push(
      <Tooltip
        key="primary-guild"
        title={`Guild: ${primary_guild.tag}`}
        placement="top"
        arrow
        slotProps={{
          tooltip: {
            sx: {
              backgroundColor: "var(--color-secondary-bg)",
              color: "var(--color-primary-text)",
              "& .MuiTooltip-arrow": {
                color: "var(--color-secondary-bg)",
              },
            },
          },
        }}
      >
        {isJBCLGuildId ? (
          <a
            href="https://discord.jailbreakchangelogs.xyz/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {badgeContent}
          </a>
        ) : (
          badgeContent
        )}
      </Tooltip>,
    );
  }

  if (badges.length === 0) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 ${className}`}
      style={{
        borderColor: "rgba(107, 114, 128, 0.3)",
        backgroundColor: "rgba(31, 41, 55, 0.3)",
      }}
    >
      {badges}
    </div>
  );
};
