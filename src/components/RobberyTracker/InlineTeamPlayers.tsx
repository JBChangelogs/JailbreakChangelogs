"use client";

import { Icon } from "@/components/ui/IconWrapper";

type Player = {
  user_id: string;
  username: string | null;
  team: string;
};

export default function InlineTeamPlayers({
  players,
  className,
}: {
  players: Player[];
  className?: string;
}) {
  if (players.length === 0) return null;

  const copsCount = players.filter((p) => p.team === "Police").length;
  const criminalsCount = players.filter((p) => p.team === "Criminal").length;

  return (
    <div
      className={`text-secondary-text flex items-center gap-2 text-xs ${className || ""}`}
    >
      <Icon icon="heroicons-outline:users" className="h-4 w-4 shrink-0" />
      <span className="text-primary-text font-medium tabular-nums">
        {criminalsCount} Criminal{criminalsCount === 1 ? "" : "s"}
      </span>
      <span className="text-tertiary-text">•</span>
      <span className="text-primary-text font-medium tabular-nums">
        {copsCount} Cop{copsCount === 1 ? "" : "s"}
      </span>
    </div>
  );
}
