"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserWithFlags } from "@/utils/api";
import UserAvatar from "@/components/Users/UserAvatarClient";

interface ContributorsClientProps {
  usersWithFlags: UserWithFlags[];
}

export default function ContributorsClient({
  usersWithFlags,
}: ContributorsClientProps) {
  const [activeFilter, setActiveFilter] = useState("All");

  // Filter out excluded users
  const filteredUsers = usersWithFlags.filter(
    (user) => user.id !== "1327206739665489930",
  );

  const getUserRole = (user: UserWithFlags): string => {
    const enabledFlags = user.flags.filter((flag) => flag.enabled);
    const highestPriorityFlag = enabledFlags.reduce((highest, current) =>
      current.index < highest.index ? current : highest,
    );
    const flagToRole: Record<string, string> = {
      is_owner: "Owner",
      is_developer: "Developer",
      is_partner: "Partner",
      is_vtm: "Value List Manager",
      is_vt: "Value Team",
      is_contributor: "Value List Contributor",
      is_tester: "Tester",
    };

    return flagToRole[highestPriorityFlag.flag] || "Member";
  };

  const userRoleMap = new Map<string, { user: UserWithFlags; role: string }>();

  filteredUsers.forEach((user) => {
    const role = getUserRole(user);
    userRoleMap.set(user.id, { user, role });
  });

  const owners = Array.from(userRoleMap.values())
    .filter(({ role }) => role === "Owner")
    .map(({ user }) => ({ ...user, role: "Owner" }));

  const developers = Array.from(userRoleMap.values())
    .filter(({ role }) => role === "Developer")
    .map(({ user }) => ({ ...user, role: "Developer" }));

  const partners = Array.from(userRoleMap.values())
    .filter(({ role }) => role === "Partner")
    .map(({ user }) => ({ ...user, role: "Partner" }));

  const managers = Array.from(userRoleMap.values())
    .filter(({ role }) => role === "Value List Manager")
    .map(({ user }) => ({ ...user, role: "Value List Manager" }));

  const valueTeam = Array.from(userRoleMap.values())
    .filter(({ role }) => role === "Value Team")
    .map(({ user }) => ({ ...user, role: "Value Team" }));

  const testers = Array.from(userRoleMap.values())
    .filter(({ role }) => role === "Tester")
    .map(({ user }) => ({ ...user, role: "Tester" }));

  const contributors = Array.from(userRoleMap.values())
    .filter(({ role }) => role === "Value List Contributor")
    .map(({ user }) => ({ ...user, role: "Value List Contributor" }));

  const staticContributors = [
    {
      key: "tradingcore",
      name: "Trading Core",
      role: "Value List Contributor",
      username: "Trading Core",
      avatar: "/api/assets/contributors/TradingCore_Bg_Big.webp",
      link: "https://discord.com/invite/jailbreaktrading",
      external: true,
    },
    {
      key: "eiesia",
      name: "EIesia",
      role: "Value List Contributor",
      username: "EIesia",
      avatar: "/api/assets/contributors/EIesia.webp",
      link: "https://www.roblox.com/users/582234297/profile",
      external: true,
    },
  ];

  const allTeam = [
    ...owners,
    ...developers,
    ...partners,
    ...managers,
    ...valueTeam,
    ...testers,
    ...contributors,
  ];

  const filters = [
    { key: "All", label: "All" },
    { key: "Owner", label: "Owner" },
    { key: "Developer", label: "Developer" },
    { key: "Partner", label: "Partner" },
    { key: "Value List Manager", label: "Value List Manager" },
    { key: "Value Team", label: "Value Team" },
    { key: "Tester", label: "Tester" },
    { key: "Value List Contributor", label: "Value List Contributor" },
  ];

  const getFilteredUsers = () => {
    let usersToShow: (UserWithFlags & { role: string })[] = [];
    let staticContributorsToShow: typeof staticContributors = [];

    switch (activeFilter) {
      case "All":
        usersToShow = allTeam;
        staticContributorsToShow = staticContributors;
        break;
      case "Owner":
        usersToShow = owners;
        break;
      case "Developer":
        usersToShow = developers;
        break;
      case "Partner":
        usersToShow = partners;
        break;
      case "Value List Manager":
        usersToShow = managers;
        break;
      case "Value Team":
        usersToShow = valueTeam;
        break;
      case "Tester":
        usersToShow = testers;
        break;
      case "Value List Contributor":
        usersToShow = contributors;
        staticContributorsToShow = staticContributors;
        break;
      default:
        usersToShow = allTeam;
        staticContributorsToShow = staticContributors;
    }

    return { usersToShow, staticContributorsToShow };
  };

  const renderUser = (user: UserWithFlags, role: string) => (
    <div
      key={user.id}
      className="group hover:bg-button-info flex transform cursor-pointer flex-col items-center rounded-xl p-8 transition-colors duration-300"
    >
      <Link href={`/users/${user.id}`} className="flex flex-col items-center">
        <div
          className="relative flex-shrink-0 overflow-hidden rounded-full"
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
            custom_avatar={user.custom_avatar}
            settings={user.settings}
            premiumType={user.premiumtype}
          />
        </div>
        <h1 className="text-primary-text group-hover:text-form-button-text mt-4 text-2xl font-semibold capitalize transition-colors duration-300">
          {user.global_name && user.global_name !== "None"
            ? user.global_name
            : user.username}
        </h1>
        <p className="text-secondary-text group-hover:text-form-button-text mt-2 capitalize opacity-80 transition-colors duration-300">
          {role}
        </p>
      </Link>
    </div>
  );

  const renderStaticContributor = (contrib: (typeof staticContributors)[0]) => (
    <div
      key={contrib.key}
      className="group hover:bg-button-info flex transform cursor-pointer flex-col items-center rounded-xl p-8 transition-colors duration-300"
    >
      <a
        href={contrib.link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center"
      >
        <div
          className="relative flex-shrink-0 overflow-hidden rounded-full"
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
        <h1 className="text-primary-text group-hover:text-form-button-text mt-4 text-2xl font-semibold capitalize transition-colors duration-300">
          {contrib.name}
        </h1>
        <p className="text-secondary-text group-hover:text-form-button-text mt-2 capitalize opacity-80 transition-colors duration-300">
          {contrib.role}
        </p>
      </a>
    </div>
  );

  const { usersToShow, staticContributorsToShow } = getFilteredUsers();

  return (
    <div className="bg-primary-bg">
      <div className="container mx-auto px-6 py-10">
        <h1 className="text-primary-text text-center text-2xl font-semibold capitalize lg:text-3xl">
          Meet the <span className="text-button-info">team</span>
        </h1>

        <p className="text-secondary-text mx-auto my-6 max-w-2xl text-center">
          Our dedicated team of developers, designers, and contributors who make
          Jailbreak Changelogs possible.
        </p>

        {/* Filter Buttons */}
        <div className="mb-8 flex items-center justify-center">
          <div className="border-button-info bg-secondary-bg scrollbar-hide flex items-center overflow-x-auto rounded-xl border p-1">
            <div className="flex min-w-max items-center">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`flex-shrink-0 rounded-xl px-3 py-2 text-xs font-medium whitespace-nowrap capitalize transition-colors duration-300 md:px-6 md:py-3 md:text-sm ${
                    activeFilter === filter.key
                      ? "bg-button-info text-form-button-text"
                      : "text-secondary-text hover:text-primary-text hover:bg-quaternary-bg"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Team Grid */}
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 xl:mt-16 xl:grid-cols-3">
          {usersToShow.map((user) => renderUser(user, user.role))}
          {staticContributorsToShow.map((contrib) =>
            renderStaticContributor(contrib),
          )}
        </div>
      </div>
    </div>
  );
}
