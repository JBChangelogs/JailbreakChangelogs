import { Suspense } from "react";
import { notFound } from "next/navigation";
import InventoryCheckerClient from "../InventoryCheckerClient";
import InventoryDataStreamer from "../InventoryDataStreamer";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ExperimentalFeatureBanner from "@/components/ui/ExperimentalFeatureBanner";
import ComingSoon from "@/components/ui/ComingSoon";
import { isFeatureEnabled } from "@/utils/config/featureFlags";
import { fetchComments } from "@/utils/api/api";
import { checkInventoryMaintenanceMode } from "@/utils/config/maintenance";
import FeatureMaintenance from "@/theme/FeatureMaintenance";

export const dynamic = "force-dynamic";

interface InventoryCheckerPageProps {
  params: Promise<{
    userid: string;
  }>;
}

export default async function InventoryCheckerPage({
  params,
}: InventoryCheckerPageProps) {
  // Check for inventory maintenance mode
  const { isInventoryMaintenanceMode } = await checkInventoryMaintenanceMode();
  if (isInventoryMaintenanceMode) {
    return (
      <FeatureMaintenance
        featureName="Inventory Checker"
        customMessage="We're experiencing technical difficulties. The Inventory Checker is temporarily unavailable. Please try again later."
      />
    );
  }

  // Check if Inventory Checker feature is enabled
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

  // Fetch comments for the inventory - only for numeric IDs
  // For usernames, comments will be fetched after username resolution in InventoryDataStreamer
  const commentsData = isNumeric
    ? await fetchComments("inventory", userid)
    : { comments: [], userMap: {} };

  return (
    <div className="container mx-auto px-4 pb-8">
      <Breadcrumb />
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-primary-text text-3xl font-bold">
          Inventory Checker
        </h1>
      </div>
      <ExperimentalFeatureBanner className="mb-6" />

      <Suspense
        fallback={<InventoryCheckerClient robloxId={userid} isLoading={true} />}
      >
        <InventoryDataStreamer
          robloxId={userid}
          initialComments={commentsData.comments}
          initialCommentUserMap={commentsData.userMap}
        />
      </Suspense>
    </div>
  );
}
