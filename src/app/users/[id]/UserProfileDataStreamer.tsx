import { Suspense } from "react";
import { fetchUserById, BASE_API_URL } from "@/utils/api";
import UserProfileClient from "./UserProfileClient";
import {
  FollowingData,
  FollowerData,
  UserSettings,
  UserFlag,
} from "@/types/auth";
import { fetchFavoritesData, fetchFavoriteItemDetails } from "./actions";

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
  try {
    // Fetch additional data in parallel
    const [
      followersResponse,
      followingResponse,
      bioResponse,
      commentsResponse,
      serversResponse,
      favoritesData,
      tradeAdsResponse,
    ] = await Promise.all([
      fetch(`${BASE_API_URL}/users/followers/get?user=${userId}`),
      fetch(`${BASE_API_URL}/users/following/get?user=${userId}`),
      fetch(
        `${BASE_API_URL}/users/description/get?user=${userId}&nocache=true`,
      ),
      fetch(`${BASE_API_URL}/users/comments/get?author=${userId}`),
      fetch(`${BASE_API_URL}/servers/get?owner=${userId}`),
      fetchFavoritesData(userId),
      fetch(`${BASE_API_URL}/trades/get?user=${userId}`),
    ]);

    // Process responses
    const followersData: FollowerData[] | string =
      await followersResponse.json();
    const followingData: FollowingData[] | string =
      await followingResponse.json();
    const bioData = await bioResponse.json();
    const commentsData = await commentsResponse.json();
    const serversData = serversResponse.ok ? await serversResponse.json() : [];

    // Process trade ads response
    let tradeAdsData: TradeAd[] = [];
    if (tradeAdsResponse.ok) {
      try {
        const tradeAdsResponseData = await tradeAdsResponse.json();
        tradeAdsData = Array.isArray(tradeAdsResponseData)
          ? tradeAdsResponseData
          : [tradeAdsResponseData];
      } catch (error) {
        console.error("Error parsing trade ads response:", error);
        tradeAdsData = [];
      }
    } else if (tradeAdsResponse.status !== 404) {
      console.error("Error fetching trade ads:", tradeAdsResponse.status);
    }

    // Fetch item details for favorites (only if we have favorites data)
    const favoriteItemDetails =
      Array.isArray(favoritesData) && favoritesData.length > 0
        ? await fetchFavoriteItemDetails(favoritesData)
        : {};

    const additionalData: UserProfileData = {
      user,
      followerCount: Array.isArray(followersData) ? followersData.length : 0,
      followingCount: Array.isArray(followingData) ? followingData.length : 0,
      bio: bioData?.description || null,
      bioLastUpdated: bioData?.last_updated || null,
      comments: Array.isArray(commentsData) ? commentsData : [],
      privateServers: Array.isArray(serversData) ? serversData : [],
      favorites: Array.isArray(favoritesData) ? favoritesData : [],
      favoriteItemDetails,
      tradeAds: tradeAdsData,
    };

    return (
      <UserProfileClient
        userId={userId}
        initialData={additionalData}
        isLoadingAdditionalData={false}
      />
    );
  } catch (error: unknown) {
    console.error("Error fetching additional user data:", error);

    // Return with basic data if additional data fails
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
        isLoadingAdditionalData={false}
        additionalDataError="Failed to load some profile data"
      />
    );
  }
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
    console.error("Error fetching user profile data:", error);

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
