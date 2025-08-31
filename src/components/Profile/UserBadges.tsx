import { Tooltip } from "@mui/material";
import {
  SparklesIcon,
  BugAntIcon,
  TrophyIcon,
  ChartBarIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import { FaCrown, FaHandsHelping } from "react-icons/fa";
import { FaWrench } from "react-icons/fa6";
import { CgCodeSlash } from "react-icons/cg";
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
        },
      }
    );
  };

  const handleEarlyAdopterBadgeClick = () => {
    toast(
      () => (
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-12 h-12 text-black" />
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
        },
      }
    );
  };

  const handleTesterBadgeClick = () => {
    const testerFlag = sortedFlags.find((f) => f.flag === "is_tester");
    toast(
      () => (
        <div className="flex items-center gap-2">
          <BugAntIcon className="w-5 h-5 text-black" />
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
        },
      }
    );
  };

  const handleVTMBadgeClick = () => {
    const vtmFlag = sortedFlags.find((f) => f.flag === "is_vtm");
    toast(
      () => (
        <div className="flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-emerald-100" />
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
        },
      }
    );
  };

  const handleVTBadgeClick = () => {
    const vtFlag = sortedFlags.find((f) => f.flag === "is_vt");
    toast(
      () => (
        <div className="flex items-center gap-2">
          <UserGroupIcon className="w-5 h-5 text-blue-100" />
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
        },
      }
    );
  };

  const handlePartnerBadgeClick = () => {
    const partnerFlag = sortedFlags.find((f) => f.flag === "is_partner");
    toast(
      () => (
        <div className="flex items-center gap-2">
          <FaHandsHelping className="w-10 h-10 text-orange-100" />
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
        },
      }
    );
  };

  const handleContributorBadgeClick = () => {
    const contributorFlag = sortedFlags.find(
      (f) => f.flag === "is_contributor"
    );
    toast(
      () => (
        <div className="flex items-center gap-2">
          <FaWrench className="w-5 h-5 text-teal-100" />
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
        },
      }
    );
  };

  const handleDeveloperBadgeClick = () => {
    const developerFlag = sortedFlags.find(
      (f) => f.flag === "is_developer"
    );
    toast(
      () => (
        <div className="flex items-center gap-2">
          <CgCodeSlash className="w-5 h-5 text-black" />
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
        },
      }
    );
  };

  const handlePremiumBadgeClick = () => {
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
          <TrophyIcon className="w-5 h-5 text-black" />
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
        },
      }
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
                  backgroundColor: "#0F1419",
                  color: "#D3D9D4",
                  fontSize: "0.75rem",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #2E3944",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  "& .MuiTooltip-arrow": {
                    color: "#0F1419",
                  },
                },
              },
            }}
          >
            <div
              className={`inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white cursor-help hover:opacity-90 ${currentSize.container}`}
              onClick={handleOwnerBadgeClick}
            >
              <FaCrown className={currentSize.icon} />
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
                  backgroundColor: "#0F1419",
                  color: "#D3D9D4",
                  fontSize: "0.75rem",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #2E3944",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  "& .MuiTooltip-arrow": {
                    color: "#0F1419",
                  },
                },
              },
            }}
          >
            <div
              className={`inline-flex items-center justify-center rounded-full bg-purple-400 text-black cursor-help hover:opacity-90 ${currentSize.container}`}
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
                  backgroundColor: "#0F1419",
                  color: "#D3D9D4",
                  fontSize: "0.75rem",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #2E3944",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  "& .MuiTooltip-arrow": {
                    color: "#0F1419",
                  },
                },
              },
            }}
          >
            <div
              className={`inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white cursor-help hover:opacity-90 ${currentSize.container}`}
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
                  backgroundColor: "#0F1419",
                  color: "#D3D9D4",
                  fontSize: "0.75rem",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #2E3944",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  "& .MuiTooltip-arrow": {
                    color: "#0F1419",
                  },
                },
              },
            }}
          >
            <div
              className={`inline-flex items-center justify-center rounded-full bg-blue-500 text-white cursor-help hover:opacity-90 ${currentSize.container}`}
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
                  backgroundColor: "#0F1419",
                  color: "#D3D9D4",
                  fontSize: "0.75rem",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #2E3944",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  "& .MuiTooltip-arrow": {
                    color: "#0F1419",
                  },
                },
              },
            }}
          >
            <div
              className={`inline-flex items-center justify-center rounded-full bg-orange-500 text-white cursor-help hover:opacity-90 ${currentSize.container}`}
              onClick={handlePartnerBadgeClick}
            >
              <FaHandsHelping className={currentSize.icon} />
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
                  backgroundColor: "#0F1419",
                  color: "#D3D9D4",
                  fontSize: "0.75rem",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #2E3944",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  "& .MuiTooltip-arrow": {
                    color: "#0F1419",
                  },
                },
              },
            }}
          >
            <div
              className={`inline-flex items-center justify-center rounded-full bg-gradient-to-r from-teal-600 to-teal-700 text-white cursor-help hover:opacity-90 ${currentSize.container}`}
              onClick={handleContributorBadgeClick}
            >
              <FaWrench className={currentSize.icon} />
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
                  backgroundColor: "#0F1419",
                  color: "#D3D9D4",
                  fontSize: "0.75rem",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #2E3944",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  "& .MuiTooltip-arrow": {
                    color: "#0F1419",
                  },
                },
              },
            }}
          >
            <div
              className={`inline-flex items-center justify-center rounded-full bg-gradient-to-r from-lime-500 to-lime-600 text-black cursor-help hover:opacity-90 ${currentSize.container}`}
              onClick={handleDeveloperBadgeClick}
            >
              <CgCodeSlash className={currentSize.icon} />
            </div>
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

  if (premiumType) {
    const premiumStyles = {
      1: "bg-gradient-to-r from-[#CD7F32] to-[#B87333]", // Bronze
      2: "bg-gradient-to-r from-[#C0C0C0] to-[#A9A9A9]", // Silver
      3: "bg-gradient-to-r from-[#FFD700] to-[#DAA520]", // Gold
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
              backgroundColor: "#0F1419",
              color: "#D3D9D4",
              fontSize: "0.75rem",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #2E3944",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              "& .MuiTooltip-arrow": {
                color: "#0F1419",
              },
            },
          },
        }}
      >
        <div
          className={`inline-flex items-center justify-center rounded-full ${
            premiumStyles[premiumType as keyof typeof premiumStyles]
          } text-black cursor-help hover:opacity-90 ${currentSize.container}`}
          onClick={handlePremiumBadgeClick}
        >
          <TrophyIcon className={currentSize.icon} />
        </div>
      </Tooltip>
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
              backgroundColor: "#0F1419",
              color: "#D3D9D4",
              fontSize: "0.75rem",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #2E3944",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              "& .MuiTooltip-arrow": {
                color: "#0F1419",
              },
            },
          },
        }}
      >
        <div
          className={`inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black cursor-help hover:opacity-90 ${currentSize.container}`}
          onClick={handleEarlyAdopterBadgeClick}
        >
          <SparklesIcon className={currentSize.icon} />
        </div>
      </Tooltip>
    );
  }

  if (primary_guild && primary_guild.tag && primary_guild.badge && primary_guild.identity_guild_id) {
    const badgeUrl = `https://cdn.discordapp.com/guild-tag-badges/${primary_guild.identity_guild_id}/${primary_guild.badge}`;
    const isJBCLGuildId =
      primary_guild.identity_guild_id === "1286064050135896064";
    const badgeContent = (
      <div
        className="inline-flex items-center gap-1 rounded-md bg-gray-700 text-white px-2.5 py-1 cursor-help"
        style={{ minWidth: 0 }}
      >
        <Image
          src={badgeUrl}
          alt={`${primary_guild.tag} guild badge`}
          className="w-4 h-4 object-contain block"
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
              backgroundColor: "#0F1419",
              color: "#D3D9D4",
              fontSize: "0.75rem",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #2E3944",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              "& .MuiTooltip-arrow": {
                color: "#0F1419",
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
      </Tooltip>
    );
  }

  if (badges.length === 0) return null;

  return <div className={`flex items-center gap-1 ${className}`}>{badges}</div>;
};
