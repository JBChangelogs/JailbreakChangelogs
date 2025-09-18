import Link from "next/link";
import { TrophyIcon } from "@heroicons/react/24/solid";
import UserAvatar from "@/components/Users/UserAvatarClient";
import { Supporter } from "@/utils/api";

interface SupportersSectionProps {
  supporters: Supporter[];
}

export default function SupportersSection({
  supporters,
}: SupportersSectionProps) {
  // Filter out excluded users
  const excludedIds = [
    "1019539798383398946",
    "659865209741246514",
    "1327206739665489930",
  ];
  const filteredSupporters = supporters.filter(
    (supporter) => !excludedIds.includes(supporter.id),
  );

  const shuffledSupporters = [...filteredSupporters];
  for (let i = shuffledSupporters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledSupporters[i], shuffledSupporters[j]] = [
      shuffledSupporters[j],
      shuffledSupporters[i],
    ];
  }

  if (filteredSupporters.length === 0) {
    return null;
  }

  return (
    <div className="mt-16">
      <h2 className="mb-8 text-center text-3xl font-bold text-white">
        Made possible by{" "}
        <span className="text-blue-300 underline">supporters</span>
      </h2>
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
        <div className="grid grid-cols-1 justify-center gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
          {shuffledSupporters.map((supporter) => (
            <div key={supporter.id} className="group">
              <div className="rounded-lg p-4 transition-all duration-200 hover:bg-[#2E3944]">
                <div className="flex flex-col items-center space-y-3 [@media(min-width:375px)]:flex-row [@media(min-width:375px)]:items-center [@media(min-width:375px)]:space-y-0 [@media(min-width:375px)]:space-x-3">
                  <UserAvatar
                    userId={supporter.id}
                    avatarHash={supporter.avatar || null}
                    username={supporter.username}
                    size={40}
                    showBadge={false}
                    showBorder={false}
                    premiumType={supporter.premiumtype}
                    settings={{ avatar_discord: 1 }}
                  />
                  <div className="min-w-0 flex-1 text-center [@media(min-width:375px)]:text-left">
                    <Link href={`/users/${supporter.id}`}>
                      <h3 className="truncate text-sm font-semibold text-blue-300 transition-colors hover:text-blue-200 md:text-base">
                        {supporter.global_name &&
                        supporter.global_name !== "None"
                          ? supporter.global_name
                          : supporter.username}
                      </h3>
                    </Link>
                    <p className="truncate text-xs text-gray-400">
                      @{supporter.username}
                    </p>
                    {supporter.premiumtype > 0 && (
                      <div className="mt-1">
                        <div
                          className={`inline-flex items-center justify-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                            supporter.premiumtype === 1
                              ? "bg-gradient-to-r from-[#CD7F32] to-[#B87333] text-black" // Bronze
                              : supporter.premiumtype === 2
                                ? "bg-gradient-to-r from-[#C0C0C0] to-[#A9A9A9] text-black" // Silver
                                : "bg-gradient-to-r from-[#FFD700] to-[#DAA520] text-black" // Gold
                          }`}
                        >
                          <TrophyIcon className="h-3 w-3" />
                          {supporter.premiumtype === 1
                            ? "Supporter 1"
                            : supporter.premiumtype === 2
                              ? "Supporter 2"
                              : "Supporter 3"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
