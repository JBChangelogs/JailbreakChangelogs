/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { fetchUserByIdForOG } from "@/utils/api";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { UserData } from "@/types/auth";

/**
 * Validates if an image URL is accessible and returns a valid image
 * This prevents broken images from being displayed in the OG image
 * @param url - The image URL to validate
 * @returns Promise<boolean> - True if the URL returns a valid image
 */
async function isImageAccessible(url: string): Promise<boolean> {
  try {
    // For GIF URLs (like Tenor), try a GET request instead of HEAD
    if (url.includes(".gif") || url.includes("tenor.com")) {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; JailbreakChangelogs-OG/1.0)",
        },
      });
      return response.ok;
    }

    const response = await fetch(url, { method: "HEAD" });
    const contentType = response.headers.get("content-type");
    return response.ok && contentType
      ? contentType.startsWith("image/")
      : false;
  } catch {
    return false;
  }
}

// Pre-defined background images for users without custom banners
// These are served from our CDN and provide consistent branding
const BACKGROUND_COUNT = 24;
const BACKGROUNDS = Array.from(
  { length: BACKGROUND_COUNT },
  (_, i) =>
    `https://assets.jailbreakchangelogs.xyz/assets/backgrounds/png/background${i + 1}.png`,
);

/**
 * Generates a deterministic background selection based on user ID
 * This ensures the same user always gets the same background for consistency
 * @param userId - The Discord user ID
 * @returns number - Index of the background to use
 */
const calculateSeed = (userId: string): number => {
  let seed = 0;
  for (let i = 0; i < userId.length; i++) {
    seed = (seed << 5) - seed + userId.charCodeAt(i);
    seed = seed & seed; // Convert to 32-bit integer
  }
  return Math.abs(seed);
};

/**
 * Determines which banner URL to use for the user's profile
 * Prioritizes user preferences and falls back to defaults
 * @param user - The user object from the API
 * @returns string | null - Banner URL or null to use fallback background
 */
function getUserBannerUrl(user: UserData): string | null {
  // If user wants to use Discord banner
  if (user.settings?.banner_discord === 1) {
    // Only use Discord banner if it exists and is not "None"
    if (user.banner && user.banner !== "None") {
      return `https://cdn.discordapp.com/banners/${user.id}/${user.banner}?size=4096`;
    }
    // If no Discord banner available, return null to use fallback
    return null;
  }

  // If user has explicitly chosen to use custom banner (Discord toggle off)
  // BUT only if they have Tier 2+ (custom banners require Tier 2+)
  if (
    user.settings?.banner_discord === 0 &&
    user.premiumtype &&
    user.premiumtype >= 2 &&
    user.custom_banner &&
    user.custom_banner !== "N/A"
  ) {
    return user.custom_banner;
  }

  // If user is Tier 1 or below but has custom banner setting, fall back to Discord banner
  if (
    user.settings?.banner_discord === 0 &&
    (!user.premiumtype || user.premiumtype < 2)
  ) {
    // Only use Discord banner if it exists and is not "None"
    if (user.banner && user.banner !== "None") {
      return `https://cdn.discordapp.com/banners/${user.id}/${user.banner}?size=4096`;
    }
  }

  // Default to null to use fallback
  return null;
}

/**
 * Generates Open Graph images for user profiles
 * This endpoint creates social media preview images when users share profile links
 *
 * Features:
 * - Dynamic user avatars with fallback to default
 * - Custom or Discord banners with fallback backgrounds
 * - User accent colors for avatar borders
 * - Call-to-action section promoting the website
 *
 * @param request - Next.js request object
 * @returns Response - ImageResponse for OG image or error response
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  // Load custom font for consistent branding across OG images
  const luckiestGuyFont = await readFile(
    join(process.cwd(), "public/fonts/LuckiestGuy.ttf"),
  );

  let user;
  try {
    user = await fetchUserByIdForOG(id);
    if (!user) {
      return new Response("User Not Found", { status: 404 });
    }
  } catch (error: unknown) {
    // Check if this is a banned user error
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.startsWith("BANNED_USER:")
    ) {
      const bannedMessage = error.message.replace("BANNED_USER:", "").trim();

      // Return a banned user OG image
      return new ImageResponse(
        (
          <div
            style={{
              width: "1200px",
              height: "630px",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #16161a 0%, #242629 100%)",
              padding: "40px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                textAlign: "center",
                padding: "32px 48px",
                borderRadius: "16px",
                backgroundColor: "rgba(237, 79, 79, 0.1)",
                border: "2px solid rgba(237, 79, 79, 0.3)",
                maxWidth: "800px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 64,
                  fontFamily: "LuckiestGuy",
                  color: "#ed4f4f",
                  marginBottom: "16px",
                }}
              >
                <b>User Banned</b>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  color: "#94a1b2",
                  lineHeight: "1.5",
                }}
              >
                {bannedMessage}
              </div>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
          fonts: [
            {
              name: "LuckiestGuy",
              data: luckiestGuyFont,
              style: "normal",
            },
          ],
        },
      );
    }

    // For other errors, return a generic error response
    return new Response("User Not Found", { status: 404 });
  }

  // Determine background image: user banner or fallback to random background
  let bannerUrl: string;
  const userBannerUrl = getUserBannerUrl(user);

  if (userBannerUrl) {
    const isBannerAccessible = await isImageAccessible(userBannerUrl);
    if (isBannerAccessible) {
      bannerUrl = userBannerUrl;
    } else {
      // Fall back to deterministic random background
      const seed = calculateSeed(user.id);
      const index = seed % BACKGROUND_COUNT;
      bannerUrl = BACKGROUNDS[index];
    }
  } else {
    // No user banner available, use deterministic random background
    const seed = calculateSeed(user.id);
    const index = seed % BACKGROUND_COUNT;
    bannerUrl = BACKGROUNDS[index];
  }

  const userNumber = user.usernumber || "Unknown";

  // Determine avatar shape: square for premiumType 3, circle otherwise
  const avatarShape = user.premiumtype === 3 ? "square" : "circle";

  // Get premium tier display info
  const getPremiumTierInfo = (premiumType: number) => {
    switch (premiumType) {
      case 1:
        return { name: "Supporter 1", color: "#cd7f32" };
      case 2:
        return { name: "Supporter 2", color: "#c0c0c0" };
      case 3:
        return { name: "Supporter 3", color: "#ffd700" };
      default:
        return null;
    }
  };

  const premiumTier = getPremiumTierInfo(user.premiumtype);

  // Determine avatar image: user's Discord avatar, custom avatar, or default
  let avatarUrl: string = "";
  let useDefaultAvatar = false;

  if (user.settings?.avatar_discord === 1) {
    if (user.avatar && user.avatar !== "None") {
      const discordAvatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}?size=4096`;
      avatarUrl = discordAvatarUrl;
    } else {
      useDefaultAvatar = true;
    }
  } else if (
    user.settings?.avatar_discord === 0 &&
    user.premiumtype &&
    user.premiumtype >= 2 &&
    user.custom_avatar &&
    user.custom_avatar !== "N/A" &&
    user.custom_avatar !== null
  ) {
    // User has explicitly chosen custom avatar AND has Tier 2+
    avatarUrl = user.custom_avatar;
  } else if (
    user.settings?.avatar_discord === 0 &&
    (!user.premiumtype || user.premiumtype < 2)
  ) {
    // User is Tier 1 or below but has custom avatar setting, fall back to Discord avatar
    if (user.avatar && user.avatar !== "None") {
      const discordAvatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}?size=4096`;
      avatarUrl = discordAvatarUrl;
    } else {
      useDefaultAvatar = true;
    }
  } else {
    useDefaultAvatar = true;
  }

  // Validate avatar URL accessibility to prevent broken images
  if (!useDefaultAvatar) {
    const isAccessible = await isImageAccessible(avatarUrl);
    if (!isAccessible) {
      useDefaultAvatar = true;
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: "15px",
        }}
      >
        {/* Banner Background Image */}
        <img
          src={bannerUrl}
          width={1200}
          height={630}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "1200px",
            height: "630px",
            objectFit: "cover",
          }}
          alt="Banner background"
        />
        {/* User Avatar Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "250px",
            height: "250px",
            borderRadius: avatarShape === "square" ? "4px" : "50%",
            overflow: "hidden",
            backgroundColor: "#0f1012",
          }}
        >
          {useDefaultAvatar ? (
            // Default avatar SVG for users without custom avatars
            <svg
              width="250"
              height="250"
              viewBox="0 0 250 250"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="125" cy="125" r="125" fill="#0f1012" />
              <circle cx="125" cy="100" r="37.5" fill="#fffffe" />
              <path
                d="M125 150C162.5 150 193.75 181.25 193.75 218.75H56.25C56.25 181.25 87.5 150 125 150Z"
                fill="#fffffe"
              />
            </svg>
          ) : (
            // User's custom avatar image
            <img
              src={avatarUrl}
              alt="User avatar"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: avatarShape === "square" ? "4px" : "50%",
                objectFit: "cover",
              }}
            />
          )}
        </div>

        {/* User Information Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            textAlign: "center",
            padding: "16px 24px",
            borderRadius: "12px",
            backgroundColor: "rgba(15, 16, 18, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            minWidth: "400px",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontFamily: "LuckiestGuy",
            }}
          >
            <b>
              {user.global_name && user.global_name !== "None"
                ? user.global_name
                : user.username}
            </b>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              color: "#94a1b2",
            }}
          >
            @{user.username}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              color: "#72757e",
            }}
          >
            User #{userNumber}
          </div>
          {premiumTier && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "8px",
                padding: "4px 12px",
                borderRadius: "20px",
                backgroundColor: premiumTier.color,
                color:
                  premiumTier.name === "Supporter 3" ? "#000000" : "#ffffff",
                fontSize: 18,
                fontFamily: "LuckiestGuy",
                fontWeight: "bold",
                textShadow:
                  premiumTier.name === "Supporter 3"
                    ? "none"
                    : "1px 1px 2px rgba(0, 0, 0, 0.8)",
              }}
            >
              {premiumTier.name}
            </div>
          )}
        </div>

        {/* Call-to-Action Section - Promotes the website */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(15, 16, 18, 0.9)",
            backdropFilter: "blur(10px)",
            padding: "20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontSize: 28,
                fontFamily: "LuckiestGuy",
                color: "white",
                margin: "0 0 8px 0",
                textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
              }}
            >
              Ready to stay updated?
            </h2>
            <p
              style={{
                fontSize: 18,
                color: "#94a1b2",
                margin: "0 0 16px 0",
                textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
              }}
            >
              Visit{" "}
              <span style={{ color: "#2462cd", fontWeight: "bold" }}>
                jailbreakchangelogs.xyz
              </span>
            </p>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "LuckiestGuy",
          data: luckiestGuyFont,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
