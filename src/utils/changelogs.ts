import { parse } from 'date-fns';

// Parse markdown content into structured sections
export function parseMarkdown(text: string) {
  const sections = text.split('\n\n');
  return sections.map(section => {
    const lines = section.split('\n');
    const title = lines[0].startsWith('## ') ? lines[0].substring(3) : null;
    const items = lines.slice(title ? 1 : 0).filter(line => line.trim());
    
    return {
      title,
      items: items.map(line => {
        // Remove all leading hyphens and spaces
        const cleanLine = line.replace(/^[- ]+/, '').trim();
        
        // Check for media embeds
        const mediaMatch = cleanLine.match(/^\((image|video|audio)\)(.+)$/);
        if (mediaMatch) {
          return {
            type: 'media' as const,
            mediaType: mediaMatch[1] as 'image' | 'video' | 'audio',
            url: `https://assets.jailbreakchangelogs.xyz${mediaMatch[2].trim()}`,
            isNested: line.trim().startsWith('- - ')
          };
        }

        // Process mentions in text
        const processedText = cleanLine.replace(/@(\w+)/g, (match, username) => {
          return `<span class="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-[#5865F2] text-white">@${username}</span>`;
        });

        return {
          type: 'text' as const,
          text: processedText,
          isNested: line.trim().startsWith('- - ')
        };
      })
    };
  });
}

// Helper function to highlight text
export function highlightText(text: string, query: string) {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-[#124E66] text-white px-1 rounded">$1</mark>');
}

// Helper function to extract media types and mentions from content
export function extractContentInfo(sections: string) {
  const mediaTypes = new Set<string>();
  const mentions = new Set<string>();
  
  // Check for media embeds
  const mediaRegex = /\((image|video|audio)\)/g;
  let match;
  while ((match = mediaRegex.exec(sections)) !== null) {
    mediaTypes.add(match[1]);
  }
  
  // Check for mentions
  const mentionRegex = /@(\w+)/g;
  while ((match = mentionRegex.exec(sections)) !== null) {
    mentions.add(match[1]);
  }
  
  return {
    mediaTypes: Array.from(mediaTypes),
    mentions: Array.from(mentions)
  };
}

// Add helper function to clean markdown and media tags
export function cleanMarkdown(text: string): string {
  return text
    // Remove markdown headers
    .replace(/^#+\s*/gm, '')
    // Remove list markers
    .replace(/^[- ]+/gm, '')
    // Remove media tags and their asset URLs
    .replace(/\((image|video|audio)\)\/assets\/.*?(?=\s|$)/g, '')
    // Remove any remaining media tags without URLs
    .replace(/\((image|video|audio)\)/g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Update getContentPreview function
export function getContentPreview(sections: string, query: string) {
  const lines = sections.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes(query.toLowerCase())) {
      return cleanMarkdown(line);
    }
  }
  return cleanMarkdown(lines[0]); // Return first line if no match found
}

// Add helper function for badge colors
export function getBadgeColor(type: string) {
  switch (type) {
    case 'video':
      return 'bg-red-500';
    case 'audio':
      return 'bg-blue-500';
    case 'image':
      return 'bg-purple-500';
    case 'mentions':
      return 'bg-[#5865F2]';
    default:
      return 'bg-[#124E66]';
  }
}

// Add helper function to parse date from title
export function parseDateFromTitle(title: string): Date | null {
  const dateMatch = title.match(/^([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?\s+\d{4})/);
  if (dateMatch) {
    try {
      return parse(dateMatch[1], 'MMMM do yyyy', new Date());
    } catch {
      return null;
    }
  }
  return null;
} 