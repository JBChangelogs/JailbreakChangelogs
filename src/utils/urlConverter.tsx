import React from 'react';

export const convertUrlsToLinks = (text: string, disableLinks: boolean = false) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, index) => {
    if (part.match(urlRegex)) {
      const url = new URL(part);
      if (url.hostname === 'roblox.com' || url.hostname.endsWith('.roblox.com') || 
          url.hostname === 'reddit.com' || url.hostname.endsWith('.reddit.com') ||
          url.hostname === 'amazon.com' || url.hostname.endsWith('.amazon.com') ||
          url.hostname === 'jailbreakchangelogs.xyz' || url.hostname.endsWith('.jailbreakchangelogs.xyz')) {
        
        // If links are disabled, return as plain text
        if (disableLinks) {
          return part;
        }
        
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      // Return as plain text for non-allowed URLs
      return part;
    }
    return part;
  });
}; 