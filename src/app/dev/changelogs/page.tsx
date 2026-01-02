import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { getCachedChangelogEntries } from "@/lib/changelog-parser";

export const metadata: Metadata = {
  title: `Development Changelog | ${siteConfig.name}`,
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
      description: entry.description,
      date: entry.date,
      version: entry.version !== "Unreleased" ? entry.version : undefined,
    },
  }));

  return (
    <div className="bg-primary-bg min-h-screen">
      {/* Header */}
      <div className="border-border-primary border-b">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-primary-text mb-4 text-4xl font-bold sm:text-5xl">
              Development Changelog
            </h1>
            <p className="text-secondary-text mx-auto max-w-2xl text-lg">
              {siteConfig.description}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
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
            {/* Timeline line */}
            <div
              className="border-border-primary absolute top-0 left-0 hidden h-full border-l-2 md:block"
              style={{ left: "1.5rem" }}
            />

            {/* Changelog entries */}
            <div className="space-y-12">
              {sortedPages.map((page) => (
                <article key={page.url} className="relative pl-0 md:pl-16">
                  {/* Timeline dot */}
                  <div className="absolute top-2 left-2 hidden h-8 w-8 md:block">
                    <div className="bg-button-info border-primary-bg flex h-full w-full items-center justify-center rounded-full border-4">
                      <div className="bg-primary-bg h-2 w-2 rounded-full" />
                    </div>
                  </div>

                  {/* Content card */}
                  <div className="bg-secondary-bg border-border-primary hover:border-button-info rounded-lg border p-6 shadow-lg transition-all duration-200 hover:shadow-xl">
                    {/* Header */}
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        <Link href={page.url} className="group">
                          <h2 className="text-primary-text group-hover:text-button-info mb-2 text-2xl font-bold transition-colors">
                            {page.data.title}
                          </h2>
                        </Link>
                        <p className="text-secondary-text">
                          {page.data.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <time className="text-secondary-text text-sm">
                          {new Date(
                            page.data.date as string,
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </time>
                        {page.data.version && (
                          <a
                            href={`${siteConfig.links.github}/releases/tag/v${page.data.version}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-status-info/10 text-status-info hover:bg-status-info/20 rounded-full px-3 py-1 text-sm font-medium transition-colors"
                          >
                            v{page.data.version as string}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Tags */}

                    {/* Read more link */}
                    <Link
                      href={page.url}
                      className="text-button-info hover:text-button-info/80 inline-flex items-center text-sm font-medium transition-colors"
                    >
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
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Marquee Demo */}
    </div>
  );
}
