"use client";

import { useEffect, useRef, useState } from "react";
import { ChangelogDate } from "./ChangelogDate";
import type { ChangelogEntry } from "@/lib/changelog-parser";
import { Icon } from "@/components/ui/IconWrapper";
import { parseChangelogSections } from "@/lib/changelog-sections";
import ReleaseChanges, { ReleaseChangeCounts } from "./ReleaseChanges";

export function ReleaseTimelineEntry({
  entry,
  latest,
  initiallyOpen,
}: {
  entry: ChangelogEntry;
  latest: boolean;
  initiallyOpen: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const articleRef = useRef<HTMLElement>(null);
  const releaseId = `release-${entry.slug}`;
  const releaseHash = `#release-${encodeURIComponent(entry.slug)}`;

  useEffect(() => {
    const reveal = () => {
      if (window.location.hash === releaseHash) setOpen(true);
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, [releaseHash]);

  useEffect(() => {
    if (open && window.location.hash === releaseHash) {
      articleRef.current?.scrollIntoView({ block: "start" });
    }
  }, [open, releaseHash]);

  const sections = parseChangelogSections(entry.content, entry.version);
  return (
    <article
      ref={articleRef}
      id={releaseId}
      className="relative scroll-mt-24 pb-12 pl-6 sm:pb-16 sm:pl-9"
    >
      <span
        aria-hidden="true"
        className={`border-primary-bg absolute top-2 -left-[9px] h-4 w-4 rounded-full border-4 sm:-left-[11px] sm:h-5 sm:w-5 ${latest ? "bg-button-info" : "bg-secondary-text"}`}
      />
      <details
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
        className="group"
      >
        <summary className="text-primary-text flex cursor-pointer list-none items-center gap-4 rounded-lg py-1 focus-visible:outline-2 focus-visible:outline-offset-4 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold sm:text-3xl">
                {entry.title || `v${entry.version}`}
              </h2>
              {latest && (
                <span className="bg-button-info/20 border-button-info text-primary-text inline-flex h-6 items-center rounded-md border px-2.5 text-xs leading-none font-medium backdrop-blur-xl">
                  Latest
                </span>
              )}
              {entry.isPrerelease && (
                <span className="bg-secondary-bg text-secondary-text rounded-md px-3 py-1 text-xs font-semibold">
                  Pre-release
                </span>
              )}
              {entry.isDraft && (
                <span className="bg-secondary-bg text-secondary-text rounded-md px-3 py-1 text-xs font-semibold">
                  Draft
                </span>
              )}
            </div>
            <div className="text-secondary-text flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <ChangelogDate date={entry.date} />
              <ReleaseChangeCounts sections={sections} />
            </div>
          </div>
          <Icon
            icon="lucide:chevron-down"
            className="text-secondary-text h-5 w-5 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        {open && (
          <div className="mt-5 space-y-4">
            <ReleaseChanges
              content={entry.content}
              version={entry.version}
              summary={false}
              showCommitHashes
            />
            {entry.htmlUrl && (
              <a
                href={entry.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover inline-flex items-center gap-1 text-sm transition-colors"
              >
                View on GitHub
                <Icon
                  icon="lucide:arrow-up-right"
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </a>
            )}
          </div>
        )}
      </details>
    </article>
  );
}
