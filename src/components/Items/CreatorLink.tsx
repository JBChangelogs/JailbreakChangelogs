import React from 'react';

interface CreatorLinkProps {
  creator: string | null;
}

export default function CreatorLink({ creator }: CreatorLinkProps) {
  if (!creator) return <span>Unknown</span>;
  if (creator === "N/A") return <span>???</span>;

  const match = creator.match(/(.*?)\s*\((\d+)\)/);
  if (!match) return <span>{creator}</span>;

  const [, name, id] = match;
  return (
    <a
      href={`https://www.roblox.com/users/${id}/profile`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
    >
      {name}
    </a>
  );
} 