import { Suspense } from "react";
import { fetchUserById } from "@/utils/api";
import UserProfileClient from "./UserProfileClient";
import { UserSettings, UserFlag } from "@/types/auth";
import { ProfileDataService } from "@/services/profileDataService";
import { logError } from "@/services/logger";

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
  roblox_id: string | null;
  roblox_username?: string;
  flags?: UserFlag[];
  primary_guild?: {
    tag: string | null;
    badge: string | null;
    identity_enabled: boolean;
    identity_guild_id: string | null;
  } | null;
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

interface UserProfileData {
  user: User;
  followerCount: number;
  followingCount: number;
  bio: string | null;
  bioLastUpdated: number | null;
  comments: CommentData[];
  privateServers: Server[];
  favorites: FavoriteItem[];
  favoriteItemDetails: Record<string, unknown>;
  tradeAds: TradeAd[];
}

// Loading fallback that shows main user data immediately
function UserProfileLoadingFallback({
  userId,
  user,
}: {
  userId: string;
  user: User;
}) {
  return (
    <UserProfileClient
      userId={userId}
      initialData={{
        user,
        followerCount: 0,
        followingCount: 0,
        bio: null,
        bioLastUpdated: null,
        comments: [],
        privateServers: [],
        favorites: [],
        favoriteItemDetails: {},
        tradeAds: [],
      }}
      isLoadingAdditionalData={true}
    />
  );
}

// Component that fetches additional data (followers, bio, comments, servers)
async function AdditionalDataFetcher({
  userId,
  user,
}: {
  userId: string;
  user: User;
}) {
  let profileData;
  let error: string | undefined = undefined;

  try {
    // Fetch additional data using the shared service
    profileData = await ProfileDataService.fetchProfileData(userId);
  } catch (err: unknown) {
    logError("Error fetching additional user data", err, {
      component: "UserProfileDataStreamer",
      action: "fetch_additional_data",
    });

    // Use default data if fetching fails
    profileData = ProfileDataService.getDefaultProfileData();
    error = "Failed to load some profile data";
  }

  const additionalData: UserProfileData = {
    user,
    ...profileData,
  };

  return (
    <UserProfileClient
      userId={userId}
      initialData={additionalData}
      isLoadingAdditionalData={false}
      additionalDataError={error}
    />
  );
}

// Main component that fetches user data first, then streams additional data
async function UserProfileDataFetcher({ userId }: { userId: string }) {
  try {
    // Fetch main user data first (this is fast and essential)
    const userData = await fetchUserById(userId);

    if (!userData) {
      throw new Error("User not found");
    }

    return (
      <Suspense
        fallback={
          <UserProfileLoadingFallback userId={userId} user={userData} />
        }
      >
        <AdditionalDataFetcher userId={userId} user={userData} />
      </Suspense>
    );
  } catch (error: unknown) {
    logError("Error fetching user profile data", error, {
      component: "UserProfileDataStreamer",
      action: "fetch_user_profile",
    });

    // Handle banned user errors
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.startsWith("BANNED_USER:")
    ) {
      const bannedMessage = error.message.replace("BANNED_USER:", "").trim();
      return (
        <UserProfileClient
          userId={userId}
          error={{ message: bannedMessage, code: 403 }}
        />
      );
    }

    // Handle not found errors (404)
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.startsWith("NOT_FOUND:")
    ) {
      return (
        <UserProfileClient
          userId={userId}
          error={{ message: "User not found", code: 404 }}
        />
      );
    }

    // Handle other errors
    return (
      <UserProfileClient
        userId={userId}
        error={{ message: "Failed to load user data", code: 500 }}
      />
    );
  }
}

export default function UserProfileDataStreamer({
  userId,
}: {
  userId: string;
}) {
  return <UserProfileDataFetcher userId={userId} />;
}
