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
    /^## +\[?([^\]\n]+)\]? *(?:-|\() *(\d{4}-\d{2}-\d{2})?\)?/;

  for (const line of lines) {
    const match = line.match(versionRegex);

    if (match) {
      // If we have an existing entry, save it
      if (currentEntry) {
        currentEntry.content = currentContent.join("\n").trim();
        entries.push(currentEntry as ChangelogEntry);
      }

      // Start new entry
      const version = match[1] || "Unreleased";
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
