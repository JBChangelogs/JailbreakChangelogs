"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserWithFlags } from "@/utils/api/api";
import UserAvatar from "@/components/Users/UserAvatarClient";

interface ContributorsClientProps {
  usersWithFlags: UserWithFlags[];
}

export default function ContributorsClient({
  usersWithFlags,
}: ContributorsClientProps) {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredUsers = usersWithFlags.filter(
    (user) => user.id !== "1327206739665489930",
  );

  const getUserRoles = (user: UserWithFlags): string[] => {
    const enabledFlags = user.flags.filter((flag) => flag.enabled);
    const flagToRole: Record<string, string> = {
      is_owner: "Owner",
      is_developer: "Developer",
      is_designer: "Graphic Designer",
      is_partner: "Partner",
      is_vtm: "Value List Manager",
      is_vt: "Value Team",
      is_contributor: "Contributor",
      is_tester: "Tester",
      is_badimo: "Badimo",
    };

    const sortedFlags = enabledFlags.sort((a, b) => a.index - b.index);
    return sortedFlags.map((flag) => flagToRole[flag.flag]).filter(Boolean);
  };

  const getUserPrimaryRole = (user: UserWithFlags): string => {
    const enabledFlags = user.flags.filter((flag) => flag.enabled);
    const highestPriorityFlag = enabledFlags.reduce((highest, current) =>
      current.index < highest.index ? current : highest,
    );
    const flagToRole: Record<string, string> = {
      is_owner: "Owner",
      is_developer: "Developer",
      is_designer: "Graphic Designer",
      is_partner: "Partner",
      is_vtm: "Value List Manager",
      is_vt: "Value Team",
      is_contributor: "Contributor",
      is_tester: "Tester",
      is_badimo: "Badimo",
    };

    return flagToRole[highestPriorityFlag.flag] || "Member";
  };

  const owners: (UserWithFlags & { role: string })[] = [];
  const developers: (UserWithFlags & { role: string })[] = [];
  const designers: (UserWithFlags & { role: string })[] = [];
  const partners: (UserWithFlags & { role: string })[] = [];
  const managers: (UserWithFlags & { role: string })[] = [];
  const valueTeam: (UserWithFlags & { role: string })[] = [];
  const testers: (UserWithFlags & { role: string })[] = [];
  const contributors: (UserWithFlags & { role: string })[] = [];
  const badimo: (UserWithFlags & { role: string })[] = [];

  filteredUsers.forEach((user) => {
    const roles = getUserRoles(user);

    roles.forEach((role) => {
      const userWithRole = { ...user, role };

      switch (role) {
        case "Owner":
          owners.push(userWithRole);
          break;
        case "Developer":
          developers.push(userWithRole);
          break;
        case "Graphic Designer":
          designers.push(userWithRole);
          break;
        case "Partner":
          partners.push(userWithRole);
          break;
        case "Value List Manager":
          managers.push(userWithRole);
          break;
        case "Value Team":
          valueTeam.push(userWithRole);
          break;
        case "Tester":
          testers.push(userWithRole);
          break;
        case "Contributor":
          contributors.push(userWithRole);
          break;
        case "Badimo":
          badimo.push(userWithRole);
          break;
      }
    });
  });

  const staticContributors = [
    {
      key: "tradingcore",
      name: "Trading Core",
      role: "Contributor",
      username: "Trading Core",
      avatar:
        "https://assets.jailbreakchangelogs.xyz/assets/contributors/TradingCore_Bg_Big.webp",
      link: "https://discord.com/invite/jailbreaktrading",
      external: true,
    },
    {
      key: "eiesia",
      name: "EIesia",
      role: "Contributor",
      username: "EIesia",
      avatar:
        "https://assets.jailbreakchangelogs.xyz/assets/contributors/EIesia.webp",
      link: "https://www.roblox.com/users/582234297/profile",
      external: true,
    },
  ];

  const sortByHierarchy = (users: (UserWithFlags & { role: string })[]) => {
    return users.sort((a, b) => {
      const aPrimaryFlag = a.flags
        .filter((flag) => flag.enabled)
        .reduce((highest, current) =>
          current.index < highest.index ? current : highest,
        );
      const bPrimaryFlag = b.flags
        .filter((flag) => flag.enabled)
        .reduce((highest, current) =>
          current.index < highest.index ? current : highest,
        );
      return aPrimaryFlag.index - bPrimaryFlag.index;
    });
  };

  const sortedOwners = sortByHierarchy(owners);
  const sortedDevelopers = sortByHierarchy(developers);
  const sortedDesigners = sortByHierarchy(designers);
  const sortedPartners = sortByHierarchy(partners);
  const sortedManagers = sortByHierarchy(managers);
  const sortedValueTeam = sortByHierarchy(valueTeam);
  const sortedTesters = sortByHierarchy(testers);
  const sortedContributors = sortByHierarchy(contributors);
  const sortedBadimo = sortByHierarchy(badimo);

  const allTeam = filteredUsers
    .map((user) => ({
      ...user,
      roles: getUserRoles(user),
      primaryRole: getUserPrimaryRole(user),
    }))
    .sort((a, b) => {
      const aPrimaryFlag = a.flags
        .filter((flag) => flag.enabled)
        .reduce((highest, current) =>
          current.index < highest.index ? current : highest,
        );
      const bPrimaryFlag = b.flags
        .filter((flag) => flag.enabled)
        .reduce((highest, current) =>
          current.index < highest.index ? current : highest,
        );
      return aPrimaryFlag.index - bPrimaryFlag.index;
    });

  const filters = [
    { key: "All", label: "All" },
    { key: "Owner", label: "Owner" },
    { key: "Developer", label: "Developer" },
    { key: "Partner", label: "Partner" },
    { key: "Badimo", label: "Badimo" },
    { key: "Tester", label: "Tester" },
    { key: "Graphic Designer", label: "Graphic Designer" },
    { key: "Contributor", label: "Contributor" },
    { key: "Value List Manager", label: "Value List Manager" },
    { key: "Value Team", label: "Value Team" },
  ];

  const getFilteredUsers = () => {
    let usersToShow: (UserWithFlags & {
      role?: string;
      roles?: string[];
      primaryRole?: string;
    })[] = [];
    let staticContributorsToShow: typeof staticContributors = [];

    switch (activeFilter) {
      case "All":
        usersToShow = allTeam;
        staticContributorsToShow = staticContributors;
        break;
      case "Owner":
        usersToShow = sortedOwners;
        break;
      case "Developer":
        usersToShow = sortedDevelopers;
        break;
      case "Graphic Designer":
        usersToShow = sortedDesigners;
        break;
      case "Partner":
        usersToShow = sortedPartners;
        break;
      case "Value List Manager":
        usersToShow = sortedManagers;
        break;
      case "Value Team":
        usersToShow = sortedValueTeam;
        break;
      case "Tester":
        usersToShow = sortedTesters;
        break;
      case "Contributor":
        usersToShow = sortedContributors;
        staticContributorsToShow = staticContributors;
        break;
      case "Badimo":
        usersToShow = sortedBadimo;
        break;
      default:
        usersToShow = allTeam;
        staticContributorsToShow = staticContributors;
    }

    return { usersToShow, staticContributorsToShow };
  };

  const renderUser = (
    user: UserWithFlags & {
      role?: string;
      roles?: string[];
      primaryRole?: string;
    },
    role?: string,
  ) => (
    <div
      key={user.id}
      className="group hover:bg-button-info flex transform cursor-pointer flex-col items-center rounded-xl p-8 transition-colors duration-300"
    >
      <Link
        href={`/users/${user.id}`}
        prefetch={false}
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
          {user.roles ? user.roles.join(", ") : role || user.role}
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
                  className={`flex-shrink-0 cursor-pointer rounded-xl px-3 py-2 text-xs font-medium whitespace-nowrap capitalize transition-colors duration-300 md:px-6 md:py-3 md:text-sm ${
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
