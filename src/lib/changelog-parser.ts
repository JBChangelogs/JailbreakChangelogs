export interface ChangelogEntry {
  version: string;
  date: string; // ISO 8601 timestamp (UTC) - converted to user's timezone on client
  title?: string;
  description?: string;
  content: string; // The full markdown content for this entry
  slug: string; // ID for the URL
  // Additional GitHub metadata
  createdAt?: string; // ISO 8601 timestamp
  publishedAt?: string; // ISO 8601 timestamp
  htmlUrl?: string; // GitHub release URL
  authorLogin?: string;
  authorAvatarUrl?: string;
  isDraft?: boolean;
  isPrerelease?: boolean;
}

interface GithubRelease {
  tag_name: string;
  name: string;
  body: string;
  created_at: string;
  published_at: string;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  author: {
    login: string;
    avatar_url: string;
  };
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
      Accept: "application/vnd.github.v3+json",
    };

    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(process.env.GITHUB_API_RELEASES_URL!, {
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

    return releases.map((release) => {
      // tag_name → version (removes 'v' prefix)
      const version = release.tag_name.replace(/^v/, "");

      // published_at → date (preserve full ISO 8601 timestamp for client-side conversion)
      const date = release.published_at;

      // name → title (strip HTML tags)
      const rawTitle = release.name || release.tag_name;
      const title = stripHtmlTags(rawTitle);

      // body → content (strip HTML tags from release notes)
      const content = stripHtmlTags(release.body);

      const slug = version;

      return {
        version,
        date,
        title,
        description: `Changelog for version ${version}`,
        content,
        slug,
        // Additional GitHub metadata
        createdAt: release.created_at,
        publishedAt: release.published_at,
        htmlUrl: release.html_url,
        authorLogin: release.author.login,
        authorAvatarUrl: release.author.avatar_url,
        isDraft: release.draft,
        isPrerelease: release.prerelease,
      };
    });
  } catch (error) {
    console.error("Error fetching changelogs from GitHub:", error);
    return [];
  }
}
