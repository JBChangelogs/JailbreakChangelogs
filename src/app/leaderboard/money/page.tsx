import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Money Leaderboard - Coming Back Soon",
  description:
    "The Money Leaderboard is being improved. We'll be back soon with a better experience.",
  robots: { index: false, follow: false },
};

export default function MoneyLeaderboardPage() {
  return (
    <main className="text-primary-text flex min-h-screen items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="bg-button-info/10 flex h-20 w-20 items-center justify-center rounded-full">
          <Icon
            icon="mdi:podium"
            className="text-link h-10 w-10"
            inline={true}
          />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Making Things Better for You</h1>
          <p className="text-secondary-text text-base leading-relaxed">
            The Money Leaderboard is currently being reworked. We&apos;re
            improving how it works under the hood so it&apos;s faster when it
            returns.
          </p>
        </div>
        <Button variant="default" size="md" asChild>
          <Link href="/">
            <Icon icon="heroicons-outline:home" className="h-5 w-5" />
            Take me home
          </Link>
        </Button>
      </div>
    </main>
  );
}
