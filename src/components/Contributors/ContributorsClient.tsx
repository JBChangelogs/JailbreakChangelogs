"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Tabs, Tab, Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { UserWithFlags } from "@/utils/api";
import UserAvatar from "@/components/Users/UserAvatarClient";

interface ContributorsClientProps {
  usersWithFlags: UserWithFlags[];
}

const StyledTabs = styled(Tabs)(() => ({
  borderBottom: "1px solid #2E3944",
  marginBottom: "2rem",
  "& .MuiTabs-flexContainer": {
    justifyContent: "center",
  },
  "& .MuiTabs-indicator": {
    backgroundColor: "#5865F2",
  },
  "& .MuiTabs-scrollButtons": {
    color: "#FFFFFF",
    "&.Mui-disabled": {
      opacity: 0.3,
    },
  },
}));

const StyledTab = styled(Tab)(() => ({
  textTransform: "none",
  color: "#FFFFFF",
  fontSize: "0.875rem",
  fontWeight: 500,
  "&.Mui-selected": {
    color: "#D3D9D4",
  },
}));

const TabPanel = ({
  children,
  value,
  index,
}: {
  children: React.ReactNode;
  value: number;
  index: number;
}) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`contributors-tabpanel-${index}`}
    aria-labelledby={`contributors-tab-${index}`}
  >
    {value === index && children}
  </div>
);

export default function ContributorsClient({
  usersWithFlags,
}: ContributorsClientProps) {
  const [value, setValue] = useState(0);

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
      avatar:
        "https://assets.jailbreakchangelogs.xyz/assets/contributors/TradingCore_Bg_Big.webp",
      link: "https://discord.com/invite/jailbreaktrading",
      external: true,
    },
    {
      key: "eiesia",
      name: "EIesia",
      role: "Value List Contributor",
      username: "EIesia",
      avatar:
        "https://assets.jailbreakchangelogs.xyz/assets/contributors/EIesia.webp",
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

  const renderUser = (user: UserWithFlags, role: string) => (
    <div key={user.id} className="mb-8 flex flex-col items-center text-center">
      <Link href={`/users/${user.id}`}>
        <UserAvatar
          userId={user.id}
          avatarHash={user.avatar || null}
          username={user.username}
          size={32}
          showBadge={false}
          accent_color={user.accent_color}
          custom_avatar={user.custom_avatar}
          settings={user.settings}
          premiumType={user.premiumtype}
        />
      </Link>
      <div className="mt-4">
        <Link
          href={`/users/${user.id}`}
          className="text-lg font-bold text-blue-300 hover:text-blue-200"
        >
          {user.global_name && user.global_name !== "None"
            ? user.global_name
            : user.username}
        </Link>
        <div className="mt-1 text-sm text-gray-300">{role}</div>
      </div>
    </div>
  );

  const renderStaticContributor = (contrib: (typeof staticContributors)[0]) => (
    <div
      key={contrib.key}
      className="mb-8 flex flex-col items-center text-center"
    >
      <a href={contrib.link} target="_blank" rel="noopener noreferrer">
        <div
          className="relative flex-shrink-0 overflow-hidden rounded-full border-4 border-[#124e66] bg-[#2E3944]"
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
      </a>
      <div className="mt-4">
        <a
          href={contrib.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-bold text-blue-300 hover:text-blue-200"
        >
          {contrib.name}
        </a>
        <div className="mt-1 text-sm text-gray-300">{contrib.role}</div>
      </div>
    </div>
  );

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const getTabContent = (tabIndex: number) => {
    let usersToShow: (UserWithFlags & { role: string })[] = [];
    let staticContributorsToShow: typeof staticContributors = [];

    switch (tabIndex) {
      case 0: // All
        usersToShow = allTeam;
        staticContributorsToShow = staticContributors;
        break;
      case 1: // Owner
        usersToShow = owners;
        break;
      case 2: // Developer
        usersToShow = developers;
        break;
      case 3: // Partner
        usersToShow = partners;
        break;
      case 4: // Value List Manager
        usersToShow = managers;
        break;
      case 5: // Value Team
        usersToShow = valueTeam;
        break;
      case 6: // Tester
        usersToShow = testers;
        break;
      case 7: // Value List Contributor
        usersToShow = contributors;
        staticContributorsToShow = staticContributors;
        break;
      default:
        usersToShow = allTeam;
        staticContributorsToShow = staticContributors;
    }

    return (
      <div className="grid grid-cols-2 justify-center gap-x-4 gap-y-12 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {usersToShow.map((user) => renderUser(user, user.role))}
        {staticContributorsToShow.map((contrib) =>
          renderStaticContributor(contrib),
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="mb-12 text-center text-4xl font-bold text-white">
        Meet the <span className="text-blue-300 underline">team</span>
      </h1>

      <Box sx={{ width: "100%" }}>
        <StyledTabs
          value={value}
          onChange={handleChange}
          aria-label="contributors tabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <StyledTab label="All" />
          <StyledTab label="Owner" />
          <StyledTab label="Developer" />
          <StyledTab label="Partner" />
          <StyledTab label="Value List Manager" />
          <StyledTab label="Value Team" />
          <StyledTab label="Tester" />
          <StyledTab label="Value List Contributor" />
        </StyledTabs>

        <TabPanel value={value} index={0}>
          {getTabContent(0)}
        </TabPanel>
        <TabPanel value={value} index={1}>
          {getTabContent(1)}
        </TabPanel>
        <TabPanel value={value} index={2}>
          {getTabContent(2)}
        </TabPanel>
        <TabPanel value={value} index={3}>
          {getTabContent(3)}
        </TabPanel>
        <TabPanel value={value} index={4}>
          {getTabContent(4)}
        </TabPanel>
        <TabPanel value={value} index={5}>
          {getTabContent(5)}
        </TabPanel>
        <TabPanel value={value} index={6}>
          {getTabContent(6)}
        </TabPanel>
        <TabPanel value={value} index={7}>
          {getTabContent(7)}
        </TabPanel>
      </Box>
    </div>
  );
}
