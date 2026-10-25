"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthContext } from "@/contexts/AuthContext";
import { useExperimentAccess } from "@/hooks/useExperimentAccess";

const TRACKERS = [
  {
    href: "/robberies",
    label: "Robberies",
  },
  {
    href: "/robberies?airdrops",
    label: "Airdrops",
  },
  {
    href: "/bounties",
    label: "Bounties",
  },
] as const;

// Tabs linking the live trackers so users of one discover the other
export default function TrackerSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuthContext();
  const airdropsEnabled = useExperimentAccess(
    "airdrop_tracker",
    user?.id,
    isAuthenticated && !isLoading,
  );
  const activeTracker =
    airdropsEnabled && pathname === "/robberies" && searchParams.has("airdrops")
      ? "/robberies?airdrops"
      : pathname;

  return (
    <Tabs value={activeTracker} className={className}>
      <TabsList aria-label="Live trackers" fullWidth className="w-full">
        {TRACKERS.filter(
          (tracker) => tracker.label !== "Airdrops" || airdropsEnabled,
        ).map((tracker) => (
          <TabsTrigger
            key={tracker.href}
            value={tracker.href}
            fullWidth
            className="py-3 text-base font-semibold"
            asChild
          >
            <Link href={tracker.href}>{tracker.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
