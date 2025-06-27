import { Tooltip } from '@mui/material';
import { SparklesIcon, BugAntIcon, TrophyIcon, ChartBarIcon, UserGroupIcon } from '@heroicons/react/24/solid';
import { FaCrown, FaHandsHelping } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import type { UserFlag } from '@/types/auth';

interface UserBadgesProps {
  usernumber: number;
  premiumType?: number;
  flags?: UserFlag[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserBadges = ({ usernumber, premiumType, flags = [], size = 'md', className = '' }: UserBadgesProps) => {
  const badges = [];

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-4 h-4', icon: 'w-3 h-3' },
    md: { container: 'w-5 h-5', icon: 'w-3.5 h-3.5' },
    lg: { container: 'w-6 h-6', icon: 'w-4 h-4' }
  };

  const currentSize = sizeConfig[size];

  // Sort flags by index (1 as first badge)
  const sortedFlags = flags
    .filter(f => f.enabled === true)
    .sort((a, b) => a.index - b.index);

  const handleOwnerBadgeClick = () => {
    const ownerFlag = sortedFlags.find(f => f.flag === 'is_owner');
    toast(() => (
      <div className="flex items-center gap-2">
        <span>👑</span>
        <span>{ownerFlag?.description || "This user created Jailbreak Changelogs!"}</span>
      </div>
    ), {
      style: {
        background: 'linear-gradient(to right, #8B5CF6, #4F46E5)',
        color: 'white',
      },
    });
  };

  const handleEarlyAdopterBadgeClick = () => {
    toast(() => (
      <div className="flex items-center gap-2">
        <SparklesIcon className="w-12 h-12 text-black" />
        <span>This badge is awarded to the first 100 people to sign up to Jailbreak Changelogs!</span>
      </div>
    ), {
      duration: 4000,
      style: {
        background: 'linear-gradient(to right, #FBBF24, #EAB308)',
        color: 'black',
      },
    });
  };

  const handleTesterBadgeClick = () => {
    const testerFlag = sortedFlags.find(f => f.flag === 'is_tester');
    toast(() => (
      <div className="flex items-center gap-2">
        <BugAntIcon className="w-5 h-5 text-purple-100" />
        <span>{testerFlag?.description || "This user is a trusted tester of Jailbreak Changelogs!"}</span>
      </div>
    ), {
      duration: 4000,
      style: {
        background: 'linear-gradient(to right, #8B5CF6, #6D28D9)',
        color: 'white',
      },
    });
  };

  const handleVTMBadgeClick = () => {
    const vtmFlag = sortedFlags.find(f => f.flag === 'is_vtm');
    toast(() => (
      <div className="flex items-center gap-2">
        <ChartBarIcon className="w-5 h-5 text-emerald-100" />
        <span>{vtmFlag?.description || "This user is a Trading Core Value Team Manager!"}</span>
      </div>
    ), {
      duration: 4000,
      style: {
        background: 'linear-gradient(to right, #059669, #047857)',
        color: 'white',
      },
    });
  };

  const handleVTBadgeClick = () => {
    const vtFlag = sortedFlags.find(f => f.flag === 'is_vt');
    toast(() => (
      <div className="flex items-center gap-2">
        <UserGroupIcon className="w-5 h-5 text-blue-100" />
        <span>{vtFlag?.description || "This user is a member of the Trading Core Value Team!"}</span>
      </div>
    ), {
      duration: 4000,
      style: {
        background: 'linear-gradient(to right, #3B82F6, #2563EB)',
        color: 'white',
      },
    });
  };

  const handlePartnerBadgeClick = () => {
    const partnerFlag = sortedFlags.find(f => f.flag === 'is_partner');
    toast(() => (
      <div className="flex items-center gap-2">
        <FaHandsHelping className="w-10 h-10 text-orange-100" />
        <span>{partnerFlag?.description || "This user is a partner of Jailbreak Changelogs!"}</span>
      </div>
    ), {
      duration: 4000,
      style: {
        background: 'linear-gradient(to right, #F97316, #EA580C)',
        color: 'white',
      },
    });
  };

  const handlePremiumBadgeClick = () => {
    const premiumMessages = {
      1: "This user has Supporter Type 1!",
      2: "This user has Supporter Type 2!",
      3: "This user has Supporter Type 3!"
    };

    const premiumToastStyles = {
      1: 'linear-gradient(to right, #CD7F32, #B87333)', // Bronze
      2: 'linear-gradient(to right, #C0C0C0, #A9A9A9)', // Silver
      3: 'linear-gradient(to right, #FFD700, #DAA520)'  // Gold
    };

    const premiumTextColors = {
      1: 'white',   // Bronze - white text
      2: 'black',   // Silver - black text
      3: 'black'    // Gold - black text
    };

    toast(() => (
      <div className="flex items-center gap-2">
        <TrophyIcon className="w-5 h-5 text-black" />
        <span>{premiumMessages[premiumType as keyof typeof premiumMessages]}</span>
      </div>
    ), {
      duration: 4000,
      style: {
        background: premiumToastStyles[premiumType as keyof typeof premiumToastStyles],
        color: premiumTextColors[premiumType as keyof typeof premiumTextColors],
      },
    });
  };

  // Helper function to create badge elements
  const createBadge = (flag: UserFlag) => {
    switch (flag.flag) {
      case 'is_owner':
        return (
          <Tooltip key={`flag-${flag.flag}`} title="Website Owner">
            <div 
              className={`inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white cursor-pointer hover:opacity-90 ${currentSize.container}`}
              onClick={handleOwnerBadgeClick}
            >
              <FaCrown className={currentSize.icon} />
            </div>
          </Tooltip>
        );
      case 'is_tester':
        return (
          <Tooltip key={`flag-${flag.flag}`} title="Trusted Tester">
            <div 
              className={`inline-flex items-center justify-center rounded-full bg-purple-400 text-white cursor-pointer hover:opacity-90 ${currentSize.container}`}
              onClick={handleTesterBadgeClick}
            >
              <BugAntIcon className={currentSize.icon} />
            </div>
          </Tooltip>
        );
      case 'is_vtm':
        return (
          <Tooltip key={`flag-${flag.flag}`} title="Value Team Manager">
            <div 
              className={`inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white cursor-pointer hover:opacity-90 ${currentSize.container}`}
              onClick={handleVTMBadgeClick}
            >
              <ChartBarIcon className={currentSize.icon} />
            </div>
          </Tooltip>
        );
      case 'is_vt':
        return (
          <Tooltip key={`flag-${flag.flag}`} title="Value Team Member">
            <div 
              className={`inline-flex items-center justify-center rounded-full bg-blue-500 text-white cursor-pointer hover:opacity-90 ${currentSize.container}`}
              onClick={handleVTBadgeClick}
            >
              <UserGroupIcon className={currentSize.icon} />
            </div>
          </Tooltip>
        );
      case 'is_partner':
        return (
          <Tooltip key={`flag-${flag.flag}`} title="Partner">
            <div 
              className={`inline-flex items-center justify-center rounded-full bg-orange-500 text-white cursor-pointer hover:opacity-90 ${currentSize.container}`}
              onClick={handlePartnerBadgeClick}
            >
              <FaHandsHelping className={currentSize.icon} />
            </div>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  // Add flags badges first (sorted by index)
  sortedFlags.forEach(flag => {
    const badge = createBadge(flag);
    if (badge) {
      badges.push(badge);
    }
  });

  // Add supporter badge after flags
  if (premiumType) {
    const premiumStyles = {
      1: "bg-gradient-to-r from-[#CD7F32] to-[#B87333]", // Bronze
      2: "bg-gradient-to-r from-[#C0C0C0] to-[#A9A9A9]", // Silver
      3: "bg-gradient-to-r from-[#FFD700] to-[#DAA520]"  // Gold
    };

    badges.push(
      <Tooltip key="premium" title={`Supporter Type ${premiumType}`}>
        <div 
          className={`inline-flex items-center justify-center rounded-full ${premiumStyles[premiumType as keyof typeof premiumStyles]} text-black cursor-pointer hover:opacity-90 ${currentSize.container}`}
          onClick={handlePremiumBadgeClick}
        >
          <TrophyIcon className={currentSize.icon} />
        </div>
      </Tooltip>
    );
  }

  // Add first 100 users badge last
  if (usernumber <= 100) {
    badges.push(
      <Tooltip key="first-100" title="Early Adopter">
        <div 
          className={`inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black cursor-pointer hover:opacity-90 ${currentSize.container}`}
          onClick={handleEarlyAdopterBadgeClick}
        >
          <SparklesIcon className={currentSize.icon} />
        </div>
      </Tooltip>
    );
  }

  if (badges.length === 0) return null;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {badges}
    </div>
  );
}; 