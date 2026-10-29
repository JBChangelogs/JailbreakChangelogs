import Link from "next/link";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";

export default function SeasonPausedNotice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 pb-16">
        <Breadcrumb />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="border-border-card bg-secondary-bg max-w-2xl rounded-lg border p-6 text-center sm:p-12">
            <div className="border-button-info/30 bg-icon-tile-bg mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border">
              <Icon
                icon="line-md:calendar"
                className="text-icon-tile h-10 w-10"
              />
            </div>
            <h1 className="text-primary-text mb-4 text-2xl font-bold">
              {title}
            </h1>
            <p className="text-secondary-text mb-8 text-lg leading-relaxed">
              {description} You can still browse past seasons and their rewards.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/seasons">
                  <Icon icon="line-md:calendar" />
                  Browse Past Seasons
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/changelogs/419">Read Changelog #419</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
