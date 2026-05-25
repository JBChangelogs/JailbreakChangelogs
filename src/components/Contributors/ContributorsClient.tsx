"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserWithFlags } from "@/utils/api/api";
import UserAvatar from "@/components/Users/UserAvatarClient";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserBadges } from "@/components/Profile/UserBadges";
import type { UserFlag } from "@/types/auth";

interface ContributorsClientProps {
  usersWithFlags: UserWithFlags[];
}

export default function ContributorsClient({
  usersWithFlags,
}: ContributorsClientProps) {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredUsers = usersWithFlags.filter((user) => {
    if (user.id === "1327206739665489930") return false;
    if (user.id === "1436084098564096042") return false;
    return !user.flags.some(
      (flag) => flag.flag === "is_badimo" && flag.enabled,
    );
  });

  const flagToTitle = (flag: string): string =>
    flag
      .replace(/^is_/, "")
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  // Build buckets dynamically from whatever flags come back
  const buckets = new Map<string, UserWithFlags[]>();
  filteredUsers.forEach((user) => {
    user.flags
      .filter((f) => f.enabled)
      .forEach((f) => {
        if (!buckets.has(f.flag)) buckets.set(f.flag, []);
        buckets.get(f.flag)!.push(user);
      });
  });

  // Derive filter tabs from data, sorted by flag index
  const flagMeta = new Map<string, number>();
  filteredUsers.forEach((user) => {
    user.flags
      .filter((f) => f.enabled)
      .forEach((f) => {
        if (!flagMeta.has(f.flag)) flagMeta.set(f.flag, f.index);
      });
  });

  const filters = [
    { key: "All", label: "All" },
    ...[...flagMeta.entries()]
      .sort(([, a], [, b]) => a - b)
      .map(([flag]) => ({ key: flag, label: flagToTitle(flag) })),
  ];

  const sortByHierarchy = (users: UserWithFlags[]): UserWithFlags[] =>
    [...users].sort((a, b) => {
      const minIndex = (u: UserWithFlags) =>
        u.flags
          .filter((f) => f.enabled)
          .reduce((min, f) => Math.min(min, f.index), Infinity);
      return minIndex(a) - minIndex(b);
    });

  const allTeam = sortByHierarchy(filteredUsers);

  const staticContributors = [
    {
      key: "tradingcore",
      name: "Trading Core",
      username: "Trading Core",
      avatar:
        "https://assets.jailbreakchangelogs.com/assets/contributors/TradingCore_Bg_Big.webp",
      flags: [
        {
          flag: "is_contributor",
          enabled: true,
          description: "This user contributed to Jailbreak Changelogs",
        },
      ],
      link: "https://discord.com/invite/jailbreaktrading",
      external: true,
    },
  ];

  const getFilteredUsers = () => {
    if (activeFilter === "All") {
      return {
        usersToShow: allTeam,
        staticContributorsToShow: staticContributors,
      };
    }
    return {
      usersToShow: sortByHierarchy(buckets.get(activeFilter) ?? []),
      staticContributorsToShow:
        activeFilter === "is_contributor" ? staticContributors : [],
    };
  };

  const renderUser = (user: UserWithFlags) => {
    const avatarContainerShapeClass =
      user.premiumtype === 3 ? "rounded-sm" : "rounded-full";

    return (
      <div
        key={user.id}
        className="border-border-card bg-secondary-bg group hover:bg-tertiary-bg flex transform cursor-pointer flex-col items-center rounded-xl border p-8 transition-colors duration-300"
      >
        <Link
          href={`/users/${user.id}`}
          prefetch={false}
          className="flex flex-col items-center"
        >
          <div
            className={`border-border-card relative shrink-0 overflow-hidden border ${avatarContainerShapeClass}`}
            style={{
              width: 128,
              height: 128,
              minWidth: 128,
              minHeight: 128,
            }}
          >
            <UserAvatar
              userId={user.id}
              avatarHash={user.avatar || null}
              username={user.username}
              size={32}
              showBadge={false}
              className="border-0"
              custom_avatar={user.custom_avatar}
              settings={user.settings_v2}
              premiumType={user.premiumtype}
            />
          </div>
          <h1 className="text-primary-text group-hover:text-link mt-4 text-2xl font-semibold capitalize transition-colors duration-300">
            {user.global_name && user.global_name !== "None"
              ? user.global_name
              : user.username}
          </h1>
          <div className="mt-2">
            <UserBadges
              flags={user.flags as UserFlag[]}
              usernumber={user.usernumber}
              size="md"
              noContainer
            />
          </div>
        </Link>
      </div>
    );
  };

  const renderStaticContributor = (contrib: (typeof staticContributors)[0]) => (
    <div
      key={contrib.key}
      className="border-border-card bg-secondary-bg group hover:bg-tertiary-bg flex transform cursor-pointer flex-col items-center rounded-xl border p-8 transition-colors duration-300"
    >
      <a
        href={contrib.link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center"
      >
        <div
          className="border-border-card relative shrink-0 overflow-hidden rounded-full border"
          style={{
            width: 128,
            height: 128,
            minWidth: 128,
            minHeight: 128,
          }}
        >
          <Image
            src={contrib.avatar}
            alt={contrib.name}
            width={192}
            height={192}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        </div>
        <h1 className="text-primary-text group-hover:text-link mt-4 text-2xl font-semibold capitalize transition-colors duration-300">
          {contrib.name}
        </h1>
        <p className="text-secondary-text mt-2 capitalize opacity-80 transition-colors duration-300">
          <UserBadges
            flags={contrib.flags as UserFlag[]}
            usernumber={NaN}
            size="md"
            noContainer
          />
        </p>
      </a>
    </div>
  );

  const { usersToShow, staticContributorsToShow } = getFilteredUsers();

  return (
    <div className="bg-primary-bg">
      <div className="container mx-auto px-6 py-10">
        <h1 className="text-primary-text text-center text-2xl font-semibold lg:text-3xl">
          Meet the <span className="text-contributers-team">team</span>
        </h1>

        <p className="text-secondary-text mx-auto my-6 max-w-2xl text-center">
          Our dedicated team of developers, designers, and contributors who make
          Jailbreak Changelogs possible.
        </p>

        {/* Filter Buttons */}
        <div className="mb-8 flex items-center justify-center">
          <div className="scrollbar-hide w-full overflow-x-auto">
            <Tabs
              className="w-full"
              value={activeFilter}
              onValueChange={(value) => setActiveFilter(value)}
            >
              <TabsList fullWidth>
                {filters.map((filter) => (
                  <TabsTrigger key={filter.key} value={filter.key} fullWidth>
                    {filter.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Team Grid */}
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 xl:mt-16 xl:grid-cols-3">
          {usersToShow.map((user) => renderUser(user))}
          {staticContributorsToShow.map((contrib) =>
            renderStaticContributor(contrib),
          )}
        </div>
      </div>
    </div>
  );
}
