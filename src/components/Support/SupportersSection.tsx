"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TrophyIcon } from "@heroicons/react/24/solid";
import UserAvatar from "@/components/Users/UserAvatarClient";
import { Supporter } from "@/utils/api";

interface SupportersSectionProps {
  supporters: Supporter[];
}

export default function SupportersSection({
  supporters,
}: SupportersSectionProps) {
  const [sortedSupporters, setSortedSupporters] = useState<Supporter[]>([]);

  useEffect(() => {
    // Filter out excluded users
    const excludedIds = [
      "1019539798383398946",
      "659865209741246514",
      "1327206739665489930",
    ];
    const filteredSupporters = supporters.filter(
      (supporter) => !excludedIds.includes(supporter.id),
    );

    // Sort by tier in descending order (3, 2, 1) then by username for consistency
    const sorted = [...filteredSupporters].sort((a, b) => {
      // First sort by premiumtype (tier) in descending order
      if (b.premiumtype !== a.premiumtype) {
        return b.premiumtype - a.premiumtype;
      }
      // Then sort by username alphabetically for consistency
      return a.username.localeCompare(b.username);
    });
    setSortedSupporters(sorted);
  }, [supporters]);

  if (sortedSupporters.length === 0) {
    return null;
  }

  return (
    <div className="mt-16">
      <h2 className="text-primary-text mb-8 text-center text-3xl font-bold">
        Made possible by{" "}
        <span className="text-button-info underline">supporters</span>
      </h2>
      <div className="p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sortedSupporters.map((supporter) => (
            <div key={supporter.id} className="group">
              <div className="flex flex-col items-center space-y-3 rounded-lg p-4 transition-all duration-200">
                <UserAvatar
                  userId={supporter.id}
                  avatarHash={supporter.avatar || null}
                  username={supporter.username}
                  size={48}
                  showBadge={false}
                  premiumType={supporter.premiumtype}
                  settings={{ avatar_discord: 1 }}
                />
                <div className="min-w-0 flex-1 text-center">
                  <Link href={`/users/${supporter.id}`} prefetch={false}>
                    <h3 className="text-link hover:text-link-hover truncate text-sm font-semibold transition-colors">
                      {supporter.global_name && supporter.global_name !== "None"
                        ? supporter.global_name
                        : supporter.username}
                    </h3>
                  </Link>
                  <p className="text-tertiary-text truncate text-xs">
                    @{supporter.username}
                  </p>
                  {supporter.premiumtype > 0 && (
                    <div className="mt-2">
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
          ))}
        </div>
      </div>
    </div>
  );
}
