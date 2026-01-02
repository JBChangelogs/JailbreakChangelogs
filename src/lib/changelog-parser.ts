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

/**
 * Fetches changelog entries from GitHub Releases API
 * Uses Next.js fetch cache with 10 minute revalidation
 */
export async function getCachedChangelogEntries(): Promise<ChangelogEntry[]> {
  try {
    const headers: HeadersInit = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const baseUrl = process.env.GITHUB_API_RELEASES_URL!;
    const url = baseUrl.includes("?")
      ? `${baseUrl}&per_page=100`
      : `${baseUrl}?per_page=100`;

    const response = await fetch(url, {
      headers,
      next: { revalidate: 600 }, // 10 minutes
    });

    if (!response.ok) {
      console.error(
        `Error fetching releases: ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const releases: GithubRelease[] = await response.json();

    return releases.map(mapGithubReleaseToEntry);
  } catch (error) {
    console.error("Error fetching changelogs from GitHub:", error);
    return [];
  }
}

/**
 * Fetches a single changelog entry from GitHub Releases API by its slug (version/tag).
 * Following the "Get a release" API pattern but using the tag-based variant to preserve human-readable URLs.
 */
export async function getChangelogEntryBySlug(
  slug: string,
): Promise<ChangelogEntry | null> {
  try {
    const headers: HeadersInit = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    // Try both the slug as is, and with a 'v' prefix if it's missing (GitHub uses v1.0.0 usually)
    // We'll first check the list or just try the tag endpoint.
    // The tag endpoint is /repos/{owner}/{repo}/releases/tags/{tag}
    const baseUrl = process.env.GITHUB_API_RELEASES_URL!;
    const tag = slug.startsWith("v") ? slug : `v${slug}`;
    const url = `${baseUrl}/tags/${tag}`;

    const response = await fetch(url, {
      headers,
      next: { revalidate: 600 },
    });

    if (!response.ok) {
      // If v-tag fails, try without v-tag as some repos don't use it
      if (response.status === 404 && tag.startsWith("v")) {
        const altUrl = `${baseUrl}/tags/${slug}`;
        const altResponse = await fetch(altUrl, {
          headers,
          next: { revalidate: 600 },
        });
        if (altResponse.ok) {
          return mapGithubReleaseToEntry(await altResponse.json());
        }
      }
      return null;
    }

    const release: GithubRelease = await response.json();
    return mapGithubReleaseToEntry(release);
  } catch (error) {
    console.error(`Error fetching single release ${slug}:`, error);
    return null;
  }
}

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
