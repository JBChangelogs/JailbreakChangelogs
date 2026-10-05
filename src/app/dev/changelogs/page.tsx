import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import { getCachedChangelogEntries } from "@/lib/changelog-parser";
import { ReleaseTimelineEntry } from "@/components/Changelogs/ReleaseChanges";
import WhatsNewToggle from "@/components/Changelogs/WhatsNewToggle";

export const metadata: Metadata = {
  title: "Development Changelog",
  description: siteConfig.description,
  alternates: {
    canonical: "/dev/changelogs",
  },
};

// Revalidate every 10 minutes
export const revalidate = 600;

export default async function DevChangelogPage() {
  // Fetch changelogs from GitHub Releases API (cached)
  const entries = await getCachedChangelogEntries();

  const latestStable = entries.find(
    (entry) => !entry.isPrerelease && !entry.isDraft,
  );

  return (
    <div className="bg-primary-bg min-h-screen">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="pt-8 pb-4 sm:pt-10 sm:pb-6">
          <div className="text-center">
            <h1 className="page-heading mb-2">Development Changelog</h1>
            <p className="text-secondary-text mx-auto max-w-2xl text-lg">
              {siteConfig.description}
            </p>
          </div>
        </div>
        {/* Timeline */}
        <div className="pt-4 pb-12 sm:pt-6">
          <WhatsNewToggle />
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-secondary-bg mb-6 rounded-full p-6">
                <svg
                  className="text-secondary-text h-10 w-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-primary-text mb-2 text-2xl font-bold">
                No Changelogs Found
              </h2>
              <p className="text-secondary-text max-w-md text-lg">
                There are no changelog entries to show at the moment.
                <br />
                Check back later for updates on development progress!
              </p>
            </div>
          ) : (
            <div className="border-border-card ml-2 border-l-2 sm:ml-3">
              {entries.map((entry, index) => (
                <ReleaseTimelineEntry
                  key={entry.slug}
                  entry={entry}
                  latest={entry.slug === latestStable?.slug}
                  initiallyOpen={index === 0}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
