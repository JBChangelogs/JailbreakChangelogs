"use client";

import { useState, useEffect } from "react";
import React from "react";

import AboutTab from "./AboutTab";
import CommentsTab from "./CommentsTab";
import FavoritesTab from "./FavoritesTab";
import TradeAdsProfileTab from "./TradeAdsProfileTab";
import ProfileInventoryTab from "./ProfileInventoryTab";
import PrivateServersTab from "./PrivateServersTab";
import { UserSettings } from "@/types/auth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TradeAd } from "@/types/trading";

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
  settings?: UserSettings;
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
}

interface CommentData {
  id: number;
  author: string;
  content: string;
  date: string;
  item_id: number;
  item_type: string;
  user_id: string;
  edited_at: number | null;
  owner?: string;
  parent_id?: number | null;
}

interface Server {
  id: number;
  link: string;
  owner: string;
  rules: string;
  expires: string;
  created_at: string;
}

interface FavoriteItem {
  item_id: string;
  created_at: number;
  author: string;
  item?: {
    id: number;
    name?: string;
    type?: string;
    parent?: number;
    sub_name?: string;
    data?: {
      name: string;
      type: string;
    };
  };
}

interface ProfileTabsProps {
  user: User | null;
  currentUserId: string | null;
  bio: string | null;
  bioLastUpdated: number | null;
  comments: CommentData[];
  commentsLoading: boolean;
  commentsError: string | null;
  onBioUpdate?: (newBio: string) => void;
  privateServers?: Server[];
  isLoadingAdditionalData?: boolean;
  favorites?: FavoriteItem[];
  favoriteItemDetails?: Record<string, unknown>;
  tradeAds?: TradeAd[];
}

// Reset to basic Tabs/Tab for debugging mobile scroll snapping

const TabPanel = ({
  children,
  value,
  index,
  keepMounted = false,
}: {
  children: React.ReactNode;
  value: number;
  index: number;
  keepMounted?: boolean;
}) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`profile-tabpanel-${index}`}
    aria-labelledby={`profile-tab-${index}`}
  >
    {keepMounted ? children : value === index ? children : null}
  </div>
);

export default function ProfileTabs({
  user,
  currentUserId,
  bio,
  bioLastUpdated,
  comments,
  commentsLoading,
  commentsError,
  onBioUpdate,
  privateServers = [],
  isLoadingAdditionalData = false,
  favorites = [],
  favoriteItemDetails = {},
  tradeAds = [],
}: ProfileTabsProps) {
  "use memo";
  const [value, setValue] = useState(0);

  // Create a shared cache of item details from both comments and favorites
  const sharedItemDetails = (() => {
    const cache: Record<string, unknown> = {};

    // Add favorite item details to cache
    Object.entries(favoriteItemDetails).forEach(([itemId, details]) => {
      if (details) {
        cache[itemId] = details;
      }
    });

    return cache;
  })();

  // Hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the # symbol
      const hasRobloxConnection = Boolean(user?.roblox_id);
      if (hash === "about") {
        setValue(0);
      } else if (hash === "comments") {
        setValue(1);
      } else if (hash === "favorites") {
        setValue(2);
      } else if (hash === "servers") {
        setValue(3);
      } else if (
        (hash === "trade-ads" || hash === "roblox") &&
        hasRobloxConnection
      ) {
        setValue(4);
      } else if (hash === "inventory" && hasRobloxConnection) {
        setValue(5);
      } else {
        setValue(0);
      }
    };

    // Handle initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [user?.roblox_id]);

  const handleChange = (newValue: number) => {
    const hasRobloxConnection = Boolean(user?.roblox_id);
    const tabsCount = hasRobloxConnection ? 6 : 4;
    const normalizedValue = Math.max(0, Math.min(newValue, tabsCount - 1));
    setValue(normalizedValue);
    // Update hash based on selected tab
    if (normalizedValue === 0) {
      // Remove hash completely for About tab
      history.pushState(null, "", window.location.pathname);
    } else if (normalizedValue === 1) {
      window.location.hash = "comments";
    } else if (normalizedValue === 2) {
      window.location.hash = "favorites";
    } else if (normalizedValue === 3) {
      window.location.hash = "servers";
    } else if (hasRobloxConnection && normalizedValue === 4) {
      window.location.hash = "trade-ads";
    } else if (hasRobloxConnection && normalizedValue === 5) {
      window.location.hash = "inventory";
    }
  };

  if (!user) {
    return null;
  }

  // Calculate whether user has Roblox connection
  const hasRobloxConnection = Boolean(user.roblox_id);

  return (
    <div className="w-full">
      <ProfileOverflowTabs
        value={value}
        onChange={(idx) => handleChange(idx)}
        hasRobloxConnection={hasRobloxConnection}
      />
      <TabPanel value={value} index={0}>
        <AboutTab
          user={user}
          currentUserId={currentUserId}
          bio={bio}
          bioLastUpdated={bioLastUpdated}
          onBioUpdate={onBioUpdate}
        />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <CommentsTab
          comments={comments}
          loading={commentsLoading}
          error={commentsError}
          currentUserId={currentUserId}
          userId={user.id}
          settings={user.settings}
          sharedItemDetails={sharedItemDetails}
        />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <FavoritesTab
          userId={user.id}
          currentUserId={currentUserId}
          settings={user.settings}
          favorites={favorites}
          favoriteItemDetails={favoriteItemDetails}
          isLoadingAdditionalData={isLoadingAdditionalData}
          sharedItemDetails={sharedItemDetails}
        />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <PrivateServersTab
          servers={privateServers}
          isOwnProfile={currentUserId === user.id}
        />
      </TabPanel>
      {hasRobloxConnection && (
        <TabPanel value={value} index={4}>
          <TradeAdsProfileTab
            user={user}
            tradeAds={tradeAds}
            isLoadingAdditionalData={isLoadingAdditionalData}
            isOwnProfile={currentUserId === user.id}
            currentUserId={currentUserId}
          />
        </TabPanel>
      )}
      {hasRobloxConnection && (
        <TabPanel value={value} index={5} keepMounted>
          <ProfileInventoryTab
            robloxId={user.roblox_id ?? ""}
            active={value === 5}
          />
        </TabPanel>
      )}
    </div>
  );
}

function ProfileOverflowTabs({
  value,
  onChange,
  hasRobloxConnection,
}: {
  value: number;
  onChange: (v: number) => void;
  hasRobloxConnection: boolean;
}) {
  const labels = [
    "About",
    "Comments",
    "Favorites",
    "Private Servers",
    ...(hasRobloxConnection ? ["Trade Ads", "Inventory"] : []),
  ];

  return (
    <div className="w-full">
      <Tabs
        value={String(value)}
        onValueChange={(v) => onChange(Number(v))}
        className="w-full"
      >
        <TabsList noBottomRadius fullWidth className="w-full">
          {labels.map((label, idx) => (
            <TabsTrigger
              key={label}
              value={String(idx)}
              aria-controls={`profile-tabpanel-${idx}`}
              id={`profile-tab-${idx}`}
              fullWidth
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
