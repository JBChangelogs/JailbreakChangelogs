"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TRACKERS = [
  {
    href: "/robberies",
    label: "Robbery Tracker",
  },
  {
    href: "/bounties",
    label: "Bounty Tracker",
  },
] as const;

// Tabs linking the live trackers so users of one discover the other
export default function TrackerSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <Tabs value={pathname} className={className}>
      <TabsList aria-label="Live trackers">
        {TRACKERS.map((tracker) => (
          <TabsTrigger key={tracker.href} value={tracker.href} asChild>
            <Link href={tracker.href}>{tracker.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
