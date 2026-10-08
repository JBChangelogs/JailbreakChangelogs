import { cache } from "react";
import { createLogger } from "@/services/logger";

const log = createLogger("API");

export interface ChangelogEntry {
  version: string;
  date: string; // ISO 8601 timestamp (UTC) - converted to user's timezone on client
  title?: string;
  description?: string;
  content: string; // The full markdown content for this entry
  slug: string; // ID for the URL
  // Additional GitHub metadata
  createdAt?: string; // ISO 8601 timestamp
  publishedAt?: string | null; // ISO 8601 timestamp
  htmlUrl?: string; // GitHub release URL
  authorLogin?: string;
  authorAvatarUrl?: string;
  isDraft?: boolean;
  isPrerelease?: boolean;
  id?: number;
  tarballUrl?: string;
  zipballUrl?: string;
}

interface GithubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  created_at: string;
  published_at: string | null;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  author: {
    login: string;
    avatar_url: string;
  };
  tarball_url: string;
  zipball_url: string;
}

/**
 * Strip HTML tags from a string.
 * Uses recursive replacement to handle nested or malformed tags.
 */
function stripHtmlTags(text: string): string {
  let cleaned = text;
  let previous: string;

  // Keep removing HTML tags until no more are found (handles nested/malformed tags)
  do {
    previous = cleaned;
    cleaned = cleaned.replace(/<[^>]*>/g, "");
  } while (cleaned !== previous);

  return cleaned.trim();
}

const APP_RELEASES_URL =
  "https://api.github.com/repos/JBChangelogs/JailbreakChangelogsApp/releases";

/**
 * Fetches changelog entries from GitHub Releases API
 * Uses Next.js fetch cache with 10 minute revalidation
 */
export const getCachedChangelogEntries = cache(() =>
  fetchChangelogEntries(process.env.GITHUB_API_RELEASES_URL!, 100),
);

/** The desktop app's releases, newest first. */
export const getCachedAppChangelogEntries = cache(() =>
  fetchChangelogEntries(APP_RELEASES_URL, 10),
);

async function fetchChangelogEntries(
  baseUrl: string,
  perPage: number,
): Promise<ChangelogEntry[]> {
  try {
    const headers: HeadersInit = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const url = baseUrl.includes("?")
      ? `${baseUrl}&per_page=${perPage}`
      : `${baseUrl}?per_page=${perPage}`;

    const response = await fetch(url, {
      headers,
      next: { revalidate: 600 }, // 10 minutes
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      log.error("fetch releases failed", {
        status: response.status,
        statusText: response.statusText,
        body,
      });
      return [];
    }

    const releases: GithubRelease[] = await response.json();

    return releases.map(mapGithubReleaseToEntry);
  } catch (error) {
    log.error("Error fetching changelogs from GitHub:", error);
    return [];
  }
}

export const getCachedLatestChangelogEntry = cache(
  async (): Promise<ChangelogEntry | null> => {
    try {
      const headers: HeadersInit = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      };

      if (process.env.GITHUB_TOKEN) {
        headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
      }

      const url = new URL(process.env.GITHUB_API_RELEASES_URL!);
      url.pathname = `${url.pathname.replace(/\/$/, "")}/latest`;
      url.search = "";

      const response = await fetch(url, {
        headers,
        next: { revalidate: 600 },
      });

      if (!response.ok) {
        log.error("fetch latest release failed", {
          status: response.status,
          statusText: response.statusText,
        });
        return null;
      }

      const release: GithubRelease = await response.json();
      return mapGithubReleaseToEntry(release);
    } catch (error) {
      log.error("Error fetching latest changelog from GitHub:", error);
      return null;
    }
  },
);

function mapGithubReleaseToEntry(release: GithubRelease): ChangelogEntry {
  const version = release.tag_name.replace(/^v/, "");
  const date = release.published_at || release.created_at;
  const rawTitle = release.name || release.tag_name;
  const title = stripHtmlTags(rawTitle);
  const content = release.body || "";
  const slug = version;

  return {
    version,
    date,
    title,
    description: `Changelog for version ${version}`,
    content,
    slug,
    createdAt: release.created_at,
    publishedAt: release.published_at,
    htmlUrl: release.html_url,
    authorLogin: release.author.login,
    authorAvatarUrl: release.author.avatar_url,
    isDraft: release.draft,
    isPrerelease: release.prerelease,
    id: release.id,
    tarballUrl: release.tarball_url,
    zipballUrl: release.zipball_url,
  };
}
