import { Suspense } from "react";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { fetchItemsChangelog, fetchUsersBatch } from '@/utils/api';
import ChangelogDetailsClient from '@/components/Values/ChangelogDetailsClient';
import Loading from './loading';

export const revalidate = 120; // Revalidate every 2 minutes

interface ChangeData {
  change_id: number;
  item: {
    id: number;
    name: string;
    type: string;
    creator: string;
    cash_value: string;
    duped_value: string;
    tradable: number;
  };
  changed_by: string;
  reason: string | null;
  changes: {
    old: Record<string, string | number | undefined>;
    new: Record<string, string | number | undefined>;
  };
  posted: number;
  created_at: number;
  id: number;
  suggestion?: {
    user_id: number | string;
  };
  changed_by_id: string;
}

export default async function ChangelogDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!id) {
    notFound();
  }

  // Fetch changelog data
  const changelog = await fetchItemsChangelog(id);
  
  if (!changelog) {
    notFound();
  }

  // Extract unique user IDs from changelog data (both changers and suggestors)
  const userIds = new Set<string>();
  
  changelog.change_data.forEach((change: ChangeData) => {
    // Add the person who made the change
    if (change.changed_by_id) {
      userIds.add(change.changed_by_id);
    }
    
    // Add the suggestor if there's a suggestion
    if (change.suggestion?.user_id) {
      userIds.add(String(change.suggestion.user_id));
    }
  });
  
  const uniqueUserIds = Array.from(userIds);
  
  // Fetch user data in batch
  const userData = await fetchUsersBatch(uniqueUserIds);

  return (
    <main className="min-h-screen bg-[#2E3944] mb-8">
      <div className="container mx-auto px-4">
          <Breadcrumb />
        <Suspense fallback={<Loading />}>
          <ChangelogDetailsClient 
            changelog={changelog}
            userData={userData}
          />
        </Suspense>
        </div>
      </main>
  );
} 