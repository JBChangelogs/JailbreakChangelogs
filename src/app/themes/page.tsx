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
          <Button asChild variant="secondary">
            <Link href="/settings?highlight=themes#themes">Theme settings</Link>
          </Button>
        </div>
        <CompetitionCard />
        <ThemeMarketplace />
      </div>
    </main>
  );
}
