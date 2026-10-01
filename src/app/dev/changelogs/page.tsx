import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { getCachedChangelogEntries } from "@/lib/changelog-parser";
import { ChangelogDate } from "@/components/Changelogs/ChangelogDate";

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

  const sortedPages = entries.map((entry) => ({
    url: `/dev/changelogs/${entry.slug}`,
    data: {
      title: entry.title || entry.version,
      date: entry.date,
      isPrerelease: entry.isPrerelease,
      isDraft: entry.isDraft,
    },
  }));

  return (
    <div className="bg-primary-bg min-h-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="pt-8 pb-4 sm:pt-10 sm:pb-6">
          <div className="text-center">
            <h1 className="text-primary-text mb-4 text-4xl font-bold sm:text-5xl">
              Development Changelog
            </h1>
            <p className="text-secondary-text mx-auto max-w-2xl text-lg">
              {siteConfig.description}
            </p>
          </div>
        </div>
        {/* Timeline */}
        <div className="pt-4 pb-12 sm:pt-6">
          {sortedPages.length === 0 ? (
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
            <div className="relative">
              <div className="scrollbar-track-secondary-bg scrollbar-thumb-button-info/20 hover:scrollbar-thumb-button-info/40 scrollbar-thin transition-colors md:max-h-250 md:overflow-y-auto md:pr-4">
                <div className="relative">
                  {/* Timeline line */}
                  <div
                    className="border-border-card absolute top-0 left-0 hidden h-full border-l-2 md:block"
                    style={{ left: "1.5rem" }}
                  />

                  {/* Changelog entries */}
                  <div className="space-y-6 pb-12 sm:space-y-12">
                    {sortedPages.map((page, index) => {
                      const isLatest = index === 0;
                      return (
                        <article
                          key={page.url}
                          className="relative pl-0 md:pl-16"
                        >
                          {/* Timeline dot */}
                          <div className="absolute top-2 left-2 hidden h-8 w-8 md:block">
                            <div
                              className={`border-primary-bg flex h-full w-full items-center justify-center rounded-full border-4 ${isLatest ? "bg-button-info animate-pulse" : "bg-button-info"}`}
                            >
                              <div className="bg-primary-bg h-2 w-2 rounded-full" />
                            </div>
                          </div>

                          <Link
                            href={page.url}
                            className="group border-border-card bg-secondary-bg hover:border-border-focus block rounded-lg border p-5 shadow-lg transition-all duration-200 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 sm:p-6"
                          >
                            <div className="mb-4 flex min-w-0 flex-wrap items-center gap-2">
                              <h2 className="text-primary-text group-hover:text-link text-2xl font-bold transition-colors">
                                {page.data.title}
                              </h2>
                              {isLatest && (
                                <span className="bg-button-info text-form-button-text inline-flex h-5 items-center rounded-lg px-2 text-xs leading-none font-bold uppercase">
                                  Latest
                                </span>
                              )}
                              {page.data.isPrerelease && (
                                <span className="bg-status-warning/10 text-status-warning rounded-lg px-2 py-1 text-xs font-medium">
                                  Pre-release
                                </span>
                              )}
                              {page.data.isDraft && (
                                <span className="bg-secondary-text/10 text-secondary-text rounded-lg px-2 py-1 text-xs font-medium">
                                  Draft
                                </span>
                              )}
                            </div>
                            <p className="text-secondary-text mb-4 text-sm">
                              {page.data.isDraft
                                ? "Created on "
                                : "Released on "}
                              <ChangelogDate date={page.data.date as string} />
                            </p>

                            <span className="text-link group-hover:text-link-hover inline-flex items-center text-sm font-medium transition-colors">
                              Read full changelog
                              <svg
                                className="ml-1 h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </span>
                          </Link>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="from-primary-bg pointer-events-none absolute bottom-0 left-0 hidden h-24 w-full bg-linear-to-t to-transparent md:block" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
