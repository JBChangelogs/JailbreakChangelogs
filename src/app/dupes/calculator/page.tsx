import React, { Suspense } from 'react';
import DupeReportHeader from '@/components/Dupes/DupeReportHeader';
import DupeSearchForm from '@/components/Dupes/DupeSearchForm';
import { fetchItems, fetchDupes } from '@/utils/api';
import Loading from './loading';
import { Item, DupeResult } from '@/types';

// ISR configuration - cache for 5 minutes
export const revalidate = 300;

export default function DupeCalculatorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <DupeReportHeader />
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-muted">Check for Duped Items</h2>
        </div>
        <Suspense fallback={<Loading />}>
          <DupeSearchFormWrapper />
        </Suspense>
      </div>
    </div>
  );
}

async function DupeSearchFormWrapper() {
  const [items, dupes] = await Promise.all([
    fetchItems(),
    fetchDupes()
  ]);
  const safeDupes = Array.isArray(dupes) ? dupes as DupeResult[] : [];

  return <DupeSearchForm initialItems={items as Item[]} initialDupes={safeDupes} />;
} 