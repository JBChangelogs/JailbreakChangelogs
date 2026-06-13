import { parse } from "date-fns";

// Parse markdown content into structured sections
export function parseMarkdown(text: string) {
  // Ensure headings always start a new paragraph even when the source omits the blank line
  const normalized = text.replace(/([^\n])\n(#{1,6} )/g, "$1\n\n$2");
  const sections = normalized.split("\n\n");
  return sections
    .filter((s) => s.trim())
    .map((section) => {
      const lines = section.split("\n");
      const title = lines[0].startsWith("## ")
        ? lines[0].substring(3)
        : lines[0].startsWith("# ")
          ? lines[0].substring(2)
          : null;
      const items = lines.slice(title ? 1 : 0).filter((line) => line.trim());

      return {
        title,
        items: items.map((line) => {
          // Remove all leading hyphens and spaces
          const cleanLine = line.replace(/^[- ]+/, "").trim();

          // Check for media embeds
          const mediaMatch = cleanLine.match(/^\((image|video|audio)\)(.+)$/);
          if (mediaMatch) {
            return {
              type: "media" as const,
              mediaType: mediaMatch[1] as "image" | "video" | "audio",
              url: `https://assets.jailbreakchangelogs.com${mediaMatch[2].trim()}`,
              isNested: line.trim().startsWith("- - "),
            };
          }

          // Process inline markdown and mentions
          const processedText = cleanLine
            .replace(
              /\*\*(.+?)\*\*/g,
              '<strong class="text-primary-text">$1</strong>',
            )
            .replace(/\*([^*]+)\*/g, "<em>$1</em>")
            .replace(/@(\w+)/g, (_, username) => {
              return `<a href="https://www.roblox.com/users/profile?username=${username}" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover active:text-link-active transition-colors duration-200">@${username}</a>`;
            });

          return {
            type: "text" as const,
            text: processedText,
            isNested: line.trim().startsWith("- - "),
          };
        }),
      };
    });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Helper function to highlight text. Accepts either a literal query (substring
// search) or a list of terms (e.g. the actual words a fuzzy search matched on,
// since the typed query itself may not appear verbatim in the text).
export function highlightText(text: string, query: string | string[]) {
  const terms = (Array.isArray(query) ? query : [query]).filter(Boolean);
  if (terms.length === 0) return text;
  const pattern = terms.map(escapeRegExp).join("|");
  const regex = new RegExp(`(${pattern})`, "gi");
  return text.replace(
    regex,
    '<mark class="bg-highlight text-primary-text px-1 rounded">$1</mark>',
  );
}

// Helper function to extract media types and mentions from content
export function extractContentInfo(sections: string) {
  const mediaTypes = new Set<string>();
  const mentions = new Set<string>();
  const mediaTypeCounts: Record<string, number> = {
    video: 0,
    audio: 0,
    image: 0,
  };

  // Check for media embeds
  const mediaRegex = /\((image|video|audio)\)/g;
  let match;
  while ((match = mediaRegex.exec(sections)) !== null) {
    const mediaType = match[1];
    mediaTypes.add(mediaType);
    mediaTypeCounts[mediaType] = (mediaTypeCounts[mediaType] || 0) + 1;
  }

  // Check for mentions
  const mentionRegex = /@(\w+)/g;
  let mentionCount = 0;
  while ((match = mentionRegex.exec(sections)) !== null) {
    mentions.add(match[1]);
    mentionCount++;
  }

  return {
    mediaTypes: Array.from(mediaTypes),
    mentions: Array.from(mentions),
    mediaTypeCounts,
    mentionCount,
  };
}

// Add helper function to clean markdown and media tags
export function cleanMarkdown(text: string): string {
  return (
    text
      // Remove markdown headers
      .replace(/^#+\s*/gm, "")
      // Remove list markers
      .replace(/^[- ]+/gm, "")
      // Remove media tags and their asset URLs
      .replace(/\((image|video|audio)\)\/assets\/.*?(?=\s|$)/g, "")
      // Remove any remaining media tags without URLs
      .replace(/\((image|video|audio)\)/g, "")
      // Remove extra whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

// Picks the line to preview. `query` can be the literal search string, or a
// list of terms to look for (e.g. the words a fuzzy search actually matched on,
// since the typed query itself may not appear verbatim in the content).
export function getContentPreview(sections: string, query: string | string[]) {
  const terms = (Array.isArray(query) ? query : [query])
    .filter(Boolean)
    .map((term) => term.toLowerCase());
  const lines = sections.split("\n");
  if (terms.length > 0) {
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (terms.some((term) => lowerLine.includes(term))) {
        return cleanMarkdown(line);
      }
    }
  }
  return cleanMarkdown(lines[0]); // Return first line if no match found
}

export function getBadgeColor(type?: "video" | "audio" | "image" | "mentions") {
  switch (type) {
    case "video":
      return "bg-[#ef4444] dark:bg-[#ef4444]";
    case "audio":
      return "bg-[#9333ea] dark:bg-[#9333ea]";
    case "image":
      return "bg-[#2563eb] dark:bg-[#2563eb]";
    case "mentions":
      return "bg-[#059669] dark:bg-[#059669]";
    default:
      return "bg-button-info";
  }
}

export function parseDateFromTitle(title: string): Date | null {
  const dateMatch = title.match(
    /^([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?\s+\d{4})/,
  );
  if (dateMatch) {
    try {
      return parse(dateMatch[1], "MMMM do yyyy", new Date());
    } catch {
      return null;
    }
  }
  return null;
}
