"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";

import AboutTab from "./AboutTab";
import CommentsTab from "./CommentsTab";
import FavoritesTab from "./FavoritesTab";
import RobloxProfileTab from "./RobloxProfileTab";
import PrivateServersTab from "./PrivateServersTab";
import { UserSettings } from "@/types/auth";

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
  owner: string;
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

interface TradeItem {
  id: number;
  name: string;
  type: string;
  creator: string;
  is_seasonal: number;
  cash_value: string;
  duped_value: string;
  price: string;
  is_limited: number;
  duped_owners: string;
  notes: string;
  demand: string;
  description: string;
  health: number;
  tradable: number;
  last_updated: number;
}

interface TradeAd {
  id: number;
  requesting: TradeItem[];
  offering: TradeItem[];
  author: string;
  created_at: number;
  expires: number | null;
  expired: number;
  status: string;
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

const StyledTabs = dynamic(
  () =>
    import("@mui/material/Tabs").then(async (TabsModule) => {
      const { styled } = await import("@mui/material/styles");
      return styled(TabsModule.default)(() => ({
        borderBottom: "1px solid #2E3944",
        "& .MuiTabs-indicator": {
          backgroundColor: "#5865F2",
        },
      }));
    }),
  { ssr: false },
);

const StyledTab = dynamic(
  () =>
    import("@mui/material/Tab").then(async (TabModule) => {
      const { styled } = await import("@mui/material/styles");
      return styled(TabModule.default)(() => ({
        textTransform: "none",
        color: "#FFFFFF",
        "&.Mui-selected": {
          color: "#D3D9D4",
        },
      }));
    }),
  { ssr: false },
);

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
    id={`profile-tabpanel-${index}`}
    aria-labelledby={`profile-tab-${index}`}
  >
    {value === index && children}
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
  const [value, setValue] = useState(0);

  // Create a shared cache of item details from both comments and favorites
  const sharedItemDetails = useMemo(() => {
    const cache: Record<string, unknown> = {};

    // Add favorite item details to cache
    Object.entries(favoriteItemDetails).forEach(([itemId, details]) => {
      if (details) {
        cache[itemId] = details;
      }
    });

    return cache;
  }, [favoriteItemDetails]);

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
      } else if (hash === "roblox" && hasRobloxConnection) {
        setValue(4);
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

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    const hasRobloxConnection = Boolean(user?.roblox_id);
    // Update hash based on selected tab
    if (newValue === 0) {
      // Remove hash completely for About tab
      history.pushState(null, "", window.location.pathname);
    } else if (newValue === 1) {
      window.location.hash = "comments";
    } else if (newValue === 2) {
      window.location.hash = "favorites";
    } else if (newValue === 3) {
      window.location.hash = "servers";
    } else if (hasRobloxConnection && newValue === 4) {
      window.location.hash = "roblox";
    }
  };

  if (!user) {
    return null;
  }

  // Calculate whether user has Roblox connection
  const hasRobloxConnection = Boolean(user.roblox_id);

  return (
    <div className="w-full">
      <div>
        <StyledTabs
          value={value}
          onChange={handleChange}
          aria-label="profile tabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <StyledTab label="About" />
          <StyledTab label="Comments" />
          <StyledTab label="Favorites" />
          <StyledTab label="Private Servers" />
          {hasRobloxConnection && <StyledTab label="Roblox Profile" />}
        </StyledTabs>
      </div>
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
          <RobloxProfileTab
            user={user}
            tradeAds={tradeAds}
            isLoadingAdditionalData={isLoadingAdditionalData}
          />
        </TabPanel>
      )}
    </div>
  );
}
