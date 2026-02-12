import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/lib/site";
import { getCachedChangelogEntries } from "@/lib/changelog-parser";
import { ChangelogDate } from "@/components/Changelogs/ChangelogDate";

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
      htmlUrl: entry.htmlUrl,
      authorLogin: entry.authorLogin,
      authorAvatarUrl: entry.authorAvatarUrl,
      isPrerelease: entry.isPrerelease,
      isDraft: entry.isDraft,
    },
  }));

  return (
    <div className="bg-primary-bg min-h-screen">
      {/* Header */}
      <div className="border-border-card border-b">
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
            {/* Scrollable Container with max height and custom scrollbar */}
            <div className="scrollbar-thin scrollbar-track-secondary-bg scrollbar-thumb-button-info/20 hover:scrollbar-thumb-button-info/40 max-h-[1000px] overflow-y-auto pr-4 transition-colors">
              <div className="relative">
                {/* Timeline line */}
                <div
                  className="border-border-card absolute top-0 left-0 hidden h-full border-l-2 md:block"
                  style={{ left: "1.5rem" }}
                />

                {/* Changelog entries */}
                <div className="space-y-12 pb-12">
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

                        {/* Content card */}
                        <div
                          className={`group rounded-lg border p-6 shadow-lg transition-all duration-200 hover:shadow-xl ${
                            isLatest
                              ? "from-button-info/10 to-button-info-hover/10 shadow-button-info/20 border-button-info bg-linear-to-r"
                              : "bg-secondary-bg border-border-card"
                          }`}
                        >
                          {/* Header */}
                          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                            <div className="flex-1">
                              <Link href={page.url} className="group">
                                <div className="flex items-center gap-2">
                                  <h2 className="text-primary-text hover:text-link mb-2 text-2xl font-bold transition-colors">
                                    {page.data.title}
                                  </h2>
                                  {isLatest && (
                                    <span className="bg-button-info text-form-button-text mb-2 rounded-full px-2 py-0.5 text-xs font-medium tracking-wider uppercase">
                                      Latest
                                    </span>
                                  )}
                                </div>
                              </Link>
                              <p className="text-secondary-text">
                                {page.data.description}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <ChangelogDate
                                date={page.data.date as string}
                                className="text-secondary-text text-sm"
                              />
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                {page.data.version && (
                                  <span className="bg-status-info/10 text-link rounded-full px-3 py-1 text-sm font-medium transition-colors">
                                    v{page.data.version as string}
                                  </span>
                                )}
                                {page.data.isPrerelease && (
                                  <span className="bg-status-warning/10 text-status-warning rounded-full px-2 py-1 text-xs font-medium">
                                    Pre-release
                                  </span>
                                )}
                                {page.data.isDraft && (
                                  <span className="bg-secondary-text/10 text-secondary-text rounded-full px-2 py-1 text-xs font-medium">
                                    Draft
                                  </span>
                                )}
                              </div>
                              {page.data.authorLogin && (
                                <div className="flex items-center gap-2">
                                  {page.data.authorAvatarUrl && (
                                    <Image
                                      src={page.data.authorAvatarUrl as string}
                                      alt={page.data.authorLogin as string}
                                      width={20}
                                      height={20}
                                      className="h-5 w-5 rounded-full"
                                    />
                                  )}
                                  <a
                                    href={`https://github.com/${page.data.authorLogin as string}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-secondary-text hover:text-link text-xs transition-colors"
                                  >
                                    @{page.data.authorLogin as string}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Read more link */}
                          <Link
                            href={page.url}
                            className="text-link hover:text-link-hover inline-flex items-center text-sm font-medium transition-colors"
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
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Fade Gradient to indicate scroll capability */}
            <div className="from-primary-bg pointer-events-none absolute bottom-0 left-0 h-24 w-full bg-linear-to-t to-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}
