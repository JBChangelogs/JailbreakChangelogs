import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import InventoryCheckerClient from '../InventoryCheckerClient';
import InventoryDataStreamer from '../InventoryDataStreamer';
import Breadcrumb from '@/components/Layout/Breadcrumb';
import ExperimentalFeatureBanner from '@/components/UI/ExperimentalFeatureBanner';
import { isFeatureEnabled } from '@/utils/featureFlags';

export const dynamic = 'force-dynamic';

interface InventoryCheckerPageProps {
  params: Promise<{
    userid: string;
  }>;
}

export default async function InventoryCheckerPage({ params }: InventoryCheckerPageProps) {
  // Check if Inventory Calculator feature is enabled
  if (!isFeatureEnabled('INVENTORY_CALCULATOR')) {
    redirect('/');
  }

  const { userid } = await params;

  // Allow both usernames and numeric IDs
  // Let InventoryDataStreamer handle the username resolution
  const isNumeric = /^\d+$/.test(userid);
  const robloxId = parseInt(userid);
  
  // Only validate numeric IDs, allow usernames to pass through
  if (isNumeric && (isNaN(robloxId) || robloxId <= 0)) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-6">Inventory Checker</h1>
      <ExperimentalFeatureBanner className="mb-6" />
      <Suspense fallback={<InventoryCheckerClient robloxId={userid} isLoading={true} />}>
        <InventoryDataStreamer robloxId={userid} />
      </Suspense>
    </div>
  );
}
