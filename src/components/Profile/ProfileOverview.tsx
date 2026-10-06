"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useQueryState } from "nuqs";
import AboutTab from "./AboutTab";
import CommentsTab from "./CommentsTab";
import FavoritesTab from "./FavoritesTab";
import TradeAdsProfileTab from "./TradeAdsProfileTab";
import ProfileInventoryTab from "./ProfileInventoryTab";
import PrivateServersTab from "./PrivateServersTab";
import UserValueSuggestionsTab from "./UserValueSuggestionsTab";
import UserBansTab from "./UserBansTab";
import type { UserSettingsV2, UserFlag } from "@/types/auth";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { formatProfileDate } from "@/utils/helpers/timestamp";

interface User {
  id: string;
  username: string;
  avatar: string;
  global_name: string;
  usernumber: number;
  accent_color: string;
  custom_avatar?: string;
  banner?: string;
  custom_banner?: string;
  settings_v2?: UserSettingsV2;
  presence?: {
    status: "Online" | "Offline";
    last_updated: number;
  };
  premiumtype?: number;
  is_following?: boolean;
  followers_count?: number;
  following_count?: number;
  created_at?: string;
  last_seen?: number | null;
  bio?: string;
  bio_last_updated?: number;
  roblox_id?: string | null;
  roblox_username?: string;
  roblox_display_name?: string;
  roblox_avatar?: string;
  roblox_join_date?: number;
  flags?: UserFlag[];
}

interface ProfileOverviewProps {
  user: User | null;
  currentUserId: string | null;
  isSiteOwner?: boolean;
  bio: string | null;
  bioLastUpdated: number | null;
  onBioUpdate?: (newBio: string) => void;
}

export default function ProfileOverview({
  user,
  currentUserId,
  isSiteOwner = false,
  bio,
  bioLastUpdated,
  onBioUpdate,
}: ProfileOverviewProps) {
  const [sectionParam, setSectionParam] = useQueryState("tab", {
    defaultValue: "",
    history: "push",
    shallow: true,
  });
  const overviewRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  if (!user) return null;

  const isOwnProfile = currentUserId === user.id;
  const hasRobloxConnection = Boolean(user.roblox_id);
  const hasVTFlag = user.flags?.some(
    (flag) =>
      (flag.flag === "is_vt" || flag.flag === "is_vtm") &&
      flag.enabled !== false,
  );
  const hasValueSuggestions = !hasVTFlag || isOwnProfile || isSiteOwner;
  const canViewBans = isOwnProfile || isSiteOwner;
  const sections = [
    { id: "", label: "Overview", icon: "heroicons:squares-2x2" },
    { id: "favorites", label: "Favorites", icon: "heroicons:heart" },
    {
      id: "comments",
      label: "Comments",
      icon: "heroicons:chat-bubble-left-right",
    },
    ...(hasRobloxConnection
      ? [
          {
            id: "trade-ads",
            label: "Trade ads",
            icon: "heroicons:arrows-right-left",
          },
          {
            id: "inventory",
            label: "Inventory",
            icon: "heroicons:archive-box",
          },
        ]
      : []),
    { id: "servers", label: "Private servers", icon: "heroicons:server" },
    ...(hasValueSuggestions
      ? [
          {
            id: "suggestions",
            label: "Item suggestions",
            icon: "heroicons:light-bulb",
          },
        ]
      : []),
    ...(canViewBans
      ? [{ id: "bans", label: "Bans", icon: "heroicons:shield-check" }]
      : []),
  ];
  const requestedSection =
    sectionParam === "roblox" ? "trade-ads" : sectionParam;
  const section =
    sections.find((entry) => entry.id === requestedSection) ?? sections[0];
  const isOverview = section.id === "";
  const openSection = async (id: string) => {
    setMenuOpen(false);
    await setSectionParam(id || null);
    overviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      ref={overviewRef}
      className="mx-3 grid min-w-0 scroll-mt-[calc(var(--header-height)+5rem)] gap-3 sm:mx-0 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6"
    >
      <aside
        className="order-1 min-w-0 lg:sticky lg:top-[calc(var(--header-height)+5rem)] lg:order-none lg:col-start-2 lg:row-start-1 lg:max-h-[calc(100dvh-var(--header-height)-6rem)] lg:space-y-5 lg:self-start lg:overflow-y-auto"
        aria-label="Profile details and navigation"
      >
        <nav
          className="border-border-card bg-secondary-bg scroll-mt-[calc(var(--header-height)+5rem)] rounded-2xl border p-4"
          aria-label="Explore profile"
          id="profile-navigation"
        >
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="profile-section-links"
            onClick={() => setMenuOpen((open) => !open)}
            className="focus-visible:ring-link flex min-h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 text-left focus-visible:ring-2 focus-visible:outline-none lg:hidden"
          >
            <span className="min-w-0">
              <span className="text-primary-text/70 block text-[11px] font-semibold tracking-wider uppercase">
                Explore profile
              </span>
              <span className="text-primary-text block text-sm font-semibold">
                {section.label}
              </span>
            </span>
            <Icon
              icon="heroicons:chevron-down"
              className={`text-secondary-text size-4 shrink-0 transition-transform ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>
          <h2 className="text-primary-text/70 mb-3 hidden h-4 items-center px-3 text-[11px] font-semibold tracking-wider uppercase lg:flex">
            Explore profile
          </h2>
          <div
            id="profile-section-links"
            className={`${menuOpen ? "mt-3 grid" : "hidden"} grid-cols-2 gap-0.5 lg:mt-0 lg:grid lg:grid-cols-1`}
          >
            {sections.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => openSection(entry.id)}
                aria-current={section.id === entry.id ? "page" : undefined}
                className={`focus-visible:ring-link flex min-h-10 min-w-0 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none ${section.id === entry.id ? "bg-button-info/10 text-primary-text" : "text-primary-text/85 hover:bg-quaternary-bg hover:text-primary-text"}`}
              >
                <Icon
                  icon={entry.icon}
                  className={`size-5 shrink-0 ${section.id === entry.id ? "text-primary-text" : "text-secondary-text"}`}
                />
                <span className="min-w-0 flex-1">{entry.label}</span>
              </button>
            ))}
          </div>
        </nav>
        <div className="border-border-card bg-secondary-bg hidden rounded-2xl border p-5 lg:block">
          <h2 className="text-primary-text/70 mb-4 flex h-4 items-center text-[11px] font-semibold tracking-wider uppercase">
            Profile details
          </h2>
          <dl className="space-y-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-secondary-text">Member number</dt>
              <dd className="text-primary-text font-medium">
                #{user.usernumber.toLocaleString()}
              </dd>
            </div>
            {user.created_at && (
              <div className="flex items-start justify-between gap-3">
                <dt className="text-secondary-text shrink-0">Member since</dt>
                <dd className="text-primary-text text-right">
                  {formatProfileDate(user.created_at)}
                </dd>
              </div>
            )}
            {hasRobloxConnection && user.roblox_username && (
              <div>
                <dt className="text-secondary-text mb-2">Roblox account</dt>
                <dd>
                  <a
                    href={`https://www.roblox.com/users/${user.roblox_id}/profile`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border-card bg-tertiary-bg hover:border-link focus-visible:ring-border-focus flex items-center gap-3 rounded-lg border p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {user.roblox_avatar && (
                      <Image
                        src={user.roblox_avatar}
                        alt={user.roblox_username}
                        width={48}
                        height={48}
                        className={`bg-quaternary-bg shrink-0 ${user.premiumtype === 3 ? "rounded-[25%]" : "rounded-full"}`}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-primary-text truncate font-semibold">
                        {user.roblox_display_name || user.roblox_username}
                      </p>
                      <p className="text-secondary-text truncate text-xs">
                        @{user.roblox_username}
                      </p>
                    </div>
                    <Icon
                      icon="akar-icons:link-out"
                      className="text-link size-4 shrink-0"
                    />
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </aside>

      <div className="order-2 min-w-0 space-y-3 sm:space-y-5 lg:order-none lg:col-start-1 lg:row-start-1 lg:space-y-6">
        {!isOverview && (
          <div className="flex flex-wrap items-center justify-end gap-3">
            {section.id === "inventory" ? (
              <h2 className="text-primary-text mr-auto text-xl font-semibold">
                Inventory
              </h2>
            ) : null}
            <Button variant="ghost" size="sm" onClick={() => openSection("")}>
              <Icon icon="heroicons:arrow-left" /> Back to overview
            </Button>
          </div>
        )}
        {isOverview && (
          <AboutTab
            user={user}
            currentUserId={currentUserId}
            bio={bio}
            bioLastUpdated={bioLastUpdated}
            onBioUpdate={onBioUpdate}
          />
        )}
        {(isOverview || section.id === "favorites") && (
          <FavoritesTab
            key={isOverview ? "favorites-preview" : "favorites-full"}
            userId={user.id}
            currentUserId={currentUserId}
            settings={user.settings_v2}
            preview={isOverview}
            onViewAll={() => openSection("favorites")}
          />
        )}
        {hasRobloxConnection && (isOverview || section.id === "trade-ads") && (
          <TradeAdsProfileTab
            key={isOverview ? "trades-preview" : "trades-full"}
            user={user}
            isOwnProfile={isOwnProfile}
            currentUserId={currentUserId}
            preview={isOverview}
            onViewAll={() => openSection("trade-ads")}
          />
        )}
        {(isOverview || section.id === "comments") && (
          <CommentsTab
            key={isOverview ? "comments-preview" : "comments-full"}
            userId={user.id}
            currentUserId={currentUserId}
            settings={user.settings_v2}
            preview={isOverview}
            onViewAll={() => openSection("comments")}
          />
        )}
        {section.id === "servers" && (
          <PrivateServersTab userId={user.id} isOwnProfile={isOwnProfile} />
        )}
        {section.id === "suggestions" && (
          <UserValueSuggestionsTab
            userId={user.id}
            currentUserId={currentUserId}
          />
        )}
        {section.id === "bans" && <UserBansTab userId={user.id} />}
        {hasRobloxConnection && (
          <div hidden={section.id !== "inventory"}>
            <ProfileInventoryTab
              robloxId={user.roblox_id ?? ""}
              active={section.id === "inventory"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
