"use client";

import { useMemo } from "react";
import React from "react";
import { useQueryState } from "nuqs";

import AboutTab from "./AboutTab";
import CommentsTab from "./CommentsTab";
import FavoritesTab from "./FavoritesTab";
import TradeAdsProfileTab from "./TradeAdsProfileTab";
import ProfileInventoryTab from "./ProfileInventoryTab";
import PrivateServersTab from "./PrivateServersTab";
import { UserSettingsV2 } from "@/types/auth";
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
  const [tabParam, setTabParam] = useQueryState("tab", {
    defaultValue: "",
    history: "push",
    shallow: true,
  });

  const hasRobloxConnection = Boolean(user?.roblox_id);

  const value = useMemo(() => {
    const map: Record<string, number> = {
      comments: 1,
      favorites: 2,
      servers: 3,
      ...(hasRobloxConnection
        ? { "trade-ads": 4, roblox: 4, inventory: 5 }
        : {}),
    };
    const idx = tabParam ? (map[tabParam] ?? 0) : 0;
    return Math.min(idx, hasRobloxConnection ? 5 : 3);
  }, [tabParam, hasRobloxConnection]);

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

  const handleChange = (newValue: number) => {
    const names: Record<number, string | null> = {
      0: null,
      1: "comments",
      2: "favorites",
      3: "servers",
      4: "trade-ads",
      5: "inventory",
    };
    void setTabParam(names[newValue] ?? null);
  };

  if (!user) {
    return null;
  }

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
          settings={user.settings_v2}
          sharedItemDetails={sharedItemDetails}
        />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <FavoritesTab
          userId={user.id}
          currentUserId={currentUserId}
          settings={user.settings_v2}
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
