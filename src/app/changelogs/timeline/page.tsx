"use client";

import Breadcrumb from "@/components/Layout/Breadcrumb";
import TimelineClient from "@/components/Timeline/TimelineClient";
import TimelineLoading from "@/app/changelogs/timeline/loading";
import RateLimitView from "@/components/Layout/RateLimitView";
import {
  ChangelogRateLimitError,
  useChangelogTimeline,
} from "@/hooks/useChangelogTimeline";

export default function TimelinePage() {
  const timelineQuery = useChangelogTimeline();
  const rateLimitError =
    timelineQuery.error instanceof ChangelogRateLimitError
      ? timelineQuery.error
      : null;
  const changelogs = timelineQuery.data ?? (timelineQuery.isError ? [] : null);

  if (rateLimitError && !timelineQuery.data) {
    return <RateLimitView retryAfter={rateLimitError.retryAfter} />;
  }

  if (!changelogs) {
    return <TimelineLoading />;
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto">
        <Breadcrumb />
        <TimelineClient changelogs={changelogs} />
      </div>
    </main>
  );
}
