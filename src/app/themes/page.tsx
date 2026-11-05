import Breadcrumb from "@/components/Layout/Breadcrumb";
import ThemeMarketplace from "@/components/Settings/ThemeMarketplace";
import CompetitionCard from "@/components/Themes/CompetitionCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ThemeMarketplacePage() {
  return (
    <main className="text-primary-text min-h-screen">
      <div className="container mx-auto mb-8 px-4">
        <Breadcrumb />
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="page-heading mb-2">Theme Marketplace</h1>
            <p className="text-secondary-text">
              Find a community theme and make it yours. Anyone can use a theme.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/settings?highlight=themes#themes">Create theme</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/themes/competitions">Competitions</Link>
            </Button>
          </div>
        </div>
        <CompetitionCard />
        <div className="mb-4">
          <h2 className="text-xl font-semibold">All marketplace themes</h2>
          <p className="text-secondary-text mt-1 text-sm">
            Share any style of theme. Enter competitions separately.
          </p>
        </div>
        <ThemeMarketplace />
      </div>
    </main>
  );
}
