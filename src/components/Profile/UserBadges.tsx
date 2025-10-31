import { Tooltip } from "@mui/material";
import {
  SparklesIcon,
  BugAntIcon,
  TrophyIcon,
  ChartBarIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import { Icon } from "../UI/IconWrapper";
import { toast } from "react-hot-toast";
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

  // Size configurations
  const sizeConfig = {
    sm: { container: "w-4 h-4", icon: "w-3 h-3" },
    md: { container: "w-5 h-5", icon: "w-3.5 h-3.5" },
    lg: { container: "w-6 h-6", icon: "w-4 h-4" },
  };

  const currentSize = sizeConfig[size];
  const badimoSize = { sm: 24, md: 36, lg: 40 }[size];

  // Sort flags by index (1 as first badge)
  const sortedFlags = flags
    .filter((f) => f.enabled === true)
    .sort((a, b) => a.index - b.index);

  const handleOwnerBadgeClick = () => {
    const ownerFlag = sortedFlags.find((f) => f.flag === "is_owner");
    toast(
      () => (
        <div className="flex items-center gap-2">
          <span>👑</span>
          <span>
            {ownerFlag?.description ||
              "This user created Jailbreak Changelogs!"}
          </span>
        </div>
      ),
      {
        style: {
          background: "linear-gradient(to right, #8B5CF6, #4F46E5)",
          color: "white",
          fontWeight: "600",
        },
      },
    );
  };

  const handleEarlyAdopterBadgeClick = () => {
    toast(
      () => (
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-12 w-12 text-black" />
          <span>
            This badge is awarded to the first 100 people to sign up to
            Jailbreak Changelogs!
          </span>
        </div>
      ),
      {
        duration: 4000,
        style: {
          background: "linear-gradient(to right, #FBBF24, #EAB308)",
          color: "black",
          fontWeight: "600",
        },
      },
    );
  };

  const handleTesterBadgeClick = () => {
    const testerFlag = sortedFlags.find((f) => f.flag === "is_tester");
    toast(
      () => (
        <div className="flex items-center gap-2">
          <BugAntIcon className="h-5 w-5 text-black" />
          <span>
            {testerFlag?.description ||
              "This user is a trusted tester of Jailbreak Changelogs!"}
          </span>
        </div>
      ),
      {
        duration: 4000,
        style: {
          background: "linear-gradient(to right, #8B5CF6, #6D28D9)",
          color: "black",
          fontWeight: "600",
        },
      },
    );
  };

  const handleVTMBadgeClick = () => {
    const vtmFlag = sortedFlags.find((f) => f.flag === "is_vtm");
    toast(
      () => (
        <div className="flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-emerald-100" />
          <span>
            {vtmFlag?.description ||
              "This user is a Trading Core Value Team Manager!"}
          </span>
        </div>
      ),
      {
        duration: 4000,
        style: {
          background: "linear-gradient(to right, #059669, #047857)",
          color: "white",
          fontWeight: "600",
        },
      },
    );
  };

  const handleVTBadgeClick = () => {
    const vtFlag = sortedFlags.find((f) => f.flag === "is_vt");
    toast(
      () => (
        <div className="flex items-center gap-2">
          <UserGroupIcon className="h-5 w-5 text-blue-100" />
          <span>
            {vtFlag?.description ||
              "This user is a member of the Trading Core Value Team!"}
          </span>
        </div>
      ),
      {
        duration: 4000,
        style: {
          background: "linear-gradient(to right, #3B82F6, #2563EB)",
          color: "white",
          fontWeight: "600",
        },
      },
    );
  };

  const handlePartnerBadgeClick = () => {
    const partnerFlag = sortedFlags.find((f) => f.flag === "is_partner");
    toast(
      () => (
        <div className="flex items-center gap-2">
          <Icon
            icon="fa7-solid:hands-helping"
            className="h-10 w-10 text-orange-100"
            inline={true}
          />
          <span>
            {partnerFlag?.description ||
              "This user is a partner of Jailbreak Changelogs!"}
          </span>
        </div>
      ),
      {
        duration: 4000,
        style: {
          background: "linear-gradient(to right, #F97316, #EA580C)",
          color: "white",
          fontWeight: "600",
        },
      },
    );
  };

  const handleContributorBadgeClick = () => {
    const contributorFlag = sortedFlags.find(
      (f) => f.flag === "is_contributor",
    );
    toast(
      () => (
        <div className="flex items-center gap-2">
          <Icon
            icon="fa6-solid:screwdriver-wrench"
            className="h-5 w-5 text-teal-100"
            inline={true}
          />
          <span>
            {contributorFlag?.description ||
              "This user contributed to Jailbreak Changelogs!"}
          </span>
        </div>
      ),
      {
        duration: 4000,
        style: {
          background: "linear-gradient(to right, #0D9488, #0F766E)",
          color: "white",
          fontWeight: "600",
        },
      },
    );
  };

  const handleDeveloperBadgeClick = () => {
    const developerFlag = sortedFlags.find((f) => f.flag === "is_developer");
    toast(
      () => (
        <div className="flex items-center gap-2">
          <Icon
            icon="ri:code-s-slash-line"
            className="h-5 w-5 text-black"
            inline={true}
          />
          <span>
            {developerFlag?.description ||
              "This user is a developer for Jailbreak Changelogs!"}
          </span>
        </div>
      ),
      {
        duration: 4000,
        style: {
          background: "linear-gradient(to right, #84CC16, #65A30D)",
          color: "black",
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

    const premiumToastStyles = {
      1: "linear-gradient(to right, #CD7F32, #B87333)", // Bronze
      2: "linear-gradient(to right, #C0C0C0, #A9A9A9)", // Silver
      3: "linear-gradient(to right, #FFD700, #DAA520)", // Gold
    };

    const premiumTextColors = {
      1: "black", // Bronze - black text
      2: "black", // Silver - black text
      3: "black", // Gold - black text
    };

    toast(
      () => (
        <div className="flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-black" />
          <span>
            {premiumMessages[premiumType as keyof typeof premiumMessages]}
          </span>
        </div>
      ),
      {
        duration: 4000,
        style: {
          background:
            premiumToastStyles[premiumType as keyof typeof premiumToastStyles],
          color:
            premiumTextColors[premiumType as keyof typeof premiumTextColors],
          fontWeight: "600",
        },
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
            <div
              className={`inline-flex cursor-help items-center justify-center rounded-full text-white hover:opacity-90 ${currentSize.container}`}
              style={{ background: "var(--color-badge-owner)" }}
              onClick={handleOwnerBadgeClick}
            >
              <Icon
                icon="fa-solid:crown"
                className={currentSize.icon}
                inline={true}
              />
            </div>
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
            <div
              className={`inline-flex cursor-help items-center justify-center rounded-full text-black hover:opacity-90 ${currentSize.container}`}
              style={{ background: "var(--color-badge-tester)" }}
              onClick={handleTesterBadgeClick}
            >
              <BugAntIcon className={currentSize.icon} />
            </div>
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
            <div
              className={`text-primary-text inline-flex cursor-help items-center justify-center rounded-full hover:opacity-90 ${currentSize.container}`}
              style={{ background: "var(--color-badge-vtm)" }}
              onClick={handleVTMBadgeClick}
            >
              <ChartBarIcon className={currentSize.icon} />
            </div>
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
            <div
              className={`text-primary-text inline-flex cursor-help items-center justify-center rounded-full hover:opacity-90 ${currentSize.container}`}
              style={{ background: "var(--color-badge-vt)" }}
              onClick={handleVTBadgeClick}
            >
              <UserGroupIcon className={currentSize.icon} />
            </div>
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
            <div
              className={`text-primary-text inline-flex cursor-help items-center justify-center rounded-full hover:opacity-90 ${currentSize.container}`}
              style={{ background: "var(--color-badge-partner)" }}
              onClick={handlePartnerBadgeClick}
            >
              <Icon
                icon="fa7-solid:hands-helping"
                className={currentSize.icon}
                inline={true}
              />
            </div>
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
            <div
              className={`text-primary-text inline-flex cursor-help items-center justify-center rounded-full hover:opacity-90 ${currentSize.container}`}
              style={{ background: "var(--color-badge-contributor)" }}
              onClick={handleContributorBadgeClick}
            >
              <Icon
                icon="fa6-solid:screwdriver-wrench"
                className={currentSize.icon}
                inline={true}
              />
            </div>
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
            <div
              className={`inline-flex cursor-help items-center justify-center rounded-full text-black hover:opacity-90 ${currentSize.container}`}
              style={{ background: "var(--color-badge-developer)" }}
              onClick={handleDeveloperBadgeClick}
            >
              <Icon
                icon="ri:code-s-slash-line"
                className={currentSize.icon}
                inline={true}
              />
            </div>
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
            <a
              href="https://roblox.com/communities/3059674/Badimo"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                const badimoFlag = sortedFlags.find(
                  (f) => f.flag === "is_badimo",
                );
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
              }}
            >
              <Image
                src="https://assets.jailbreakchangelogs.xyz/assets/images/badimo_transparent.png"
                alt="Badimo"
                width={badimoSize}
                height={badimoSize}
                className="object-contain cursor-pointer hover:opacity-90"
              />
            </a>
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
    const premiumStyles = {
      1: "var(--color-badge-premium-bronze)", // Bronze
      2: "var(--color-badge-premium-silver)", // Silver
      3: "var(--color-badge-premium-gold)", // Gold
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
        <div
          className={`inline-flex cursor-help items-center justify-center rounded-full text-black hover:opacity-90 ${currentSize.container}`}
          style={{
            background:
              premiumStyles[premiumType as keyof typeof premiumStyles],
          }}
          onClick={handlePremiumBadgeClick}
        >
          <TrophyIcon className={currentSize.icon} />
        </div>
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
        <div
          className={`inline-flex cursor-help items-center justify-center rounded-full text-black hover:opacity-90 ${currentSize.container}`}
          style={{ background: "var(--color-badge-early-adopter)" }}
          onClick={handleEarlyAdopterBadgeClick}
        >
          <SparklesIcon className={currentSize.icon} />
        </div>
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
        className="bg-primary-bg border-border-primary text-primary-text inline-flex cursor-help items-center gap-1 rounded-md border px-2.5 py-1"
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

  return <div className={`flex items-center gap-1 ${className}`}>{badges}</div>;
};
