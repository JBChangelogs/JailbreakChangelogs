import { Suspense } from "react";
import { notFound } from "next/navigation";
import InventoryCheckerClient from "../InventoryCheckerClient";
import InventoryDataStreamer from "../InventoryDataStreamer";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ExperimentalFeatureBanner from "@/components/UI/ExperimentalFeatureBanner";
import ComingSoon from "@/components/UI/ComingSoon";
import { isFeatureEnabled } from "@/utils/featureFlags";

export const dynamic = "force-dynamic";

interface InventoryCheckerPageProps {
  params: Promise<{
    userid: string;
  }>;
}

export default async function InventoryCheckerPage({
  params,
}: InventoryCheckerPageProps) {
  // Check if Inventory Calculator feature is enabled
  if (!isFeatureEnabled("INVENTORY_CALCULATOR")) {
    return <ComingSoon />;
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
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-3xl font-bold text-white">Inventory Checker</h1>
        <span className="rounded bg-[#5865F2] px-1.5 py-0.5 text-[10px] font-semibold text-white uppercase">
          New
        </span>
      </div>
      <ExperimentalFeatureBanner className="mb-6" />
      <Suspense
        fallback={<InventoryCheckerClient robloxId={userid} isLoading={true} />}
      >
        <InventoryDataStreamer robloxId={userid} />
      </Suspense>
    </div>
  );
}
