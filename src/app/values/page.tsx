import { Suspense } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { fetchItems, fetchLastUpdated } from '@/utils/api';
import ValuesClient from '@/components/Values/ValuesClient';
import Loading from './loading';
import { unstable_cacheTag as cacheTag } from 'next/cache'

// ISR configuration - cache for 5 minutes
export const revalidate = 300;

export default async function ValuesPage() {
  'use cache'
  cacheTag('items')
  const itemsPromise = fetchItems();
  const lastUpdatedPromise = itemsPromise.then(items => fetchLastUpdated(items));

  return (
    <main className="min-h-screen bg-[#2E3944] mb-8">
      <div className="container mx-auto px-4">
        <Breadcrumb />
        <Suspense fallback={<Loading />}>
          <ValuesClient 
            itemsPromise={itemsPromise}
            lastUpdatedPromise={lastUpdatedPromise}
          />
        </Suspense>
      </div>
    </main>
  );
}