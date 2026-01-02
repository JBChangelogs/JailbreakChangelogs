import { unstable_cache } from "next/cache";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface ChangelogEntry {
  version: string;
  date: string;
  title?: string;
  description?: string;
  content: string; // The full markdown content for this entry
  slug: string; // ID for the URL
}

export function parseChangelog(markdown: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const lines = markdown.split("\n");

  let currentEntry: Partial<ChangelogEntry> | null = null;
  let currentContent: string[] = [];

  // Regex to match headers like:
  // ## [1.0.0] - 2024-01-01
  // ## 1.0.0 (2024-01-01)
  // ## [Unreleased]
  // ## (2024-01-01)
  const versionRegex =
    /^## +\[?([^\]\n]*?)\]? *(?:-|\() *(\d{4}-\d{2}-\d{2})?\)?/;

  for (const line of lines) {
    const match = line.match(versionRegex);

    if (match) {
      // If we have an existing entry, save it
      if (currentEntry) {
        currentEntry.content = currentContent.join("\n").trim();
        entries.push(currentEntry as ChangelogEntry);
      }

      // Start new entry
      // Strip HTML tags from version (e.g., "<small>0.1.1</small>" -> "0.1.1")
      // Use recursive replacement to handle nested or malformed tags
      const rawVersion = match[1] || "Unreleased";
      let version = rawVersion;
      let previousVersion: string;
      // Keep removing HTML tags until no more are found (handles nested/malformed tags)
      do {
        previousVersion = version;
        version = version.replace(/<[^>]*>/g, "");
      } while (version !== previousVersion);
      version = version.trim();
      const date = match[2] || new Date().toISOString().split("T")[0];
      const slug = version === "Unreleased" ? "unreleased" : version;

      currentEntry = {
        version,
        date,
        slug,
        title: version === "Unreleased" ? "Unreleased Changes" : `v${version}`,
        description: `Changelog for version ${version}`,
      };
      currentContent = [];
    } else if (currentEntry) {
      // If we are matching a "header" that didn't match the regex but starts with ##, be careful.
      // But usually conventional changelog uses ## for Versions and ### for Types.
      currentContent.push(line);
    }
  }

  // Push last entry
  if (currentEntry) {
    currentEntry.content = currentContent.join("\n").trim();
    entries.push(currentEntry as ChangelogEntry);
  }

  return entries;
}

// Cached function to read and parse changelog
// Revalidates every 5 minutes to pick up new releases
export const getCachedChangelogEntries = unstable_cache(
  async (): Promise<ChangelogEntry[]> => {
    try {
      const content = await readFile(
        join(process.cwd(), "CHANGELOG.md"),
        "utf-8",
      );
      return parseChangelog(content);
    } catch (error) {
      console.error("Error reading CHANGELOG.md:", error);
      return [];
    }
  },
  ["changelog-entries"],
  {
    revalidate: 300, // 5 minutes
    tags: ["changelog"],
  },
);
