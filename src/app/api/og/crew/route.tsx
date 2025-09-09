/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { fetchCrewLeaderboard } from "@/utils/api";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Validates if an image URL is accessible and returns a valid image
 * This prevents broken images from being displayed in the OG image
 * @param url - The image URL to validate
 * @returns Promise<boolean> - True if the URL returns a valid image
 */
async function isImageAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    const contentType = response.headers.get("content-type");
    return response.ok && contentType
      ? contentType.startsWith("image/")
      : false;
  } catch {
    return false;
  }
}

// Pre-defined background images for crews
// These are served from our CDN and provide consistent branding
const BACKGROUND_COUNT = 19;
const BACKGROUNDS = Array.from(
  { length: BACKGROUND_COUNT },
  (_, i) =>
    `https://assets.jailbreakchangelogs.xyz/assets/backgrounds/png/background${i + 1}.png`,
);

/**
 * Generates a deterministic background selection based on crew rank
 * This ensures the same crew always gets the same background for consistency
 * @param rank - The crew rank
 * @returns number - Index of the background to use
 */
const calculateSeed = (rank: string): number => {
  let seed = 0;
  for (let i = 0; i < rank.length; i++) {
    seed = (seed << 5) - seed + rank.charCodeAt(i);
    seed = seed & seed; // Convert to 32-bit integer
  }
  return Math.abs(seed);
};

/**
 * Generates Open Graph images for crew profiles
 * This endpoint creates social media preview images when crew links are shared
 *
 * Features:
 * - Dynamic crew backgrounds with fallback to random backgrounds
 * - Crew performance stats
 * - Call-to-action section promoting the website
 *
 * @param request - Next.js request object
 * @returns Response - ImageResponse for OG image or error response
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rank = searchParams.get("rank");
  const season = searchParams.get("season");

  if (!rank) {
    return new Response("Missing rank", { status: 400 });
  }

  // Load custom font for consistent branding across OG images
  const luckiestGuyFont = await readFile(
    join(process.cwd(), "public/fonts/LuckiestGuy.ttf"),
  );

  let crew;
  try {
    const rankNumber = parseInt(rank);
    if (isNaN(rankNumber) || rankNumber < 1) {
      return new Response("Invalid rank", { status: 400 });
    }

    const selectedSeason = season ? parseInt(season, 10) : 19;
    const leaderboard = await fetchCrewLeaderboard(selectedSeason);
    crew = leaderboard[rankNumber - 1]; // Convert 1-based rank to 0-based index

    if (!crew) {
      return new Response("Crew Not Found", { status: 404 });
    }
  } catch {
    return new Response("Crew Not Found", { status: 404 });
  }

  // Determine background image: crew flag or fallback to random background
  let bannerUrl: string;
  const crewFlagUrl =
    "https://assets.jailbreakchangelogs.xyz/assets/images/crews/flags/Flag_2.png";

  const isFlagAccessible = await isImageAccessible(crewFlagUrl);
  if (isFlagAccessible) {
    bannerUrl = crewFlagUrl;
  } else {
    // Fall back to deterministic random background
    const seed = calculateSeed(rank);
    const index = seed % BACKGROUND_COUNT;
    bannerUrl = BACKGROUNDS[index];
  }

  // Calculate win rate
  const winRate =
    crew.BattlesPlayed > 0
      ? Math.round((crew.BattlesWon / crew.BattlesPlayed) * 100)
      : 0;

  // Format rating
  const formattedRating = Math.round(crew.Rating).toLocaleString();

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
        }}
      >
        {/* Crew Flag Background */}
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
          alt="Crew flag background"
        />
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
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            maxWidth: "800px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontFamily: "LuckiestGuy",
              color: "#93c5fd",
              marginBottom: "16px",
              flexDirection: "column",
            }}
          >
            <b>Crew #{rank}</b>
            {season && season !== "19" && (
              <span
                style={{ fontSize: 20, marginTop: "8px", color: "#fbbf24" }}
              >
                Season {season}
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 64,
              fontFamily: "LuckiestGuy",
              color: "white",
              marginBottom: "16px",
            }}
          >
            <b>{crew.ClanName}</b>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              color: "#d1d5db",
              lineHeight: "1.5",
            }}
          >
            {formattedRating} Rating • {crew.BattlesPlayed} Battles • {winRate}%
            Win Rate
          </div>
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
            backgroundColor: "rgba(0, 0, 0, 0.8)",
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
                color: "#a0a0a0",
                margin: "0 0 16px 0",
                textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
              }}
            >
              Visit{" "}
              <span style={{ color: "#6366f1", fontWeight: "bold" }}>
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
