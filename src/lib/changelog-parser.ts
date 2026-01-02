export interface ChangelogEntry {
  version: string;
  date: string;
  title?: string;
  description?: string;
  content: string; // The full markdown content for this entry
  slug: string; // ID for the URL
}

interface GithubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
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

    const response = await fetch(
      "https://api.github.com/repos/JBChangelogs/JailbreakChangelogs/releases",
      {
        headers,
        next: { revalidate: 600 }, // 10 minutes
      },
    );

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

      // published_at → date
      const date = release.published_at.split("T")[0];

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
      };
    });
  } catch (error) {
    console.error("Error fetching changelogs from GitHub:", error);
    return [];
  }
}
