"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { TrophyIcon } from "@heroicons/react/24/solid";
import { useVirtualizer } from "@tanstack/react-virtual";
import UserAvatar from "@/components/Users/UserAvatarClient";
import { Supporter } from "@/utils/api";

interface SupportersSectionProps {
  supporters: Supporter[];
}

export default function SupportersSection({
  supporters,
}: SupportersSectionProps) {
  const [sortedSupporters, setSortedSupporters] = useState<Supporter[]>([]);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const excludedIds = [
      "1019539798383398946",
      "659865209741246514",
      "1327206739665489930",
      "1361726772374147112",
    ];
    const filteredSupporters = supporters.filter(
      (supporter) => !excludedIds.includes(supporter.id),
    );

    const sorted = [...filteredSupporters].sort((a, b) => {
      if (b.premiumtype !== a.premiumtype) {
        return b.premiumtype - a.premiumtype;
      }
      return parseInt(b.created_at) - parseInt(a.created_at);
    });
    setSortedSupporters(sorted);
  }, [supporters]);

  const getSupportersPerRow = () => {
    if (typeof window === "undefined") return 5;
    const width = window.innerWidth;
    if (width < 640) return 1;
    if (width < 768) return 2;
    if (width < 1024) return 3;
    if (width < 1280) return 4;
    return 5;
  };

  const supportersPerRow = getSupportersPerRow();

  const rows: Supporter[][] = [];
  for (let i = 0; i < sortedSupporters.length; i += supportersPerRow) {
    rows.push(sortedSupporters.slice(i, i + supportersPerRow));
  }

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 320,
    overscan: 3,
  });
  useEffect(() => {
    const handleResize = () => {
      virtualizer.measure();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [virtualizer]);

  if (sortedSupporters.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h2 className="text-primary-text mb-8 text-center text-3xl font-bold">
        Made possible by{" "}
        <span className="text-button-info underline">supporters</span>
      </h2>
      <div className="p-8">
        <div
          ref={parentRef}
          className="h-[800px] overflow-auto"
          style={{
            contain: "strict",
          }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div
                    className={`grid gap-6 ${getGridColsClass(supportersPerRow)}`}
                  >
                    {row.map((supporter) => (
                      <div key={supporter.id} className="group">
                        <div className="flex flex-col items-center space-y-6 rounded-lg p-6 transition-all duration-200">
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
                            <Link
                              href={`/users/${supporter.id}`}
                              prefetch={false}
                            >
                              <h3 className="text-primary-text hover:text-link truncate text-sm font-semibold transition-colors">
                                {supporter.global_name &&
                                supporter.global_name !== "None"
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
                                  className={`inline-flex items-center justify-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${
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
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGridColsClass(supportersPerRow: number): string {
  switch (supportersPerRow) {
    case 1:
      return "grid-cols-1";
    case 2:
      return "grid-cols-2";
    case 3:
      return "grid-cols-3";
    case 4:
      return "grid-cols-4";
    case 5:
      return "grid-cols-5";
    default:
      return "grid-cols-5";
  }
}
