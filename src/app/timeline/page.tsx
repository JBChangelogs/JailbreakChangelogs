import React from 'react';
import Breadcrumb from '@/components/Layout/Breadcrumb';
import TimelineClient from '@/components/Timeline/TimelineClient';
import { fetchChangelogList } from '@/utils/api';

// Revalidate every 5 minutes
export const revalidate = 300;

export default async function TimelinePage() {
  // Fetch changelogs on the server
  const changelogs = await fetchChangelogList();
  // Sort by ID in descending order (newest first)
  const sortedChangelogs = [...changelogs].sort((a, b) => b.id - a.id);

  return (
    <main className="min-h-screen bg-[#2E3944]">
      <div className="container mx-auto">
        <Breadcrumb />
        <TimelineClient changelogs={sortedChangelogs} />
      </div>
    </main>
  );
} 