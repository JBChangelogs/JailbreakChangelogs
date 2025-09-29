import React from "react";

interface CreatorLinkProps {
  creator: string | null;
}

export default function CreatorLink({ creator }: CreatorLinkProps) {
  if (!creator) return <span>Unknown</span>;
  if (creator === "N/A") return <span>???</span>;

  const match = creator.match(/(.*?)\s*\((\d+)\)/);
  if (!match) {
    // Special case for Badimo - link to community page
    if (creator === "Badimo") {
      return (
        <a
          href="https://www.roblox.com/communities/3059674/Badimo#!/about"
          target="_blank"
          rel="noopener noreferrer"
          className="text-link hover:text-link-hover transition-colors hover:underline"
        >
          {creator}
        </a>
      );
    }
    return <span>{creator}</span>;
  }

  const [, name, id] = match;
  return (
    <a
      href={`https://www.roblox.com/users/${id}/profile`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-link hover:text-link-hover transition-colors hover:underline"
    >
      {name}
    </a>
  );
}
